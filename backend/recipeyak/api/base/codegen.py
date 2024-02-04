# ruff: noqa: T201
import filecmp
import json
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from textwrap import dedent, indent
from typing import Any, NotRequired, TypedDict

import typer


def _dump_function(
    *,
    name: str,
    url: str,
    method: str,
    param_type: str | None,
    return_type: str,
    path_params: list[str],
    comment: str | None,
) -> str:
    comment = dedent(comment or "")
    comment = comment.removesuffix("\n").removeprefix("\n")
    comment = indent(comment, " * ", predicate=lambda _: True)
    prefix = "/**\n"
    suffix = "\n */"

    args = f"params: {param_type}" if param_type is not None else ""
    params = "params," if param_type is not None else ""
    pathParams = (
        f"pathParamNames: {path_params},"
        if param_type is not None and path_params
        else ""
    )
    comment = prefix + comment + suffix if comment else ""
    module_name = __spec__.name  # type:ignore[name-defined]
    return f"""
// generated by {module_name}
import {{ http }} from "@/apiClient"

{comment}
export function {name}({args}) {{
  return http<{return_type}>({{
    url: "{url}",
    method: "{method}",
    {params}
    {pathParams}
  }})
}}
        """


class _RequestBodyDict(TypedDict):
    required: bool
    content: dict[str, Any]


class _MethodDict(TypedDict):
    description: NotRequired[str]
    requestBody: NotRequired[_RequestBodyDict]
    responses: NotRequired[dict[str, Any]]
    parameters: NotRequired[list[dict[str, Any]]]
    operationId: str


def _parameter_type(method: _MethodDict) -> str | None:
    try:
        body_schema = method["requestBody"]["content"]["application/json"]["schema"]
    except KeyError:
        body_schema = {"required": [], "properties": {}, "type": "object"}

    for path_param in method.get("parameters", []):
        assert path_param
        body_schema.setdefault("required", []).append(path_param["name"])
        body_schema["properties"][path_param["name"]] = path_param["schema"]

    if not body_schema["properties"]:
        return None
    return _json_schema_to_typescript_type(
        body_schema, op=method["operationId"], is_input_type=True
    )


def _json_schema_to_typescript_type(
    schema: dict[str, Any] | None, depth: int = 0, *, op: str, is_input_type: bool
) -> str:
    if schema is None:
        # TODO: maybe this should be void
        return "unknown"
    if anyOf := schema.get("anyOf"):
        out = ""
        for variant in anyOf:
            out += " | " + _json_schema_to_typescript_type(
                variant, depth, op=op, is_input_type=is_input_type
            )
        return out
    if const := schema.get("const"):
        return f'"{const}"'
    if schema["type"] == "array":
        inner_type = _json_schema_to_typescript_type(
            schema["items"], depth + 1, op=op, is_input_type=is_input_type
        )
        if is_input_type:
            return f"ReadonlyArray<{inner_type}>"
        return f"Array<{inner_type}>"
    if schema["type"] == "object":
        out = "{\n"
        if "required" not in schema and "properties" not in schema:
            if type := schema.get("additionalProperties"):
                typescript_type = _json_schema_to_typescript_type(
                    type, op=op, is_input_type=is_input_type
                )
            else:
                typescript_type = "unknown"
            return f"Record<string, {typescript_type}>"
        required_properties = set(schema.get("required", []))
        for prop_name in schema["properties"]:
            is_optional_prop = (
                prop_name not in required_properties
                and "const" not in schema["properties"][prop_name]
                # Return types are essentially never optional, they might be
                # nullable but they shouldn't be typed as `?` since json doesn't
                # have undefined. It's okay for `?` in request params since the
                # server has defaults it will apply.
                and is_input_type
            )
            out += indent(
                f"""\
"{prop_name}"{("?" if is_optional_prop else "")}: {_json_schema_to_typescript_type(schema["properties"][prop_name], depth + 1, op=op, is_input_type=is_input_type)},""",
                " " * (depth * 2),
            )

            out += "\n"
        out += "}"
        return out
    if schema["type"] == "integer":
        return "number"
    if schema["type"] == "string":
        if enum := schema.get("enum"):
            out = ""
            for idx, variant in enumerate(enum):
                if idx == 0:
                    out = f"{variant!r}"
                else:
                    out += f" | {variant!r}"
                out += ""
            return out
        if schema.get("format") in ("date-time", "date") and is_input_type:
            # typescript api client serializes these with .toISOString() before
            # sending over the wire
            return "Date"
        return "string"
    if schema["type"] == "boolean":
        return "boolean"
    if schema["type"] == "null":
        return "null"
    raise ValueError(f"unhandled case type={schema['type']}")


