import { createAsyncAction, ActionType, getType } from "typesafe-actions"
import { RootState } from "@/store/store"

export const fetchInvites = createAsyncAction(
  "FETCH_INVITES_START",
  "FETCH_INVITES_SUCCESS",
  "FETCH_INVITES_FAILURE"
)<void, IInvite[], void>()

export const acceptInvite = createAsyncAction(
  "ACCEPT_INVITE_REQUEST",
  "ACCEPT_INVITE_SUCCESS",
  "ACCEPT_INVITE_FAILURE"
)<IInvite["id"], IInvite["id"], IInvite["id"]>()

export const declineInvite = createAsyncAction(
  "DECLINE_INVITE_REQUEST",
  "DECLINE_INVITE_SUCCESS",
  "DECLINE_INVITE_FAILURE"
)<IInvite["id"], IInvite["id"], IInvite["id"]>()

export type InviteActions =
  | ActionType<typeof acceptInvite>
  | ActionType<typeof declineInvite>
  | ActionType<typeof fetchInvites>

interface ITeam {
  readonly id: number
  readonly name: string
}

interface IUserPublic {
  readonly id: number
  readonly email: string
  readonly avatar_url: string
}

export interface IInvite {
  readonly id: number
  readonly accepting?: boolean
  readonly declining?: boolean
  readonly status: "accepted" | "declined" | "open"
  readonly active: boolean
  readonly team: ITeam
  readonly creator: IUserPublic
}

function mapById(
  state: IInvitesState,
  id: IInvite["id"],
  func: (invite: IInvite) => IInvite
): IInvitesState {
  const invite = state.byId[id]
  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: func(invite)
    }
  }
}

export interface IInvitesState {
  readonly loading: boolean
  readonly byId: {
    readonly [key: number]: IInvite
  }
}

export const initialState: IInvitesState = {
  loading: false,
  byId: {}
}

const invites = (
  state: IInvitesState = initialState,
  action: InviteActions
): IInvitesState => {
  switch (action.type) {
    case getType(fetchInvites.success):
      return {
        ...state,
        loading: false,
        byId: {
          ...state.byId,
          ...action.payload.reduce(
            (a, b) => ({
              ...a,
              [b.id]: b
            }),
            {}
          )
        }
      }
    case getType(fetchInvites.request):
      return { ...state, loading: true }
    case getType(fetchInvites.failure):
      return { ...state, loading: false }
    case getType(acceptInvite.request):
      return mapById(state, action.payload, invite => ({
        ...invite,
        accepting: true
      }))
    case getType(acceptInvite.success):
      return mapById(state, action.payload, invite => ({
        ...invite,
        accepting: false,
        status: "accepted"
      }))
    case getType(acceptInvite.failure):
      return mapById(state, action.payload, invite => ({
        ...invite,
        accepting: false
      }))
    case getType(declineInvite.request):
      return mapById(state, action.payload, invite => ({
        ...invite,
        declining: true
      }))
    case getType(declineInvite.success):
      return mapById(state, action.payload, invite => ({
        ...invite,
        status: "declined",
        declining: false
      }))
    case getType(declineInvite.failure):
      return mapById(state, action.payload, invite => ({
        ...invite,
        status: "declined",
        declining: false
      }))
    default:
      return state
  }
}

export default invites

export function getInvites(state: RootState): IInvite[] {
  return Object.values(state.invites.byId)
}
