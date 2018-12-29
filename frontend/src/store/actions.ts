import isSameDay from "date-fns/is_same_day"

// TODO(chdsbd): Replace "personal" with null in all uses
type TeamID = number | "personal"

export type Dispatch = ReduxDispatch<Action>

export type GetState = () => RootState

import { uuid4, random32Id } from "@/uuid"
import Cookie from "js-cookie"

import startOfMonth from "date-fns/start_of_month"
import subWeeks from "date-fns/sub_weeks"
import endOfMonth from "date-fns/end_of_month"
import addWeeks from "date-fns/add_weeks"

import { pyFormat } from "@/date"

import { push, replace } from "react-router-redux"
import axios, { AxiosError, AxiosResponse, CancelTokenSource } from "axios"
import raven from "raven-js"

import { store, RootState, Action } from "@/store/store"
import {
  SocialProvider,
  updateEmail,
  updateTeamID,
  fetchingUser,
  setSocialConnections,
  setLoadingUserStats,
  setUserStats,
  login,
  setUserLoggedIn,
  setLoggingOut,
  IUser,
  IUserStats,
  ISocialConnection
} from "@/store/reducers/user"
import {
  ICalRecipe,
  setCalendarLoading,
  setCalendarError,
  setCalendarRecipe,
  replaceCalendarRecipe,
  deleteCalendarRecipe,
  setCalendarRecipes,
  moveCalendarRecipe
} from "@/store/reducers/calendar"
import {
  setDecliningInvite,
  setDeclinedInvite,
  setAcceptingInvite,
  setAcceptedInvite,
  setLoadingInvites,
  setErrorFetchingInvites,
  setInvites,
  IInvite
} from "@/store/reducers/invites"
import {
  INotificationState,
  setNotification,
  clearNotification
} from "@/store/reducers/notification"
import { IRecipeBasic } from "@/components/AddRecipe"
import {
  ITeam,
  deleteTeam,
  addTeam,
  setLoadingTeam,
  setLoadingTeamMembers,
  setLoadingTeamRecipes,
  setTeamMembers,
  setTeam404,
  setTeamRecipes,
  setUpdatingUserTeamLevel,
  setUserTeamLevel,
  setDeletingMembership,
  setSendingTeamInvites,
  deleteMembership,
  setTeams,
  setCreatingTeam,
  setTeam,
  setLoadingTeams,
  updateTeamById,
  setCopyingTeam,
  IMember
} from "@/store/reducers/teams"
import {
  IRecipe,
  setSchedulingRecipe,
  updateRecipeOwner,
  setRecipes,
  deleteRecipe,
  setRemovingStep,
  deleteStep,
  updateStep,
  setUpdatingStep,
  setRemovingIngredient,
  deleteIngredient,
  setUpdatingIngredient,
  setLoadingAddStepToRecipe,
  addStepToRecipe,
  setRecipeUpdating,
  setRecipe,
  updateRecipeTime,
  updateRecipeAuthor,
  updateRecipeSource,
  updateRecipeName,
  setAddingIngredientToRecipe,
  addIngredientToRecipe,
  updateIngredient,
  IIngredient,
  fetchRecipe
} from "@/store/reducers/recipes"
import * as api from "@/api"
import {
  setLoadingAddRecipe,
  setLoadingRecipes,
  setLoadingLogin,
  setLoadingSignup,
  setLoadingReset,
  setLoadingResetConfirmation
} from "@/store/reducers/loading"
import {
  clearSearchResults,
  incrLoadingSearch,
  decrLoadingSearch,
  setSearchResults
} from "@/store/reducers/search"
import { clearAddRecipeForm } from "@/store/reducers/addrecipe"
import {
  setShoppingList,
  setLoadingShoppingList,
  setShoppingListError,
  IShoppingListItem
} from "@/store/reducers/shoppinglist"
import {
  setLoadingPasswordUpdate,
  setErrorPasswordUpdate
} from "@/store/reducers/passwordChange"
import {
  setErrorSocialLogin,
  setErrorLogin,
  setErrorRecipes,
  setErrorSignup,
  setErrorReset,
  setErrorResetConfirmation,
  setErrorAddRecipe
} from "@/store/reducers/error"
import { Dispatch as ReduxDispatch } from "redux"

const config = { timeout: 15000 }

const http = axios.create(config)
const anon = axios.create(config)

const handleResponseError = (error: AxiosError) => {
  // 503 means we are in maintenance mode. Reload to show maintenance page.
  const maintenanceMode = error.response && error.response.status === 503
  // Report all 500 errors
  const serverError =
    !maintenanceMode && error.response && error.response.status >= 500
  // Report request timeouts
  const requestTimeout = error.code === "ECONNABORTED"
  const unAuthenticated = error.response && invalidToken(error.response)
  if (maintenanceMode) {
    location.reload()
  } else if (serverError || requestTimeout) {
    raven.captureException(error)
  } else if (unAuthenticated) {
    store.dispatch(setUserLoggedIn(false))
  } else {
    // NOTE(chdsbd): I think it's a good idea just to report any other bad
    // status to Sentry.
    raven.captureException(error, { level: "info" })
  }
  return Promise.reject(error)
}

http.interceptors.response.use(
  response => {
    store.dispatch(setUserLoggedIn(true))
    return response
  },
  // tslint:disable-next-line:no-unsafe-any
  error => handleResponseError(error)
)

anon.interceptors.response.use(
  response => response,
  // tslint:disable-next-line:no-unsafe-any
  error => handleResponseError(error)
)

