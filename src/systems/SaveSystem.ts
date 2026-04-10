import { Inventory } from '../core/Inventory'
import type { ItemType } from './ItemSystem'

export interface PlayerSaveData {
  hp: number
  maxHp: number
  speed: number
  position: { x: number; y: number; z: number }
  rotation: number
  gold: number
  herbs: number
  ores: number
  ammo: number
  lightAmmo: number
  heavyAmmo: number
  gunpowder: number
  inventory: { items: [string, number][]; equipment: { weapon: string | null; armor: string | null } }
}

export interface WorldSaveData {
  seed: string
  currentChunkX: number
  currentChunkZ: number
}

export interface SaveData {
  version: string
  timestamp: number
  player: PlayerSaveData
  world: WorldSaveData
}

export interface SaveInfo {
  timestamp: number
  version: string
  hasData: boolean
}

const SAVE_KEY = 'cute_survivor_save'
const SAVE_VERSION = '1.0.0'

export class SaveSystem {
  private localStorage: Storage

  constructor(localStorage: Storage = window.localStorage) {
    this.localStorage = localStorage
  }

  saveGame(
    playerState: { hp: number; maxHp: number; speed: number; position: { x: number; y: number; z: number }; rotation: number },
    gold: number,
    herbs: number,
    ores: number,
    ammo: number,
    lightAmmo: number,
    heavyAmmo: number,
    gunpowder: number,
    inventory: Inventory,
    seed: string,
    currentChunkX: number,
    currentChunkZ: number
  ): boolean {
    try {
      const invData = inventory.serialize()
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        player: {
          hp: playerState.hp,
          maxHp: playerState.maxHp,
          speed: playerState.speed,
          position: playerState.position,
          rotation: playerState.rotation,
          gold,
          herbs,
          ores,
          ammo,
          lightAmmo,
          heavyAmmo,
          gunpowder,
          inventory: {
            items: invData.items,
            equipment: {
              weapon: invData.equipment.weapon,
              armor: invData.equipment.armor
            }
          }
        },
        world: {
          seed,
          currentChunkX,
          currentChunkZ
        }
      }

      this.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      return true
    } catch {
      console.error('Failed to save game')
      return false
    }
  }

  loadGame(): SaveData | null {
    try {
      const data = this.localStorage.getItem(SAVE_KEY)
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

  deleteSave(): boolean {
    try {
      this.localStorage.removeItem(SAVE_KEY)
      return true
    } catch (e) {
      console.error('Failed to delete save:', e)
      return false
    }
  }

  getSaveInfo(): SaveInfo {
    try {
      const data = this.localStorage.getItem(SAVE_KEY)
      if (!data) {
        return { timestamp: 0, version: '', hasData: false }
      }

      const saveData: SaveData = JSON.parse(data)
      return {
        timestamp: saveData.timestamp,
        version: saveData.version,
        hasData: true
      }
    } catch {
      return { timestamp: 0, version: '', hasData: false }
    }
  }

  hasSave(): boolean {
    return this.getSaveInfo().hasData
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
