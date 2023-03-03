import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import raven from "raven-js"
import { useHistory } from "react-router"

import { deleteTeam } from "@/api"
import { unwrapResult } from "@/query"
import { toast } from "@/toast"

export function useTeamDelete() {
  const history = useHistory()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId }: { teamId: number }) =>
      deleteTeam(teamId).then(unwrapResult),
    onSuccess: (_res, vars) => {
      history.push("/")
      toast.success(`Team deleted`)
      queryClient.removeQueries(["teams", vars.teamId])
    },
    onError: (res) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-assignment
      const err = res as AxiosError | undefined
      let message = "Uh Oh! Something went wrong."

      if (err?.response?.status === 403) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message = err.response.data?.detail
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            err.response.data.detail
          : "You are not authorized to delete this team"
      } else if (err?.response?.status === 404) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message = err.response.data?.detail
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            err.response.data.detail
          : "The team you are attempting to delete doesn't exist"
      } else {
        raven.captureException(err)
      }
      toast.error(message)
    },
  })
}