import { ItemType } from '../../systems/ItemSystem'
import { AmmoType, WeaponRegistry, type WeaponType } from '../Weapon'

export interface SurvivalResources {
  herbs: number
  ores: number
  gunpowder: number
  lightAmmo: number
  heavyAmmo: number
}

export interface MagazineState {
  ammo: number
  maxAmmo: number
}

export interface HealthState {
  hp: number
  maxHp: number
}

export interface ReloadResult {
  magazine: MagazineState
  resources: SurvivalResources
  loaded: number
  reserveType: ItemType.LightAmmo | ItemType.HeavyAmmo
}

export interface HealResult {
  health: HealthState
  potions: number
  healed: number
}

export function ammoItemForWeapon(weaponType: WeaponType): ItemType.LightAmmo | ItemType.HeavyAmmo {
  const weapon = WeaponRegistry.get(weaponType)
  return weapon?.stats.ammoType === AmmoType.HeavyAmmo ? ItemType.HeavyAmmo : ItemType.LightAmmo
}

export function recipeIdForAmmoItem(
  itemType: ItemType.LightAmmo | ItemType.HeavyAmmo
): 'light_ammo' | 'heavy_ammo' {
  return itemType === ItemType.HeavyAmmo ? 'heavy_ammo' : 'light_ammo'
}

export function reloadMagazine(
  magazine: MagazineState,
  resources: SurvivalResources,
  reserveType: ItemType.LightAmmo | ItemType.HeavyAmmo
): ReloadResult {
  const needed = Math.max(0, magazine.maxAmmo - magazine.ammo)
  const reserve = reserveType === ItemType.HeavyAmmo ? resources.heavyAmmo : resources.lightAmmo
  const loaded = Math.min(needed, reserve)

  return {
    magazine: {
      ...magazine,
      ammo: magazine.ammo + loaded
    },
    resources: {
      ...resources,
      lightAmmo:
        reserveType === ItemType.LightAmmo ? resources.lightAmmo - loaded : resources.lightAmmo,
      heavyAmmo:
        reserveType === ItemType.HeavyAmmo ? resources.heavyAmmo - loaded : resources.heavyAmmo
    },
    loaded,
    reserveType
  }
}

export function consumeHealthPotion(
  health: HealthState,
  potions: number,
  healAmount: number
): HealResult {
  if (potions <= 0 || health.hp >= health.maxHp) {
    return {
      health,
      potions,
      healed: 0
    }
  }

  const nextHp = Math.min(health.maxHp, health.hp + healAmount)
  return {
    health: {
      ...health,
      hp: nextHp
    },
    potions: potions - 1,
    healed: nextHp - health.hp
  }
}
