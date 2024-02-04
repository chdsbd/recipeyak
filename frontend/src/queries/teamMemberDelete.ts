import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"

import { memberDelete } from "@/api/memberDelete"
import { setQueryDataTeamMemberList } from "@/queries/teamMembersList"
import { toast } from "@/toast"

export function useTeamMemberDelete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId }: { memberId: number; teamId: number }) =>
      memberDelete({ member_id: memberId }),
    onSuccess: (_res, vars) => {
      setQueryDataTeamMemberList(queryClient, {
        teamId: vars.teamId,
        updater: (prev) => {
          return prev?.filter((x) => x.id !== vars.memberId)
        },
      })
    },
    onError: (error) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-assignment
      const err = error as AxiosError | undefined
      if (err == null) {
        return {}
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const message: string = err.response?.data
      toast.error(message)
    },
  })
}
