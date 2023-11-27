import { RouteComponentProps } from "react-router"

import { Helmet } from "@/components/Helmet"
import { Loader } from "@/components/Loader"
import { Meta } from "@/components/Meta"
import { NavPage } from "@/components/Page"
import { CookingFullscreen } from "@/pages/cook-detail/CookingFullscreen"
import { pathCookDetail } from "@/paths"
import { INote, TimelineItem, useRecipeFetch } from "@/queries/recipeFetch"
import { formatImgOpenGraph } from "@/url"
import { useAddSlugToUrl } from "@/useAddSlugToUrl"

function isNote(x: TimelineItem): x is INote {
  return x.type === "note"
}

export function CookDetailPage(
  props: RouteComponentProps<{ recipeId: string }>,
) {
  const recipeId = parseInt(props.match.params.recipeId, 10)
  const maybeRecipe = useRecipeFetch({ recipeId })
  const myRecipe = maybeRecipe.isSuccess ? maybeRecipe.data : null
  const notes = myRecipe?.timelineItems.filter(isNote) ?? []

  useAddSlugToUrl(
    pathCookDetail({ recipeId: recipeId.toString() }),
    maybeRecipe.data?.name,
  )

  if (maybeRecipe.isPending) {
    return <Loader />
  }

  if (maybeRecipe.isError) {
    return <p>recipe not found</p>
  }

  const recipe = maybeRecipe.data

  let recipeTitle = recipe.name
  if (recipe.author) {
    recipeTitle = recipeTitle + ` by ${recipe.author}`
  }

  return (
    <NavPage>
      <Helmet title={recipe.name} />
      <Meta
        title={recipeTitle}
        image={formatImgOpenGraph(recipe.primaryImage?.url ?? "")}
      />
      <CookingFullscreen
        recipeId={recipe.id}
        recipeName={recipe.name}
        recipeSource={recipe.source}
        ingredients={recipe.ingredients}
        sections={recipe.sections}
        steps={recipe.steps}
        notes={notes}
      />
    </NavPage>
  )
}
