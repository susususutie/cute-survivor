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
  seed: number
  currentChunkX: number
  currentChunkZ: number
}

export interface GameState {
  resources: GameResourcesState
  combat: GameCombatState
  world: GameWorldState
}

export function createInitialGameState(seed: number, currentWeaponType: WeaponType): GameState {
  return {
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
    }
  }
}
