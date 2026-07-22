import { describe, expect, it } from 'vitest'
import { ItemType } from '../../systems/ItemSystem'
import { WeaponType } from '../Weapon'
import {
  ammoItemForWeapon,
  consumeHealthPotion,
  recipeIdForAmmoItem,
  reloadMagazine
} from './survivalActions'

describe('survivalActions', () => {
  it('maps weapons to their reserve ammo item', () => {
    expect(ammoItemForWeapon(WeaponType.Pistol)).toBe(ItemType.LightAmmo)
    expect(ammoItemForWeapon(WeaponType.Rifle)).toBe(ItemType.LightAmmo)
    expect(ammoItemForWeapon(WeaponType.Shotgun)).toBe(ItemType.HeavyAmmo)
  })

  it('maps ammo items to crafting recipes', () => {
    expect(recipeIdForAmmoItem(ItemType.LightAmmo)).toBe('light_ammo')
    expect(recipeIdForAmmoItem(ItemType.HeavyAmmo)).toBe('heavy_ammo')
  })

  it('reloads only the missing magazine amount from reserves', () => {
    const result = reloadMagazine(
      { ammo: 4, maxAmmo: 10 },
      { herbs: 0, ores: 0, gunpowder: 0, lightAmmo: 20, heavyAmmo: 3 },
      ItemType.LightAmmo
    )

    expect(result.loaded).toBe(6)
    expect(result.magazine.ammo).toBe(10)
    expect(result.resources.lightAmmo).toBe(14)
    expect(result.resources.heavyAmmo).toBe(3)
  })

  it('does not overdraw reserves when reloading', () => {
    const result = reloadMagazine(
      { ammo: 0, maxAmmo: 8 },
      { herbs: 0, ores: 0, gunpowder: 0, lightAmmo: 0, heavyAmmo: 3 },
      ItemType.HeavyAmmo
    )

    expect(result.loaded).toBe(3)
    expect(result.magazine.ammo).toBe(3)
    expect(result.resources.heavyAmmo).toBe(0)
  })

  it('consumes a health potion only when it can heal', () => {
    const result = consumeHealthPotion({ hp: 60, maxHp: 100 }, 2, 30)

    expect(result.health.hp).toBe(90)
    expect(result.potions).toBe(1)
    expect(result.healed).toBe(30)
  })

  it('keeps potion count unchanged at full health', () => {
    const result = consumeHealthPotion({ hp: 100, maxHp: 100 }, 2, 30)

    expect(result.health.hp).toBe(100)
    expect(result.potions).toBe(2)
    expect(result.healed).toBe(0)
  })
})
