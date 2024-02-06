// generated by recipeyak.api.base.codegen
import { http } from "@/apiClient"

export function recipeRecentlyCreated() {
  return http<
    Array<{
      id: number
      name: string
      author: string | null
      archivedAt: string | null
      primaryImage: {
        id: number
        url: string
        backgroundUrl: string | null
      } | null
      createdBy: {
        id: number
        name: string
        avatarUrl: string
      } | null
    }>
  >({
    url: "/api/v1/recipes/recently_created",
    method: "get",
  })
}