/**
 * Pure spatial collision-detection functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 *
 * Collision volumes are approximated by spheres for simplicity and speed.
 */

import type {
  BulletState,
  EnemyLogicState,
  PlayerLogicState,
  ItemState,
  CollisionResult,
  BulletEnemyHit,
  EnemyPlayerHit,
  PlayerItemPickup
} from './types'
import { calculateDistance } from './physics'

// ---------------------------------------------------------------------------
// Per-pair checks
// ---------------------------------------------------------------------------

/** Bullet radius (metres). */
const BULLET_RADIUS = 0.12

/** Typical enemy collider radius. */
const ENEMY_RADIUS = 0.88   // 1 - bullet radius ≈ < 1 from centre

/** Player collider radius. */
const PLAYER_RADIUS = 0.68  // 0.8 - bullet radius

/** Item pick-up radius. */
const ITEM_RADIUS = 1.5

/**
 * Returns true when a bullet overlaps an enemy's collider.
 */
export function checkBulletEnemyCollision(
  bullet: BulletState,
  enemy: EnemyLogicState
): boolean {
  const dist = calculateDistance(bullet.position, enemy.position)
  return dist < BULLET_RADIUS + ENEMY_RADIUS
}

/**
 * Returns true when an enemy overlaps the player's collider.
 * Used for melee contact detection.
 */
export function checkEnemyPlayerCollision(
  enemy: EnemyLogicState,
  player: PlayerLogicState
): boolean {
  const dist = calculateDistance(enemy.position, player.position)
  return dist < 1.2   // matches Game.ts value
}

/**
 * Returns true when a bullet from an enemy overlaps the player's collider.
 */
export function checkEnemyBulletPlayerCollision(
  bullet: BulletState,
  player: PlayerLogicState
): boolean {
  const dist = calculateDistance(bullet.position, player.position)
  return dist < BULLET_RADIUS + PLAYER_RADIUS
}

/**
 * Returns true when the player is within pick-up range of an item.
 */
export function checkPlayerItemCollision(
  player: PlayerLogicState,
  item: ItemState
): boolean {
  const dist = calculateDistance(player.position, item.position)
  return dist < ITEM_RADIUS
}

// ---------------------------------------------------------------------------
// Batch collision scan
// ---------------------------------------------------------------------------

/**
 * Runs all collision checks for a single frame and returns a
 * `CollisionResult` describing every overlap detected.
 *
 * The caller is responsible for applying the resulting game-state changes
 * (e.g. reducing HP, removing bullets, collecting items).
 *
 * Each bullet is only matched against the *first* enemy it overlaps so that
 * a bullet cannot damage multiple enemies simultaneously (matching Game.ts
 * behaviour with the `break` in `checkBulletEnemyCollisions`).
 */
export function getCollisions(
  bullets: BulletState[],
  enemyBullets: BulletState[],
  enemies: EnemyLogicState[],
  player: PlayerLogicState,
  items: ItemState[]
): CollisionResult {
  const bulletEnemyHits: BulletEnemyHit[] = []
  const enemyPlayerHits: EnemyPlayerHit[] = []
  const playerItemPickups: PlayerItemPickup[] = []

  // Player bullets vs enemies
  const hitBulletIds = new Set<string>()
  const hitEnemyIds = new Set<string>()

  for (const bullet of bullets) {
    if (hitBulletIds.has(bullet.id)) continue
    for (const enemy of enemies) {
      if (checkBulletEnemyCollision(bullet, enemy)) {
        bulletEnemyHits.push({ bulletId: bullet.id, enemyId: enemy.id })
        hitBulletIds.add(bullet.id)
        hitEnemyIds.add(enemy.id)
        break   // one bullet, one enemy
      }
    }
  }

  // Enemy melee vs player
  for (const enemy of enemies) {
    if (checkEnemyPlayerCollision(enemy, player)) {
      enemyPlayerHits.push({ enemyId: enemy.id })
    }
  }

  // Enemy ranged bullets vs player
  for (const bullet of enemyBullets) {
    if (checkEnemyBulletPlayerCollision(bullet, player)) {
      // Represent as a special enemy hit with a sentinel ID so the caller
      // knows it came from a bullet rather than melee.
      enemyPlayerHits.push({ enemyId: `bullet:${bullet.id}` })
      hitBulletIds.add(bullet.id)
    }
  }

  // Player vs items
  for (const item of items) {
    if (checkPlayerItemCollision(player, item)) {
      playerItemPickups.push({ itemId: item.id })
    }
  }

  return { bulletEnemyHits, enemyPlayerHits, playerItemPickups }
}