http.interceptors.request.use(
  cfg => {
    const csrfToken = Cookie.get("csrftoken")
    // tslint:disable:no-unsafe-any
    cfg.headers["X-CSRFTOKEN"] = csrfToken
    cfg.headers["X-Request-ID"] = uuid4()
    // tslint:disable:no-unsafe-any
    return cfg
  },
  error => Promise.reject(error)
)

anon.interceptors.request.use(
  cfg => {
    const csrfToken = Cookie.get("csrftoken")
    // tslint:disable:no-unsafe-any
    cfg.headers["X-CSRFTOKEN"] = csrfToken
    cfg.headers["X-Request-ID"] = uuid4()
    // tslint:enable:no-unsafe-any
    return cfg
  },
  error => Promise.reject(error)
)

export { http, anon }

// We check if detail matches our string because Django will not return 401 when
// the session expires
export const invalidToken = (res: AxiosResponse) =>
  // tslint:disable:no-unsafe-any
  res != null &&
  res.data.detail === "Authentication credentials were not provided."
// tslint:enable:no-unsafe-any

const isbadRequest = (err: AxiosError) =>
  err.response && err.response.status === 400

const is404 = (err: AxiosError) => err.response && err.response.status === 404

export interface INotificationWithTimeout {
  readonly delay?: number
  readonly sticky?: boolean
  readonly message: string
  readonly closeable?: boolean
  readonly level?: INotificationState["level"]
}

// https://stackoverflow.com/a/38574266/3555105
let notificationTimeout: NodeJS.Timer
export const showNotificationWithTimeout = (dispatch: Dispatch) => ({
  message,
  level = "info",
  closeable = true,
  delay = 2000,
  sticky = false
}: INotificationWithTimeout) => {
  clearTimeout(notificationTimeout)
  dispatch(
    setNotification({
      message,
      level,
      closeable
    })
  )

  if (!sticky) {
    notificationTimeout = setTimeout(() => {
      dispatch(clearNotification())
    }, delay)
  }
}

export const loggingOut = (dispatch: Dispatch) => () => {
  dispatch(setLoggingOut(true))
  return http
    .post("/api/v1/rest-auth/logout/", {})
    .then(() => {
      dispatch(setUserLoggedIn(false))
      dispatch(push("/login"))
      dispatch(setLoggingOut(false))
    })
    .catch(() => {
      dispatch(setLoggingOut(false))
    })
}

const emailExists = (err: AxiosError) =>
  // tslint:disable:no-unsafe-any
  err.response &&
  err.response.data.email != null &&
  err.response.data.email[0].includes("email already exists")
// tslint:enable:no-unsafe-any

const second = 1000

export const updatingEmail = (dispatch: Dispatch) => (email: string) => {
  dispatch(updateEmail.request())
  return api
    .updateUser({ email })
    .then(res => {
      dispatch(updateEmail.success(res.data))

      showNotificationWithTimeout(dispatch)({
        message: "updated email",
        level: "success",
        delay: 3 * second
      })
    })
    .catch((err: AxiosError) => {
      dispatch(updateEmail.failure())
      const messageExtra = emailExists(err) ? "- email already in use" : ""
      dispatch(
        setNotification({
          message: `problem updating email ${messageExtra}`,
          level: "danger"
        })
      )
    })
}

export const updatingTeamID = (dispatch: Dispatch) => (id: number | null) => {
  // store old id so we can undo
  const oldID = store.getState().user.teamID
  dispatch(updateTeamID(id))
  api
    .updateUser({ selected_team: id })
    .then(res => {
      dispatch(fetchingUser.success(res.data))
    })
    .catch(() => {
      dispatch(updateTeamID(oldID))
    })
}

export const fetchUser = (dispatch: Dispatch) => () => {
  dispatch(fetchingUser.request())
  return api
    .getUser()
    .then(res => {
      dispatch(fetchingUser.success(res.data))
    })
    .catch(() => {
      dispatch(fetchingUser.failure())
    })
}

export const fetchSocialConnections = (dispatch: Dispatch) => () => {
  return http
    .get<ISocialConnection[]>("/api/v1/rest-auth/socialaccounts/")
    .then(res => {
      dispatch(setSocialConnections(res.data))
    })
    .catch(() => undefined)
}

/** Disconnect social account by id
 *
 * We intentionally do _not_ catch any error as we catch in the view. This is
 * poor form and should be refactored.
 *
 * TODO(chdsbd): Refactor API usage to not catch in view.
 */
export const disconnectSocialAccount = (dispatch: Dispatch) => (
  provider: SocialProvider,
  id: number
) => {
  return http
    .post(`/api/v1/rest-auth/socialaccounts/${id}/disconnect/`, {
      id
    })
    .then(() => {
      dispatch(
        setSocialConnections([
          {
            provider,
            id: null
          }
        ])
      )
    })
}

export const fetchUserStats = (dispatch: Dispatch) => () => {
  dispatch(setLoadingUserStats(true))
  return http
    .get<IUserStats>("api/v1/user_stats/")
    .then(res => {
      dispatch(setUserStats(res.data))
      dispatch(setLoadingUserStats(false))
    })
    .catch(() => {
      dispatch(setLoadingUserStats(false))
    })
}

