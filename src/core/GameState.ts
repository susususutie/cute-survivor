import type { WeaponType } from './Weapon'

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

export interface GamePlayerState {
  id: string
  hp: number
  maxHp: number
  speed: number
  position: { x: number; y: number; z: number }
  rotation: number
}

export interface GameEnemyState {
  id: string
  type: string
  hp: number
  maxHp: number
  position: { x: number; y: number; z: number }
  rotation: number
}

export interface GameBulletState {
  id: string
  position: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
}

export interface GameItemState {
  id: string
  type: string
  position: { x: number; y: number; z: number }
}

export interface GameEffectState {
  type: 'kill' | 'hit'
  position: { x: number; y: number; z: number }
}

export interface GameDefenseState {
  active: boolean
  wave: number
  totalWaves: number
  enemiesRemaining: number
}

export interface GameState {
  player: GamePlayerState
  resources: GameResourcesState
  combat: GameCombatState
  world: GameWorldState
  enemies: GameEnemyState[]
  bullets: GameBulletState[]
  items: GameItemState[]
  effects: GameEffectState[]
  defense: GameDefenseState
}

export function createInitialGameState(seed: string, currentWeaponType: WeaponType): GameState {
  return {
    player: {
      id: `player_${Date.now()}`,
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
