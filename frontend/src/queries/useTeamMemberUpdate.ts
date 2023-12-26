
import { useMutation } from "@tanstack/react-query"

import { httpx } from "@/http"

export function useTeamMemberUpdate() {
  return useMutation({
    mutationFn: teamMemberUpdate,
  })
}

// AUTOGEN
function teamMemberUpdate(params: 
{
"offset": string
"limit": string
"some_id": string
"ids_with_str": string
"ids_with_int": string
"team_id": string
"member_id": string
}
): Promise<
{
"id": string
"name": string
"tags": string
"members": string
}
> {
return httpx({
    method: 'patch',
    url: `teams/${params.team_id}/members/${params.member_id}`,
    params,
})
}
    