def _return_type(method: _MethodDict) -> str:
    responses = method["responses"]
    assert len(responses) == 1, "should only have one response to choose from"
    if responses.get("204"):
        return "unknown"
    response_schema = next(iter(responses.values()))["content"]["application/json"][
        "schema"
    ]
    return _json_schema_to_typescript_type(
        response_schema, op=method["operationId"], is_input_type=False
    )


def _funcs_from_path(path: str, methods: dict[str, Any]) -> list[tuple[str, str]]:
    out_functions: list[tuple[str, str]] = []
    for http_method in methods:
        method_meta = methods[http_method]
        description = method_meta.get("description")
        op_name: str = method_meta["operationId"]
        if op_name[0].isupper():
            op_name = op_name[0].lower() + op_name[1:]
        url = path
        path_params = [
            x["name"] for x in method_meta.get("parameters", []) if x["in"] == "path"
        ]
        param_type = _parameter_type(method_meta)
        return_type = _return_type(method_meta)
        func = _dump_function(
            name=op_name,
            url=url,
            method=http_method,
            param_type=param_type,
            return_type=return_type,
            path_params=path_params,
            comment=description,
        )

        out_functions.append((op_name, func))
    return out_functions


@dataclass(frozen=True, kw_only=True, slots=True)
class DirDiff:
    missing_files: list[str]
    files_to_delete: list[str]
    diff_files: list[str]


def _compare_directories(src_dir: str, dest_dir: str) -> DirDiff | None:
    # Compare directories
    dir_cmp = filecmp.dircmp(src_dir, dest_dir)
    # Check if file lists are the same
    if dir_cmp.left_only or dir_cmp.right_only or dir_cmp.diff_files:
        return DirDiff(
            missing_files=dir_cmp.left_only,
            files_to_delete=dir_cmp.right_only,
            diff_files=dir_cmp.diff_files,
        )
    else:
        return None


def main(check: bool = False) -> None:
    print("generating client...")
    schema = json.loads(Path("./api-schema.json").read_text())

    paths = schema["paths"]

    out_functions = []
    for path, methods in paths.items():
        out_functions.extend(_funcs_from_path(path, methods))

    tmpdir = tempfile.mkdtemp()
    for func_name, func_content in out_functions:
        (Path(tmpdir) / (func_name + ".ts")).write_text(func_content)
    print("formatting...")
    subprocess.run(
        (
            "./node_modules/.bin/prettier",
            "--config",
            ".prettierrc.js",
            "-w",
            "--log-level",
            "warn",
            "--cache",
            tmpdir,
        ),
        check=True,
    )

    client_path = "../frontend/src/api/"
    print("checking for changes...")
    diff = _compare_directories(tmpdir, client_path)
    if diff is None:
        print("no changes required!")
        sys.exit(0)

    if check:
        if diff.files_to_delete:
            print(f"delete: {diff.files_to_delete}")
        if diff.missing_files:
            print(f"add:    {diff.missing_files}")
        if diff.diff_files:
            print(f"update: {diff.diff_files}")
        print(
            """\
client is not up to date, regenerate with:
./.venv/bin/python -m recipeyak.api.base.codegen"""
        )
        sys.exit(1)

    shutil.rmtree(client_path)
    shutil.move(tmpdir, client_path)

    print("generated client")


if __name__ == "__main__":
    typer.run(main)
