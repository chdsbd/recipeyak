import { useQuery } from "@tanstack/react-query"

import { getShoppingList } from "@/api"
import { useTeamId } from "@/hooks"
import { unwrapResult } from "@/query"

export function useShoppingListFetch({
  startDay,
  endDay,
}: {
  startDay: Date | number
  endDay: Date | number
}) {
  const teamId = useTeamId()
  return useQuery(
    [teamId, "shopping-list", startDay, endDay],
    () => getShoppingList(teamId, startDay, endDay).then(unwrapResult),
    {
      keepPreviousData: true,
    },
  )
}