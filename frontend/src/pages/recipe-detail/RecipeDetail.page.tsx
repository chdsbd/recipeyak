import { last, sortBy } from "lodash-es"
import queryString from "query-string"
import React, { useState } from "react"
import { RouteComponentProps, useHistory } from "react-router"
import { useLocation } from "react-router-dom"

import * as api from "@/api"
import { Button, ButtonPrimary } from "@/components/Buttons"
import { TextInput } from "@/components/Forms"
import { Helmet } from "@/components/Helmet"
import { Loader } from "@/components/Loader"
import { formatHumanDate } from "@/date"
import { useDispatch, useOnWindowFocusChange, useSelector } from "@/hooks"
import * as ordering from "@/ordering"
import AddIngredientOrSection from "@/pages/recipe-detail/AddIngredient"
import AddStep from "@/pages/recipe-detail/AddStep"
import { Ingredient } from "@/pages/recipe-detail/Ingredient"
import { NoteContainer } from "@/pages/recipe-detail/Notes"
import { SectionTitle } from "@/pages/recipe-detail/RecipeHelpers"
import { RecipeTimeline } from "@/pages/recipe-detail/RecipeTimeline"
import RecipeTitle, { TagEditor } from "@/pages/recipe-detail/RecipeTitle"
import { Dropdown } from "@/pages/recipe-detail/RecipeTitleDropdown"
import { Section } from "@/pages/recipe-detail/Section"
import StepContainer from "@/pages/recipe-detail/StepContainer"
import { getNewPosIngredients } from "@/position"
import { isOk } from "@/result"
import {
  deleteIngredient,
  fetchRecipe,
  getRecipeById,
  IIngredient,
  IRecipe,
  updateIngredient,
  updateSectionForRecipe,
  updatingRecipeAsync,
} from "@/store/reducers/recipes"
import { styled } from "@/theme"
import { recipeURL } from "@/urls"
import { pathNamesEqual } from "@/utils/url"
import { isFailure, isInitial, isLoading, isSuccessLike } from "@/webdata"

type SectionsAndIngredients = ReadonlyArray<
  | {
      readonly kind: "ingredient"
      readonly item: IIngredient
    }
  | {
      readonly kind: "section"
      readonly item: {
        readonly id: number
        readonly title: string
        readonly position: string
      }
    }
>
// from https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#improved-control-over-mapped-type-modifiers
type Mutable<T> = { -readonly [P in keyof T]-?: T[P] }

function getInitialIngredients({
  sections,
  ingredients,
}: Pick<IRecipe, "sections" | "ingredients">): SectionsAndIngredients {
  const out: Mutable<SectionsAndIngredients> = []
  for (const s of sections) {
    out.push({
      kind: "section" as const,
      item: s,
    })
  }
  for (const i of ingredients) {
    out.push({
      kind: "ingredient" as const,
      item: i,
    })
  }
  return sortBy(out, (x) => x.item.position)
}

