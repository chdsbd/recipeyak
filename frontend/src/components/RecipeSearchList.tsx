import React, { useEffect, useState } from "react"
import { useHistory } from "react-router"

import cls from "@/classnames"
import { Box } from "@/components/Box"
import { Button } from "@/components/Buttons"
import { CheckBox, SearchInput } from "@/components/Forms"
import { Loader } from "@/components/Loader"
import RecipeItem from "@/pages/recipe-list/RecipeItem"
import { parseIntOrNull } from "@/parseIntOrNull"
import { pathRecipeAdd } from "@/paths"
import { useRecipeList } from "@/queries/recipeList"
import { ITeam } from "@/queries/teamFetch"
import { searchRecipes } from "@/search"
import { styled } from "@/theme"
import { removeQueryParams, setQueryParams } from "@/utils/querystring"

interface IResultsProps {
  readonly recipes: JSX.Element[]
  readonly query: string
}

function Results({ recipes, query }: IResultsProps) {
  if (recipes.length === 0 && query !== "") {
    return <NoMatchingRecipe query={query} />
  }
  return <>{recipes}</>
}

function AddRecipeCallToAction() {
  return (
    <Box dir="col" mx="auto" mt={2} align="center" gap={1}>
      <div>No recipes here.</div>
      <Button variant="primary" size="small" to={pathRecipeAdd({})}>
        Add a Recipe
      </Button>
    </Box>
  )
}

function NoMatchingRecipe({ query }: { readonly query: string }) {
  return (
    <p className="grid-entire-row justify-center break-word">
      No recipes found matching <strong>{query}</strong>
    </p>
  )
}

interface IRecipeList {
  readonly query: string
  readonly drag?: boolean
  readonly scroll?: boolean
}

const NAV_HEIGHT = "65px"
const SEARCH_AND_TAB_HEIGHT = "30px"

const RecipeScroll = styled.div<{ scroll: boolean | undefined }>`
  // we only enable scrolling when not at the small width (aka mobile), since
  // scroll boxes on mobile are much worse than normal scroll behavior
  ${(p) =>
    p.scroll &&
    `@media (min-width: ${p.theme.small}) {
       height: calc(100vh - (${NAV_HEIGHT} + ${SEARCH_AND_TAB_HEIGHT}));
       overflow: auto;
       // edges of the recipe boxes get cut without extra padding
       padding: 0.125rem; 
     }`}
`

function RecipeList(props: IRecipeList) {
  const [showArchived, setShowArchived] = useState(false)

  const recipes = useRecipeList()

  if (!recipes.isSuccess) {
    return <Loader />
  }

  const results = searchRecipes({
    recipes: recipes.data,
    query: props.query,
    includeArchived: true,
  })

  const normalResults = results.recipes
    .filter((result) => !result.recipe.archived_at)
    .map((result, index) => (
      <RecipeItem
        {...result.recipe}
        index={index}
        match={result.match}
        drag={props.drag}
        key={result.recipe.id}
      />
    ))
  const archivedResults = results.recipes
    .filter((result) => result.recipe.archived_at)
    .map((result, index) => (
      <RecipeItem
        {...result.recipe}
        index={index}
        match={result.match}
        drag={props.drag}
        key={result.recipe.id}
      />
    ))

  if (results.recipes.length === 0 && props.query === "") {
    return <AddRecipeCallToAction />
  }

  return (
    <RecipeScroll scroll={props.scroll}>
      <div className="mb-2 d-flex justify-space-between flex-wrap">
        <div className="fs-14px mr-2">
          results: {normalResults.length + archivedResults.length}{" "}
          {archivedResults.length > 0 && (
            <>({archivedResults.length} archived)</>
          )}
        </div>
        <div className="fs-14px">
          <label>
            show all:
            <CheckBox
              onChange={() => {
                setShowArchived((s) => !s)
              }}
              checked={showArchived}
              name="optional"
              className="ml-1 mr-2"
            />
          </label>
        </div>
      </div>
      <div className="recipe-grid">
        <Results recipes={normalResults} query={props.query} />
      </div>
      {archivedResults.length > 0 && showArchived ? (
        <>
          <div className="d-flex align-items-center">
            <hr className="flex-grow-1" />
            <b className="mx-4 my-4">Archived Recipes</b>
            <hr className="flex-grow-1" />
          </div>
          <div className="recipe-grid">
            <Results recipes={archivedResults} query={props.query} />
          </div>
        </>
      ) : null}
    </RecipeScroll>
  )
}

function getSearch(qs: string): string {
  const params = new URLSearchParams(qs)
  const searchQuery = params.get("search")
  if (searchQuery != null && typeof searchQuery === "string") {
    return decodeURIComponent(searchQuery)
  }
  const tagParam = params.get("tag")
  if (typeof tagParam === "string") {
    return `tag:${tagParam}`
  }
  const recipeIdParam = params.get("recipeId")
  if (recipeIdParam == null || Array.isArray(recipeIdParam)) {
    return ""
  }
  const recipeId = parseIntOrNull(recipeIdParam)
  if (recipeId == null) {
    return ""
  }
  return `recipeId:${recipeId}`
}

// TODO(sbdchd): this really shouldn't be shared like it is
export function RecipeSearchList({
  noPadding,
  drag,
  scroll,
}: {
  readonly scroll?: boolean
  readonly drag?: boolean
  readonly noPadding?: boolean
  readonly teamID?: ITeam["id"] | null
}) {
  const [query, setQuery] = useState(() => getSearch(window.location.search))
  const history = useHistory()

  useEffect(() => {
    if (query === "") {
      removeQueryParams(history, ["search"])
    } else {
      setQueryParams(history, { search: query })
    }
  }, [query, history])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <div className={cls(noPadding ? "" : "mw-1000px ml-auto mr-auto")}>
      <SearchInput
        value={query}
        className={cls(noPadding ? "" : "mb-2")}
        onChange={handleQueryChange}
        placeholder="search • optionally prepended a tag, 'author:' 'name:' 'ingredient:"
      />
      <RecipeList query={query} drag={drag} scroll={scroll} />
    </div>
  )
}