import { format, isFuture, isToday, parseISO, startOfWeek } from "date-fns"
import { orderBy } from "lodash-es"
import React from "react"
import { Link } from "react-router-dom"

import { isMobile } from "@/browser"
import { Box } from "@/components/Box"
import { Button } from "@/components/Buttons"
import Clock from "@/components/icons"
import { Modal } from "@/components/Modal"
import { formatDistanceToNow, formatHumanDate, toISODateString } from "@/date"
import { pathSchedule } from "@/paths"
import { RecentSchedule } from "@/queries/recipeFetch"
import { useScheduleRecipeCreate } from "@/queries/scheduledRecipeCreate"
import { addQueryParams } from "@/querystring"
import { useTeamId } from "@/useTeamId"

function RecentSchedules({
  scheduleHistory,
  scheduleUrl,
}: {
  readonly scheduleHistory: readonly RecentSchedule[]
  readonly scheduleUrl: string
}) {
  return (
    <Box dir="col">
      <div className="font-bold">Recent Schedules</div>
      <Box dir="col" gap={2}>
        {orderBy(scheduleHistory, (x) => x.on).map((x, i) => {
          const on = parseISO(x.on)
          const week = toISODateString(startOfWeek(on))
          const to = {
            pathname: scheduleUrl,
            search: addQueryParams(location.search, { week }),
          }
          return (
            <Box space="between" align="center" key={i}>
              <Link to={to} className="grow" style={{ lineHeight: "1.3" }}>
                <div className="font-medium">
                  {format(on, "E")} ∙ {formatHumanDate(on)}
                </div>
                <Box gap={1}>
                  {isFuture(on) && <Clock size={14} />}
                  <div>
                    {isToday(on)
                      ? // avoid showing "3 hours ago" for today
                        ""
                      : formatDistanceToNow(on, {
                          allowFuture: true,
                          ignoreHours: true,
                        })}
                  </div>
                </Box>
              </Link>
              <Button size="small" to={to}>
                view
              </Button>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export function ScheduleModal({
  recipeName,
  recipeId,
  onClose,
  scheduleHistory,
}: {
  readonly recipeId: number
  readonly recipeName: string
  readonly onClose: () => void
  readonly scheduleHistory: readonly RecentSchedule[]
}) {
  const [isoDate, setIsoDate] = React.useState(toISODateString(new Date()))
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsoDate(e.target.value)
  }

  const scheduledRecipeCreate = useScheduleRecipeCreate()
  const handleSave = () => {
    scheduledRecipeCreate.mutate(
      {
        recipeID: recipeId,
        recipeName,
        teamID: teamId,
        on: parseISO(isoDate),
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  const teamId = useTeamId()
  const params = new URLSearchParams(location.search)
  params.set("search", `recipeId:${recipeId.toString()}`)
  const openInCalendarUrl = {
    pathname: pathSchedule({ teamId: teamId.toString() }),
    search: params.toString(),
  }

  return (
    <Modal
      show
      onClose={onClose}
      title={`Schedule: ${recipeName}`}
      content={
        <Box gap={2} dir="col">
          <input
            value={toISODateString(isoDate)}
            onChange={handleDateChange}
            type="date"
            className="mt-2 w-full"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 5,
              padding: "0.25rem",
            }}
          />

          <Box space="between" align="center">
            {!isMobile() ? (
              <Link to={openInCalendarUrl} className="text-sm">
                open in calendar
              </Link>
            ) : (
              <div />
            )}
            <Box align="center" gap={2}>
              <Button size="small" onClick={onClose}>
                cancel
              </Button>
              <Button
                size="small"
                variant="primary"
                onClick={handleSave}
                disabled={scheduledRecipeCreate.isPending}
              >
                {!scheduledRecipeCreate.isPending
                  ? "schedule"
                  : "scheduling..."}
              </Button>
            </Box>
          </Box>

          {scheduleHistory.length > 0 && (
            // we intentionally hide from view when there are no scheduled
            // recipes in the history window -- avoids having an empty state
            <RecentSchedules
              scheduleHistory={scheduleHistory}
              scheduleUrl={pathSchedule({ teamId: teamId.toString() })}
            />
          )}
        </Box>
      }
    />
  )
}
