/**
 * Logic layer types - extends core/state/ types for pure function logic.
 *
 * Design principle:
 * - Base types (Vector3, etc.) are defined in core/state/
 * - Logic-specific types (EnemyLogicState, PlayerLogicState) are defined here
 * - No THREE.js, no DOM, no side effects
 */

import type { WeaponType } from '../Weapon'

// Re-export base types from core/state/ for convenience
export type { Vector3 } from '../state/player'

// ---------------------------------------------------------------------------
// Logic-specific state types (simplified for pure function processing)
// ---------------------------------------------------------------------------

/** Simplified item state for logic processing */
export interface LogicItemState {
  id: string
  type: ItemType
  position: { x: number; y: number; z: number }
  value: number
  quality: number
}

export const ENEMY_TYPE = {
  Goblin: 'goblin',
  Orc: 'orc',
  Slime: 'slime',
  Bat: 'bat',
  Skeleton: 'skeleton',
  Mushroom: 'mushroom'
} as const

export type EnemyType = typeof ENEMY_TYPE[keyof typeof ENEMY_TYPE]

export const ITEM_TYPE = {
  Gold: 'gold',
  Herb: 'herb',
  Ore: 'ore',
  Ammo: 'ammo',
  Gunpowder: 'gunpowder',
  LightAmmo: 'light_ammo',
  HeavyAmmo: 'heavy_ammo',
  HealthPotion: 'health_potion',
  SpeedPotion: 'speed_potion'
} as const

export type ItemType = typeof ITEM_TYPE[keyof typeof ITEM_TYPE]

// ---------------------------------------------------------------------------
// Bullet
// ---------------------------------------------------------------------------

/** Simplified bullet state for logic processing */
export interface BulletState {
  id: string
  ownerId: string
  position: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
  speed: number
  damage: number
  maxRange: number
  distanceTraveled: number
  createdAt: number
  lifetime: number
}

/** AI states for enemy logic */
export type EnemyAIState = 'patrol' | 'chase' | 'attack'

/** Simplified enemy state for logic processing */
export interface EnemyLogicState {
  id: string
  type: EnemyType
  position: { x: number; y: number; z: number }
  hp: number
  maxHp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  aiState: EnemyAIState
  lastAttackTime: number
  attackCooldown: number
  patrolTarget: { x: number; y: number; z: number }
  hasRangedAttack: boolean
  rangedAttackRange: number
  rangedAttackDamage: number
  rangedAttackCooldown: number
  rangedAttackTimer: number
}

/** Simplified player state for logic processing */
export interface PlayerLogicState {
  id: string
  position: { x: number; y: number; z: number }
  hp: number
  maxHp: number
  speed: number
  rotation: number
}

// ---------------------------------------------------------------------------
// Chunk / World
// ---------------------------------------------------------------------------

export interface ChunkData {
  x: number
  z: number
  rocks: { x: number; z: number; radius: number; height: number }[]
}

// ---------------------------------------------------------------------------
// Collision results
// ---------------------------------------------------------------------------

export interface BulletEnemyHit {
  bulletId: string
  enemyId: string
}

export interface EnemyPlayerHit {
  enemyId: string
}

export interface PlayerItemPickup {
  itemId: string
}

export interface CollisionResult {
  bulletEnemyHits: BulletEnemyHit[]
  enemyPlayerHits: EnemyPlayerHit[]
  playerItemPickups: PlayerItemPickup[]
}

// ---------------------------------------------------------------------------
// Game state snapshot (pure, no render objects)
// ---------------------------------------------------------------------------

export interface GameResourcesState {
  gold: number
  herbs: number
  ores: number
  gunpowder: number
  lightAmmo: number
  heavyAmmo: number
}

export interface GameCombatState {
  ammo: number
  maxAmmo: number
  currentWeaponType: WeaponType
}

export interface GameWorldState {
  seed: string
  currentChunkX: number
  currentChunkZ: number
}

export interface GameLogicState {
  player: PlayerLogicState
  resources: GameResourcesState
  combat: GameCombatState
  world: GameWorldState
  bullets: BulletState[]
  enemyBullets: BulletState[]
  enemies: EnemyLogicState[]
  items: LogicItemState[]
  enemySpawnTimer: number
  saveTimer: number
  isGameOver: boolean
}

// ---------------------------------------------------------------------------
// Player input snapshot
// ---------------------------------------------------------------------------

export interface InputSnapshot {
  moveX: number   // -1 .. 1
  moveZ: number   // -1 .. 1
  fire: boolean
  fireDirX: number
  fireDirZ: number
}
