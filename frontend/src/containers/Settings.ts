import { connect } from "react-redux"

import {
  fetchUser,
  fetchSocialConnections,
  updatingEmail,
  disconnectSocialAccount,
  loggingOut,
  deleteUserAccount,
  Dispatch
} from "../store/actions"

import Settings from "../components/Settings"
import { RootState } from "../store/store"
import { SocialProvider } from "../store/reducers/user"

const mapStateToProps = (state: RootState) => {
  // HACK(sbdchd): we need to type the store so we can stop socialAccountConnections from becoming undefined
  const socialAccountConnections = state.user.socialAccountConnections || {}
  return {
    avatarURL: state.user.avatarURL,
    email: state.user.email,
    updatingEmail: state.user.updatingEmail,
    hasPassword: state.user.hasUsablePassword,
    socialAccountConnections,
    loading: state.user.loading
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    logout: () => {
      dispatch(loggingOut())
    },
    fetchData: () => {
      dispatch(fetchUser())
      dispatch(fetchSocialConnections())
    },
    disconnectAccount: (provider: SocialProvider, id: number) =>
      dispatch(disconnectSocialAccount(provider, id)),
    deleteUserAccount: () => dispatch(deleteUserAccount()),
    updateEmail: (email: string) => dispatch(updatingEmail(email))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings)
