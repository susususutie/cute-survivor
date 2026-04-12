// EnemyType enum for both type annotations and runtime values
export enum EnemyType {
  Goblin = 'goblin',
  Orc = 'orc',
  Slime = 'slime',
  Bat = 'bat',
  Skeleton = 'skeleton',
  Mushroom = 'mushroom'
}

export interface EnemyConfig {
  type: EnemyType
  hp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  color: number
  hasRangedAttack?: boolean
  rangedAttackRange?: number
  rangedAttackDamage?: number
  rangedAttackCooldown?: number
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.Goblin]: {
    type: EnemyType.Goblin,
    hp: 40,
    speed: 3.5,
    damage: 8,
    detectRange: 12,
    attackRange: 1.2,
    color: 0x446622,
    hasRangedAttack: true,
    rangedAttackRange: 12,
    rangedAttackDamage: 8,
    rangedAttackCooldown: 2
  },
  [EnemyType.Orc]: {
    type: EnemyType.Orc,
    hp: 80,
    speed: 2,
    damage: 15,
    detectRange: 10,
    attackRange: 1.5,
    color: 0x557744
  },
  [EnemyType.Slime]: {
    type: EnemyType.Slime,
    hp: 30,
    speed: 2.5,
    damage: 5,
    detectRange: 8,
    attackRange: 1,
    color: 0x44aa44
  },
  [EnemyType.Bat]: {
    type: EnemyType.Bat,
    hp: 20,
    speed: 5,
    damage: 4,
    detectRange: 15,
    attackRange: 0.8,
    color: 0x443322
  },
  [EnemyType.Skeleton]: {
    type: EnemyType.Skeleton,
    hp: 35,
    speed: 2.8,
    damage: 10,
    detectRange: 14,
    attackRange: 1.0,
    color: 0xddddcc,
    hasRangedAttack: true,
    rangedAttackRange: 15,
    rangedAttackDamage: 12,
    rangedAttackCooldown: 2.5
  },
  [EnemyType.Mushroom]: {
    type: EnemyType.Mushroom,
    hp: 50,
    speed: 1.5,
    damage: 8,
    detectRange: 10,
    attackRange: 1.5,
    color: 0xcc2222
  }
}