export const updatingPassword = (dispatch: Dispatch) => (
  password1: string,
  password2: string,
  oldPassword: string
) => {
  dispatch(setLoadingPasswordUpdate(true))
  dispatch(setErrorPasswordUpdate({}))
  return http
    .post("/api/v1/rest-auth/password/change/", {
      new_password1: password1,
      new_password2: password2,
      old_password: oldPassword
    })
    .then(() => {
      dispatch(setLoadingPasswordUpdate(false))
      dispatch(push("/"))
      showNotificationWithTimeout(dispatch)({
        message: "Successfully updated password",
        level: "success"
      })
    })
    .catch((err: AxiosError) => {
      dispatch(setLoadingPasswordUpdate(false))
      const badRequest = err.response && err.response.status === 400
      if (err.response && badRequest) {
        const data = err.response.data
        // tslint:disable:no-unsafe-any
        dispatch(
          setErrorPasswordUpdate({
            newPasswordAgain: data["new_password2"],
            newPassword: data["new_password1"],
            oldPassword: data["old_password"]
          })
        )
        // tslint:ebale:no-unsafe-any
      }
    })
}

export const fetchShoppingList = (dispatch: Dispatch) => (
  teamID: TeamID,
  start?: Date,
  end?: Date
) => {
  const startDay = start || store.getState().shoppinglist.startDay
  const endDay = end || store.getState().shoppinglist.endDay
  dispatch(setLoadingShoppingList(true))
  dispatch(setShoppingListError(false))
  const url =
    teamID === "personal"
      ? "/api/v1/shoppinglist/"
      : `/api/v1/t/${teamID}/shoppinglist/`
  return http
    .get<IShoppingListItem[]>(url, {
      params: {
        start: pyFormat(startDay),
        end: pyFormat(endDay)
      }
    })
    .then(res => {
      dispatch(setShoppingList(res.data))
      dispatch(setLoadingShoppingList(false))
    })
    .catch(() => {
      dispatch(setShoppingListError(true))
      dispatch(setLoadingShoppingList(false))
    })
}

export const postNewRecipe = (dispatch: Dispatch) => (recipe: IRecipeBasic) => {
  dispatch(setLoadingAddRecipe(true))
  dispatch(setErrorAddRecipe({}))

  return http
    .post<IRecipe>("/api/v1/recipes/", recipe)
    .then(res => {
      dispatch(fetchRecipe.success(res.data))
      dispatch(clearAddRecipeForm())
      dispatch(setLoadingAddRecipe(false))
      dispatch(push("/recipes"))
    })
    .catch((err: AxiosError) => {
      // tslint:disable:no-unsafe-any
      const errors =
        (err.response && {
          errorWithName: err.response.data.name != null,
          errorWithIngredients: err.response.data.ingredients != null,
          errorWithSteps: err.response.data.steps != null
        }) ||
        {}
      // tslint:enable:no-unsafe-any
      dispatch(setLoadingAddRecipe(false))
      dispatch(setErrorAddRecipe(errors))

      showNotificationWithTimeout(dispatch)({
        message: "problem creating new recipe",
        level: "danger",
        delay: 5 * second
      })
    })
}

export const fetchingRecipe = (dispatch: Dispatch) => (id: number) => {
  dispatch(fetchRecipe.request(id))
  return http
    .get<IRecipe>(`/api/v1/recipes/${id}/`)
    .then(res => {
      dispatch(fetchRecipe.success(res.data))
    })
    .catch((err: AxiosError) => {
      const error404 = !!(err.response && err.response.status === 404)
      dispatch(fetchRecipe.failure({ id, error404 }))
    })
}

export const fetchRecentRecipes = (dispatch: Dispatch) => () => {
  dispatch(setLoadingRecipes(true))
  dispatch(setErrorRecipes(false))
  return http
    .get<IRecipe[]>("/api/v1/recipes/?recent")
    .then(res => {
      dispatch(setRecipes(res.data))
      dispatch(setLoadingRecipes(false))
    })
    .catch(() => {
      dispatch(setErrorRecipes(true))
      dispatch(setLoadingRecipes(false))
    })
}

export const fetchRecipeList = (dispatch: Dispatch) => (
  teamID: number | "personal"
) => {
  dispatch(setLoadingRecipes(true))
  dispatch(setErrorRecipes(false))

  const url =
    teamID === "personal" ? "/api/v1/recipes/" : `/api/v1/t/${teamID}/recipes/`

  return http
    .get<IRecipe[]>(url)
    .then(res => {
      dispatch(setRecipes(res.data))
      dispatch(setLoadingRecipes(false))
    })
    .catch(() => {
      dispatch(setErrorRecipes(true))
      dispatch(setLoadingRecipes(false))
    })
}

interface ISearchStore {
  lastRequest: null | CancelTokenSource
}

// container for our promise cancel tokens
const searchStore: ISearchStore = {
  lastRequest: null
}

export const searchRecipes = (dispatch: Dispatch) => (query: string) => {
  // It's visually pleasing to have all the results disappear when
  // the search query is cleared.
  if (query === "") {
    return dispatch(clearSearchResults())
  }
  // count our request
  dispatch(incrLoadingSearch())
  // cancel unknown existing request
  if (searchStore.lastRequest != null) {
    searchStore.lastRequest.cancel()
  }
  // create and store cancel token
  const cancelSource = axios.CancelToken.source()
  searchStore.lastRequest = cancelSource
  // make request with cancel token
  return http
    .get<IRecipe[]>(`/api/v1/recipes?q=${encodeURI(query)}`, {
      cancelToken: cancelSource.token
    })
    .then(res => {
      dispatch(decrLoadingSearch())
      dispatch(setSearchResults(res.data))
    })
    .catch((err: AxiosError) => {
      dispatch(decrLoadingSearch())
      if (String(err) === "Cancel") {
        // Ignore axios cancels
      }
      raven.captureException(err)
    })
}

