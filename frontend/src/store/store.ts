import { createStore, combineReducers, applyMiddleware, compose } from "redux"
import thunk from "redux-thunk"
import throttle from "lodash/throttle"

import createHistory from "history/createBrowserHistory"
import { routerReducer, routerMiddleware } from "react-router-redux"

import recipes from "./reducers/recipes.js"
import user from "./reducers/user.js"
import loading from "./reducers/loading.js"
import error from "./reducers/error.js"
import notification from "./reducers/notification.js"
import passwordChange from "./reducers/passwordChange.js"
import shoppinglist from "./reducers/shoppinglist.js"
import addrecipe from "./reducers/addrecipe"
import auth from "./reducers/auth"
import teams from "./reducers/teams"
import invites from "./reducers/invites"
import calendar from "./reducers/calendar"
import search from "./reducers/search"

import { loadState, saveState } from "./localStorage"

import { LOG_OUT } from "./actionTypes"

const recipeApp = combineReducers({
  user,
  recipes,
  invites,
  loading,
  error,
  routerReducer,
  notification,
  passwordChange,
  shoppinglist,
  addrecipe,
  auth,
  teams,
  calendar,
  search
})

// reset redux to default state on logout
export const rootReducer = (state: any, action: any) => {
  if (action.type === LOG_OUT) {
    return {
      ...recipeApp(undefined as any, action),
      // We need to save this auth state (fromUrl) through logout
      // so we can redirect users to where they were attempting to
      // visit before being asked for authentication
      auth: state.auth,
      routerReducer: state.routerReducer
    }
  }
  return recipeApp(state, action)
}

export type RootState = any

const defaultData = loadState()

export const history = createHistory()
const router = routerMiddleware(history)

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

// A "hydrated" store is nice for UI development
export const store = createStore(
  rootReducer,
  defaultData,
  composeEnhancers(applyMiddleware(thunk, router))
)

store.subscribe(
  throttle(() => {
    saveState({
      user: {
        // We assume this is true and if the session expires we have axios interceptors
        // to set this to false. In that _rare_ case, there will be a slight flash, but
        // this is acceptable for us for the added performance
        loggedIn: store.getState().user.loggedIn,
        darkMode: store.getState().user.darkMode,
        scheduleURL: store.getState().user.scheduleURL
      },
      addrecipe: store.getState().addrecipe,
      auth: store.getState().auth
    })
  }, 1000)
)

// We need an empty store for the unit tests
export const emptyStore = createStore(
  rootReducer,
  {},
  composeEnhancers(applyMiddleware(thunk, router))
)
export default store
