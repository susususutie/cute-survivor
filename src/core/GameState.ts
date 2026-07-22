/**
 * GameState.ts - Re-exports from core/state/ for backward compatibility.
 * This file serves as the public API for game state types used by Game.ts.
 *
 * For new code, prefer importing directly from './state/' or './state/index'.
 */

import type { WeaponType } from './Weapon'

// Re-export Vector3 from state for convenience
export type { Vector3 } from './state/player'

// Re-export core state types
export type { PlayerState } from './state/player'
export type { EnemyState, EnemyAIState } from './state/enemy'
export type { BulletState } from './state/bullet'
export type { ItemState } from './state/item'
export type { CombatState } from './state/combat'
export type { WorldState } from './state/world'
export type { ResourcesState } from './state/resources'
export type { GameState as FullGameState, GameDifficulty } from './state/game'

/**
 * Simplified game state for Game.ts runtime.
 * Contains only the fields actively used by the game loop.
 */
export interface GameState {
  player: {
    id: string
    hp: number
    maxHp: number
    speed: number
    position: { x: number; y: number; z: number }
    rotation: number
  }
  resources: {
    gold: number
    herbs: number
    ores: number
    gunpowder: number
    lightAmmo: number
    heavyAmmo: number
  }
  combat: {
    ammo: number
    maxAmmo: number
    currentWeaponType: WeaponType
  }
  world: {
    seed: string
    currentChunkX: number
    currentChunkZ: number
  }
  enemies: {
    id: string
    type: string
    hp: number
    maxHp: number
    position: { x: number; y: number; z: number }
    rotation: number
  }[]
  bullets: {
    id: string
    position: { x: number; y: number; z: number }
    direction: { x: number; y: number; z: number }
  }[]
  items: {
    id: string
    type: string
    position: { x: number; y: number; z: number }
  }[]
  effects: {
    type: 'kill' | 'hit'
    position: { x: number; y: number; z: number }
  }[]
  defense: {
    active: boolean
    wave: number
    totalWaves: number
    enemiesRemaining: number
  }
}

export function createInitialGameState(seed: string, currentWeaponType: WeaponType): GameState {
  return {
    player: {
      id: `player_${seed}`,
      hp: 100,
      maxHp: 100,
      speed: 8,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0
    },
    resources: {
      gold: 0,
      herbs: 0,
      ores: 0,
      gunpowder: 0,
      lightAmmo: 0,
      heavyAmmo: 0
    },
    combat: {
      ammo: 30,
      maxAmmo: 30,
      currentWeaponType
    },
    world: {
      seed,
      currentChunkX: 0,
      currentChunkZ: 0
    },
    enemies: [],
    bullets: [],
    items: [],
    effects: [],
    defense: {
      active: false,
      wave: 0,
      totalWaves: 0,
      enemiesRemaining: 0
    }
  }
}
