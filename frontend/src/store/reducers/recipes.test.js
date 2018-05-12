import recipes from './recipes.js'

import {
  addRecipe,
  deleteRecipe,
  addStepToRecipe,
  addIngredientToRecipe,
  updateRecipeTime,
  updateRecipeAuthor,
  updateRecipeName,
  deleteIngredient,
  deleteStep,
  updateRecipeSource,
  updateIngredient,
  updateStep,
  setLoadingAddStepToRecipe,
  setLoadingRecipe,
  setDeletingRecipe,
  setAddingIngredientToRecipe,
  setUpdatingIngredient,
  setRemovingIngredient,
  setUpdatingStep,
  setRemovingStep,
  setRecipe404,
  setRecipeUpdating,
  setRecipe,
  updateRecipeOwner,
  setSchedulingRecipe,
} from '../actions'

describe('Recipes', () => {
  it('Adds recipe to recipe list', () => {
    const beforeState = {
      1: {
        id: 1,
        title: 'a meh recipe'
      }
    }
    const recipe = {
      id: 123,
      title: 'Recipe title',
      tags: ['tagOne', 'tagTwo'],
      author: 'Recipe author',
      source: '',
      ingredients: [
        {
          text: 'ingredientOne'
        },
        {
          text: 'ingredientTwo'
        }
      ]
    }
    const afterState = {
      ...beforeState,
      [recipe.id]: recipe
    }
    expect(
      recipes(beforeState, addRecipe(recipe))
    ).toEqual(afterState)
  })

  it('Remove recipe from recipe list', () => {
    const beforeState = {
      123: {},
      1: {}
    }
    const afterState = {
      1: {}
    }
    expect(
      recipes(beforeState, deleteRecipe(123))
    ).toEqual(afterState)
  })

  it('Remove non-existent recipe from recipe list', () => {
    expect(
      recipes({}, deleteRecipe(123))
    ).toEqual({})
  })

  it('fetching recipe results in it loading', () => {
    const beforeState = {
      1: {
        title: 'good recipe',
        steps: [],
        loading: false
      }
    }

    const afterState = {
      1: {
        title: 'good recipe',
        steps: [],
        loading: true
      }
    }

    expect(
      recipes(beforeState, setLoadingRecipe(1, true))
    ).toEqual(afterState)
  })

  it('sets deleting of the recipe', () => {
    const beforeState = {
      1: {
        title: 'good recipe',
        steps: [],
        deleting: false
      }
    }

    const afterState = {
      1: {
        title: 'good recipe',
        steps: [],
        deleting: true
      }
    }

    expect(
      recipes(beforeState, setDeletingRecipe(1, true))
    ).toEqual(afterState)
  })

  it('adds a step to the recipe', () => {
    const beforeState = {
      1: {
        title: 'good recipe',
        steps: []
      }
    }

    const newStep = {
      text: 'a new step'
    }

    const afterState = {
      1: {
        title: 'good recipe',
        steps: [
          newStep
        ]
      }
    }

    expect(
      recipes(beforeState, addStepToRecipe(1, newStep))
    ).toEqual(afterState)
  })

  it("adds an ingredient to the recipe and doesn't delete steps", () => {
    const beforeState = {
      1: {
        ingredients: [],
        steps: [
          {
            text: 'test'
          }
        ]
      }
    }

    const newIngredient = {
      text: 'a new step'
    }

    const afterState = {
      1: {
        ingredients: [
          newIngredient
        ],
        steps: [
          {
            text: 'test'
          }
        ]
      }
    }

    expect(
      recipes(beforeState, addIngredientToRecipe(1, newIngredient))
    ).toEqual(afterState)
  })

  it('it updates a step', () => {
    const beforeState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step'
          }
        ],
        steps: [
          {
            id: 1,
            text: 'test'
          }
        ]
      }
    }

    const text = 'new text'

    const afterState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step'
          }
        ],
        steps: [
          {
            id: 1,
            text: text
          }
        ]
      }
    }

    expect(
      recipes(beforeState, updateStep(1, 1, text))
    ).toEqual(afterState)
  })

  it('it updates an ingredient', () => {
    const beforeState = {
      1: {
        ingredients: [
          {
            id: 1,
            quantity: 2,
            unit: 'count',
            name: 'Tomato',
            description: 'sliced'
          }
        ],
        steps: [
          {
            text: 'test'
          }
        ]
      }
    }

    const newIngredient = {
      id: 1,
      quantity: 4,
      unit: 'count',
      name: 'Tomato',
      description: 'diced'
    }

    const afterState = {
      1: {
        ingredients: [
          newIngredient
        ],
        steps: [
          {
            text: 'test'
          }
        ]
      }
    }

    expect(
      recipes(beforeState, updateIngredient(1, 1, newIngredient))
    ).toEqual(afterState)
  })

  it('updates the name of the recipe', () => {
    const beforeState = {
      1: {
        id: 1,
        name: 'Before title'
      }
    }

    const newName = 'After title'

    const afterState = {
      1: {
        id: 1,
        name: newName
      }
    }

    expect(
      recipes(beforeState, updateRecipeName(1, newName))
    ).toEqual(afterState)
  })

  it('deletes an ingredient from a recipe', () => {
    const beforeState = {
      1: {
        id: 1,
        ingredients: [
          {
            id: 1,
            text: 'test'
          },
          {
            id: 2,
            text: 'target'
          }
        ]
      }
    }

    const afterState = {
      1: {
        id: 1,
        ingredients: [
          {
            id: 2,
            text: 'target'
          }
        ]
      }
    }
    expect(
      recipes(beforeState, deleteIngredient(1, 1))
    ).toEqual(afterState)
  })

  it('deletes a step from a recipe', () => {
    const beforeState = {
      1: {
        id: 1,
        steps: [
          {
            id: 1,
            text: 'test'
          },
          {
            id: 2,
            text: 'target'
          }
        ]
      }
    }

    const afterState = {
      1: {
        id: 1,
        steps: [
          {
            id: 2,
            text: 'target'
          }
        ]
      }
    }

    expect(
      recipes(beforeState, deleteStep(1, 1))
    ).toEqual(afterState)
  })

  it('updates the recipe source', () => {
    const beforeState = {
      1: {
        id: 1,
        source: 'example.com'
      }
    }

    const newSource = 'abettersource.com'

    const afterState = {
      1: {
        id: 1,
        source: newSource
      }
    }

    expect(
      recipes(beforeState, updateRecipeSource(1, newSource))
    ).toEqual(afterState)
  })

  it('updates the recipe author', () => {
    const beforeState = {
      1: {
        id: 1,
        author: 'donny'
      }
    }

    const newAuthor = 'aldo raine'

    const afterState = {
      1: {
        id: 1,
        author: newAuthor
      }
    }

    expect(
      recipes(beforeState, updateRecipeAuthor(1, newAuthor))
    ).toEqual(afterState)
  })

  it('updates the recipe time', () => {
    const beforeState = {
      1: {
        id: 1,
        time: '1 hour'
      }
    }

    const newTime = '5.12 years'

    const afterState = {
      1: {
        id: 1,
        time: newTime
      }
    }

    expect(
      recipes(beforeState, updateRecipeTime(1, newTime))
    ).toEqual(afterState)
  })

  it('sets the loading state for adding a step to a recipe', () => {
    const beforeState = {
      1: {
        addingStepToRecipe: false,
      }
    }

    const afterState = {
      1: {
        addingStepToRecipe: true
      }
    }

    expect(
      recipes(beforeState, setLoadingAddStepToRecipe(1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to be adding an ingredient', () => {
    const beforeState = {
      1: {
        addingIngredient: false,
      }
    }

    const afterState = {
      1: {
        addingIngredient: true,
      }
    }

    expect(
      recipes(beforeState, setAddingIngredientToRecipe(1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to be updating a specific ingredient', () => {
    const beforeState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step',
            updating: false
          }
        ]
      }
    }

    const afterState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step',
            updating: true
          }
        ]
      }
    }

    expect(
      recipes(beforeState, setUpdatingIngredient(1, 1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to be removing a specific ingredient', () => {
    const beforeState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step',
            removing: false
          }
        ]
      }
    }

    const afterState = {
      1: {
        ingredients: [
          {
            id: 1,
            text: 'a new step',
            removing: true
          }
        ]
      }
    }

    expect(
      recipes(beforeState, setRemovingIngredient(1, 1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to be updating a specific step', () => {
    const beforeState = {
      1: {
        steps: [
          {
            id: 1,
            text: 'a new step',
            updating: false
          }
        ]
      }
    }

    const afterState = {
      1: {
        steps: [
          {
            id: 1,
            text: 'a new step',
            updating: true
          }
        ]
      }
    }

    expect(
      recipes(beforeState, setUpdatingStep(1, 1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to be removing a specific step', () => {
    const beforeState = {
      1: {
        steps: [
          {
            id: 1,
            text: 'a new step',
            removing: false
          }
        ]
      }
    }

    const afterState = {
      1: {
        steps: [
          {
            id: 1,
            text: 'a new step',
            removing: true
          }
        ]
      }
    }

    expect(
      recipes(beforeState, setRemovingStep(1, 1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to 404', () => {
    const beforeState = {
      1: {
        error404: false
      }
    }

    const afterState = {
      1: {
        error404: true
      }
    }

    expect(
      recipes(beforeState, setRecipe404(1, true))
    ).toEqual(afterState)
  })

  it('sets the recipe to updating', () => {
    const beforeState = {
      1: {
        updating: false
      }
    }

    const afterState = {
      1: {
        updating: true
      }
    }

    expect(
      recipes(beforeState, setRecipeUpdating(1, true))
    ).toEqual(afterState)
  })

  it('overwrites the recipe correctly', () => {
    const beforeState = {
      1: {
        name: 'Initial recipe name',
        updating: true
      }
    }

    const newRecipe = {
      name: 'new recipe name',
    }

    const afterState = {
      1: {
        name: 'new recipe name',
        updating: true,
      }
    }

    expect(
      recipes(beforeState, setRecipe(1, newRecipe))
    ).toEqual(afterState)
  })

  it('sets recipe owner for recipe move', () => {
    const beforeState = {
      1: {
        id: 1,
        name: 'Initial recipe name 1',
      },
      2: {
        id: 2,
        name: 'Initial recipe name 2',
      },
    }

    const afterState = {
      1: {
        id: 1,
        name: 'Initial recipe name 1',
        owner: {
          id: 14,
          type: 'team',
          name: 'A Cool Name'
        }
      },
      2: {
        id: 2,
        name: 'Initial recipe name 2',
      },
    }

    const id = 1
    const owner = {
      id: 14,
      type: 'team',
      name: 'A Cool Name'
    }

    expect(
      recipes(beforeState, updateRecipeOwner(id, owner))
    ).toEqual(afterState)
  })

  it('sets recipe owner for recipe move', () => {
    const beforeState = {
      1: {
        id: 1,
        name: 'Initial recipe name 1',
      },
      2: {
        id: 2,
        name: 'Initial recipe name 2',
      },
    }

    const afterState = {
      1: {
        id: 1,
        name: 'Initial recipe name 1',
        scheduling: true,
      },
      2: {
        id: 2,
        name: 'Initial recipe name 2',
      },
    }

    expect(
      recipes(beforeState, setSchedulingRecipe(1, true))
    ).toEqual(afterState)
  })
})
