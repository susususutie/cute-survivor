import type { ItemType } from './ItemSystem'
import type { Recipe } from '../data/Recipe'
import { RecipeRegistry } from '../data/Recipe'

export interface ItemStore {
  addItem(type: ItemType, quantity: number): boolean
  removeItem(type: ItemType, quantity: number): boolean
  getItemCount(type: ItemType): number
  getAllItems(): Map<ItemType, number>
}

export class CraftingSystem {
  private store: ItemStore

  constructor(store: ItemStore) {
    this.store = store
  }

  getItemCount(type: ItemType): number {
    return this.store.getItemCount(type)
  }

  hasMaterials(recipe: Recipe): boolean {
    return RecipeRegistry.canCraft(recipe, this.store.getAllItems())
  }

  craft(recipeId: string): boolean {
    const recipe = RecipeRegistry.get(recipeId)
    if (!recipe) {
      return false
    }

    if (!this.hasMaterials(recipe)) {
      return false
    }

    // Consume input materials
    for (const input of recipe.inputs) {
      this.store.removeItem(input.type, input.quantity)
    }

    // Produce output items
    for (const output of recipe.outputs) {
      this.store.addItem(output.type, output.quantity)
    }

    return true
  }

  getAvailableRecipes(): Recipe[] {
    return RecipeRegistry.getAvailableRecipes(this.store.getAllItems())
  }

  getAllRecipes(): Recipe[] {
    return RecipeRegistry.getAll()
  }
}
