/**
 * Shared value types used across all pure logic modules.
 * No THREE.js, no DOM, no side effects.
 */

import type { WeaponType } from '../Weapon'

/** Lightweight 3-D vector – mirrors THREE.Vector3 but carries no renderer deps. */
export interface Vector3 {
  x: number
  y: number
  z: number
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

export interface BulletState {
  id: string
  ownerId: string
  position: Vector3
  direction: Vector3
  speed: number
  damage: number
  maxRange: number
  distanceTraveled: number
  createdAt: number
  lifetime: number
}

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------

export type EnemyAIState = 'patrol' | 'chase' | 'attack'

export interface EnemyLogicState {
  id: string
  type: EnemyType
  position: Vector3
  hp: number
  maxHp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  aiState: EnemyAIState
  lastAttackTime: number
  attackCooldown: number
  patrolTarget: Vector3
  hasRangedAttack: boolean
  rangedAttackRange: number
  rangedAttackDamage: number
  rangedAttackCooldown: number
  rangedAttackTimer: number
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface PlayerLogicState {
  id: string
  position: Vector3
  hp: number
  maxHp: number
  speed: number
  rotation: number
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export interface ItemState {
  id: string
  type: ItemType
  position: Vector3
  value: number
  quality: number
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
  items: ItemState[]
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
