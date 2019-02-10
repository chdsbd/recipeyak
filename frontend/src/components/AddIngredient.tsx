import React from "react"

import AddIngredientForm from "@/components/AddIngredientForm"

export interface IIngredientBasic {
  quantity: string
  name: string
  description: string
}

interface IAddIngredientProps {
  readonly onCancel: () => void
  readonly id: number
  readonly addIngredient: (
    args: {
      recipeID: number
      ingredient: IIngredientBasic
    }
  ) => void
  readonly loading: boolean
  readonly autoFocus: boolean
}

interface IAddIngredientState {
  readonly quantity: string
  readonly name: string
  readonly description: string
  readonly optional: boolean
  readonly addingIngredient: boolean
}

export type AddIngredientFields = Exclude<
  keyof IAddIngredientState,
  "addingIngredient"
>

export default class AddIngredient extends React.Component<
  IAddIngredientProps,
  IAddIngredientState
> {
  static defaultProps = {
    loading: false
  }

  emptyState: IAddIngredientState = {
    quantity: "",
    name: "",
    description: "",
    optional: false,
    addingIngredient: false
  }

  state: IAddIngredientState = this.emptyState

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(({
      [e.target.name]: e.target.value
    } as unknown) as IAddIngredientState)
  }

  addingIngredient = () => {
    this.setState({ addingIngredient: true })
  }

  cancelAddIngredient = async () => {
    this.props.onCancel()
    this.setState(this.emptyState)
  }

  clearInputs = () => {
    this.setState(this.emptyState)
  }

  render() {
    const { clearInputs, cancelAddIngredient, handleInputChange } = this
    const { id, addIngredient, loading, autoFocus } = this.props
    const { quantity, name, description, optional } = this.state

    return (
      <AddIngredientForm
        handleAddIngredient={() => {
          // TODO(sbdchd): fix this
          addIngredient({
            recipeID: id,
            ingredient: { quantity, name, description }
          })
          // this needs to execute after
          clearInputs()
        }}
        loading={loading}
        cancelAddIngredient={cancelAddIngredient}
        handleInputChange={handleInputChange}
        quantity={quantity}
        name={name}
        description={description}
        optional={optional}
        autoFocus={autoFocus}
      />
    )
  }
}
