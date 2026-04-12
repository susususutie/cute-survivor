/**
 * Pure enemy AI functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

import type { Vector3, EnemyLogicState, EnemyAIState } from './types'
import type { IRandomSource } from './dependencies'
import {
  calculateDistance,
  calculateDirection,
  updatePosition,
  scale
} from './physics'

// ---------------------------------------------------------------------------
// AI state selection
// ---------------------------------------------------------------------------

/**
 * Decides the AI state for an enemy based on its position relative to the
 * player and the configured range thresholds.
 *
 * @param aiState      Current state (used to implement hysteresis).
 * @param distToPlayer Pre-computed distance to the player (optimisation).
 * @param detectRange  Distance at which the enemy enters chase state.
 * @param attackRange  Distance at which the enemy can attack.
 */
export function selectEnemyState(
  aiState: EnemyAIState,
  distToPlayer: number,
  detectRange: number,
  attackRange: number
): EnemyAIState {
  if (distToPlayer <= attackRange) return 'attack'
  if (distToPlayer <= detectRange) return 'chase'
  // Hysteresis: stay in chase until well outside detect range
  if (aiState === 'chase' && distToPlayer <= detectRange * 1.5) return 'chase'
  return 'patrol'
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

/**
 * Calculates the new XZ position of an enemy moving toward `targetPos`.
 * Keeps the Y component from the enemy's current position (terrain-based Y is
 * handled by the renderer layer).
 */
export function calculateEnemyMovement(
  enemy: EnemyLogicState,
  targetPos: Vector3,
  delta: number
): Vector3 {
  const flatTarget: Vector3 = { x: targetPos.x, y: enemy.position.y, z: targetPos.z }
  const dir = calculateDirection(enemy.position, flatTarget)
  return updatePosition(enemy.position, scale(dir, enemy.speed), delta)
}

// ---------------------------------------------------------------------------
// Attack checks
// ---------------------------------------------------------------------------

/**
 * Returns true when the enemy should perform a melee attack.
 */
export function shouldEnemyAttack(
  enemy: EnemyLogicState,
  playerPos: Vector3,
  currentTime: number
): boolean {
  const dist = calculateDistance(enemy.position, playerPos)
  const cooldownElapsed = currentTime - enemy.lastAttackTime >= enemy.attackCooldown
  return dist <= enemy.attackRange && cooldownElapsed
}

// ---------------------------------------------------------------------------
// Patrol
// ---------------------------------------------------------------------------

/**
 * Returns a new patrol target when the enemy has reached the current one.
 * Uses the injected random source so the result is reproducible.
 */
export function nextPatrolTarget(
  currentPos: Vector3,
  currentTarget: Vector3,
  random: IRandomSource
): Vector3 {
  const dist = calculateDistance(currentPos, currentTarget)
  if (dist > 1) return currentTarget          // hasn't reached target yet
  // Pick a new target within a 10-unit radius
  const angle = random.range(0, Math.PI * 2)
  const radius = random.range(3, 10)
  return {
    x: currentPos.x + Math.cos(angle) * radius,
    y: currentPos.y,
    z: currentPos.z + Math.sin(angle) * radius
  }
}

// ---------------------------------------------------------------------------
// Full AI update
// ---------------------------------------------------------------------------

/**
 * Runs one tick of enemy AI.
 * Returns a new immutable EnemyLogicState – never mutates the input.
 *
 * @param enemy      Current enemy state.
 * @param playerPos  Player position this frame.
 * @param delta      Frame delta in seconds.
 * @param currentTime  Current time in seconds (for attack cooldowns).
 * @param random     Injected random source.
 */
export function updateEnemyAI(
  enemy: EnemyLogicState,
  playerPos: Vector3,
  delta: number,
  _currentTime: number,
  random: IRandomSource
): EnemyLogicState {
  const dist = calculateDistance(enemy.position, playerPos)
  const newAIState = selectEnemyState(enemy.aiState, dist, enemy.detectRange, enemy.attackRange)

  let newPosition = enemy.position
  let newPatrolTarget = enemy.patrolTarget
  const newRangedTimer = enemy.rangedAttackTimer - delta

  switch (newAIState) {
    case 'patrol': {
      newPatrolTarget = nextPatrolTarget(enemy.position, enemy.patrolTarget, random)
      newPosition = calculateEnemyMovement(
        { ...enemy, speed: enemy.speed * 0.5 },
        newPatrolTarget,
        delta
      )
      break
    }
    case 'chase': {
      newPosition = calculateEnemyMovement(enemy, playerPos, delta)
      break
    }
    case 'attack': {
      // Melee: stop and face the player (movement handled by collision push)
      break
    }
  }

  return {
    ...enemy,
    position: newPosition,
    aiState: newAIState,
    patrolTarget: newPatrolTarget,
    rangedAttackTimer: newRangedTimer
  }
}

// ---------------------------------------------------------------------------
// Spawn
// ---------------------------------------------------------------------------

/**
 * Creates initial state for a freshly spawned enemy.
 *
 * @param enemyType   Type identifier.
 * @param position    Spawn position.
 * @param id          Unique identifier (caller must guarantee uniqueness).
 * @param overrides   Stat overrides applied on top of the defaults.
 * @param random      Injected random source (used for patrol target).
 */
export interface EnemyOverrides {
  hp?: number
  speed?: number
  damage?: number
  detectRange?: number
  attackRange?: number
  attackCooldown?: number
  hasRangedAttack?: boolean
  rangedAttackRange?: number
  rangedAttackDamage?: number
  rangedAttackCooldown?: number
}

/** Default stats per enemy type. */
const ENEMY_DEFAULTS: Record<EnemyType, Required<EnemyOverrides>> = {
  'goblin':   { hp: 40,  speed: 3.5, damage: 8,  detectRange: 10, attackRange: 1.2, attackCooldown: 1.0, hasRangedAttack: false, rangedAttackRange: 0,  rangedAttackDamage: 0,  rangedAttackCooldown: 0   },
  'orc':      { hp: 80,  speed: 2.5, damage: 15, detectRange: 8,  attackRange: 1.5, attackCooldown: 1.5, hasRangedAttack: false, rangedAttackRange: 0,  rangedAttackDamage: 0,  rangedAttackCooldown: 0   },
  'slime':    { hp: 30,  speed: 2.0, damage: 6,  detectRange: 6,  attackRange: 1.0, attackCooldown: 0.8, hasRangedAttack: false, rangedAttackRange: 0,  rangedAttackDamage: 0,  rangedAttackCooldown: 0   },
  'bat':      { hp: 25,  speed: 5.0, damage: 5,  detectRange: 12, attackRange: 1.0, attackCooldown: 0.6, hasRangedAttack: false, rangedAttackRange: 0,  rangedAttackDamage: 0,  rangedAttackCooldown: 0   },
  'skeleton': { hp: 50,  speed: 3.0, damage: 10, detectRange: 12, attackRange: 1.2, attackCooldown: 1.2, hasRangedAttack: true,  rangedAttackRange: 10, rangedAttackDamage: 12, rangedAttackCooldown: 2.5 },
  'mushroom': { hp: 60,  speed: 1.5, damage: 12, detectRange: 7,  attackRange: 1.5, attackCooldown: 2.0, hasRangedAttack: true,  rangedAttackRange: 8,  rangedAttackDamage: 10, rangedAttackCooldown: 3.0 }
}

export function spawnEnemy(
  enemyType: EnemyType,
  position: Vector3,
  id: string,
  overrides: EnemyOverrides = {},
  random: IRandomSource
): EnemyLogicState {
  const defaults = ENEMY_DEFAULTS[enemyType]

  const hp              = overrides.hp              ?? defaults.hp
  const speed           = overrides.speed           ?? defaults.speed
  const damage          = overrides.damage          ?? defaults.damage
  const detectRange     = overrides.detectRange     ?? defaults.detectRange
  const attackRange     = overrides.attackRange     ?? defaults.attackRange
  const attackCooldown  = overrides.attackCooldown  ?? defaults.attackCooldown

  const patrolAngle  = random.range(0, Math.PI * 2)
  const patrolRadius = random.range(3, 10)

  return {
    id,
    type: enemyType,
    position: { ...position },
    hp,
    maxHp: hp,
    speed,
    damage,
    detectRange,
    attackRange,
    aiState: 'patrol',
    lastAttackTime: 0,
    attackCooldown,
    patrolTarget: {
      x: position.x + Math.cos(patrolAngle) * patrolRadius,
      y: position.y,
      z: position.z + Math.sin(patrolAngle) * patrolRadius
    },
    hasRangedAttack:      overrides.hasRangedAttack      ?? defaults.hasRangedAttack,
    rangedAttackRange:    overrides.rangedAttackRange    ?? defaults.rangedAttackRange,
    rangedAttackDamage:   overrides.rangedAttackDamage   ?? defaults.rangedAttackDamage,
    rangedAttackCooldown: overrides.rangedAttackCooldown ?? defaults.rangedAttackCooldown,
    rangedAttackTimer: 0
  }
}
