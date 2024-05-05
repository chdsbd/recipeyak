// generated by recipeyak.api.base.codegen
import { http } from "@/apiClient"

export function recipeCreate(params: {
  team: number
  from_url?: string | null
  name?: string | null
}) {
  return http<{
    /** Unique ID of the Recipe. */
    id: number
    /** The name of the Recipe. */
    name: string
    /** The author of the Recipe. */
    author: string | null
    /** The source of the Recipe. */
    source: string | null
    /** The time duration to make the Recipe. */
    time: string | null
    /** The number of servings the Recipe yields. */
    servings: string | null
    /** The Ingredients of the Recipe. */
    ingredients: Array<{
      /** Unique ID of the Ingredient. */
      id: number
      /** The quantity of the Ingredient. */
      quantity: string
      /** The name of the Ingredient. */
      name: string
      /** The description of the Ingredient. */
      description: string
      /** The position of the Ingredient in the Recipe. */
      position: string
      /** Whether the Ingredient is optional for the Recipe. */
      optional: boolean
    }>
    /** The Steps of the Recipe. */
    steps: Array<{
      id: number
      text: string
      position: string
    }>
    /** The ScheduledRecipes of the Recipe in the past 3 weeks, and the next 3 weeks. */
    recentSchedules: Array<{
      id: number
      on: string
    }>
    /** The Notes and TimelineEvents of the Recipe. */
    timelineItems: Array<
      | {
          id: string
          text: string
          created_by: {
            id: number
            name: string
            email: string
            avatar_url: string
          }
          created: string
          modified: string
          attachments: Array<{
            id: string
            url: string
            backgroundUrl: string | null
            contentType: string
            isPrimary: boolean
            type: "upload"
          }>
          reactions: Array<{
            id: string
            type: "❤️" | "😆" | "🤮"
            note_id: number
            user: {
              id: number
              name: string
              email: string
              avatar_url: string
            }
            created: string
          }>
          type: "note"
        }
      | {
          id: number
          type: "recipe"
          action:
            | "created"
            | "archived"
            | "unarchived"
            | "deleted"
            | "scheduled"
            | "remove_primary_image"
            | "set_primary_image"
          created_by: {
            id: number
            name: string
            email: string
            avatar_url: string
          } | null
          is_scraped: boolean
          created: string
        }
    >
    /** The Sections of the Recipe. */
    sections: Array<{
      id: number
      title: string
      position: string
    }>
    /** The last modified time of the Recipe fields. */
    modified: string
    /** The creation time of the Recipe. */
    created: string
    /** When the Recipe was archived. */
    archived_at: string | null
    /** Whether the User has favorited the Recipe. */
    user_favorite: boolean
    /** The tags of the Recipe. */
    tags: Array<string> | null
    /** The primary image of the Recipe. */
    primaryImage: {
      /** Unique ID of the Upload. */
      id: string
      /** The URL of the Upload. */
      url: string
      /** The background URL of the Upload for progressive loading. */
      backgroundUrl: string | null
      /** The content type of the Upload. */
      contentType: string
      /** Name of User who created the Upload. */
      author: string | null
    } | null
    /** The previous versions of the Recipe. */
    versions: Array<{
      id: number
      created_at: string
      actor: {
        id: number
        name: string
        avatar_url: string
      } | null
      name: string
      author: string | null
      source: string | null
      time: string | null
      servings: string | null
      archived_at: string | null
      tags: Array<string> | null
      primary_image: {
        id: number
        url: string
        backgroundUrl: string | null
      } | null
      ingredients: Array<
        | {
            id: number | null
            type: "ingredient"
            description: string
            quantity: string
            name: string
            position: string
            optional: boolean
          }
        | {
            id: number | null
            type: "section"
            title: string
            position: string
          }
      >
      steps: Array<{
        id: number | null
        text: string
        position: string
      }>
    }>
  }>({
    url: "/api/v1/recipes/",
    method: "post",
    params,
  })
}
