import { describe, it, expect, beforeEach } from 'vitest'
import { Inventory } from './Inventory'
import { ItemType } from '../systems/ItemSystem'

describe('Inventory', () => {
  let inventory: Inventory

  beforeEach(() => {
    inventory = new Inventory(20)
  })

  describe('initialization', () => {
    it('should initialize all item counts to 0', () => {
      expect(inventory.getItemCount(ItemType.Ore)).toBe(0)
      expect(inventory.getItemCount(ItemType.Herb)).toBe(0)
      expect(inventory.getItemCount(ItemType.Gold)).toBe(0)
      expect(inventory.getItemCount(ItemType.Ammo)).toBe(0)
    })

    it('should have correct capacity', () => {
      expect(inventory.getCapacity()).toBe(20)
    })

    it('should not be full initially', () => {
      expect(inventory.isFull()).toBe(false)
    })
  })

  describe('addItem', () => {
    it('should add items correctly', () => {
      inventory.addItem(ItemType.Ore, 5)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(5)
    })

    it('should accumulate items', () => {
      inventory.addItem(ItemType.Ore, 5)
      inventory.addItem(ItemType.Ore, 3)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(8)
    })

    it('should add different item types independently', () => {
      inventory.addItem(ItemType.Ore, 5)
      inventory.addItem(ItemType.Herb, 3)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(5)
      expect(inventory.getItemCount(ItemType.Herb)).toBe(3)
    })
  })

  describe('removeItem', () => {
    it('should remove items correctly', () => {
      inventory.addItem(ItemType.Ore, 10)
      const result = inventory.removeItem(ItemType.Ore, 3)
      expect(result).toBe(true)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(7)
    })

    it('should return false when not enough items', () => {
      inventory.addItem(ItemType.Ore, 2)
      const result = inventory.removeItem(ItemType.Ore, 5)
      expect(result).toBe(false)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(2)
    })

    it('should return true when removing exact amount', () => {
      inventory.addItem(ItemType.Ore, 5)
      const result = inventory.removeItem(ItemType.Ore, 5)
      expect(result).toBe(true)
      expect(inventory.getItemCount(ItemType.Ore)).toBe(0)
    })
  })

  describe('hasItem', () => {
    it('should return true when player has enough items', () => {
      inventory.addItem(ItemType.Ore, 10)
      expect(inventory.hasItem(ItemType.Ore, 5)).toBe(true)
      expect(inventory.hasItem(ItemType.Ore, 10)).toBe(true)
    })

    it('should return false when player lacks items', () => {
      inventory.addItem(ItemType.Ore, 3)
      expect(inventory.hasItem(ItemType.Ore, 5)).toBe(false)
    })

    it('should default to quantity 1', () => {
      inventory.addItem(ItemType.Ore, 1)
      expect(inventory.hasItem(ItemType.Ore)).toBe(true)
      expect(inventory.hasItem(ItemType.Herb)).toBe(false)
    })
  })

  describe('isFull', () => {
    it('should return false when under capacity', () => {
      inventory.addItem(ItemType.Ore, 15)
      expect(inventory.isFull()).toBe(false)
    })

    it('should track total item count', () => {
      inventory.addItem(ItemType.Ore, 5)
      inventory.addItem(ItemType.Herb, 10)
      expect(inventory.getTotalItemCount()).toBe(15)
    })
  })

  describe('equipment', () => {
    it('should allow setting weapon slot', () => {
      inventory.setEquipment('weapon', ItemType.Ammo)
      expect(inventory.getEquipment('weapon')).toBe(ItemType.Ammo)
    })

    it('should allow setting armor slot', () => {
      inventory.setEquipment('armor', ItemType.HealthPotion)
      expect(inventory.getEquipment('armor')).toBe(ItemType.HealthPotion)
    })

    it('should allow null equipment', () => {
      inventory.setEquipment('weapon', ItemType.Ammo)
      inventory.setEquipment('weapon', null)
      expect(inventory.getEquipment('weapon')).toBeNull()
    })
  })

  describe('serialize / deserialize', () => {
    it('should serialize inventory state', () => {
      inventory.addItem(ItemType.Ore, 10)
      inventory.addItem(ItemType.Herb, 5)
      inventory.setEquipment('weapon', ItemType.Ammo)

      const data = inventory.serialize()

      expect(data.items.length).toBeGreaterThan(0)
      expect(data.equipment.weapon).toBe(ItemType.Ammo)
    })

    it('should deserialize and restore inventory', () => {
      inventory.addItem(ItemType.Ore, 10)
      inventory.setEquipment('weapon', ItemType.Ammo)

      const data = inventory.serialize()
      const restored = Inventory.deserialize(data)

      expect(restored.getItemCount(ItemType.Ore)).toBe(10)
      expect(restored.getEquipment('weapon')).toBe(ItemType.Ammo)
    })
  })
})
