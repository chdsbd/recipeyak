import { DragElementWrapper, DragSourceOptions } from "react-dnd"

import { IIngredient } from "@/api"
import { normalizeUnitsFracs } from "@/text"

interface IIngredientVIewProps {
  readonly quantity: IIngredient["quantity"]
  readonly name: IIngredient["name"]
  readonly description: IIngredient["description"]
  readonly optional: IIngredient["optional"]
  readonly dragRef: DragElementWrapper<DragSourceOptions> | undefined
}

export default function IngredientView({
  quantity,
  name,
  description,
  optional,
  dragRef,
}: IIngredientVIewProps) {
  const fmtDescription = description
    ? ", " + normalizeUnitsFracs(description)
    : ""

  return (
    <p className="listitem-text justify-space-between selectable" ref={dragRef}>
      <span className="fw-500">{normalizeUnitsFracs(quantity).trim()}</span>{" "}
      {name.trim()}
      {fmtDescription.trim()}{" "}
      {optional ? <span className="text-muted">[optional]</span> : ""}
    </p>
  )
}
