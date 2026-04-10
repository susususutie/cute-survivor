import { describe, it, expect, beforeEach } from 'vitest'
import { Weapon, WeaponType, WeaponRegistry, AmmoType } from './Weapon'

describe('WeaponRegistry', () => {
  it('should have pistol definition', () => {
    const pistol = WeaponRegistry.get(WeaponType.Pistol)
    expect(pistol).toBeDefined()
    expect(pistol!.name).toBe('Pistol')
    expect(pistol!.stats.damage).toBe(25)
    expect(pistol!.stats.attackSpeed).toBe(0.3)
    expect(pistol!.stats.magazineSize).toBe(30)
    expect(pistol!.stats.projectileCount).toBe(1)
  })

  it('should have shotgun definition', () => {
    const shotgun = WeaponRegistry.get(WeaponType.Shotgun)
    expect(shotgun).toBeDefined()
    expect(shotgun!.name).toBe('Shotgun')
    expect(shotgun!.stats.damage).toBe(15)
    expect(shotgun!.stats.attackSpeed).toBe(0.8)
    expect(shotgun!.stats.magazineSize).toBe(8)
    expect(shotgun!.stats.projectileCount).toBe(5)
    expect(shotgun!.stats.spreadAngle).toBe(30)
    expect(shotgun!.stats.ammoType).toBe(AmmoType.HeavyAmmo)
  })

  it('should have rifle definition', () => {
    const rifle = WeaponRegistry.get(WeaponType.Rifle)
    expect(rifle).toBeDefined()
    expect(rifle!.name).toBe('Rifle')
    expect(rifle!.stats.damage).toBe(40)
    expect(rifle!.stats.range).toBe(25)
  })

  it('should return all weapons', () => {
    const all = WeaponRegistry.getAll()
    expect(all).toHaveLength(3)
  })
})

describe('Weapon', () => {
  let pistol: Weapon

  beforeEach(() => {
    pistol = new Weapon(WeaponType.Pistol)
  })

  describe('initialization', () => {
    it('should start with full ammo', () => {
      expect(pistol.getCurrentAmmo()).toBe(30)
    })

    it('should not be reloading initially', () => {
      expect(pistol.isReloadingWeapon()).toBe(false)
    })
  })

  describe('fire', () => {
    it('should decrease ammo on fire', () => {
      const result = pistol.fire()
      expect(result).toBe(true)
      expect(pistol.getCurrentAmmo()).toBe(29)
    })

    it('should return false when empty', () => {
      for (let i = 0; i < 30; i++) {
        pistol.fire()
      }
      const result = pistol.fire()
      expect(result).toBe(false)
      expect(pistol.getCurrentAmmo()).toBe(0)
    })

    it('should return false when reloading', () => {
      pistol.reload()
      const result = pistol.fire()
      expect(result).toBe(false)
    })
  })

  describe('reload', () => {
    it('should start reloading', () => {
      pistol.reload()
      expect(pistol.isReloadingWeapon()).toBe(true)
    })

    it('should restore ammo after reload completes', () => {
      for (let i = 0; i < 25; i++) {
        pistol.fire()
      }
      expect(pistol.getCurrentAmmo()).toBe(5)

      pistol.reload()
      // Simulate reload completing (2 seconds later)
      pistol.update(2.0)

      expect(pistol.getCurrentAmmo()).toBe(30)
      expect(pistol.isReloadingWeapon()).toBe(false)
    })
  })

  describe('update', () => {
    it('should update reload progress', () => {
      pistol.reload()
      pistol.update(1.0) // 1 second of 1.5s reload
      expect(pistol.getReloadProgress()).toBeCloseTo(0.67)
    })
  })

  describe('getDamage', () => {
    it('should return base damage', () => {
      expect(pistol.getDamage()).toBe(25)
    })
  })

  describe('getAttackSpeed', () => {
    it('should return base attack speed', () => {
      expect(pistol.getAttackSpeed()).toBe(0.3)
    })
  })

  describe('getProjectileCount', () => {
    it('should return 1 for pistol', () => {
      expect(pistol.getProjectileCount()).toBe(1)
    })

    it('should return 5 for shotgun', () => {
      const shotgun = new Weapon(WeaponType.Shotgun)
      expect(shotgun.getProjectileCount()).toBe(5)
    })
  })

  describe('getSpreadAngle', () => {
    it('should return 0 for pistol', () => {
      expect(pistol.getSpreadAngle()).toBe(0)
    })

    it('should return 30 for shotgun', () => {
      const shotgun = new Weapon(WeaponType.Shotgun)
      expect(shotgun.getSpreadAngle()).toBe(30)
    })
  })

  describe('addAmmo', () => {
    it('should add ammo up to max', () => {
      pistol.fire()
      pistol.fire()
      pistol.addAmmo(5)
      expect(pistol.getCurrentAmmo()).toBe(30) // capped at max
    })
  })
})