function RecipeDetails({
  recipe,
  editingEnabled,
}: {
  readonly recipe: IRecipe
  editingEnabled: boolean
}) {
  // default to open when in edit mode
  const [addIngredient, setAddIngredient] = React.useState(editingEnabled)
  // default to open when in edit mode
  const [addStep, setAddStep] = React.useState(editingEnabled)
  const dispatch = useDispatch()
  const [sectionsAndIngredients, setSectionsAndIngredients] =
    React.useState<SectionsAndIngredients>(() => getInitialIngredients(recipe))
  React.useEffect(() => {
    setSectionsAndIngredients(
      getInitialIngredients({
        sections: recipe.sections,
        ingredients: recipe.ingredients,
      }),
    )
  }, [recipe.ingredients, recipe.sections])

  const handleMove = ({
    from,
    to,
  }: {
    readonly from: number
    readonly to: number
  }) => {
    setSectionsAndIngredients((prev) => {
      const newIngredients = [...prev]
      const item = newIngredients[from]
      newIngredients.splice(from, 1)
      newIngredients.splice(to, 0, item)
      return newIngredients
    })
  }

  const handleCompleteMove = (args: {
    readonly kind: "section" | "ingredient"
    readonly id: number
    readonly to: number
  }) => {
    const newPosition = getNewPosIngredients(sectionsAndIngredients, args.to)
    if (newPosition == null) {
      return
    }
    setSectionsAndIngredients((prev) => {
      const out: Mutable<SectionsAndIngredients> = []
      for (const item of prev) {
        if (item.item.id === args.id) {
          // NOTE(sbdchd): we do this weird `if` to make typescript happy
          if (item.kind === "ingredient") {
            out.push({
              ...item,
              item: {
                ...item.item,
                position: newPosition,
              },
            })
          } else {
            out.push({
              ...item,
              item: {
                ...item.item,
                position: newPosition,
              },
            })
          }
        } else {
          out.push(item)
        }
      }
      return out
    })
    if (args.kind === "ingredient") {
      dispatch(
        updateIngredient.request({
          recipeID: recipe.id,
          ingredientID: args.id,
          content: { position: newPosition },
        }),
      )
    } else {
      void api
        .updateSection({ sectionId: args.id, position: newPosition })
        .then((res) => {
          if (isOk(res)) {
            dispatch(
              updateSectionForRecipe({
                recipeId: recipe.id,
                sectionId: args.id,
                position: newPosition,
              }),
            )
          }
        })
    }
  }

  const handleHideAddIngredient = () => {
    setAddIngredient(false)
  }
  const handleShowAddIngredient = () => {
    setAddIngredient(true)
  }

  const handleRemove = ({ ingredientId }: { readonly ingredientId: number }) =>
    dispatch(
      deleteIngredient.request({
        recipeID: recipe.id,
        ingredientID: ingredientId,
      }),
    )

  const handleUpdate = ({
    ingredientId,
    ...ingredient
  }: {
    readonly ingredientId: number
    readonly quantity: string
    readonly name: string
    readonly description: string
    readonly optional: boolean
  }) =>
    dispatch(
      updateIngredient.request({
        recipeID: recipe.id,
        ingredientID: ingredientId,
        content: ingredient,
      }),
    )

  React.useEffect(() => {
    if (!editingEnabled) {
      setAddStep(false)
      setAddIngredient(false)
    }
  }, [editingEnabled])

  const steps = sortBy(recipe.steps, (x) => x.position)

  return (
    <section className="ingredients-preparation-grid">
      <div>
        <SectionTitle>Ingredients</SectionTitle>
        <ul>
          {sectionsAndIngredients.map((item, i) => {
            if (item.kind === "ingredient") {
              const ingre = item.item
              return (
                <Ingredient
                  key={"ingredient" + String(ingre.id)}
                  index={i}
                  recipeID={recipe.id}
                  id={ingre.id}
                  quantity={ingre.quantity}
                  name={ingre.name}
                  update={handleUpdate}
                  remove={handleRemove}
                  updating={ingre.updating}
                  isEditing={editingEnabled}
                  removing={ingre.removing}
                  description={ingre.description}
                  optional={ingre.optional}
                  completeMove={handleCompleteMove}
                  move={handleMove}
                />
              )
            }
            if (item.kind === "section") {
              const sec = item.item
              return (
                <Section
                  key={"section" + String(sec.id)}
                  recipeId={recipe.id}
                  sectionId={sec.id}
                  title={sec.title}
                  isEditing={editingEnabled}
                  index={i}
                  move={handleMove}
                  completeMove={handleCompleteMove}
                />
              )
            }
          })}
        </ul>
        {addIngredient ? (
          <AddIngredientOrSection
            recipeId={recipe.id}
            autoFocus
            addingIngredient={!!recipe.addingIngredient}
            onCancel={handleHideAddIngredient}
            newPosition={ordering.positionAfter(
              last(sectionsAndIngredients)?.item.position ??
                ordering.FIRST_POSITION,
            )}
          />
        ) : (
          editingEnabled && (
            <a className="text-muted" onClick={handleShowAddIngredient}>
              add
            </a>
          )
        )}
      </div>

      <div>
        <SectionTitle>Preparation</SectionTitle>
        <StepContainer
          steps={steps}
          isEditing={editingEnabled}
          recipeID={recipe.id}
        />
        {addStep ? (
          <AddStep
            id={recipe.id}
            index={steps.length + 1}
            step={recipe.draftStep}
            autoFocus
            onCancel={() => {
              setAddStep(false)
            }}
            loading={recipe.addingStepToRecipe}
            position={ordering.positionAfter(
              last(steps)?.position ?? ordering.FIRST_POSITION,
            )}
          />
        ) : (
          editingEnabled && (
            <a
              className="text-muted"
              onClick={() => {
                setAddStep(true)
              }}
            >
              add
            </a>
          )
        )}
        <NoteContainer
          timelineItems={recipe.timelineItems}
          recipeId={recipe.id}
        />
      </div>
    </section>
  )
}

