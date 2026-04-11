import { describe, it, expect, beforeEach } from 'vitest'
import { CraftingSystem } from './CraftingSystem'
import { ItemType } from './ItemSystem'
import { RecipeRegistry } from '../data/Recipe'
import { Inventory } from '../core/Inventory'

describe('RecipeRegistry', () => {
  it('should have light ammo recipe: 2 Ore -> 10 Light Ammo', () => {
    const recipe = RecipeRegistry.get('light_ammo')
    expect(recipe).toBeDefined()
    expect(recipe!.id).toBe('light_ammo')
    expect(recipe!.inputs).toEqual([{ type: ItemType.Ore, quantity: 2 }])
    expect(recipe!.outputs).toEqual([{ type: ItemType.LightAmmo, quantity: 10 }])
  })

  it('should have heavy ammo recipe: 3 Ore + 1 Gunpowder -> 5 Heavy Ammo', () => {
    const recipe = RecipeRegistry.get('heavy_ammo')
    expect(recipe).toBeDefined()
    expect(recipe!.id).toBe('heavy_ammo')
    expect(recipe!.inputs).toContainEqual({ type: ItemType.Ore, quantity: 3 })
    expect(recipe!.inputs).toContainEqual({ type: ItemType.Gunpowder, quantity: 1 })
    expect(recipe!.outputs).toEqual([{ type: ItemType.HeavyAmmo, quantity: 5 }])
  })

  it('should have first aid kit recipe: 3 Herb -> 1 Health Potion', () => {
    const recipe = RecipeRegistry.get('first_aid_kit')
    expect(recipe).toBeDefined()
    expect(recipe!.id).toBe('first_aid_kit')
    expect(recipe!.inputs).toEqual([{ type: ItemType.Herb, quantity: 3 }])
    expect(recipe!.outputs).toEqual([{ type: ItemType.HealthPotion, quantity: 1 }])
  })

  it('should return all recipes', () => {
    const recipes = RecipeRegistry.getAll()
    expect(recipes).toHaveLength(3)
  })
})

describe('CraftingSystem', () => {
  let craftingSystem: CraftingSystem
  let inventory: Inventory

  beforeEach(() => {
    inventory = new Inventory()
    craftingSystem = new CraftingSystem(inventory)
  })

  describe('inventory initialization (delegated store)', () => {
    it('should initialize all item counts to 0', () => {
      expect(craftingSystem.getItemCount(ItemType.Ore)).toBe(0)
      expect(craftingSystem.getItemCount(ItemType.Herb)).toBe(0)
      expect(craftingSystem.getItemCount(ItemType.Gunpowder)).toBe(0)
      expect(craftingSystem.getItemCount(ItemType.LightAmmo)).toBe(0)
      expect(craftingSystem.getItemCount(ItemType.HeavyAmmo)).toBe(0)
    })
  })

  describe('hasMaterials', () => {
    it('should return true when player has enough materials', () => {
      inventory.addItem(ItemType.Ore, 5)
      const recipe = RecipeRegistry.get('light_ammo')!
      expect(craftingSystem.hasMaterials(recipe)).toBe(true)
    })

    it('should return false when player lacks materials', () => {
      inventory.addItem(ItemType.Ore, 1)
      const recipe = RecipeRegistry.get('light_ammo')!
      expect(craftingSystem.hasMaterials(recipe)).toBe(false)
    })

    it('should check multiple input materials', () => {
      inventory.addItem(ItemType.Ore, 3)
      inventory.addItem(ItemType.Gunpowder, 0)
      const recipe = RecipeRegistry.get('heavy_ammo')!
      expect(craftingSystem.hasMaterials(recipe)).toBe(false)
    })
  })

  describe('craft', () => {
    it('should consume materials and produce outputs for light ammo', () => {
      inventory.addItem(ItemType.Ore, 10)

      const result = craftingSystem.craft('light_ammo')

      expect(result).toBe(true)
      expect(craftingSystem.getItemCount(ItemType.Ore)).toBe(8)
      expect(craftingSystem.getItemCount(ItemType.LightAmmo)).toBe(10)
    })

    it('should consume multiple materials for heavy ammo', () => {
      inventory.addItem(ItemType.Ore, 10)
      inventory.addItem(ItemType.Gunpowder, 5)

      const result = craftingSystem.craft('heavy_ammo')

      expect(result).toBe(true)
      expect(craftingSystem.getItemCount(ItemType.Ore)).toBe(7)
      expect(craftingSystem.getItemCount(ItemType.Gunpowder)).toBe(4)
      expect(craftingSystem.getItemCount(ItemType.HeavyAmmo)).toBe(5)
    })

    it('should return false and not consume when insufficient materials', () => {
      inventory.addItem(ItemType.Ore, 1)

      const result = craftingSystem.craft('light_ammo')

      expect(result).toBe(false)
      expect(craftingSystem.getItemCount(ItemType.Ore)).toBe(1)
      expect(craftingSystem.getItemCount(ItemType.LightAmmo)).toBe(0)
    })

    it('should return false for unknown recipe', () => {
      const result = craftingSystem.craft('unknown_recipe')
      expect(result).toBe(false)
    })

    it('should handle multiple crafts in sequence', () => {
      inventory.addItem(ItemType.Ore, 10)

      craftingSystem.craft('light_ammo')
      craftingSystem.craft('light_ammo')

      expect(craftingSystem.getItemCount(ItemType.Ore)).toBe(6)
      expect(craftingSystem.getItemCount(ItemType.LightAmmo)).toBe(20)
    })
  })

  describe('getAvailableRecipes', () => {
    it('should return recipes that can be crafted', () => {
      inventory.addItem(ItemType.Ore, 10)
      inventory.addItem(ItemType.Herb, 5)
      inventory.addItem(ItemType.Gunpowder, 5)

      const available = craftingSystem.getAvailableRecipes()

      expect(available.length).toBe(3)
      expect(available.map((r) => r.id)).toContain('light_ammo')
      expect(available.map((r) => r.id)).toContain('heavy_ammo')
      expect(available.map((r) => r.id)).toContain('first_aid_kit')
    })

    it('should return empty when no recipes available', () => {
      const available = craftingSystem.getAvailableRecipes()
      expect(available).toHaveLength(0)
    })
  })
})
