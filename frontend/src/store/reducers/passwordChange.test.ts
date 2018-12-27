import passwordChange, { initialState } from "@/store/reducers/passwordChange"
import * as a from "@/store/reducers/passwordChange"

describe("passwordChange", () => {
  it("sets the loading state of the updating password", () => {
    const beforeState = initialState

    const afterState = {
      ...initialState,
      loadingPasswordUpdate: true
    }

    expect(
      passwordChange(beforeState, a.setLoadingPasswordUpdate(true))
    ).toEqual(afterState)

    const anotherAfterState = {
      ...initialState,
      loadingPasswordUpdate: false
    }

    expect(
      passwordChange(beforeState, a.setLoadingPasswordUpdate(false))
    ).toEqual(anotherAfterState)
  })

  it("sets the error state of the updating password", () => {
    const beforeState = initialState

    const error = {
      newPassword: ["The two password fields didn't match."]
    }

    const afterState = {
      ...initialState,
      errorPasswordUpdate: error
    }
    expect(
      passwordChange(beforeState, a.setErrorPasswordUpdate(error))
    ).toEqual(afterState)
  })
})
