/**
 * Root game state - integrates all sub-states as plain data.
 * No methods, no class instances.
 */

import type { PlayerState } from './player'
import type { EnemyState } from './enemy'
import type { BulletState } from './bullet'
import type { ItemState } from './item'
import type { CombatState } from './combat'
import type { WorldState } from './world'
import type { ResourcesState } from './resources'

/** Game difficulty levels */
export type GameDifficulty = 'easy' | 'normal' | 'hard'

/** Top-level game state - all fields are plain serializable data */
export interface GameState {
  // Sub-states
  player: PlayerState
  enemies: EnemyState[]
  bullets: BulletState[]
  enemyBullets: BulletState[]
  items: ItemState[]
  combat: CombatState
  world: WorldState
  resources: ResourcesState

  // Game-level flags
  isPaused: boolean
  isGameOver: boolean
  isInMenu: boolean
  isDefending: boolean
  gameTime: number
  difficulty: GameDifficulty

  // Timers
  enemySpawnTimer: number
  saveTimer: number
  lastShotTime: number

  // Slot / save info
  currentSlotIndex: number
}