export function useRecipe(recipeId: number) {
  const dispatch = useDispatch()
  const fetch = React.useCallback(
    (refresh?: boolean) => {
      dispatch(fetchRecipe.request({ recipeId, refresh }))
    },
    [dispatch, recipeId],
  )
  React.useEffect(() => {
    fetch()
  }, [fetch])
  const refreshData = React.useCallback(() => {
    fetch(true)
  }, [fetch])
  useOnWindowFocusChange(refreshData)
  return useSelector((state) => getRecipeById(state, recipeId))
}

const ArchiveMessage = styled.div`
  background: whitesmoke;
  font-weight: bold;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-radius: 5px;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
`

function RecipeBanner({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="d-flex align-items-center">
      <hr className="flex-grow mb-0 mt-0" />
      <ArchiveMessage>{children}</ArchiveMessage>
      <hr className="flex-grow mb-0 mt-0" />
    </div>
  )
}

/** On load, update the recipe URL to include the slugified recipe name */
function useRecipeUrlUpdate(recipe: { id: number; name: string } | null) {
  const location = useLocation()
  const history = useHistory()

  const { id: recipeId, name: recipeName } = recipe || {}

  React.useEffect(() => {
    if (recipeId == null || recipeName == null) {
      return
    }
    const pathname = recipeURL(recipeId, recipeName)
    if (pathNamesEqual(location.pathname, pathname)) {
      return
    }
    history.replace({ pathname, search: location.search })
  }, [history, history.replace, location, recipeId, recipeName])
}

type IRecipeProps = RouteComponentProps<{ id: string }>

function Meta({ title }: { title: string }) {
  React.useEffect(() => {
    const metaTags = document.querySelectorAll<HTMLMetaElement>(
      `meta[property="og:title"]`,
    )
    if (metaTags.length > 0) {
      if (metaTags[0].content !== title) {
        metaTags[0].content = title
      }
      // clear out any dupe tags
      if (metaTags.length > 1) {
        metaTags.forEach((x, i) => {
          // we only want one metatag
          if (i > 0) {
            x.remove()
          }
        })
      }
    } else {
      // setup the missing metatag
      const metaTag = document.createElement("meta")
      // NOTE: property is missing from the type
      metaTag.setAttribute("property", "og:title")
      metaTag.content = title
      document.head.appendChild(metaTag)
    }
  }, [title])
  return null
}

const HeaderImg = styled.img`
  border-radius: 3px;
`

const MyRecipeTitle = styled.div`
  font-size: 2.8rem;
  font-family: Georgia, serif;
`

const RecipeMetaTitle = styled.dt`
  font-weight: bold;
`
const RecipeMetaContent = styled.dd``
const RecipeMetaContainer = styled.dl`
  display: grid;
  grid-template-columns: 90px 1fr;
`

const RecipeDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const MyRecipeMeta = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: end;
  grid-row-gap: 4px;
