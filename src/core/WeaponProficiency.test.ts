import { describe, it, expect, beforeEach } from 'vitest'
import { WeaponProficiency } from './WeaponProficiency'
import { WeaponType } from './Weapon'

describe('WeaponProficiency', () => {
  let prof: WeaponProficiency

  beforeEach(() => {
    prof = new WeaponProficiency()
  })

  describe('initialization', () => {
    it('should start with rank 0 for all weapons', () => {
      expect(prof.getRank(WeaponType.Pistol)).toBe(0)
      expect(prof.getRank(WeaponType.Shotgun)).toBe(0)
      expect(prof.getRank(WeaponType.Rifle)).toBe(0)
    })

    it('should start with 0 kills for all weapons', () => {
      expect(prof.getKills(WeaponType.Pistol)).toBe(0)
      expect(prof.getKills(WeaponType.Shotgun)).toBe(0)
    })
  })

  describe('addKill', () => {
    it('should increment kill count', () => {
      prof.addKill(WeaponType.Pistol)
      expect(prof.getKills(WeaponType.Pistol)).toBe(1)
    })

    it('should increase rank every 10 kills', () => {
      for (let i = 0; i < 10; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      expect(prof.getRank(WeaponType.Pistol)).toBe(1)
    })

    it('should cap at rank 10', () => {
      for (let i = 0; i < 150; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      expect(prof.getRank(WeaponType.Pistol)).toBe(10)
    })

    it('should track kills independently per weapon type', () => {
      for (let i = 0; i < 10; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      prof.addKill(WeaponType.Shotgun)
      expect(prof.getRank(WeaponType.Pistol)).toBe(1)
      expect(prof.getRank(WeaponType.Shotgun)).toBe(0)
    })
  })

  describe('addDamage', () => {
    it('should accumulate damage', () => {
      prof.addDamage(WeaponType.Pistol, 100)
      prof.addDamage(WeaponType.Pistol, 200)
      expect(prof.getTotalDamage(WeaponType.Pistol)).toBe(300)
    })

    it('should increase rank every 500 damage', () => {
      prof.addDamage(WeaponType.Pistol, 500)
      expect(prof.getRank(WeaponType.Pistol)).toBe(1)
    })
  })

  describe('damageBonus', () => {
    it('should be 0 at rank 0', () => {
      expect(prof.getDamageBonus(WeaponType.Pistol)).toBe(0)
    })

    it('should increase by 2% per rank', () => {
      for (let i = 0; i < 30; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      expect(prof.getRank(WeaponType.Pistol)).toBe(3)
      expect(prof.getDamageBonus(WeaponType.Pistol)).toBeCloseTo(0.06) // 3 * 0.02 = 0.06
    })
  })

  describe('speedBonus', () => {
    it('should be 0 at rank 0', () => {
      expect(prof.getSpeedBonus(WeaponType.Pistol)).toBe(0)
    })

    it('should increase by 1% per rank', () => {
      for (let i = 0; i < 50; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      expect(prof.getRank(WeaponType.Pistol)).toBe(5)
      expect(prof.getSpeedBonus(WeaponType.Pistol)).toBeCloseTo(0.05) // 5 * 0.01 = 0.05
    })
  })

  describe('getLevel', () => {
    it('should return rank and bonuses', () => {
      for (let i = 0; i < 20; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      const level = prof.getLevel(WeaponType.Pistol)
      expect(level.rank).toBe(2)
      expect(level.damageBonus).toBeCloseTo(0.04)
      expect(level.speedBonus).toBeCloseTo(0.02)
    })
  })

  describe('getEffectiveDamage', () => {
    it('should apply damage bonus', () => {
      for (let i = 0; i < 50; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      const effective = prof.getEffectiveDamage(100, WeaponType.Pistol)
      expect(effective).toBeCloseTo(110) // 100 * 1.10 = 110 (rank 5 = 10% bonus)
    })

    it('should not apply bonus to other weapon types', () => {
      for (let i = 0; i < 50; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      const effective = prof.getEffectiveDamage(100, WeaponType.Shotgun)
      expect(effective).toBe(100) // No bonus for shotgun
    })
  })

  describe('getEffectiveAttackSpeed', () => {
    it('should apply speed bonus', () => {
      for (let i = 0; i < 50; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      const effective = prof.getEffectiveAttackSpeed(1.0, WeaponType.Pistol)
      expect(effective).toBeCloseTo(1.05) // 1.0 * 1.05 = 1.05
    })
  })

  describe('serialize / deserialize', () => {
    it('should serialize proficiency data', () => {
      for (let i = 0; i < 15; i++) {
        prof.addKill(WeaponType.Pistol)
      }
      prof.addDamage(WeaponType.Pistol, 300)

      const data = prof.serialize()
      expect(data.length).toBe(3) // 3 weapon types
    })

    it('should deserialize and restore proficiency', () => {
      for (let i = 0; i < 30; i++) {
        prof.addKill(WeaponType.Shotgun)
      }

      const data = prof.serialize()
      const restored = WeaponProficiency.deserialize(data)

      expect(restored.getRank(WeaponType.Shotgun)).toBe(3)
      expect(restored.getKills(WeaponType.Shotgun)).toBe(30)
    })
  })

  describe('getAllProficiencies', () => {
    it('should return proficiency for all weapon types', () => {
      const all = prof.getAllProficiencies()
      expect(all.size).toBe(3)
      expect(all.get(WeaponType.Pistol)).toBeDefined()
      expect(all.get(WeaponType.Shotgun)).toBeDefined()
      expect(all.get(WeaponType.Rifle)).toBeDefined()
    })
  })
})
