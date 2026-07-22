import { Inventory } from '../core/Inventory'
import { ItemType } from './ItemSystem'
import { WeaponType, type WeaponType as WeaponTypeValue } from '../core/Weapon'
import { createDefaultWorldConfig, type WorldConfig } from '../core/WorldConfig'
import type { IStorage } from '../core/dependencies/Storage'
import { MemoryStorage } from '../core/dependencies/Storage'
import type { EnemySnapshotDTO } from '../entities/Enemy'
import type { PlayerSnapshotDTO } from '../entities/Player'
import { EnemyType } from '../entities/EnemyConfig'

export interface PlayerSaveData extends PlayerSnapshotDTO {
  gold: number
  herbs: number
  ores: number
  ammo: number
  maxAmmo: number
  lightAmmo: number
  heavyAmmo: number
  gunpowder: number
  currentWeaponType: WeaponTypeValue
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
  slotIndex?: number
  player: {
    id: string
    hp: number
    maxHp: number
    speed: number
    position: { x: number; y: number; z: number }
    rotation: number
  }
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
    currentWeaponType: WeaponTypeValue
  }
  inventory: Inventory
  world: {
    seed: string
    currentChunkX: number
    currentChunkZ: number
    worldConfig?: WorldConfig
  }
  enemies?: EnemySaveData[]
}

const MAX_SAVE_SLOTS = 6
const LEGACY_SAVE_KEY = 'cute_survivor_save'
const SAVE_KEY_PREFIX = 'cute_survivor_save_'
const SAVE_VERSION = '1.0.0'
const DEFAULT_SLOT_INDEX = 0
const DEFAULT_MAX_AMMO = 30
const ENEMY_AI_STATES = ['patrol', 'alert', 'chase', 'attack'] as const

type UnknownRecord = Record<string, unknown>

export class SaveSystem {
  private storage: IStorage

  constructor(storage?: IStorage) {
    this.storage = storage ?? this.getDefaultStorage()
  }

  /**
   * Set the storage backend (useful for switching from memory to localStorage in browser)
   */
  setStorage(storage: IStorage): void {
    this.storage = storage
  }

  private getSaveKey(slotIndex: number): string {
    return slotIndex === 0 ? LEGACY_SAVE_KEY : `${SAVE_KEY_PREFIX}${slotIndex}`
  }

  private getSaveKeys(slotIndex: number): string[] {
    if (slotIndex !== 0) {
      return [this.getSaveKey(slotIndex)]
    }
    return [LEGACY_SAVE_KEY, `${SAVE_KEY_PREFIX}0`]
  }

  private getDefaultStorage(): IStorage {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    return new MemoryStorage()
  }

  saveGame(input: SaveInput): boolean {
    try {
      const slotIndex = input.slotIndex ?? DEFAULT_SLOT_INDEX
      const invData = input.inventory.serialize()
      const worldConfig = input.world.worldConfig ?? createDefaultWorldConfig(input.world.seed)
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        slotIndex,
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
          worldConfig
        },
        enemies: input.enemies ?? []
      }

