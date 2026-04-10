import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaveSystem, SaveData } from './SaveSystem'
import { Inventory } from '../core/Inventory'

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
    saveSystem = new SaveSystem(mockLocalStorage as unknown as Storage)
  })

  describe('saveGame', () => {
    it('should save game data to localStorage', () => {
      const inventory = new Inventory()
      inventory.addItem('ore' as any, 10)

      const playerState = {
        hp: 100,
        maxHp: 100,
        speed: 8,
        position: { x: 10, y: 0, z: 20 },
        rotation: 1.5
      }

      const result = saveSystem.saveGame(
        playerState,
        500, // gold
        20, // herbs
        15, // ores
        30, // ammo
        0, // lightAmmo
        0, // heavyAmmo
        0, // gunpowder
        inventory,
        'test_seed',
        0,
        0
      )

      expect(result).toBe(true)
      expect(mockStorage.cute_survivor_save).toBeDefined()
    })

    it('should include version and timestamp', () => {
      const inventory = new Inventory()
      const playerState = {
        hp: 100,
        maxHp: 100,
        speed: 8,
        position: { x: 0, y: 0, z: 0 },
        rotation: 0
      }

      saveSystem.saveGame(
        playerState,
        0, 0, 0, 0, 0, 0, 0,
        inventory,
        'seed',
        0, 0
      )

      const savedData: SaveData = JSON.parse(mockStorage.cute_survivor_save)
      expect(savedData.version).toBe('1.0.0')
      expect(savedData.timestamp).toBeDefined()
      expect(savedData.timestamp).toBeGreaterThan(0)
    })
  })

  describe('loadGame', () => {
    it('should return null when no save exists', () => {
      const result = saveSystem.loadGame()
      expect(result).toBeNull()
    })

    it('should load saved game data', () => {
      const savedData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        player: {
          hp: 80,
          maxHp: 100,
          speed: 8,
          position: { x: 50, y: 0, z: 30 },
          rotation: 2.0,
          gold: 1000,
          herbs: 25,
          ores: 15,
          ammo: 20,
          lightAmmo: 10,
          heavyAmmo: 5,
          gunpowder: 3,
          inventory: {
            items: [['ore', 10]],
            equipment: { weapon: null, armor: null }
          }
        },
        world: {
          seed: 'test_seed',
          currentChunkX: 1,
          currentChunkZ: -1
        }
      }

      mockStorage.cute_survivor_save = JSON.stringify(savedData)

      const result = saveSystem.loadGame()

      expect(result).not.toBeNull()
      expect(result!.player.hp).toBe(80)
      expect(result!.player.gold).toBe(1000)
      expect(result!.world.seed).toBe('test_seed')
    })
  })

  describe('deleteSave', () => {
    it('should delete save data', () => {
      const savedData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        player: {
          hp: 100,
          maxHp: 100,
          speed: 8,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          gold: 0,
          herbs: 0,
          ores: 0,
          ammo: 0,
          lightAmmo: 0,
          heavyAmmo: 0,
          gunpowder: 0,
          inventory: { items: [], equipment: { weapon: null, armor: null } }
        },
        world: { seed: 'seed', currentChunkX: 0, currentChunkZ: 0 }
      }

      mockStorage.cute_survivor_save = JSON.stringify(savedData)

      const result = saveSystem.deleteSave()

      expect(result).toBe(true)
      expect(mockStorage.cute_survivor_save).toBeUndefined()
    })
  })

  describe('getSaveInfo', () => {
    it('should return hasData false when no save exists', () => {
      const info = saveSystem.getSaveInfo()
      expect(info.hasData).toBe(false)
      expect(info.timestamp).toBe(0)
    })

    it('should return save info when save exists', () => {
      const savedData: SaveData = {
        version: '1.0.0',
        timestamp: 1234567890,
        player: {
          hp: 100,
          maxHp: 100,
          speed: 8,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          gold: 0,
          herbs: 0,
          ores: 0,
          ammo: 0,
          lightAmmo: 0,
          heavyAmmo: 0,
          gunpowder: 0,
          inventory: { items: [], equipment: { weapon: null, armor: null } }
        },
        world: { seed: 'seed', currentChunkX: 0, currentChunkZ: 0 }
      }

      mockStorage.cute_survivor_save = JSON.stringify(savedData)

      const info = saveSystem.getSaveInfo()

      expect(info.hasData).toBe(true)
      expect(info.timestamp).toBe(1234567890)
      expect(info.version).toBe('1.0.0')
    })
  })

  describe('hasSave', () => {
    it('should return false when no save exists', () => {
      expect(saveSystem.hasSave()).toBe(false)
    })

    it('should return true when save exists', () => {
      const savedData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        player: {
          hp: 100,
          maxHp: 100,
          speed: 8,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
          gold: 0,
          herbs: 0,
          ores: 0,
          ammo: 0,
          lightAmmo: 0,
          heavyAmmo: 0,
          gunpowder: 0,
          inventory: { items: [], equipment: { weapon: null, armor: null } }
        },
        world: { seed: 'seed', currentChunkX: 0, currentChunkZ: 0 }
      }

      mockStorage.cute_survivor_save = JSON.stringify(savedData)

      expect(saveSystem.hasSave()).toBe(true)
    })
  })
})