export const addingRecipeIngredient = (dispatch: Dispatch) => (
  recipeID: number,
  ingredient: unknown
) => {
  dispatch(setAddingIngredientToRecipe(recipeID, true))
  return http
    .post<IIngredient>(`/api/v1/recipes/${recipeID}/ingredients/`, ingredient)
    .then(res => {
      dispatch(addIngredientToRecipe(recipeID, res.data))
      dispatch(setAddingIngredientToRecipe(recipeID, false))
    })
    .catch(() => {
      dispatch(setAddingIngredientToRecipe(recipeID, false))
    })
}

export const sendUpdatedRecipeName = (id: number, name: string) => (
  dispatch: Dispatch
) => {
  return http
    .patch<IRecipe>(`/api/v1/recipes/${id}/`, {
      name
    })
    .then(res => {
      dispatch(updateRecipeName(res.data.id, res.data.name))
    })
    .catch(() => undefined)
}

export const setRecipeSource = (id: number, source: string) => (
  dispatch: Dispatch
) => {
  return http
    .patch<IRecipe>(`/api/v1/recipes/${id}/`, {
      source
    })
    .then(res => {
      dispatch(updateRecipeSource(res.data.id, res.data.source))
    })
    .catch(() => undefined)
}

export const setRecipeAuthor = (id: number, author: unknown) => (
  dispatch: Dispatch
) => {
  return http
    .patch<IRecipe>(`/api/v1/recipes/${id}/`, {
      author
    })
    .then(res => {
      dispatch(updateRecipeAuthor(res.data.id, res.data.author))
    })
    .catch(() => undefined)
}

export const setRecipeTime = (id: number, time: unknown) => (
  dispatch: Dispatch
) => {
  return http
    .patch<IRecipe>(`/api/v1/recipes/${id}/`, {
      time
    })
    .then(res => {
      dispatch(updateRecipeTime(res.data.id, res.data.time))
    })
    .catch(() => undefined)
}

export const updateRecipe = (dispatch: Dispatch) => (
  id: number,
  data: unknown
) => {
  dispatch(setRecipeUpdating(id, true))
  return http
    .patch<IRecipe>(`/api/v1/recipes/${id}/`, data)
    .then(res => {
      dispatch(setRecipe(res.data.id, res.data))
      dispatch(setRecipeUpdating(id, false))
    })
    .catch(() => {
      dispatch(setRecipeUpdating(id, false))
    })
}

export const addingRecipeStep = (dispatch: Dispatch) => (
  recipeID: number,
  step: unknown
) => {
  dispatch(setLoadingAddStepToRecipe(recipeID, true))
  return http
    .post<IStep>(`/api/v1/recipes/${recipeID}/steps/`, {
      text: step
    })
    .then(res => {
      dispatch(addStepToRecipe(recipeID, res.data))
      dispatch(setLoadingAddStepToRecipe(recipeID, false))
    })
    .catch(() => {
      dispatch(setLoadingAddStepToRecipe(recipeID, false))
    })
}

export const updatingIngredient = (dispatch: Dispatch) => (
  recipeID: number,
  ingredientID: number,
  content: unknown
) => {
  dispatch(setUpdatingIngredient(recipeID, ingredientID, true))
  return http
    .patch<IIngredient>(
      `/api/v1/recipes/${recipeID}/ingredients/${ingredientID}/`,
      content
    )
    .then(res => {
      dispatch(updateIngredient(recipeID, ingredientID, res.data))
      dispatch(setUpdatingIngredient(recipeID, ingredientID, false))
    })
    .catch(() => {
      dispatch(setUpdatingIngredient(recipeID, ingredientID, false))
    })
}

export const deletingIngredient = (dispatch: Dispatch) => (
  recipeID: number,
  ingredientID: number
) => {
  dispatch(setRemovingIngredient(recipeID, ingredientID, true))
  return http
    .delete(`/api/v1/recipes/${recipeID}/ingredients/${ingredientID}/`)
    .then(() => {
      dispatch(setRemovingIngredient(recipeID, ingredientID, false))
      dispatch(deleteIngredient(recipeID, ingredientID))
    })
    .catch(() => {
      dispatch(setRemovingIngredient(recipeID, ingredientID, false))
    })
}

interface IStep {
  id: number
  text: string
  position: number
}

export const updatingStep = (dispatch: Dispatch) => (
  recipeID: number,
  stepID: number,
  { text, position }: { text?: string; position?: number }
) => {
  dispatch(setUpdatingStep(recipeID, stepID, true))
  const data: { [key: string]: unknown } = {
    text,
    position
  }
  // Remove null/empty keys for PATCH
  for (const key of Object.keys(data)) {
    if (data[key] == null) {
      delete data[key]
    }
  }
  return http
    .patch<IStep>(`/api/v1/recipes/${recipeID}/steps/${stepID}/`, data)
    .then(res => {
      const txt = res.data.text
      const pos = res.data.position
      dispatch(updateStep(recipeID, stepID, txt, pos))
      dispatch(setUpdatingStep(recipeID, stepID, false))
    })
    .catch(() => {
      dispatch(setUpdatingStep(recipeID, stepID, false))
    })
}

export const deletingStep = (dispatch: Dispatch) => (
  recipeID: number,
  stepID: number
) => {
  dispatch(setRemovingStep(recipeID, stepID, true))
  return http
    .delete(`/api/v1/recipes/${recipeID}/steps/${stepID}/`)
    .then(() => {
      dispatch(deleteStep(recipeID, stepID))
      dispatch(setRemovingStep(recipeID, stepID, false))
    })
    .catch(() => {
      dispatch(setRemovingStep(recipeID, stepID, false))
    })
}

