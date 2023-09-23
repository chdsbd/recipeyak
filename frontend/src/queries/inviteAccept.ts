import { useMutation, useQueryClient } from "@tanstack/react-query"

import { http } from "@/http"
import { IInvite } from "@/queries/inviteList"
import { unwrapResult } from "@/query"

const acceptInvite = (id: IInvite["id"]) =>
  http.post<void>(`/api/v1/invites/${id}/accept/`, {})

export function useInviteAccept() {
  // TODO: if we delete the current session that should use the logout mutation
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ inviteId }: { inviteId: number }) =>
      acceptInvite(inviteId).then(unwrapResult),
    onSuccess: (_response, vars) => {
      queryClient.setQueryData<readonly IInvite[]>(["invites"], (prev) => {
        return prev?.map((x) => {
          if (x.id === vars.inviteId) {
            return { ...x, status: "accepted" as const }
          }
          return x
        })
      })
    },
  })
}
