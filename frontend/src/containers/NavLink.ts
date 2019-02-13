import { connect } from "react-redux"

import { NavLink } from "@/components/NavLink"
import { IState } from "@/store/store"

const mapStateToProps = (state: IState) => ({
  pathname:
    state.routerReducer.location != null
      ? state.routerReducer.location.pathname
      : ""
})

// pass {} to prevent passing `dispatch` to component
export default connect(
  mapStateToProps,
  {}
)(NavLink)
