/**
 * Player state - pure data, no methods.
 */

import type { WeaponType } from '../Weapon'
import type { ItemType } from '../../systems/ItemSystem'

/** Serializable 3-D vector without THREE.js dependency */
export interface Vector3 {
  x: number
  y: number
  z: number
}

/** Proficiency level for a single weapon type */
export interface ProficiencyLevel {
  rank: number
  damageBonus: number
  speedBonus: number
}

/** Weapon proficiency state per weapon type */
export interface WeaponProficiencyState {
  kills: number
  damage: number
  rank: number
}

/** Equipment slot definition */
export interface EquipmentSlot {
  weapon: ItemType | null
  armor: ItemType | null
}

/** Inventory item map entry */
export interface InventoryItemEntry {
  type: ItemType
  quantity: number
}

/** Player state - all fields are plain serializable data */
export interface PlayerState {
  id: string
  position: Vector3
  rotation: number
  velocity: Vector3
  hp: number
  maxHp: number
  speed: number
  attackPower: number
  defense: number
  gold: number
  herbs: number
  ores: number
  gunpowder: number
  lightAmmo: number
  heavyAmmo: number
  inventory: {
    items: Record<ItemType, number>
    capacity: number
    equipment: EquipmentSlot
  }
  weaponStates: Partial<Record<WeaponType, WeaponProficiencyState>>
  proficientWeapons: WeaponType[]
  currentWeaponType: WeaponType
  isDefending: boolean
  isSpeedBoosted: boolean
  speedBoostTimer: number
}
