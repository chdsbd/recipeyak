from __future__ import annotations

from datetime import datetime

from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from recipeyak.api.base.request import AuthedRequest
from recipeyak.api.base.serialization import RequestParams, StrTrimmed
from recipeyak.api.serializers.recipe import serialize_recipe
from recipeyak.models import (
    ChangeType,
    RecipeChange,
    TimelineEvent,
    filter_recipe_or_404,
    get_team,
)
from recipeyak.models.upload import Upload


class RecipePatchParams(RequestParams):
    name: StrTrimmed | None = None
    author: StrTrimmed | None = None
    time: StrTrimmed | None = None
    tags: list[StrTrimmed] | None = None
    servings: StrTrimmed | None = None
    source: StrTrimmed | None = None
    archived_at: datetime | None = None

    # attributes requiring custom handling.
    primaryImageId: str | None = None


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def recipe_update_view(request: AuthedRequest, recipe_id: str) -> Response:
    team = get_team(request.user)
    recipe = filter_recipe_or_404(recipe_id=recipe_id, team=team)

    params = RecipePatchParams.parse_obj(request.data)
    provided_fields = set(params.dict(exclude_unset=True))

    changes = []
    fields = [
        ("name", ChangeType.NAME),
        ("author", ChangeType.AUTHOR),
        ("source", ChangeType.SOURCE),
        ("servings", ChangeType.SERVINGS),
        ("time", ChangeType.TIME),
    ]
    for field, change_type in fields:
        if field in provided_fields and getattr(recipe, field) != getattr(
            params, field
        ):
            changes.append(
                RecipeChange(
                    recipe=recipe,
                    actor=request.user,
                    before=getattr(recipe, field) or "",
                    after=getattr(params, field) or "",
                    change_type=change_type,
                )
            )

    RecipeChange.objects.bulk_create(changes)

    if "archived_at" in provided_fields and recipe.archived_at != params.archived_at:
        TimelineEvent(
            action=("archived" if params.archived_at else "unarchived"),
            created_by=request.user,
            recipe=recipe,
        ).save()

    for field in provided_fields & {
        "name",
        "author",
        "time",
        "tags",
        "servings",
        "source",
        "archived_at",
    }:
        setattr(recipe, field, getattr(params, field))

    if "primaryImageId" in provided_fields:
        existing_primary_image_id = (
            recipe.primary_image.pk if recipe.primary_image else None
        )
        if params.primaryImageId != existing_primary_image_id:
            if params.primaryImageId is None:
                recipe.primary_image = None
                timeline_action = "remove_primary_image"
                upload = None
            else:
                upload = Upload.objects.filter(
                    recipe=recipe, id=params.primaryImageId
                ).first()
                if upload is None:
                    raise ValidationError(
                        "Could not find upload with provided Id",
                    )
                recipe.primary_image = upload
                timeline_action = "set_primary_image"
            TimelineEvent(
                action=timeline_action,
                created_by=request.user,
                recipe=recipe,
                upload=upload,
            ).save()
    recipe.save()

    team = get_team(request.user)
    recipe = filter_recipe_or_404(team=team, recipe_id=recipe_id)
    return Response(serialize_recipe(recipe))