export const logUserIn = (dispatch: Dispatch) => (
  email: string,
  password: string,
  redirectUrl: string = ""
) => {
  dispatch(setLoadingLogin(true))
  dispatch(setErrorLogin({}))
  dispatch(clearNotification())
  return anon
    .post<{ user: IUser }>("/api/v1/rest-auth/login/", {
      email,
      password
    })
    .then(res => {
      dispatch(login(res.data.user))
      dispatch(setLoadingLogin(false))
      dispatch(push(redirectUrl))
    })
    .catch((err: AxiosError) => {
      dispatch(setLoadingLogin(false))
      const badRequest = err.response && err.response.status === 400
      if (err.response && badRequest) {
        const data = err.response.data
        // tslint:disable:no-unsafe-any
        dispatch(
          setErrorLogin({
            email: data["email"],
            password1: data["password1"],
            nonFieldErrors: data["non_field_errors"]
          })
        )
        // tslint:enable:no-unsafe-any
      }
    })
}

export const socialLogin = (dispatch: Dispatch) => (
  service: SocialProvider,
  token: string,
  redirectUrl: string = ""
) => {
  return anon
    .post<{ user: IUser }>(`/api/v1/rest-auth/${service}/`, {
      code: token
    })
    .then(res => {
      dispatch(login(res.data.user))
      dispatch(replace(redirectUrl))
    })
    .catch((err: AxiosError) => {
      const badRequest = err.response && err.response.status === 400
      if (err.response && badRequest) {
        const data = err.response.data
        // tslint:disable:no-unsafe-any
        dispatch(
          setErrorSocialLogin({
            emailSocial: data["email"],
            nonFieldErrorsSocial: data["non_field_errors"]
          })
        )
        // tslint:enable:no-unsafe-any
      }
      dispatch(replace("/login"))
    })
}

export const socialConnect = (dispatch: Dispatch) => (
  service: SocialProvider,
  code: unknown
) => {
  return http
    .post(`/api/v1/rest-auth/${service}/connect/`, {
      code
    })
    .then(() => {
      dispatch(replace("/settings"))
    })
    .catch(() => {
      dispatch(replace("/settings"))
    })
}

export const signup = (dispatch: Dispatch) => (
  email: string,
  password1: string,
  password2: string
) => {
  dispatch(setLoadingSignup(true))
  // clear previous signup errors
  dispatch(setErrorSignup({}))
  dispatch(clearNotification())
  return anon
    .post<{ user: IUser }>("/api/v1/rest-auth/registration/", {
      email,
      password1,
      password2
    })
    .then(res => {
      dispatch(login(res.data.user))
      dispatch(setLoadingSignup(false))
      dispatch(push("/recipes/add"))
    })
    .catch((err: AxiosError) => {
      if (isbadRequest(err)) {
        // tslint:disable:no-unsafe-any
        const data = err.response && err.response.data
        dispatch(
          setErrorSignup({
            email: data["email"],
            password1: data["password1"],
            password2: data["password2"],
            nonFieldErrors: data["non_field_errors"]
          })
        )
        // tslint:enable:no-unsafe-any
      }
      dispatch(setLoadingSignup(false))
    })
}
export const deletingRecipe = (dispatch: Dispatch) => (id: number) => {
  dispatch(deleteRecipe.request(id))
  return http
    .delete(`/api/v1/recipes/${id}/`)
    .then(() => {
      dispatch(push("/recipes"))
      dispatch(deleteRecipe.success(id))
    })
    .catch(() => {
      dispatch(deleteRecipe.failure(id))
    })
}

interface IDetailResponse {
  detail: string
}

export const reset = (dispatch: Dispatch) => (email: string) => {
  dispatch(setLoadingReset(true))
  dispatch(setErrorReset({}))
  dispatch(clearNotification())
  return anon
    .post<IDetailResponse>("/api/v1/rest-auth/password/reset/", {
      email
    })
    .then(res => {
      dispatch(setLoadingReset(false))
      const message = res && res.data && res.data.detail
      showNotificationWithTimeout(dispatch)({
        message,
        level: "success"
      })
    })
    .catch((err: AxiosError) => {
      dispatch(setLoadingReset(false))
      showNotificationWithTimeout(dispatch)({
        message: "uh oh! problem resetting password",
        level: "danger",
        sticky: true
      })
      if (isbadRequest(err)) {
        // tslint:disable:no-unsafe-any
        const data = err.response && err.response.data
        dispatch(
          setErrorReset({
            email: data["email"],
            nonFieldErrors: data["non_field_errors"]
          })
        )
        // tslint:enable:no-unsafe-any
      }
      showNotificationWithTimeout(dispatch)({
        message: "problem resetting password",
        level: "danger",
        sticky: true
      })
    })
}

