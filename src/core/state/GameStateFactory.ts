/**
 * GameStateFactory.ts
 * Pure function to create an initial game state.
 * Given the same inputs, always returns the same output.
 */

import type { GameState, GameDifficulty } from './game'
import type { PlayerState } from './player'
import type { CombatState } from './combat'
import type { WorldState } from './world'
import type { ResourcesState } from './resources'
import type { WeaponType } from '../Weapon'
import { WeaponType as WT } from '../Weapon'
import { ItemType } from '../../systems/ItemSystem'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function generatePlayerId(seed: string): string {
  return `player_${seed}`
}

// -----------------------------------------------------------------------------
// Default sub-states
// -----------------------------------------------------------------------------

function createDefaultPlayerState(weaponType: WeaponType, seed: string): PlayerState {
  return {
    id: generatePlayerId(seed),
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    hp: 100,
    maxHp: 100,
    speed: 8,
    attackPower: 25,
    defense: 0,
    gold: 0,
    herbs: 0,
    ores: 0,
    gunpowder: 0,
    lightAmmo: 0,
    heavyAmmo: 0,
    inventory: {
      items: {
        [ItemType.Gold]: 0,
        [ItemType.Herb]: 0,
        [ItemType.Ore]: 0,
        [ItemType.Ammo]: 0,
        [ItemType.Gunpowder]: 0,
        [ItemType.LightAmmo]: 0,
        [ItemType.HeavyAmmo]: 0,
        [ItemType.HealthPotion]: 0,
        [ItemType.SpeedPotion]: 0
      },
      capacity: 20,
      equipment: { weapon: null, armor: null }
    },
    weaponStates: {},
    proficientWeapons: [],
    currentWeaponType: weaponType,
    isDefending: false,
    isSpeedBoosted: false,
    speedBoostTimer: 0
  }
}

function createDefaultCombatState(weaponType: WeaponType): CombatState {
  return {
    ammo: 30,
    maxAmmo: 30,
    currentWeaponType: weaponType,
    isReloading: false,
    reloadTimer: 0,
    reloadProgress: 1,
    defenseModeActive: false,
    defenseCooldown: 0,
    defenseDuration: 0,
    defenseCurrentWave: 0,
    defenseTotalWaves: 10,
    defenseEnemiesRemaining: 0,
    defenseEnemiesToSpawn: 0,
    defenseEnemiesSpawned: 0,
    defenseWaveActive: false,
    defenseWaveComplete: false,
    isSpeedBoosted: false,
    speedBoostTimer: 0,
    lastShotTime: 0
  }
}

function createDefaultResourcesState(): ResourcesState {
  return {
    gold: 0,
    herbs: 0,
    ores: 0,
    gunpowder: 0,
    lightAmmo: 0,
    heavyAmmo: 0
  }
}

function createDefaultWorldState(seed: string): WorldState {
  return {
    seed,
    currentChunkX: 0,
    currentChunkZ: 0,
    chunks: {},
    loadedChunkIds: [],
    loadDistance: 2,
    chunkSize: 24,
    terrainSeed: hashStringSeed(seed),
    monsterSeed: hashStringSeed(seed + '_monster'),
    loadedChunkKeys: []
  }
}

// -----------------------------------------------------------------------------
// Pure factory
// -----------------------------------------------------------------------------

/**
 * Creates a complete initial GameState from a seed and starting weapon type.
 * This is a pure function: same inputs always produce same outputs.
 */
export function createInitialState(
  seed: string,
  weaponType: WeaponType = WT.Pistol,
  difficulty: GameDifficulty = 'normal'
): GameState {
  return {
    player: createDefaultPlayerState(weaponType, seed),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    items: [],
    combat: createDefaultCombatState(weaponType),
    world: createDefaultWorldState(seed),
    resources: createDefaultResourcesState(),
    isPaused: false,
    isGameOver: false,
    isInMenu: false,
    isDefending: false,
    gameTime: 0,
    difficulty,
    enemySpawnTimer: 0,
    saveTimer: 0,
    lastShotTime: 0,
    currentSlotIndex: -1
  }
}

/** Simple string hash for seed conversion */
function hashStringSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & 0x7fffffff
  }
  return Math.abs(hash)
}
