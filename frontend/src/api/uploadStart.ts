// generated by recipeyak.api.base.codegen
import { http } from "@/apiClient"

export function uploadStart(params: {
  file_name: string
  content_type: string
  content_length: number
  recipe_id?: number | null
  purpose?: "recipe" | "profile"
}) {
  return http<{
    id: number
    upload_url: string
    upload_headers: Record<string, string>
  }>({
    url: "/api/v1/upload/",
    method: "post",
    params,
  })
}