export const resetConfirmation = (dispatch: Dispatch) => (
  uid: string,
  token: string,
  newPassword1: string,
  newPassword2: string
) => {
  dispatch(setLoadingResetConfirmation(true))
  dispatch(setErrorResetConfirmation({}))
  dispatch(clearNotification())
  return anon
    .post<IDetailResponse>("/api/v1/rest-auth/password/reset/confirm/", {
      uid,
      token,
      new_password1: newPassword1,
      new_password2: newPassword2
    })
    .then(res => {
      dispatch(setLoadingResetConfirmation(false))
      const message = res && res.data && res.data.detail
      showNotificationWithTimeout(dispatch)({
        message,
        level: "success"
      })
      dispatch(push("/login"))
    })
    .catch((err: AxiosError) => {
      dispatch(setLoadingResetConfirmation(false))
      showNotificationWithTimeout(dispatch)({
        message: "uh oh! problem resetting password",
        level: "danger",
        sticky: true
      })
      if (isbadRequest(err)) {
        // tslint:disable:no-unsafe-any
        const data = err.response && err.response.data

        const tokenData =
          data["token"] && data["token"].map((x: unknown) => "token: " + x)
        const uidData =
          data["uid"] && data["uid"].map((x: unknown) => "uid: " + x)
        const nonFieldErrors = []
          .concat(data["non_field_errors"])
          .concat(tokenData)
          .concat(uidData)

        dispatch(
          setErrorResetConfirmation({
            newPassword1: data["new_password1"],
            newPassword2: data["new_password2"],
            nonFieldErrors
          })
        )
        // tslint:enable:no-unsafe-any
      }
    })
}

export const fetchTeam = (dispatch: Dispatch) => (id: ITeam["id"]) => {
  dispatch(setLoadingTeam(id, true))
  return http
    .get<ITeam>(`/api/v1/t/${id}/`)
    .then(res => {
      dispatch(addTeam(res.data))
      dispatch(setLoadingTeam(id, false))
    })
    .catch((err: AxiosError) => {
      if (is404(err)) {
        dispatch(setTeam404(id))
      }
      dispatch(setLoadingTeam(id, false))
    })
}

export const fetchTeamMembers = (dispatch: Dispatch) => (id: number) => {
  dispatch(setLoadingTeamMembers(id, true))
  return http
    .get<IMember[]>(`/api/v1/t/${id}/members/`)
    .then(res => {
      dispatch(setTeamMembers(id, res.data))
      dispatch(setLoadingTeamMembers(id, false))
    })
    .catch(() => {
      dispatch(setLoadingTeamMembers(id, false))
    })
}

export const fetchTeamRecipes = (dispatch: Dispatch) => (id: number) => {
  dispatch(setLoadingTeamRecipes(id, true))
  return http
    .get<IRecipe[]>(`/api/v1/t/${id}/recipes/`)
    .then(res => {
      dispatch(setRecipes(res.data))
      dispatch(setTeamRecipes(id, res.data))
      dispatch(setLoadingTeamRecipes(id, false))
    })
    .catch(() => {
      dispatch(setLoadingTeamRecipes(id, false))
    })
}

// tslint:disable:no-unsafe-any
const attemptedDeleteLastAdmin = (res: AxiosResponse) =>
  res.status === 400 &&
  res.data.level &&
  res.data.level[0].includes("cannot demote")
// tslint:enable:no-unsafe-any

export const settingUserTeamLevel = (dispatch: Dispatch) => (
  teamID: number,
  membershipID: number,
  level: unknown
) => {
  dispatch(setUpdatingUserTeamLevel(teamID, true))
  return http
    .patch<IMember>(`/api/v1/t/${teamID}/members/${membershipID}/`, { level })
    .then(res => {
      dispatch(setUserTeamLevel(teamID, membershipID, res.data.level))
      dispatch(setUpdatingUserTeamLevel(teamID, false))
    })
    .catch((err: AxiosError) => {
      if (err.response && attemptedDeleteLastAdmin(err.response)) {
        // tslint:disable:no-unsafe-any
        const message = err.response.data.level[0]
        showNotificationWithTimeout(dispatch)({
          message,
          level: "danger",
          delay: 3 * second
        })
        // tslint:enable:no-unsafe-any
      }
      dispatch(setUpdatingUserTeamLevel(teamID, false))
    })
}

export const deletingMembership = (dispatch: Dispatch) => (
  teamID: number,
  id: number,
  leaving: boolean = false
) => {
  dispatch(setDeletingMembership(teamID, id, true))
  return http
    .delete(`/api/v1/t/${teamID}/members/${id}/`)
    .then(() => {
      const message = "left team " + store.getState().teams[teamID].name
      dispatch(deleteMembership(teamID, id))
      if (leaving) {
        dispatch(push("/"))
        showNotificationWithTimeout(dispatch)({
          message,
          level: "success",
          delay: 3 * second
        })
        dispatch(deleteTeam(teamID))
      }
    })
    .catch((err: AxiosError) => {
      const message = err.response && err.response.data
      showNotificationWithTimeout(dispatch)({
        // tslint:disable-next-line:no-unsafe-any
        message,
        level: "danger",
        delay: 3 * second
      })
      dispatch(setDeletingMembership(teamID, id, false))
    })
}

export const deletingTeam = (dispatch: Dispatch) => (teamID: number) => {
  return http
    .delete(`/api/v1/t/${teamID}`)
    .then(() => {
      dispatch(push("/"))
      const teamName = store.getState().teams[teamID].name
      showNotificationWithTimeout(dispatch)({
        message: `Team deleted (${teamName})`,
        level: "success",
        delay: 3 * second
      })
      dispatch(deleteTeam(teamID))
    })
    .catch((err: AxiosError) => {
      let message = "Uh Oh! Something went wrong."
      // tslint:disable:no-unsafe-any
      if (err.response && err.response.status === 403) {
        message =
          err.response.data && err.response.data.detail
            ? err.response.data.detail
            : "You are not authorized to delete this team"
      } else if (err.response && err.response.status === 404) {
        message =
          err.response.data && err.response.data.detail
            ? err.response.data.detail
            : "The team you are attempting to delete doesn't exist"
      } else {
        raven.captureException(err)
      }
      // tslint:enable:no-unsafe-any
      showNotificationWithTimeout(dispatch)({
        message,
        level: "danger",
        delay: 3 * second
      })
    })
}