      this.storage.setItem(this.getSaveKey(slotIndex), JSON.stringify(saveData))
      if (slotIndex === 0) {
        this.storage.removeItem(`${SAVE_KEY_PREFIX}0`)
      }
      return true
    } catch {
      console.error('Failed to save game')
      return false
    }
  }

  getSave(slotIndex: number): SaveData | null {
    try {
      const candidates = this.getSaveKeys(slotIndex)
        .map((key) => ({ key, data: this.storage.getItem(key) }))
        .filter((entry): entry is { key: string; data: string } => entry.data !== null)

      if (candidates.length === 0) {
        return null
      }

      const saves = candidates
        .map((entry) => ({
          key: entry.key,
          saveData: this.normalizeSaveData(JSON.parse(entry.data), slotIndex)
        }))
        .filter((entry): entry is { key: string; saveData: SaveData } => entry.saveData !== null)
        .sort((a, b) => b.saveData.timestamp - a.saveData.timestamp)
      if (saves.length === 0) {
        return null
      }
      const saveData = saves[0].saveData

      const canonicalKey = this.getSaveKey(slotIndex)
      this.storage.setItem(canonicalKey, JSON.stringify(saveData))

      if (saves[0].key !== canonicalKey) {
        this.storage.removeItem(saves[0].key)
      }

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

  deleteSave(slotIndex = 0): boolean {
    try {
      for (const key of this.getSaveKeys(slotIndex)) {
        this.storage.removeItem(key)
      }
      return true
    } catch (e) {
      console.error('Failed to delete save:', e)
      return false
    }
  }

  getSaveInfo(slotIndex = 0): SaveInfo {
    try {
      const saveData = this.getSave(slotIndex)
      if (!saveData) {
        return { slotIndex, timestamp: 0, version: '', hasData: false, seedPreview: '' }
      }

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

  private normalizeSaveData(raw: unknown, fallbackSlotIndex: number): SaveData | null {
    if (!isRecord(raw) || !isRecord(raw.player) || !isRecord(raw.world)) {
      return null
    }

    const seed = readString(raw.world.seed, 'DEFAULT')
    const slotIndex = readNumber(raw.slotIndex, fallbackSlotIndex)
    const worldConfig = isWorldConfig(raw.world.worldConfig)
      ? raw.world.worldConfig
      : createDefaultWorldConfig(seed)

    return {
      version: readString(raw.version, SAVE_VERSION),
      timestamp: readNumber(raw.timestamp, Date.now()),
      slotIndex,
      player: this.normalizePlayer(raw.player),
      world: {
        seed,
        currentChunkX: readNumber(raw.world.currentChunkX, 0),
        currentChunkZ: readNumber(raw.world.currentChunkZ, 0),
        worldConfig
      },
      enemies: readArray(raw.enemies)
        .map((enemy) => this.normalizeEnemy(enemy))
        .filter(isPresent)
    }
  }

  private normalizePlayer(rawPlayer: UnknownRecord): PlayerSaveData {
    const position = readVector(rawPlayer.position)
    const inventory = this.normalizeInventory(rawPlayer.inventory)
    const resources = {
      gold: readNumber(rawPlayer.gold, 0),
      herbs: readNumber(rawPlayer.herbs, 0),
      ores: readNumber(rawPlayer.ores, 0),
      gunpowder: readNumber(rawPlayer.gunpowder, 0),
      lightAmmo: readNumber(rawPlayer.lightAmmo, 0),
      heavyAmmo: readNumber(rawPlayer.heavyAmmo, 0)
    }
    syncResourcesIntoInventory(inventory.items, resources)

    return {
      id: readString(rawPlayer.id, `player_${Date.now()}`),
      hp: readNumber(rawPlayer.hp, 100),
      maxHp: readNumber(rawPlayer.maxHp, 100),
      speed: readNumber(rawPlayer.speed, 8),
      position,
      rotation: readNumber(rawPlayer.rotation, 0),
      gold: resources.gold,
      herbs: resources.herbs,
      ores: resources.ores,
      ammo: readNumber(rawPlayer.ammo, DEFAULT_MAX_AMMO),
      maxAmmo: readNumber(rawPlayer.maxAmmo, DEFAULT_MAX_AMMO),
      lightAmmo: resources.lightAmmo,
      heavyAmmo: resources.heavyAmmo,
      gunpowder: resources.gunpowder,
      currentWeaponType: readWeaponType(rawPlayer.currentWeaponType),
      inventory
    }
  }

  private normalizeInventory(rawInventory: unknown): PlayerSaveData['inventory'] {
    if (!isRecord(rawInventory)) {
      return { items: [], equipment: { weapon: null, armor: null } }
    }

    const items = readArray(rawInventory.items)
      .map((item): [string, number] | null => {
        if (!Array.isArray(item)) return null
        const [type, count] = item
        if (typeof type !== 'string') return null
        return [type, readNumber(count, 0)]
      })
      .filter(isPresent)

    const equipment = isRecord(rawInventory.equipment) ? rawInventory.equipment : {}

    return {
      items,
      equipment: {
        weapon: readNullableString(equipment.weapon),
        armor: readNullableString(equipment.armor)
      }
    }
  }

  private normalizeEnemy(rawEnemy: unknown): EnemySaveData | null {
    if (!isRecord(rawEnemy)) {
      return null
    }

    const type = readEnemyType(rawEnemy.type)
    if (!type) {
      return null
    }

    const position = readVector(rawEnemy.position)

    return {
      id: readString(rawEnemy.id, `enemy_${type}_${position.x}_${position.z}`),
      type,
      hp: readNumber(rawEnemy.hp, 1),
      maxHp: readNumber(rawEnemy.maxHp, readNumber(rawEnemy.hp, 1)),
      position,
      rotation: readNumber(rawEnemy.rotation, 0),
      speed: readNumber(rawEnemy.speed, 2),
      damage: readNumber(rawEnemy.damage, 5),
      detectRange: readNumber(rawEnemy.detectRange, 10),
      attackRange: readNumber(rawEnemy.attackRange, 1),
      state: readEnemyState(rawEnemy.state),
      animPhase: readNumber(rawEnemy.animPhase, 0),
      isAggro: readBoolean(rawEnemy.isAggro, false),
      patrolTarget: readVector(rawEnemy.patrolTarget, position),
      attackCooldown: readNumber(rawEnemy.attackCooldown, 1),
      hasRangedAttack: readBoolean(rawEnemy.hasRangedAttack, false),
      rangedAttackRange: readNumber(rawEnemy.rangedAttackRange, 0),
      rangedAttackDamage: readNumber(rawEnemy.rangedAttackDamage, 0),
      rangedAttackCooldown: readNumber(rawEnemy.rangedAttackCooldown, 0),
      rangedAttackTimer: readNumber(rawEnemy.rangedAttackTimer, 0),
      aggroRange: readNumber(rawEnemy.aggroRange, readNumber(rawEnemy.detectRange, 10) * 1.3),
      leashRange: readNumber(rawEnemy.leashRange, readNumber(rawEnemy.detectRange, 10) * 2)
    }
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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readVector(
  value: unknown,
  fallback: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): { x: number; y: number; z: number } {
  if (!isRecord(value)) {
    return { ...fallback }
  }

  return {
    x: readNumber(value.x, fallback.x),
    y: readNumber(value.y, fallback.y),
    z: readNumber(value.z, fallback.z)
  }
}

function readWeaponType(value: unknown): WeaponTypeValue {
  return Object.values(WeaponType).includes(value as WeaponTypeValue)
    ? (value as WeaponTypeValue)
    : WeaponType.Pistol
}

function readEnemyType(value: unknown): EnemyType | null {
  return Object.values(EnemyType).includes(value as EnemyType) ? (value as EnemyType) : null
}

function readEnemyState(value: unknown): string {
  return ENEMY_AI_STATES.includes(value as (typeof ENEMY_AI_STATES)[number])
    ? (value as string)
    : 'patrol'
}

function isWorldConfig(value: unknown): value is WorldConfig {
  return (
    isRecord(value) &&
    typeof value.seed === 'string' &&
    isRecord(value.terrain) &&
    isRecord(value.monster) &&
    isRecord(value.drop)
  )
}

function syncResourcesIntoInventory(
  items: [string, number][],
  resources: {
    gold: number
    herbs: number
    ores: number
    gunpowder: number
    lightAmmo: number
    heavyAmmo: number
  }
): void {
  const counts = new Map<string, number>(items)
  counts.set(ItemType.Gold, resources.gold)
  counts.set(ItemType.Herb, resources.herbs)
  counts.set(ItemType.Ore, resources.ores)
  counts.set(ItemType.Gunpowder, resources.gunpowder)
  counts.set(ItemType.LightAmmo, resources.lightAmmo)
  counts.set(ItemType.HeavyAmmo, resources.heavyAmmo)

  items.length = 0
  for (const [type, count] of counts.entries()) {
    if (count > 0) {
      items.push([type, count])
    }
  }
}
