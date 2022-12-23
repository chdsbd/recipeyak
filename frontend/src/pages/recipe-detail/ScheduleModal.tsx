import { parseISO } from "date-fns"
import React from "react"
import { Link } from "react-router-dom"

import { isMobile } from "@/browser"
import { Box } from "@/components/Box"
import { Button } from "@/components/Buttons"
import { Modal } from "@/components/Modal"
import { toISODateString } from "@/date"
import { useSelector, useTeamId } from "@/hooks"
import { useScheduleRecipeCreate } from "@/queries/scheduledRecipeCreate"
import { scheduleURLFromTeamID } from "@/store/mapState"

function useScheduleUrl(recipeId: number) {
  return useSelector(scheduleURLFromTeamID) + `?recipeId=${recipeId}`
}

export function ScheduleModal({
  recipeName,
  recipeId,
  onClose,
}: {
  readonly recipeId: number
  readonly recipeName: string
  readonly onClose: () => void
}) {
  const [isoDate, setIsoDate] = React.useState(toISODateString(new Date()))
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsoDate(e.target.value)
  }
  const teamId = useTeamId()

  const scheduledRecipeCreate = useScheduleRecipeCreate()
  const handleSave = () => {
    scheduledRecipeCreate.mutate(
      {
        recipeID: recipeId,
        teamID: teamId,
        count: 1,
        on: parseISO(isoDate),
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  const scheduleUrl = useScheduleUrl(recipeId)

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
            className="mt-2"
            style={{
              border: "1px solid lightgray",
              borderRadius: 5,
              padding: "0.25rem",
            }}
          />

          <Box space="between" align="center">
            {!isMobile() ? (
              <Link to={scheduleUrl} className="text-small">
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
                disabled={scheduledRecipeCreate.isLoading}
              >
                {!scheduledRecipeCreate.isLoading
                  ? "schedule"
                  : "scheduling..."}
              </Button>
            </Box>
          </Box>
        </Box>
      }
    />
  )
}
