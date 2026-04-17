import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaveSystem, type SaveInput, type SaveData } from './SaveSystem'
import { Inventory } from '../core/Inventory'
import { ItemType } from './ItemSystem'
import { WeaponType } from '../core/Weapon'
import { createDefaultWorldConfig } from '../core/WorldConfig'

describe('SaveSystem', () => {
  let saveSystem: SaveSystem
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      })
    }
    saveSystem = new SaveSystem(mockLocalStorage as unknown as import('../core/dependencies/Storage').IStorage)
  })

  function createSaveInput(slotIndex = 0): SaveInput {
    const inventory = new Inventory()
    inventory.addItem(ItemType.Ore, 10)

    return {
      slotIndex,
      player: {
        id: 'player_test',
        hp: 100,
        maxHp: 100,
        speed: 8,
        position: { x: 10, y: 0, z: 20 },
        rotation: 1.5
      },
      resources: {
        gold: 500,
        herbs: 20,
        ores: 15,
        gunpowder: 1,
        lightAmmo: 2,
        heavyAmmo: 3
      },
      combat: {
        ammo: 30,
        maxAmmo: 30,
        currentWeaponType: WeaponType.Pistol
      },
      inventory,
      world: {
        seed: 'test_seed',
        currentChunkX: 0,
        currentChunkZ: 0,
        worldConfig: createDefaultWorldConfig('test_seed')
      },
      enemies: []
    }
  }

  describe('saveGame', () => {
    it('saves game data to slot key', () => {
      const result = saveSystem.saveGame(createSaveInput(2))

      expect(result).toBe(true)
      expect(mockStorage.cute_survivor_save_2).toBeDefined()
    })

    it('includes version and timestamp', () => {
      saveSystem.saveGame(createSaveInput(0))

      const savedData: SaveData = JSON.parse(mockStorage.cute_survivor_save_0)
      expect(savedData.version).toBe('1.1.0')
      expect(savedData.timestamp).toBeGreaterThan(0)
      expect(savedData.slotIndex).toBe(0)
    })

    it('persists extended enemy snapshot fields', () => {
      const input = createSaveInput(0)
      input.enemies = [{
        id: 'enemy_1',
        type: 'goblin',
        hp: 35,
        maxHp: 40,
        position: { x: 11, y: 0, z: -9 },
        rotation: 0.3,
        speed: 3.5,
        damage: 8,
        detectRange: 12,
        attackRange: 1.2,
        state: 'chase',
        animPhase: 0.6,
        isAggro: true,
        patrolTarget: { x: 15, y: 0, z: -7 },
        attackCooldown: 0.5,
        hasRangedAttack: true,
        rangedAttackRange: 10,
        rangedAttackDamage: 9,
        rangedAttackCooldown: 2,
        rangedAttackTimer: 1.3,
        aggroRange: 15,
        leashRange: 24,
        deaggroTimer: 0.2,
        colliderRadius: 0.55
      }]

      saveSystem.saveGame(input)
      const saved = saveSystem.getSave(0)

      expect(saved).not.toBeNull()
      expect(saved!.enemies).toHaveLength(1)
      expect(saved!.enemies[0].deaggroTimer).toBe(0.2)
      expect(saved!.enemies[0].colliderRadius).toBe(0.55)
      expect(saved!.enemies[0].patrolTarget).toEqual({ x: 15, y: 0, z: -7 })
    })
  })

  describe('load/get', () => {
    it('returns null when no save exists', () => {
      const result = saveSystem.loadGame()
      expect(result).toBeNull()
    })

    it('loads saved game data', () => {
      saveSystem.saveGame(createSaveInput(0))

      const result = saveSystem.loadGame()

      expect(result).not.toBeNull()
      expect(result!.player.hp).toBe(100)
      expect(result!.player.gold).toBe(500)
      expect(result!.world.seed).toBe('test_seed')
    })
  })

  describe('deleteSave', () => {
    it('deletes save data by slot', () => {
      saveSystem.saveGame(createSaveInput(1))

      const result = saveSystem.deleteSave(1)

      expect(result).toBe(true)
      expect(mockStorage.cute_survivor_save_1).toBeUndefined()
    })
  })

  describe('getSaveInfo', () => {
    it('returns hasData false when slot is empty', () => {
      const info = saveSystem.getSaveInfo(3)
      expect(info.hasData).toBe(false)
      expect(info.timestamp).toBe(0)
    })

    it('returns save info when slot has data', () => {
      saveSystem.saveGame(createSaveInput(4))

      const info = saveSystem.getSaveInfo(4)

      expect(info.hasData).toBe(true)
      expect(info.version).toBe('1.1.0')
      expect(info.slotIndex).toBe(4)
      expect(info.seedPreview).toBe('test_see')
    })
  })

  describe('hasSave', () => {
    it('returns false when slot 0 is empty', () => {
      expect(saveSystem.hasSave()).toBe(false)
    })

    it('returns true when slot 0 has data', () => {
      saveSystem.saveGame(createSaveInput(0))
      expect(saveSystem.hasSave()).toBe(true)
    })
  })
})