`

function RecipeInfo(props: {
  recipe: IRecipe
  editingEnabled: boolean
  toggleEditMode: () => void
}) {
  const dispatch = useDispatch()
  const [formState, setFormState] = useState<Partial<IRecipe>>(props.recipe)
  const onSave = () => {
    void updatingRecipeAsync({ data: {}, id: props.recipe.id }, dispatch)
  }

  const handleChange =
    (attr: keyof Partial<IRecipe>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setFormState((s) => ({ ...s, [attr]: val }))
    }
  return (
    <div className="d-grid ingredients-preparation-grid">
      <RecipeDetailsContainer>
        <Dropdown
          recipeId={props.recipe.id}
          editingEnabled={props.editingEnabled}
          toggleEditing={props.toggleEditMode}
          toggleScheduling={() => {}}
        />
        {props.editingEnabled ? (
          <div>
            <label className="bold">
              Title
              <TextInput
                autoFocus
                placeholder="new recipe title"
                onChange={handleChange("name")}
                defaultValue={formState.name}
              />
            </label>
            <label className="bold">
              Author
              <TextInput
                placeholder="Author"
                defaultValue={formState.author ?? ""}
                onChange={handleChange("author")}
              />
            </label>
            <label className="bold">
              Time
              <TextInput
                placeholder="1 hour"
                defaultValue={formState.time ?? ""}
                onChange={handleChange("time")}
              />
            </label>
            <label className="bold">
              Servings
              <TextInput
                placeholder="4 to 6 servings"
                defaultValue={formState.servings ?? ""}
                onChange={handleChange("servings")}
                name="servings"
              />
            </label>
            <label className="bold">
              Tags
              <TagEditor
                tags={formState.tags}
                onCreate={() => {}}
                onRemove={() => {}}
                className="mr-2"
              />
            </label>
            <label className="bold">
              From
              <TextInput
                placeholder="http://example.com/dumpling-soup"
                defaultValue={formState.source ?? ""}
                onChange={handleChange("source")}
                name="source"
              />
            </label>
            <div className="d-flex grid-entire-row align-items-end justify-content-end mt-4">
              <Button
                size="small"
                className="mr-3"
                type="button"
                name="cancel recipe update"
                onClick={() => {}}
              >
                Cancel
              </Button>
              <ButtonPrimary
                size="small"
                type="submit"
                loading={false}
                onClick={() => {}}
                name="save recipe"
              >
                Save
              </ButtonPrimary>
            </div>
          </div>
        ) : (
          <>
            <div>
              <MyRecipeTitle>{props.recipe.name}</MyRecipeTitle>
              <div>By {props.recipe.author}</div>
            </div>
            <MyRecipeMeta>
              {[
                { title: "Time", content: "45 minutes" },
                { title: "Servings", content: "6 to 8 servings" },
                { title: "Tags", content: "chris, natasha" },
                { title: "From", content: "cooking.nytimes.com" },
              ].map((x) => (
                <RecipeMetaContainer key={x.title}>
                  <RecipeMetaTitle>{x.title}</RecipeMetaTitle>
                  <RecipeMetaContent>{x.content}</RecipeMetaContent>
                </RecipeMetaContainer>
              ))}
            </MyRecipeMeta>
          </>
        )}
      </RecipeDetailsContainer>
      <HeaderImg src="https://images-cdn.recipeyak.com/1/10c9c2a1e18d4809a215047d67bd201a/9B0360A4-B35D-4DC4-80B1-2FED8BD28287.jpeg" />
    </div>
  )
}

export function Recipe(props: IRecipeProps) {
  const recipeId = parseInt(props.match.params.id, 10)

  const maybeRecipe = useRecipe(recipeId)
  const history = useHistory()
  const parsed = queryString.parse(props.location.search)
  const editingEnabled = parsed.edit === "1"

  // default to metadata being in edit mode when the page is naved to with edit=1
  const [editingMetadata, setEditingMetadata] = React.useState(editingEnabled)

  useRecipeUrlUpdate(
    isSuccessLike(maybeRecipe)
      ? { id: maybeRecipe.data.id, name: maybeRecipe.data.name }
      : null,
  )

  if (isInitial(maybeRecipe) || isLoading(maybeRecipe)) {
    return <Loader />
  }

  if (isFailure(maybeRecipe)) {
    return <p>recipe not found</p>
  }

  const recipe = maybeRecipe.data

  const isTimeline = !!parsed.timeline
  const archivedAt = recipe.archived_at
    ? formatHumanDate(new Date(recipe.archived_at))
    : null

  const toggleEditMode = () => {
    const params = new URLSearchParams(props.location.search)
    if (params.get("edit")) {
      params.delete("edit")
    } else {
      params.set("edit", "1")
    }
    history.push({ search: "?" + params.toString() })
  }

  let recipeTitle = recipe.name
  if (recipe.author) {
    recipeTitle = recipeTitle + ` by ${recipe.author}`
  }
  return (
    <div className="d-grid gap-2 mx-auto mw-1000px">
      <Helmet title={recipe.name} />
      <Meta title={recipeTitle} />
      {archivedAt != null && <RecipeBanner>Archived {archivedAt}</RecipeBanner>}
      {editingEnabled && (
        <RecipeBanner>
          Editing
          <Button
            size="small"
            type="button"
            name="toggle add section"
            className="ml-3"
            onClick={toggleEditMode}
          >
            Exit
          </Button>
        </RecipeBanner>
      )}

      <RecipeInfo
        recipe={recipe}
        editingEnabled={editingEnabled}
        toggleEditMode={toggleEditMode}
      />

      {isTimeline ? (
        <RecipeTimeline recipeId={recipe.id} createdAt={recipe.created} />
      ) : (
        <RecipeDetails recipe={recipe} editingEnabled={editingEnabled} />
      )}
    </div>
  )
}

export default Recipe
