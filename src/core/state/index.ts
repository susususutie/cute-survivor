/**
 * src/core/state/index.ts
 * Public re-export of all state types.
 */

export type { Vector3, PlayerState, ProficiencyLevel, WeaponProficiencyState, EquipmentSlot, InventoryItemEntry } from './player'
export type { EnemyState, EnemyAIState } from './enemy'
export type { BulletState, BulletType } from './bullet'
export type { ItemState, ItemQuality } from './item'
export type { CombatState, DefenseWaveConfig } from './combat'
export type { WorldState, ChunkData, RockData, VegetationData, ResourceData, TerrainData, SeededRngState } from './world'
export type { ResourcesState } from './resources'
export type { GameState, GameDifficulty } from './game'
