/**
 * Combat state - pure data, no methods.
 */

import type { WeaponType } from '../Weapon'

/** Defense mode wave configuration */
export interface DefenseWaveConfig {
  enemyCount: number
  spawnDelay: number
}

/** Combat state - all fields are plain serializable data */
export interface CombatState {
  ammo: number
  maxAmmo: number
  currentWeaponType: WeaponType
  isReloading: boolean
  reloadTimer: number
  reloadProgress: number
  defenseModeActive: boolean
  defenseCooldown: number
  defenseDuration: number
  defenseCurrentWave: number
  defenseTotalWaves: number
  defenseEnemiesRemaining: number
  defenseEnemiesToSpawn: number
  defenseEnemiesSpawned: number
  defenseWaveActive: boolean
  defenseWaveComplete: boolean
  isSpeedBoosted: boolean
  speedBoostTimer: number
  lastShotTime: number
}
