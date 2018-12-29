import { action as act } from "typesafe-actions"

export const SET_LOADING_LOGIN = "SET_LOADING_LOGIN"
export const SET_LOADING_SIGNUP = "SET_LOADING_SIGNUP"
export const SET_LOADING_RESET = "SET_LOADING_RESET"
export const SET_LOADING_RESET_CONFIRMATION = "SET_LOADING_RESET_CONFIRMATION"
export const SET_LOADING_ADD_RECIPE = "SET_LOADING_ADD_RECIPE"

export const setLoadingLogin = (val: boolean) => act(SET_LOADING_LOGIN, val)
export const setLoadingSignup = (val: boolean) => act(SET_LOADING_SIGNUP, val)
export const setLoadingReset = (val: boolean) => act(SET_LOADING_RESET, val)
export const setLoadingResetConfirmation = (val: boolean) =>
  act(SET_LOADING_RESET_CONFIRMATION, val)
export const setLoadingAddRecipe = (val: boolean) =>
  act(SET_LOADING_ADD_RECIPE, val)

export interface ILoadingState {
  readonly login: boolean
  readonly signup: boolean
  readonly reset: boolean
  readonly resetConfirmation: boolean
  readonly addRecipe: boolean
}

export const initialState: ILoadingState = {
  login: false,
  signup: false,
  reset: false,
  resetConfirmation: false,
  addRecipe: false
}

export type LoadingActions =
  | ReturnType<typeof setLoadingLogin>
  | ReturnType<typeof setLoadingSignup>
  | ReturnType<typeof setLoadingReset>
  | ReturnType<typeof setLoadingResetConfirmation>
  | ReturnType<typeof setLoadingAddRecipe>

const loading = (
  state: ILoadingState = initialState,
  action: LoadingActions
): ILoadingState => {
  switch (action.type) {
    case SET_LOADING_LOGIN:
      return { ...state, login: action.payload }
    case SET_LOADING_SIGNUP:
      return { ...state, signup: action.payload }
    case SET_LOADING_RESET:
      return { ...state, reset: action.payload }
    case SET_LOADING_RESET_CONFIRMATION:
      return { ...state, resetConfirmation: action.payload }
    case SET_LOADING_ADD_RECIPE:
      return { ...state, addRecipe: action.payload }
    default:
      return state
  }
}

export default loading
