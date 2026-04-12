/**
 * Enemy state - pure data, no methods.
 */

import type { EnemyType } from '../../entities/Enemy'
import type { Vector3 } from './player'

/** Valid AI states for an enemy */
export type EnemyAIState = 'patrol' | 'alert' | 'chase' | 'attack' | 'dead'

/** Enemy state - all fields are plain serializable data */
export interface EnemyState {
  id: string
  type: EnemyType
  position: Vector3
  rotation: number
  velocity: Vector3
  hp: number
  maxHp: number
  speed: number
  damage: number
  attackSpeed: number
  detectRange: number
  attackRange: number
  state: EnemyAIState
  targetId: string | null
  hasRangedAttack: boolean
  rangedAttackRange: number
  rangedAttackDamage: number
  rangedAttackCooldown: number
  rangedAttackTimer: number
  isAggro: boolean
  deaggroTimer: number
  attackCooldown: number
  patrolTarget: Vector3
  aggroRange: number
  leashRange: number
  animPhase: number
}
