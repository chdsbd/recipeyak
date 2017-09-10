import {
  LOG_IN,
  LOG_OUT,
  ADD_TO_CART,
  REMOVE_FROM_CART,
  ADD_RECIPE,
  REMOVE_RECIPE,
  ADD_STEP_TO_RECIPE,
  ADD_INGREDIENT_TO_RECIPE,
  UPDATE_RECIPE_NAME,
  DELETE_INGREDIENT,
  DELETE_STEP,
  UPDATE_RECIPE_SOURCE,
  UPDATE_RECIPE_AUTHOR,
  UPDATE_RECIPE_TIME,
  SET_LOADING_LOGIN,
  SET_ERROR_LOGIN,
  SET_LOADING_SIGNUP,
  SET_ERROR_SIGNUP,
  SET_LOADING_RESET,
  SET_ERROR_RESET,
  SET_NOTIFICATION,
  CLEAR_NOTIFICATION,
} from './actionTypes.js'

import { push } from 'react-router-redux'

import axios from 'axios'

export const login = token => {
  return {
    type: LOG_IN,
    token,
  }
}

export const logout = () => {
  return {
    type: LOG_OUT,
  }
}

export const addToCart = id => {
  return {
    type: ADD_TO_CART,
    id,
  }
}

export const removeFromCart = id => {
  return {
    type: REMOVE_FROM_CART,
    id,
  }
}

export const addRecipe = recipe => {
  return {
    type: ADD_RECIPE,
    recipe,
  }
}

export const addStepToRecipe = (id, step) => {
  return {
    type: ADD_STEP_TO_RECIPE,
    id,
    step,
  }
}

export const addIngredientToRecipe = (id, ingredient) => {
  return {
    type: ADD_INGREDIENT_TO_RECIPE,
    id,
    ingredient,
  }
}

export const updateRecipeName = (id, name) => {
  return {
    type: UPDATE_RECIPE_NAME,
    id,
    name,
  }
}

export const updateRecipeSource = (id, source) => {
  return {
    type: UPDATE_RECIPE_SOURCE,
    id,
    source,
  }
}

export const updateRecipeAuthor = (id, author) => {
  return {
    type: UPDATE_RECIPE_AUTHOR,
    id,
    author,
  }
}

export const updateRecipeTime = (id, time) => {
  return {
    type: UPDATE_RECIPE_TIME,
    id,
    time,
  }
}

export const deleteIngredient = (id, index) => {
  return {
    type: DELETE_INGREDIENT,
    id,
    index,
  }
}

export const removeRecipe = id => {
  return {
    type: REMOVE_RECIPE,
    id,
  }
}

export const deleteStep = (id, index) => {
  return {
    type: DELETE_STEP,
    id,
    index,
  }
}

export const setErrorLogin = val => {
  return {
    type: SET_ERROR_LOGIN,
    val,
  }
}

export const setLoadingLogin = val => {
  return {
    type: SET_LOADING_LOGIN,
    val,
  }
}

function sendLoginInfo (email, password) {
  return axios.post('/api/v1/rest-auth/login/', { email, password })
}

export const logUserIn = (email, password) => {
  return function (dispatch) {
    dispatch(setLoadingLogin(true))
    dispatch(setErrorLogin({}))
    dispatch(clearNotification())
    sendLoginInfo(email, password)
      .then(res => {
        dispatch(login(res.data.key))
        dispatch(setLoadingLogin(false))
        dispatch(push('/recipes'))
      })
      .catch(err => {
        dispatch(setLoadingLogin(false))
        const badRequest = err.response.status === 400
        if (err.response && badRequest) {
          const data = err.response.data
          dispatch(setErrorLogin({
            email: data['email'],
            password1: data['password1'],
            nonFieldErrors: data['non_field_errors'],
          }))
        }
        showNotificationWithTimeout(dispatch, {
          message: 'problem authenticating',
          level: 'danger',
          sticky: true,
        })
        console.warn('error with login', err)
      })
  }
}

export const setLoadingSignup = val => {
  return {
    type: SET_LOADING_SIGNUP,
    val,
  }
}

export const setErrorSignup = val => {
  return {
    type: SET_ERROR_SIGNUP,
    val,
  }
}

function sendSignupInfo (email, password1, password2) {
  return axios.post('/api/v1/rest-auth/registration/', { email, password1, password2 })
}

export const signup = (email, password1, password2) => {
  return function (dispatch) {
    dispatch(setLoadingSignup(true))
    // clear previous signup errors
    dispatch(setErrorSignup({}))
    dispatch(clearNotification())
    sendSignupInfo(email, password1, password2)
      .then(res => {
        dispatch(login(res.data.key))
        dispatch(setLoadingSignup(false))
        dispatch(push('/recipes'))
      })
      .catch(err => {
        const badRequest = err.response.status === 400
        if (err.response && badRequest) {
          const data = err.response.data
          dispatch(setErrorSignup({
            email: data['email'],
            password1: data['password1'],
            password2: data['password2'],
            nonFieldErrors: data['non_field_errors'],
          }))
        }
        showNotificationWithTimeout(dispatch, {
          message: 'problem registering account',
          level: 'danger',
          sticky: true,
        })
        dispatch(setLoadingSignup(false))
        console.warn('error with registration', err)
      })
  }
}

export const setLoadingReset = val => {
  return {
    type: SET_LOADING_RESET,
    val,
  }
}

export const setErrorReset = val => {
  return {
    type: SET_ERROR_RESET,
    val,
  }
}

const sendReset = email =>
  axios.post('/api/v1/rest-auth/password/reset/', { email })

export const reset = email => dispatch => {
  dispatch(setLoadingReset(true))
  dispatch(setErrorReset({}))
  dispatch(clearNotification())
  sendReset(email)
    .then(res => {
      dispatch(setLoadingReset(false))
      const message = res && res.data && res.data.detail
      showNotificationWithTimeout(dispatch, { message, level: 'success' })
    })
    .catch(err => {
      dispatch(setLoadingReset(false))
      showNotificationWithTimeout(dispatch, { message: 'uh oh! problem resetting password', level: 'danger', closeable: true, sticky: true })
      console.warn('error with password reset', err)
      const badRequest = err.response.status === 400
      if (err.response && badRequest) {
        const data = err.response.data
        console.log(data)
        dispatch(setErrorReset({
          email: data['email'],
          nonFieldErrors: data['non_field_errors'],
        }))
      }
      showNotificationWithTimeout(dispatch, {
        message: 'problem resetting password',
        level: 'danger',
        sticky: true,
      })
    })
}

export const setNotification = ({ message, closeable, level }) => {
  return {
    type: SET_NOTIFICATION,
    message,
    closeable,
    level,
  }
}

// https://stackoverflow.com/a/38574266/3555105
let notificationTimeout = null
export function showNotificationWithTimeout (dispatch, { message, level, closeable, delay = 2000, sticky }) {
  clearTimeout(notificationTimeout)
  dispatch(setNotification({ message, level, closeable }))

  if (!sticky) {
    notificationTimeout = setTimeout(() => {
      dispatch(clearNotification())
    }, delay)
  }
}

export const clearNotification = () => {
  return {
    type: CLEAR_NOTIFICATION,
  }
}
