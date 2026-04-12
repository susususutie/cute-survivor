/**
 * Item state - pure data, no methods.
 */

import type { ItemType } from '../../systems/ItemSystem'
import type { Vector3 } from './player'

/** Item quality tiers */
export type ItemQuality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Item state - all fields are plain serializable data */
export interface ItemState {
  id: string
  position: Vector3
  rotation: number
  itemType: ItemType
  stackCount: number
  quality: ItemQuality
  price: number
  value: number
  isCollected: boolean
  createdAt: number
}
