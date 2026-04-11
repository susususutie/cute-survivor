import { EnemyType } from '../entities/Enemy'

export interface VegetationConfig {
  trees: number
  grass: number
  flowers: number
  bushes: number
  density: number
}

export interface ResourceConfig {
  herbs: number
  ores: number
  density: number
}

export interface TerrainConfig {
  rockCount: number
  rockDensity: number
  terrainMoundCount: number
  vegetation: VegetationConfig
  resources: ResourceConfig
}

export interface MonsterTypeConfig {
  spawnWeight: number
  hp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  hasRangedAttack?: boolean
  rangedAttackRange?: number
  rangedAttackDamage?: number
  rangedAttackCooldown?: number
}

export interface MonsterConfig {
  spawnRate: number
  types: Record<EnemyType, MonsterTypeConfig>
}

export interface DropEntry {
  itemType: string
  chance: number
}

export type DropConfig = Partial<Record<EnemyType, DropEntry[]>>

export interface WorldConfig {
  seed: string
  terrain: TerrainConfig
  monster: MonsterConfig
  drop: DropConfig
}

export const DEFAULT_VEGETATION: VegetationConfig = {
  trees: 10,
  grass: 10,
  flowers: 5,
  bushes: 5,
  density: 1.0
}

export const DEFAULT_RESOURCES: ResourceConfig = {
  herbs: 8,
  ores: 7,
  density: 1.0
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  rockCount: 20,
  rockDensity: 1.0,
  terrainMoundCount: 12,
  vegetation: DEFAULT_VEGETATION,
  resources: DEFAULT_RESOURCES
}

export const DEFAULT_MONSTER_TYPES: Record<EnemyType, MonsterTypeConfig> = {
  [EnemyType.Goblin]: {
    spawnWeight: 20,
    hp: 40,
    speed: 3.5,
    damage: 8,
    detectRange: 12,
    attackRange: 1.2,
    hasRangedAttack: true,
    rangedAttackRange: 12,
    rangedAttackDamage: 8,
    rangedAttackCooldown: 2
  },
  [EnemyType.Orc]: {
    spawnWeight: 15,
    hp: 80,
    speed: 2,
    damage: 15,
    detectRange: 10,
    attackRange: 1.5
  },
  [EnemyType.Slime]: {
    spawnWeight: 20,
    hp: 30,
    speed: 2.5,
    damage: 5,
    detectRange: 8,
    attackRange: 1
  },
  [EnemyType.Bat]: {
    spawnWeight: 15,
    hp: 20,
    speed: 5,
    damage: 4,
    detectRange: 15,
    attackRange: 0.8
  },
  [EnemyType.Skeleton]: {
    spawnWeight: 15,
    hp: 35,
    speed: 2.8,
    damage: 10,
    detectRange: 14,
    attackRange: 1.0,
    hasRangedAttack: true,
    rangedAttackRange: 15,
    rangedAttackDamage: 12,
    rangedAttackCooldown: 2.5
  },
  [EnemyType.Mushroom]: {
    spawnWeight: 15,
    hp: 50,
    speed: 1.5,
    damage: 8,
    detectRange: 10,
    attackRange: 1.5
  }
}

export const DEFAULT_MONSTER_CONFIG: MonsterConfig = {
  spawnRate: 1.0,
  types: DEFAULT_MONSTER_TYPES
}

export const DEFAULT_DROP_CONFIG: DropConfig = {
  [EnemyType.Goblin]: [
    { itemType: 'gold', chance: 0.3 },
    { itemType: 'herb', chance: 0.15 }
  ],
  [EnemyType.Orc]: [
    { itemType: 'gold', chance: 0.5 },
    { itemType: 'ore', chance: 0.2 }
  ],
  [EnemyType.Slime]: [
    { itemType: 'herb', chance: 0.25 }
  ],
  [EnemyType.Bat]: [
    { itemType: 'light_ammo', chance: 0.2 }
  ],
  [EnemyType.Skeleton]: [
    { itemType: 'gold', chance: 0.35 },
    { itemType: 'heavy_ammo', chance: 0.15 }
  ],
  [EnemyType.Mushroom]: [
    { itemType: 'herb', chance: 0.3 },
    { itemType: 'health_potion', chance: 0.1 }
  ]
}

export function createDefaultWorldConfig(seed: string): WorldConfig {
  return {
    seed,
    terrain: { ...DEFAULT_TERRAIN_CONFIG },
    monster: {
      spawnRate: DEFAULT_MONSTER_CONFIG.spawnRate,
      types: { ...DEFAULT_MONSTER_TYPES }
    },
    drop: { ...DEFAULT_DROP_CONFIG }
  }
}

export function generateRandomSeed(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let seed = ''
  for (let i = 0; i < 8; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)]
  }
  return seed
}

export function hashStringSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & 0x7fffffff
  }
  return Math.abs(hash)
}
