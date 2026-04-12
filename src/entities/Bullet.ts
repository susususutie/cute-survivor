import type { Vector3 } from './Player'
import { WeaponType } from '../core/Weapon'

export type BulletType = 'pistol' | 'rifle' | 'shotgun'

export interface BulletState {
  id: string
  ownerId: string
  position: Vector3
  direction: Vector3
  speed: number
  damage: number
  lifetime: number
  maxLifetime: number
  maxRange: number
  traveledDistance: number
  bulletType: BulletType
  age: number
}

export function createBullet(
  id: string,
  ownerId: string,
  position: Vector3,
  direction: Vector3,
  weaponType: WeaponType,
  damage: number
): BulletState {
  const bulletTypeMap: Record<WeaponType, BulletType> = {
    [WeaponType.Pistol]: 'pistol',
    [WeaponType.Rifle]: 'rifle',
    [WeaponType.Shotgun]: 'shotgun'
  }

  const speedMap: Record<BulletType, number> = {
    pistol: 20,
    rifle: 30,
    shotgun: 15
  }

  const rangeMap: Record<BulletType, number> = {
    pistol: 15,
    rifle: 25,
    shotgun: 8
  }

  const lifetimeMap: Record<BulletType, number> = {
    pistol: 3,
    rifle: 4,
    shotgun: 2
  }

  const bulletType = bulletTypeMap[weaponType]

  return {
    id,
    ownerId,
    position: { ...position },
    direction: { ...direction },
    speed: speedMap[bulletType],
    damage,
    lifetime: 0,
    maxLifetime: lifetimeMap[bulletType],
    maxRange: rangeMap[bulletType],
    traveledDistance: 0,
    bulletType,
    age: 0
  }
}

export function updateBullet(state: BulletState, delta: number): BulletState {
  const moveDistance = state.speed * delta
  const newPosition: Vector3 = {
    x: state.position.x + state.direction.x * moveDistance,
    y: state.position.y,
    z: state.position.z + state.direction.z * moveDistance
  }

  return {
    ...state,
    position: newPosition,
    traveledDistance: state.traveledDistance + moveDistance,
    lifetime: state.lifetime + delta,
    age: state.age + delta
  }
}

export function isBulletExpired(state: BulletState): boolean {
  return state.lifetime >= state.maxLifetime || state.traveledDistance >= state.maxRange
}

export function getBulletPosition(state: BulletState): Vector3 {
  return { ...state.position }
}

export function createBulletId(): string {
  return `bullet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}
