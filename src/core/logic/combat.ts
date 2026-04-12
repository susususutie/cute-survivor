/**
 * Pure combat calculation functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

import type { BulletState, EnemyLogicState, PlayerLogicState } from './types'
import type { WeaponType } from '../Weapon'
import { WeaponRegistry } from '../Weapon'

// ---------------------------------------------------------------------------
// Damage calculations
// ---------------------------------------------------------------------------

/**
 * Calculates final damage dealt after applying defense and a critical
 * multiplier.  Defense reduces damage linearly (clamped at 0); the
 * critical multiplier is applied on top.
 *
 * @param attackPower   Base damage of the attack.
 * @param defense       Flat damage reduction (0 = no armour).
 * @param criticalMultiplier  1.0 means no crit; 2.0 means double damage.
 */
export function calculateDamage(
  attackPower: number,
  defense: number,
  criticalMultiplier: number
): number {
  const reduced = Math.max(0, attackPower - defense)
  return Math.round(reduced * criticalMultiplier)
}

/**
 * Determines whether an attack hits the target.
 * Uses a simple probability model: higher attackSpeed and lower targetDefense
 * both increase hit chance.  Result is deterministic given the same `roll`
 * (callers supply `roll` from IRandomSource.next() to stay pure).
 *
 * @param attackSpeed    Normalised attacker speed (0–1 recommended).
 * @param targetDefense  Normalised target evasion / defense (0–1 recommended).
 * @param roll           A pre-generated random value in [0, 1).
 */
export function isHit(attackSpeed: number, targetDefense: number, roll: number): boolean {
  const hitChance = Math.min(1, Math.max(0, 0.5 + attackSpeed * 0.5 - targetDefense * 0.3))
  return roll < hitChance
}

// ---------------------------------------------------------------------------
// Bullet-enemy hit resolution
// ---------------------------------------------------------------------------

export interface BulletHitResult {
  newEnemyHp: number
  damage: number
  isDead: boolean
}

/**
 * Resolves a bullet hitting an enemy.  Returns the resulting enemy HP, the
 * damage dealt, and whether the enemy is dead.  Does NOT mutate any state.
 */
export function processBulletHit(
  bullet: BulletState,
  enemy: EnemyLogicState
): BulletHitResult {
  const damage = bullet.damage
  const newHp = Math.max(0, enemy.hp - damage)
  return {
    newEnemyHp: newHp,
    damage,
    isDead: newHp <= 0
  }
}

// ---------------------------------------------------------------------------
// Enemy-player hit resolution
// ---------------------------------------------------------------------------

export interface PlayerHitResult {
  newPlayerHp: number
  damage: number
  isDead: boolean
}

/**
 * Resolves an enemy melee attack on the player.
 */
export function processPlayerHit(
  enemy: EnemyLogicState,
  player: PlayerLogicState
): PlayerHitResult {
  const damage = enemy.damage
  const newHp = Math.max(0, player.hp - damage)
  return {
    newPlayerHp: newHp,
    damage,
    isDead: newHp <= 0
  }
}

// ---------------------------------------------------------------------------
// Attack timing
// ---------------------------------------------------------------------------

/**
 * Returns true when the entity is allowed to attack again.
 *
 * @param lastAttackTime  Timestamp (seconds) of the last attack.
 * @param attackCooldown  Minimum gap (seconds) between attacks.
 * @param currentTime     Current time (seconds).
 */
export function canAttack(
  lastAttackTime: number,
  attackCooldown: number,
  currentTime: number
): boolean {
  return currentTime - lastAttackTime >= attackCooldown
}

// ---------------------------------------------------------------------------
// Fire rate
// ---------------------------------------------------------------------------

/**
 * Returns the base fire-rate (seconds between shots) for a weapon type.
 * The value is taken directly from the WeaponRegistry so it stays in sync
 * with the rest of the game without duplicating numbers.
 */
export function calculateFireRate(weaponType: WeaponType): number {
  const def = WeaponRegistry.get(weaponType)
  if (!def) return 0.3          // safe fallback
  return def.stats.attackSpeed
}
