import { connect } from 'react-redux'

import { byNameAlphabetical } from '../sorters'

import {
  addingToCart,
  removingFromCart,
  fetchCart,
  fetchRecipeList,
  fetchShoppingList
} from '../store/actions.js'

import Cart from '../components/Cart.jsx'

const mapStateToProps = state => {
  return {
    cart: state.cart,
    recipes: Object.values(state.recipes)
             .filter(recipe => state.cart[recipe.id] > 0)
             .sort(byNameAlphabetical),
    loading: state.loading.recipes || state.loading.cart,
    shoppinglist: state.shoppinglist.shoppinglist
                  .sort(byNameAlphabetical),
    loadingShoppingList: state.shoppinglist.loading
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToCart: async id => {
      await dispatch(addingToCart(id))
      await dispatch(fetchShoppingList())
    },
    removeFromCart: async id => {
      await dispatch(removingFromCart(id))
      await dispatch(fetchShoppingList())
    },
    fetchData: () => {
      dispatch(fetchRecipeList())
      dispatch(fetchCart())
      dispatch(fetchShoppingList())
    }
  }
}

const ConnectedCart = connect(
  mapStateToProps,
  mapDispatchToProps
)(Cart)

export default ConnectedCart
