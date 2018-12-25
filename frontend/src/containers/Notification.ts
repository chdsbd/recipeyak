import { connect } from "react-redux"

import { Dispatch } from "../store/actions"
import Notification from "../components/Notification"
import { RootState } from "../store/store"
import { clearNotification } from "../store/reducers/notification"

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    close: () => dispatch(clearNotification())
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    message: state.notification.message,
    closeable: state.notification.closeable,
    show: state.notification.show,
    level: state.notification.level
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Notification)
