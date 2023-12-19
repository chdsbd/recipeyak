import { addWeeks, endOfWeek, startOfWeek, subWeeks } from "date-fns"
import eachDayOfInterval from "date-fns/eachDayOfInterval"
import format from "date-fns/format"
import isValid from "date-fns/isValid"
import parseISO from "date-fns/parseISO"
import { chunk, first } from "lodash-es"
import { useState } from "react"
import { useHistory, useLocation } from "react-router-dom"

import { Box } from "@/components/Box"
import { Button } from "@/components/Buttons"
import { Modal } from "@/components/Modal"
import { toISODateString } from "@/date"
import CalendarDay from "@/pages/schedule/CalendarDay"
import { ICalConfig } from "@/pages/schedule/CalendarMoreDropdown"
import { IconSettings } from "@/pages/schedule/IconSettings"
import { Kbd } from "@/pages/schedule/Kbd"
import ShoppingList from "@/pages/schedule/ShoppingList"
import { ICalRecipe } from "@/queries/scheduledRecipeCreate"
import { useScheduledRecipeList } from "@/queries/scheduledRecipeList"
import { useScheduledRecipeSettingsFetch } from "@/queries/scheduledRecipeSettingsFetch"
import { removeQueryParams, setQueryParams } from "@/querystring"
import { styled } from "@/theme"

function CalTitle({ dayTs }: { readonly dayTs: number }) {
  return (
    <div>
      <span>{format(dayTs, "MMM d")}</span>
      <span className="hidden sm:inline"> | {format(dayTs, "yyyy")}</span>
    </div>
  )
}

export type IDays = Record<string, ICalRecipe[] | undefined>

const WeekdaysContainer = styled.div`
  @media (max-width: ${(p) => p.theme.medium}) {
    display: none;
  }
  display: flex;
  font-size: 14px;
  flex-shrink: 0;
  & > b {
    width: ${(1 / 7) * 100}%;
    &:not(:last-child) {
      margin-right: 0.25rem;
    }
  }
`

function Weekdays() {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return (
    <WeekdaysContainer>
      {weekDays.map((x) => (
        <b key={x}>{x}</b>
      ))}
    </WeekdaysContainer>
  )
}

const CalendarWeekContainer = styled.div`
  display: flex;
  @media (max-width: ${(p) => p.theme.medium}) {
    height: 100%;
    flex-direction: column;
    margin-top: 0.5rem;
    &:first-child,
    &:last-child {
      display: none;
    }
  }
  height: ${(1 / 3) * 100}%;
  &:not(:last-child) {
    margin-bottom: 0.25rem;
  }
`

const WEEK_DAYS = 7

interface IDaysProps {
  readonly start: Date
  readonly end: Date
  readonly days: IDays
  readonly isError: boolean
}

function Days({ start, end, isError, days }: IDaysProps) {
  if (isError) {
    // TODO: Fix this the next time the file is edited.
    // eslint-disable-next-line react/forbid-elements
    return <p className="m-auto">error fetching calendar</p>
  }

  return (
    <div className="mb-2 h-full grow">
      {chunk(eachDayOfInterval({ start, end }), WEEK_DAYS).map((dates) => {
        const firstDay = first(dates)
        if (firstDay == null) {
          return <CalendarWeekContainer />
        }
        const week = String(startOfWeek(firstDay))
        return (
          <CalendarWeekContainer key={week}>
            {dates.map((date) => {
              const scheduledRecipes = days[toISODateString(date)] || []
              return (
                <CalendarDay
                  scheduledRecipes={scheduledRecipes}
                  date={date}
                  key={date.toString()}
                />
              )
            })}
          </CalendarWeekContainer>
        )
      })}
    </div>
  )
}

interface INavProps {
  readonly dayTs: number
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onCurrent: () => void
}

function Nav({ dayTs, onPrev, onNext, onCurrent }: INavProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showShopping, setShowShopping] = useState(false)

  const settings = useScheduledRecipeSettingsFetch()

  return (
    <Box space="between" align="center" shrink={0}>
      <Modal
        show={showSettings}
        onClose={() => {
          setShowSettings(false)
        }}
        title="Calendar Settings"
        content={
          <Box gap={2} dir="col">
            <ICalConfig settings={settings} />
          </Box>
        }
      />
      <Modal
        show={showShopping}
        onClose={() => {
          setShowShopping(false)
        }}
        title="Shopping List"
        content={
          <div className="flex">
            <ShoppingList />
          </div>
        }
      />

      <Box gap={1}>
        <CalTitle dayTs={dayTs} />
        <Button
          size="small"
          className="p-1"
          data-testid="show calendar settings"
          onClick={() => {
            setShowSettings(true)
          }}
        >
          <IconSettings />
        </Button>
        <Button
          size="small"
          data-testid="open shopping list modal"
          onClick={() => {
            setShowShopping(true)
          }}
        >
          Shop
        </Button>
      </Box>
      <Box gap={1}>
        <Button size="small" onClick={onPrev} aria-label="previous week">
          {"←"}
        </Button>
        <Button size="small" onClick={onCurrent} aria-label="current week">
          Today
        </Button>
        <Button size="small" onClick={onNext} aria-label="next week">
          {"→"}
        </Button>
      </Box>
    </Box>
  )
}

function HelpPrompt() {
  return (
    // TODO: Fix this the next time the file is edited.
    // eslint-disable-next-line react/forbid-elements
    <p className="mb-1 mt-2 hidden md:block">
      press<Kbd>?</Kbd>for help
    </p>
  )
}

// pull the week from the URL otherwise default to the current time.
function getToday(search: string): Date {
  const week = new URLSearchParams(search).get("week")
  if (week == null || Array.isArray(week)) {
    return new Date()
  }
  const parsedDate = parseISO(week)
  if (isValid(parsedDate)) {
    return parsedDate
  }
  return new Date()
}

export function Calendar() {
  const location = useLocation()
  const today = getToday(location.search)
  const weekStartDate = startOfWeek(today)
  const startOfWeekMs = startOfWeek(weekStartDate).getTime()
  const startDate = startOfWeek(subWeeks(startOfWeekMs, 1))
  const endDate = endOfWeek(addWeeks(startOfWeekMs, 1))
  const history = useHistory()

  const scheduledRecipesResult = useScheduledRecipeList({ startOfWeekMs })

  const scheduledRecipes: ICalRecipe[] =
    scheduledRecipesResult.data?.scheduledRecipes ?? []

  function nextPage() {
    setQueryParams(history, {
      week: toISODateString(addWeeks(weekStartDate, 1)),
    })
  }
  function prevPage() {
    setQueryParams(history, {
      week: toISODateString(subWeeks(weekStartDate, 1)),
    })
  }

  const navCurrent = () => {
    // navigating to the current page when we're already on the current page
    // shouldn't cause another item to be added to the history
    if (location.search !== "") {
      removeQueryParams(history, ["week"])
    }
  }

  const scheduledById: IDays = {}
  scheduledRecipes.forEach((calRecipe) => {
    scheduledById[calRecipe.on] = (scheduledById[calRecipe.on] ?? []).concat(
      calRecipe,
    )
  })

  return (
    <Box dir="col" grow={1}>
      <Nav
        dayTs={startOfWeekMs}
        onNext={nextPage}
        onPrev={prevPage}
        onCurrent={navCurrent}
      />
      <Weekdays />
      <Days
        start={startDate}
        end={endDate}
        days={scheduledById}
        isError={scheduledRecipesResult.isError}
      />
      <HelpPrompt />
    </Box>
  )
}

export default Calendar
