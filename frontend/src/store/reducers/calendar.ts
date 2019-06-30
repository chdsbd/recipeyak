import { uniq, omit } from "lodash"
import isSameDay from "date-fns/is_same_day"
import {
  createAsyncAction,
  ActionType,
  getType,
  createStandardAction
} from "typesafe-actions"
import { IState } from "@/store/store"
import { isUndefined } from "util"
import { notUndefined } from "@/utils/general"
import { ITeam } from "@/store/reducers/teams"
import { IUser } from "@/store/reducers/user"

export const fetchCalendarRecipes = createAsyncAction(
  "FETCH_CALENDAR_RECIPES_START",
  "FETCH_CALENDAR_RECIPES_SUCCESS",
  "FETCH_CALENDAR_RECIPES_FAILURE"
)<void, ICalRecipe[], void>()
export const setCalendarRecipe = createStandardAction("SET_CALENDAR_RECIPE")<
  ICalRecipe
>()
export const deleteCalendarRecipe = createStandardAction(
  "DELETE_CALENDAR_RECIPE"
)<number>()
export const moveCalendarRecipe = createStandardAction("MOVE_CALENDAR_RECIPE")<{
  id: ICalRecipe["id"]
  to: string
}>()
export const replaceCalendarRecipe = createStandardAction(
  "REPLACE_CALENDAR_RECIPE"
)<{ id: ICalRecipe["id"]; recipe: ICalRecipe }>()

export type CalendarActions =
  | ReturnType<typeof setCalendarRecipe>
  | ReturnType<typeof deleteCalendarRecipe>
  | ReturnType<typeof moveCalendarRecipe>
  | ReturnType<typeof replaceCalendarRecipe>
  | ActionType<typeof fetchCalendarRecipes>

// TODO(sbdchd): this should be imported from the recipes reducer
export interface ICalRecipe {
  readonly id: number
  readonly count: number
  readonly on: string
  readonly team: ITeam["id"] | null
  readonly user: IUser["id"] | null
  readonly recipe: {
    readonly id: number
    readonly name: string
  }
}

export interface ICalendarState {
  readonly allIds: ICalRecipe["id"][]
  readonly loading: boolean
  readonly error: boolean
  readonly byId: {
    readonly [key: number]: ICalRecipe | undefined
  }
}

export const initialState: ICalendarState = {
  allIds: [],
  byId: {},
  loading: false,
  error: false
}

export const calendar = (
  state: ICalendarState = initialState,
  action: CalendarActions
): ICalendarState => {
  switch (action.type) {
    case getType(fetchCalendarRecipes.success):
      return {
        ...state,
        byId: {
          ...state.byId,
          ...action.payload.reduce((a, b) => ({ ...a, [b.id]: b }), {})
        },
        allIds: uniq(state.allIds.concat(action.payload.map(x => x.id)))
      }
    case getType(setCalendarRecipe): {
      // TOOD(sbdchd): move to selector
      const existing = state.allIds
        .map(x => state.byId[x])
        .find(
          x =>
            notUndefined(x) &&
            isSameDay(x.on, action.payload.on) &&
            haveSameTeam(x, action.payload) &&
            x.recipe.id === action.payload.recipe.id &&
            x.id !== action.payload.id
        )

      if (existing) {
        // we remove the existing and replace with the pending uuid
        return {
          ...state,
          byId: {
            ...omit(state.byId, existing.id),
            [action.payload.id]: {
              ...action.payload,
              count: existing.count + action.payload.count
            }
          },
          allIds: state.allIds
            .filter(id => id !== existing.id)
            .concat(action.payload.id)
        }
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [action.payload.id]: action.payload
        },
        allIds: uniq(state.allIds.concat(action.payload.id))
      }
    }
    case getType(deleteCalendarRecipe):
      return {
        ...state,
        byId: omit(state.byId, action.payload),
        allIds: state.allIds.filter(id => id !== action.payload)
      }
    case getType(fetchCalendarRecipes.request):
      return {
        ...state,
        loading: true,
        error: false
      }
    case getType(fetchCalendarRecipes.failure):
      return {
        ...state,
        error: true
      }
    case getType(moveCalendarRecipe): {
      // if the same recipe already exists at the date:
      // - add the two counts
      // - remove the old recipe
      // else
      // - update the date of the recipe
      const moving = state.byId[action.payload.id]

      const isSameTeamAndDay = (r: ICalRecipe | undefined): r is ICalRecipe => {
        if (isUndefined(moving) || isUndefined(r)) {
          return false
        }
        return (
          r.id !== action.payload.id &&
          isSameDay(r.on, action.payload.to) &&
          r.team === moving.team &&
          r.user === moving.user
        )
      }

      const existing =
        notUndefined(moving) &&
        state.allIds
          .map(id => state.byId[id])
          .filter(isSameTeamAndDay)
          .find(r => r.recipe.id === moving.recipe.id)

      if (existing && notUndefined(moving)) {
        return {
          ...state,
          byId: {
            ...omit(state.byId, action.payload.id),
            [existing.id]: {
              ...existing,
              count: existing.count + moving.count
            }
          },
          allIds: state.allIds.filter(id => id !== action.payload.id)
        }
      }

      const cal = state.byId[action.payload.id]
      if (cal == null) {
        return state
      }
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.payload.id]: {
            ...cal,
            on: action.payload.to
          }
        }
      }
    }
    case getType(replaceCalendarRecipe):
      return {
        ...state,
        byId: {
          ...omit(state.byId, action.payload.id),
          [action.payload.recipe.id]: action.payload.recipe
        },
        allIds: uniq(
          state.allIds
            .filter(id => id !== action.payload.id)
            .concat(action.payload.recipe.id)
        )
      }
    default:
      return state
  }
}

export default calendar

export const getCalRecipeById = (
  state: IState,
  id: ICalRecipe["id"]
): ICalRecipe | undefined => state.calendar.byId[id]

export const getAllCalRecipes = (state: IState): ICalRecipe[] =>
  state.calendar.allIds
    .map(id => getCalRecipeById(state, id))
    .filter(notUndefined)

export const getTeamRecipes = (state: IState): ICalRecipe[] =>
  getAllCalRecipes(state).filter(recipe => recipe.team != null)

export const getPersonalRecipes = (state: IState): ICalRecipe[] =>
  getAllCalRecipes(state).filter(recipe => recipe.team == null)

function haveSameTeam(a: ICalRecipe, b: ICalRecipe): boolean {
  return a.team === b.team && a.user === b.user
}

function isSameTeam(x: ICalRecipe, teamID: TeamID): boolean {
  if (teamID === "personal") {
    return x.user != null
  }
  return x.team === teamID
}

interface IGetExistingRecipeProps {
  readonly state: IState
  readonly on: Date
  // recipe that is going to be moved
  readonly from: ICalRecipe
  readonly teamID: TeamID
}

export const getExistingRecipe = ({
  state,
  on,
  teamID,
  from
}: IGetExistingRecipeProps) =>
  getAllCalRecipes(state).find(
    x =>
      isSameDay(x.on, on) &&
      isSameTeam(x, teamID) &&
      x.id !== from.id &&
      x.recipe.id === from.recipe.id
  )
