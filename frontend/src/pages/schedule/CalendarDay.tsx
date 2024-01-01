import { isSameDay, parseISO } from "date-fns"
import endOfDay from "date-fns/endOfDay"
import format from "date-fns/format"
import isFirstDayOfMonth from "date-fns/isFirstDayOfMonth"
import isWithinInterval from "date-fns/isWithinInterval"
import startOfDay from "date-fns/startOfDay"
import { sortBy } from "lodash-es"
import { useState } from "react"
import { useDrop } from "react-dnd"
import { useLocation } from "react-router"

import { assertNever } from "@/assert"
import { isInsideChangeWindow, toISODateString } from "@/date"
import { DragDrop } from "@/dragDrop"
import {
  CalendarItem,
  ICalendarDragItem,
} from "@/pages/schedule/CalendarDayItem"
import { ScheduleRecipeModal } from "@/pages/schedule/ScheduleRecipeModal"
import { ICalRecipe } from "@/queries/scheduledRecipeCreate"
import { useScheduledRecipeDelete } from "@/queries/scheduledRecipeDelete"
import { useScheduledRecipeUpdate } from "@/queries/scheduledRecipeUpdate"
import { css, styled } from "@/theme"
import { useCurrentDay } from "@/useCurrentDay"

function DayOfWeek({ date }: { date: Date }) {
  const dayOfWeek = format(date, "E")
  return (
    <div className="block md:hidden">
      <span>{dayOfWeek}</span>
      <span className="mx-1">∙</span>
    </div>
  )
}

const Title = ({ date }: { readonly date: Date }) => {
  const dateFmtText = isFirstDayOfMonth(date) ? "MMM d" : "d"
  return (
    <div className="flex text-[14px]">
      <DayOfWeek date={date} />
      <span>{format(date, dateFmtText)}</span>
    </div>
  )
}

const isTodayStyle = css`
  border-bottom: 2px solid var(--color-accent);
`

const isSelectedDayStyle = css`
  border: 2px solid var(--color-border-selected-day);
  border-radius: 6px;
`

const isDroppableStyle = css`
  opacity: 0.5;
`

interface ICalendarDayContainerProps {
  readonly isToday: boolean
  readonly isSelectedDay: boolean
  readonly isDroppable: boolean
}

const CalendarDayContainer = styled.div<ICalendarDayContainerProps>`
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  background-color: var(--color-background-calendar-day);
  transition:
    background-color,
    border 0.2s;
  // prevent shifting when we show the highlight border
  border: 2px solid transparent;

  ${(p) => p.isToday && isTodayStyle}
  ${(p) => p.isSelectedDay && isSelectedDayStyle}
  ${(p) => p.isDroppable && isDroppableStyle}

  &:not(:last-child) {
    margin-right: 0.25rem;
    @media (max-width: ${(p) => p.theme.medium}) {
      margin-right: 0;
      margin-bottom: 0.25rem;
    }
  }
  @media (max-width: ${(p) => p.theme.medium}) {
    width: 100%;
  }
`

export function CalendarDay({
  date,
  scheduledRecipes,
}: {
  readonly date: Date
  readonly scheduledRecipes: ICalRecipe[]
}) {
  const today = useCurrentDay()
  const isToday = isSameDay(date, today)

  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const start = params.get("shoppingStartDay")
  const startParsed = start != null ? parseISO(start) : null
  const end = params.get("shoppingEndDay")
  const endParsed = end != null ? parseISO(end) : null
  const isSelected =
    startParsed != null &&
    endParsed != null &&
    isWithinInterval(date, {
      start: startOfDay(startParsed),
      end: endOfDay(endParsed),
    })

  const scheduledRecipeDelete = useScheduledRecipeDelete()
  const scheduledRecipeUpdate = useScheduledRecipeUpdate()

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [DragDrop.CAL_RECIPE],
    canDrop: () => {
      return isInsideChangeWindow(date)
    },
    drop: (dropped) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const item = dropped as ICalendarDragItem
      if (item.type === DragDrop.CAL_RECIPE) {
        scheduledRecipeUpdate.mutate({
          scheduledRecipeId: item.scheduledId,
          update: {
            on: toISODateString(date),
          },
        })
      } else {
        assertNever(item.type)
      }
    },
    collect: (monitor) => {
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }
    },
  })

  const scheduled = sortBy(scheduledRecipes, (x) => new Date(x.created))

  const isDroppable = isOver && canDrop

  const isSelectedDay = isSelected || isDroppable
  const [showScheduleRecipeModal, setShowScheduleRecipeModal] = useState(false)

  return (
    <CalendarDayContainer
      ref={drop}
      isDroppable={isDroppable}
      isToday={isToday}
      isSelectedDay={isSelectedDay}
      onDoubleClick={() => {
        setShowScheduleRecipeModal(true)
      }}
    >
      <Title date={date} />
      {showScheduleRecipeModal && (
        <ScheduleRecipeModal
          onClose={() => {
            setShowScheduleRecipeModal(false)
          }}
          defaultValue={toISODateString(date)}
        />
      )}
      <ul className="flex h-full flex-col gap-3 overflow-y-auto px-1">
        {scheduled.map((x) => (
          <CalendarItem
            key={x.id}
            scheduledId={x.id}
            createdAt={x.created}
            createdBy={x.createdBy}
            date={date}
            recipeName={x.recipe.name}
            recipeID={x.recipe.id}
            remove={() => {
              scheduledRecipeDelete.mutate({
                scheduledRecipeId: x.id,
              })
            }}
          />
        ))}
      </ul>
    </CalendarDayContainer>
  )
}
