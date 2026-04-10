import { ItemType } from '../systems/ItemSystem'

export interface RecipeItem {
  type: ItemType
  quantity: number
}

export interface Recipe {
  id: string
  name: string
  inputs: RecipeItem[]
  outputs: RecipeItem[]
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RecipeRegistry {
  private static recipes = new Map<string, Recipe>()

  static {
    this.register(this.lightAmmoRecipe())
    this.register(this.heavyAmmoRecipe())
    this.register(this.firstAidKitRecipe())
  }

  static register(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe)
  }

  static get(id: string): Recipe | undefined {
    return this.recipes.get(id)
  }

  static getAll(): Recipe[] {
    return Array.from(this.recipes.values())
  }

  static getAvailableRecipes(inventory: Map<ItemType, number>): Recipe[] {
    return this.getAll().filter((recipe) => this.canCraft(recipe, inventory))
  }

  static canCraft(recipe: Recipe, inventory: Map<ItemType, number>): boolean {
    for (const input of recipe.inputs) {
      const available = inventory.get(input.type) ?? 0
      if (available < input.quantity) {
        return false
      }
    }
    return true
  }

  static lightAmmoRecipe(): Recipe {
    return {
      id: 'light_ammo',
      name: 'Light Ammo',
      inputs: [{ type: ItemType.Ore, quantity: 2 }],
      outputs: [{ type: ItemType.LightAmmo, quantity: 10 }]
    }
  }

  static heavyAmmoRecipe(): Recipe {
    return {
      id: 'heavy_ammo',
      name: 'Heavy Ammo',
      inputs: [
        { type: ItemType.Ore, quantity: 3 },
        { type: ItemType.Gunpowder, quantity: 1 }
      ],
      outputs: [{ type: ItemType.HeavyAmmo, quantity: 5 }]
    }
  }

  static firstAidKitRecipe(): Recipe {
    return {
      id: 'first_aid_kit',
      name: 'First Aid Kit',
      inputs: [{ type: ItemType.Herb, quantity: 3 }],
      outputs: [{ type: ItemType.HealthPotion, quantity: 1 }]
    }
  }
}
