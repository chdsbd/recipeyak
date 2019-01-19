import addWeeks from "date-fns/add_weeks"
import startOfToday from "date-fns/start_of_today"

import {
  createAsyncAction,
  ActionType,
  getType,
  createStandardAction
} from "typesafe-actions"
import { WebData, Success, Failure, HttpErrorKind, toLoading } from "@/webdata"

export const fetchShoppingList = createAsyncAction(
  "FETCH_SHOPPING_LIST_START",
  "FETCH_SHOPPING_LIST_SUCCESS",
  "FETCH_SHOPPING_LIST_FAILURE"
)<void, IShoppingListItem[], void>()

export const setSelectingStart = createStandardAction("SET_SELECTING_START")<
  Date
>()
export const setSelectingEnd = createStandardAction("SET_SELECTING_END")<Date>()

export type ShoppingListActions =
  | ReturnType<typeof setSelectingStart>
  | ReturnType<typeof setSelectingEnd>
  | ActionType<typeof fetchShoppingList>

export interface IShoppingListItem {
  readonly name: string
  readonly unit: string
}

export interface IShoppingListState {
  readonly shoppinglist: WebData<IShoppingListItem[]>
  readonly startDay: Date
  readonly endDay: Date
}

const initialState: IShoppingListState = {
  shoppinglist: undefined,
  startDay: startOfToday(),
  endDay: addWeeks(startOfToday(), 1)
}

const shoppinglist = (
  state: IShoppingListState = initialState,
  action: ShoppingListActions
): IShoppingListState => {
  switch (action.type) {
    case getType(fetchShoppingList.success):
      return { ...state, shoppinglist: Success(action.payload) }
    case getType(fetchShoppingList.request):
      return { ...state, shoppinglist: toLoading(state.shoppinglist) }
    case getType(fetchShoppingList.failure):
      return { ...state, shoppinglist: Failure(HttpErrorKind.other) }
    case getType(setSelectingStart):
      return { ...state, startDay: action.payload }
    case getType(setSelectingEnd):
      return { ...state, endDay: action.payload }
    default:
      return state
  }
}

export default shoppinglist
