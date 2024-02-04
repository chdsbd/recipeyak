// generated by recipeyak.api.base.codegen
import { http } from "@/apiClient"

export function userRetrieve() {
  return http<{
    id: number
    name: string
    avatar_url: string
    email: string
    theme_day: "light" | "dark" | "dark_dimmed" | "autumn" | "solarized"
    theme_night: "light" | "dark" | "dark_dimmed" | "autumn" | "solarized"
    theme_mode: "single" | "sync_with_system"
    schedule_team: number | null
  }>({
    url: "/api/v1/user/",
    method: "get",
  })
}