export const sendingTeamInvites = (dispatch: Dispatch) => (
  teamID: number,
  emails: string[],
  level: unknown
) => {
  dispatch(setSendingTeamInvites(teamID, true))
  return http
    .post(`/api/v1/t/${teamID}/invites/`, { emails, level })
    .then(() => {
      showNotificationWithTimeout(dispatch)({
        message: "invites sent!",
        level: "success",
        delay: 3 * second
      })
      dispatch(setSendingTeamInvites(teamID, false))
    })
    .catch(() => {
      showNotificationWithTimeout(dispatch)({
        message: "error sending team invite",
        level: "danger",
        delay: 3 * second
      })
      dispatch(setSendingTeamInvites(teamID, false))
      // NOTE(chdsbd): We depend on this to return an error in TeamInvite.tsx
      return Error()
    })
}

export const fetchTeams = (dispatch: Dispatch) => () => {
  dispatch(setLoadingTeams(true))
  return http
    .get<ITeam[]>("/api/v1/t/")
    .then(res => {
      dispatch(setTeams(res.data))
      dispatch(setLoadingTeams(false))
    })
    .catch(() => {
      dispatch(setLoadingTeams(false))
    })
}

export const creatingTeam = (dispatch: Dispatch) => (
  name: string,
  emails: string[],
  level: unknown
) => {
  dispatch(setCreatingTeam(true))
  return http
    .post<ITeam>("/api/v1/t/", { name, emails, level })
    .then(res => {
      dispatch(setTeam(res.data.id, res.data))
      dispatch(setCreatingTeam(false))
      dispatch(push(`/t/${res.data.id}`))
    })
    .catch(() => {
      dispatch(setCreatingTeam(false))
    })
}

export const updatingTeam = (dispatch: Dispatch) => (
  teamId: ITeam["id"],
  teamKVs: unknown
) => {
  return http
    .patch<ITeam>(`/api/v1/t/${teamId}/`, teamKVs)
    .then(res => {
      showNotificationWithTimeout(dispatch)({
        message: "Team updated",
        level: "success",
        delay: 3 * second
      })
      dispatch(updateTeamById(res.data.id, res.data))
    })
    .catch((err: AxiosError) => {
      let message = "Problem updating team."
      // tslint:disable-next-line:no-unsafe-any
      if (err.response && err.response.status === 403) {
        message = "You are not authorized to perform that action"
      }
      showNotificationWithTimeout(dispatch)({
        message,
        level: "danger",
        delay: 3 * second
      })
    })
}

export const moveRecipeTo = (dispatch: Dispatch) => (
  recipeId: number,
  ownerId: number,
  type: unknown
) => {
  return http
    .post<IRecipe>(`/api/v1/recipes/${recipeId}/move/`, { id: ownerId, type })
    .then(res => {
      dispatch(updateRecipeOwner(res.data.id, res.data.owner))
    })
}

export const copyRecipeTo = (dispatch: Dispatch) => (
  recipeId: number,
  ownerId: number,
  type: unknown
) => {
  dispatch(setCopyingTeam(true))
  return http
    .post<IRecipe>(`/api/v1/recipes/${recipeId}/copy/`, { id: ownerId, type })
    .then(res => {
      dispatch(fetchRecipe.success(res.data))
      dispatch(setCopyingTeam(false))
    })
    .catch(err => {
      dispatch(setCopyingTeam(false))
      // TODO(chdsbd): Improve api usage and remove this throw
      // tslint:disable-next-line:no-throw
      throw err
    })
}

export const fetchInvites = (dispatch: Dispatch) => () => {
  dispatch(setLoadingInvites(true))
  dispatch(setErrorFetchingInvites(false))
  return http
    .get<IInvite[]>("/api/v1/invites/")
    .then(res => {
      dispatch(setInvites(res.data))
      dispatch(setLoadingInvites(false))
    })
    .catch(() => {
      dispatch(setLoadingInvites(false))
      dispatch(setErrorFetchingInvites(true))
    })
}

export const acceptingInvite = (dispatch: Dispatch) => (id: number) => {
  dispatch(setAcceptingInvite(id, true))
  return http
    .post(`/api/v1/invites/${id}/accept/`, {})
    .then(() => {
      dispatch(setAcceptingInvite(id, false))
      dispatch(setAcceptedInvite(id))
    })
    .catch(() => {
      dispatch(setAcceptingInvite(id, false))
    })
}
export const decliningInvite = (dispatch: Dispatch) => (id: number) => {
  dispatch(setDecliningInvite(id, true))
  return http
    .post(`/api/v1/invites/${id}/decline/`, {})
    .then(() => {
      dispatch(setDecliningInvite(id, false))
      dispatch(setDeclinedInvite(id))
    })
    .catch(() => {
      dispatch(setDecliningInvite(id, false))
    })
}

export const deleteUserAccount = (dispatch: Dispatch) => () => {
  return http
    .delete("/api/v1/user/")
    .then(() => {
      dispatch(setUserLoggedIn(false))
      dispatch(push("/login"))
      showNotificationWithTimeout(dispatch)({ message: "Account deleted" })
    })
    .catch((error: AxiosError) => {
      // tslint:disable:no-unsafe-any
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.detail
      ) {
        showNotificationWithTimeout(dispatch)({
          message: error.response.data.detail,
          level: "danger"
        })
        // tslint:enable:no-unsafe-any
      } else {
        showNotificationWithTimeout(dispatch)({
          message: "failed to delete account",
          level: "danger"
        })
      }
    })
}

