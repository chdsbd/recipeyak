import React, { useState } from "react"
import { useDrag } from "react-dnd"
import { Link } from "react-router-dom"

import { isInsideChangeWindow } from "@/date"
import { DragDrop } from "@/dragDrop"
import { useGlobalEvent } from "@/hooks"
import { CalendarDayItemModal } from "@/pages/schedule/CalendarDayItemModal"
import { IRecipe } from "@/queries/recipeFetch"
import { styled } from "@/theme"
import { recipeURL } from "@/urls"

interface IRecipeLink {
  readonly id: IRecipe["id"] | string
  readonly name: IRecipe["name"]
  readonly onClick: (e: React.MouseEvent) => void
}

const StyledLink = styled(Link)`
  line-height: 1.3;
  font-size: ${(props) => props.theme.text.small};
  word-break: break-word;
  background-color: var(--color-background-calendar-item);
  border-radius: 5px;
  padding: 0.35rem;
  font-weight: 600;
`

function RecipeLink({ name, id, onClick }: IRecipeLink) {
  const to = recipeURL(id, name)
  return (
    <StyledLink to={to} onClick={onClick}>
      {name}
    </StyledLink>
  )
}

interface ICalendarListItemProps {
  readonly visibility: React.CSSProperties["visibility"]
}

const CalendarListItem = styled.li<ICalendarListItemProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:not(:last-child) {
    margin-bottom: var(--margin-calendar-item-bottom);
  }
  visibility: ${(props) => props.visibility};
`

export interface ICalendarItemProps {
  readonly remove: () => void
  readonly date: Date
  readonly recipeID: number | string
  readonly recipeName: string
  readonly scheduledId: number
  readonly teamID: number
  readonly createdAt: string
  readonly createdBy: {
    readonly id: number | string
    readonly name: string
    readonly avatar_url: string
  } | null
}

export function CalendarItem({
  date,
  remove,
  recipeName,
  recipeID,
  teamID,
  scheduledId,
  createdAt,
  createdBy,
}: ICalendarItemProps) {
  const ref = React.useRef<HTMLLIElement>(null)
  const [show, setShow] = useState(false)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!ref.current?.matches(":hover")) {
      return
    }

    if (!isInsideChangeWindow(date)) {
      return
    }

    if (e.key === "#" || e.key === "Delete") {
      remove()
    }
  }

  const dragItem: ICalendarDragItem = {
    type: DragDrop.CAL_RECIPE,
    recipeID,
    scheduledId,
    date,
  }

  const [{ isDragging }, drag] = useDrag({
    type: DragDrop.CAL_RECIPE,
    item: dragItem,
    // don't do anything when on drop
    end: () => {},
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
      }
    },
  })

  const visibility =
    isDragging && isInsideChangeWindow(date) ? "hidden" : "visible"

  useGlobalEvent({ keyUp: handleKeyPress })

  drag(ref)

  return (
    <>
      <CalendarListItem ref={ref} visibility={visibility}>
        <RecipeLink
          name={recipeName}
          id={recipeID}
          onClick={(e) => {
            if (e.shiftKey || e.metaKey) {
              return
            }
            e.preventDefault()
            setShow(true)
          }}
        />
      </CalendarListItem>
      {show ? (
        <CalendarDayItemModal
          scheduledId={scheduledId}
          createdAt={createdAt}
          createdBy={createdBy}
          teamID={teamID}
          recipeName={recipeName}
          recipeId={recipeID}
          date={date}
          onClose={() => {
            setShow(false)
          }}
        />
      ) : null}
    </>
  )
}

export interface ICalendarDragItem
  extends Pick<ICalendarItemProps, "recipeID" | "scheduledId" | "date"> {
  readonly type: DragDrop.CAL_RECIPE
}
