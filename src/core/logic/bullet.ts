/**
 * Pure bullet lifecycle functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

import type { Vector3, BulletState } from './types'
import type { WeaponType } from '../Weapon'
import { WeaponRegistry } from '../Weapon'
import { updatePosition, scale } from './physics'

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/**
 * Creates the initial state for a new bullet.
 *
 * @param position    Spawn position (e.g. weapon muzzle).
 * @param direction   Normalised direction vector.
 * @param ownerId     ID of the entity that fired the bullet.
 * @param id          Unique identifier for this bullet.
 * @param weaponType  Weapon type (used to derive default speed / lifetime).
 * @param damage      Damage value (may override weapon default after construction).
 * @param currentTime Current time in seconds.
 */
export function createBullet(
  position: Vector3,
  direction: Vector3,
  ownerId: string,
  id: string,
  weaponType: WeaponType,
  damage: number,
  currentTime: number
): BulletState {
  const def = WeaponRegistry.get(weaponType)
  const maxRange = def?.stats.range ?? 15
  const speed = 20          // all projectiles travel at the same speed

  return {
    id,
    ownerId,
    position: { ...position },
    direction: { ...direction },
    speed,
    damage,
    maxRange,
    distanceTraveled: 0,
    createdAt: currentTime,
    lifetime: 3              // seconds before forced expiry
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Advances a bullet by `delta` seconds and returns the new state.
 * Never mutates the input object.
 */
export function updateBullet(bullet: BulletState, delta: number): BulletState {
  const moveDistance = bullet.speed * delta
  const newPosition = updatePosition(bullet.position, scale(bullet.direction, bullet.speed), delta)
  return {
    ...bullet,
    position: newPosition,
    distanceTraveled: bullet.distanceTraveled + moveDistance
  }
}

// ---------------------------------------------------------------------------
// Expiry checks
// ---------------------------------------------------------------------------

/**
 * Returns true when the bullet has exceeded its configured lifetime.
 */
export function isBulletExpired(bullet: BulletState, currentTime: number): boolean {
  return currentTime - bullet.createdAt >= bullet.lifetime
}

/**
 * Returns true when the bullet has traveled farther than its max range.
 */
export function hasBulletExceededRange(bullet: BulletState): boolean {
  return bullet.distanceTraveled >= bullet.maxRange
}

/**
 * Convenience: returns true if the bullet should be removed for any reason.
 */
export function isBulletDone(bullet: BulletState, currentTime: number): boolean {
  return isBulletExpired(bullet, currentTime) || hasBulletExceededRange(bullet)
}
