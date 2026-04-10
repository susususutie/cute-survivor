import { ItemType } from './ItemSystem'
import type { Recipe } from '../data/Recipe'
import { RecipeRegistry } from '../data/Recipe'

export class CraftingSystem {
  private inventory: Map<ItemType, number>

  constructor() {
    this.inventory = new Map()
    this.initInventory()
  }

  private initInventory(): void {
    Object.values(ItemType).forEach((type) => {
      this.inventory.set(type, 0)
    })
  }

  setInventory(inventory: Map<ItemType, number>): void {
    this.inventory = inventory
  }

  getInventory(): Map<ItemType, number> {
    return this.inventory
  }

  addItem(type: ItemType, quantity: number): void {
    const current = this.inventory.get(type) ?? 0
    this.inventory.set(type, current + quantity)
  }

  removeItem(type: ItemType, quantity: number): boolean {
    const current = this.inventory.get(type) ?? 0
    if (current < quantity) {
      return false
    }
    this.inventory.set(type, current - quantity)
    return true
  }

  getItemCount(type: ItemType): number {
    return this.inventory.get(type) ?? 0
  }

  hasMaterials(recipe: Recipe): boolean {
    return RecipeRegistry.canCraft(recipe, this.inventory)
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
      this.removeItem(input.type, input.quantity)
    }

    // Produce output items
    for (const output of recipe.outputs) {
      this.addItem(output.type, output.quantity)
    }

    return true
  }

  getAvailableRecipes(): Recipe[] {
    return RecipeRegistry.getAvailableRecipes(this.inventory)
  }

  getAllRecipes(): Recipe[] {
    return RecipeRegistry.getAll()
  }
}