export const reportBadMerge = (dispatch: Dispatch) => () => {
  return http
    .post("/api/v1/report-bad-merge", {})
    .then(() => {
      showNotificationWithTimeout(dispatch)({
        message: "reported bad merge",
        level: "success",
        delay: 3 * second
      })
    })
    .catch(() => {
      showNotificationWithTimeout(dispatch)({
        message: "error reporting bad merge",
        level: "danger",
        delay: 3 * second
      })
    })
}

export const fetchCalendar = (dispatch: Dispatch) => (
  teamID: TeamID,
  month = new Date()
) => {
  dispatch(setCalendarLoading(true))
  dispatch(setCalendarError(false))
  const url =
    teamID === "personal"
      ? "/api/v1/calendar/"
      : `/api/v1/t/${teamID}/calendar/`
  // we fetch current month plus and minus 1 week
  return http
    .get<ICalRecipe[]>(url, {
      params: {
        start: pyFormat(subWeeks(startOfMonth(month), 1)),
        end: pyFormat(addWeeks(endOfMonth(month), 1))
      }
    })
    .then(res => {
      dispatch(setCalendarRecipes(res.data))
      dispatch(setCalendarLoading(false))
    })
    .catch(() => {
      dispatch(setCalendarLoading(false))
      dispatch(setCalendarError(true))
    })
}
export const addingScheduledRecipe = (dispatch: Dispatch) => (
  recipeID: IRecipe["id"],
  teamID: TeamID,
  on: Date,
  count: number | string
) => {
  const recipe = store.getState().recipes.byId[recipeID]
  dispatch(setSchedulingRecipe(recipeID, true))
  const id = random32Id()
  const data = {
    recipe: recipeID,
    on: pyFormat(on),
    count
  }
  // 1. preemptively add recipe
  // 2. if succeeded, then we replace the preemptively added one
  //    if failed, then we remove the preemptively added one, and display an error

  const url =
    teamID === "personal"
      ? "/api/v1/calendar/"
      : `/api/v1/t/${teamID}/calendar/`

  // HACK(sbdchd): we need to add the user to the recipe
  dispatch(
    setCalendarRecipe(({ ...data, id, recipe } as unknown) as ICalRecipe)
  )
  return http
    .post<ICalRecipe>(url, data)
    .then(res => {
      dispatch(replaceCalendarRecipe(id, res.data))
      dispatch(setSchedulingRecipe(recipeID, false))
    })
    .catch(() => {
      dispatch(deleteCalendarRecipe(id))
      showNotificationWithTimeout(dispatch)({
        message: "error scheduling recipe",
        level: "danger",
        delay: 3 * second
      })
      dispatch(setSchedulingRecipe(recipeID, false))
    })
}
export const deletingScheduledRecipe = (dispatch: Dispatch) => (
  id: ICalRecipe["id"],
  teamID: TeamID
) => {
  // HACK(sbdchd): we should have these in byId object / Map
  const recipe = store.getState().calendar.byId[parseInt(String(id), 10)]
  dispatch(deleteCalendarRecipe(id))

  const url =
    teamID === "personal"
      ? `/api/v1/calendar/${id}/`
      : `/api/v1/t/${teamID}/calendar/${id}/`

  return http.delete(url).catch(() => {
    dispatch(setCalendarRecipe(recipe))
  })
}

export const moveScheduledRecipe = (dispatch: Dispatch) => (
  id: ICalRecipe["id"],
  teamID: TeamID,
  to: Date
) => {
  // HACK(sbdchd): we should have these in byId object / Map
  const from = store.getState().calendar.byId[parseInt(String(id), 10)]
  const existing = store
    .getState()
    .calendar.allIds.filter((x: unknown) => x !== id)
    .map(x => store.getState().calendar.byId[x as number])
    .filter(x => isSameDay(x.on, to))
    .filter(x => {
      if (teamID === "personal") {
        return x.user != null
      }
      return x.team === teamID
    })
    .find(x => x.recipe.id === from.recipe.id)

  const sourceURL =
    teamID === "personal"
      ? `/api/v1/calendar/${id}/`
      : `/api/v1/t/${teamID}/calendar/${id}/`

  dispatch(moveCalendarRecipe(id, pyFormat(to)))

  if (existing) {
    const sinkURL =
      teamID === "personal"
        ? `/api/v1/calendar/${existing.id}/`
        : `/api/v1/t/${teamID}/calendar/${existing.id}/`
    // TODO: this should be an endpoint so we can have this be in a transaction
    return http
      .delete(sourceURL)
      .then(() => http.patch(sinkURL, { count: existing.count + from.count }))
      .catch(() => {
        dispatch(moveCalendarRecipe(id, pyFormat(from.on)))
      })
  }

  return http.patch(sourceURL, { on: pyFormat(to) }).catch(() => {
    // on error we want to move it back to the old position
    dispatch(moveCalendarRecipe(id, pyFormat(from.on)))
  })
}

export const updatingScheduledRecipe = (dispatch: Dispatch) => (
  id: ICalRecipe["id"],
  teamID: ITeam["id"] | "personal",
  count: ICalRecipe["count"]
) => {
  if (parseInt(count.toString(), 10) <= 0) {
    return deletingScheduledRecipe(dispatch)(id, teamID)
  }

  const url =
    teamID === "personal"
      ? `/api/v1/calendar/${id}/`
      : `/api/v1/t/${teamID}/calendar/${id}/`
  return http.patch<ICalRecipe>(url, { count }).then(res => {
    dispatch(setCalendarRecipe(res.data))
  })
}
