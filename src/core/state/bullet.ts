/**
 * Bullet state - pure data, no methods.
 */

import type { Vector3 } from './player'

/** Bullet type distinguishing player vs enemy bullets */
export type BulletType = 'player' | 'enemy'

/** Bullet state - all fields are plain serializable data */
export interface BulletState {
  id: string
  ownerId: string
  position: Vector3
  direction: Vector3
  speed: number
  damage: number
  lifetime: number
  maxRange: number
  traveledDistance: number
  createdAt: number
  bulletType: BulletType
  isActive: boolean
}
