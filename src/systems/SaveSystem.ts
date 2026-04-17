import { Inventory } from '../core/Inventory'
import type { ItemType } from './ItemSystem'
import type { WeaponType } from '../core/Weapon'
import type { WorldConfig } from '../core/WorldConfig'
import type { IStorage } from '../core/dependencies/Storage'
import { BrowserStorage, MemoryStorage } from '../core/dependencies/Storage'
import type { EnemySnapshotDTO } from '../entities/Enemy'
import type { PlayerSnapshotDTO } from '../entities/Player'

export interface PlayerSaveData extends PlayerSnapshotDTO {
  gold: number
  herbs: number
  ores: number
  ammo: number
  maxAmmo?: number
  lightAmmo: number
  heavyAmmo: number
  gunpowder: number
  currentWeaponType?: WeaponType
  inventory: {
    items: [string, number][]
    equipment: { weapon: string | null; armor: string | null }
  }
}

export interface WorldSaveData {
  seed: string
  currentChunkX: number
  currentChunkZ: number
  worldConfig: WorldConfig
}

export type EnemySaveData = EnemySnapshotDTO

export interface SaveData {
  version: string
  timestamp: number
  slotIndex: number
  player: PlayerSaveData
  world: WorldSaveData
  enemies: EnemySaveData[]
}

export interface SaveInfo {
  slotIndex: number
  timestamp: number
  version: string
  hasData: boolean
  seedPreview: string
}

export interface SaveInput {
  slotIndex: number
  player: PlayerSnapshotDTO
  resources: {
    gold: number
    herbs: number
    ores: number
    gunpowder: number
    lightAmmo: number
    heavyAmmo: number
  }
  combat: {
    ammo: number
    maxAmmo: number
    currentWeaponType: WeaponType
  }
  inventory: Inventory
  world: {
    seed: string
    currentChunkX: number
    currentChunkZ: number
    worldConfig: WorldConfig
  }
  enemies: EnemySaveData[]
}

const MAX_SAVE_SLOTS = 6
const SAVE_KEY_PREFIX = 'cute_survivor_save_'
const SAVE_VERSION = '1.1.0'

export class SaveSystem {
  private storage: IStorage

  constructor(storage?: IStorage) {
    if (storage) {
      this.storage = storage
      return
    }

    // Prefer browser localStorage when available, fallback to in-memory for Node/tests.
    this.storage = typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? new BrowserStorage(globalThis.localStorage)
      : new MemoryStorage()
  }

  /**
   * Set the storage backend (useful for switching from memory to localStorage in browser)
   */
  setStorage(storage: IStorage): void {
    this.storage = storage
  }

  private getSaveKey(slotIndex: number): string {
    return `${SAVE_KEY_PREFIX}${slotIndex}`
  }

  saveGame(input: SaveInput): boolean {
    try {
      const invData = input.inventory.serialize()
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        slotIndex: input.slotIndex,
        player: {
          id: input.player.id,
          hp: input.player.hp,
          maxHp: input.player.maxHp,
          speed: input.player.speed,
          position: input.player.position,
          rotation: input.player.rotation,
          gold: input.resources.gold,
          herbs: input.resources.herbs,
          ores: input.resources.ores,
          ammo: input.combat.ammo,
          maxAmmo: input.combat.maxAmmo,
          lightAmmo: input.resources.lightAmmo,
          heavyAmmo: input.resources.heavyAmmo,
          gunpowder: input.resources.gunpowder,
          currentWeaponType: input.combat.currentWeaponType,
          inventory: {
            items: invData.items,
            equipment: {
              weapon: invData.equipment.weapon,
              armor: invData.equipment.armor
            }
          }
        },
        world: {
          seed: input.world.seed,
          currentChunkX: input.world.currentChunkX,
          currentChunkZ: input.world.currentChunkZ,
          worldConfig: input.world.worldConfig
        },
        enemies: input.enemies
      }

      this.storage.setItem(this.getSaveKey(input.slotIndex), JSON.stringify(saveData))
      return true
    } catch {
      console.error('Failed to save game')
      return false
    }
  }

  getSave(slotIndex: number): SaveData | null {
    try {
      const data = this.storage.getItem(this.getSaveKey(slotIndex))
      if (!data) {
        return null
      }

      const saveData: SaveData = JSON.parse(data)

      // Version migration if needed
      if (saveData.version !== SAVE_VERSION) {
        // Handle migration logic here if needed
      }

      return saveData
    } catch {
      console.error('Failed to load game')
      return null
    }
  }

  // Legacy method - loads from slot 0 for backward compatibility
  loadGame(): SaveData | null {
    return this.getSave(0)
  }

  deleteSave(slotIndex: number): boolean {
    try {
      this.storage.removeItem(this.getSaveKey(slotIndex))
      return true
    } catch (e) {
      console.error('Failed to delete save:', e)
      return false
    }
  }

  getSaveInfo(slotIndex: number): SaveInfo {
    try {
      const data = this.storage.getItem(this.getSaveKey(slotIndex))
      if (!data) {
        return { slotIndex, timestamp: 0, version: '', hasData: false, seedPreview: '' }
      }

      const saveData: SaveData = JSON.parse(data)
      return {
        slotIndex,
        timestamp: saveData.timestamp,
        version: saveData.version,
        hasData: true,
        seedPreview: saveData.world.seed.substring(0, 8)
      }
    } catch {
      return { slotIndex, timestamp: 0, version: '', hasData: false, seedPreview: '' }
    }
  }

  // Legacy method - checks slot 0
  hasSave(): boolean {
    return this.getSaveInfo(0).hasData
  }

  getAllSaves(): SaveInfo[] {
    const saves: SaveInfo[] = []
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      saves.push(this.getSaveInfo(i))
    }
    return saves
  }

  getMaxSlots(): number {
    return MAX_SAVE_SLOTS
  }
}

export function createInventoryFromSave(data: SaveData): Inventory {
  const inv = new Inventory()
  data.player.inventory.items.forEach(([key, value]) => {
    const itemType = key as ItemType
    inv.addItem(itemType, value)
  })
  if (data.player.inventory.equipment.weapon) {
    inv.setEquipment('weapon', data.player.inventory.equipment.weapon as ItemType)
  }
  if (data.player.inventory.equipment.armor) {
    inv.setEquipment('armor', data.player.inventory.equipment.armor as ItemType)
  }
  return inv
}
