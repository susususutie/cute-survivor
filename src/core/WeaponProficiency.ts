import { WeaponType } from './Weapon'

export interface ProficiencyLevel {
  rank: number
  damageBonus: number
  speedBonus: number
}

const MAX_RANK = 10

export class WeaponProficiency {
  private proficiency: Map<WeaponType, { kills: number; damage: number; rank: number }>

  constructor() {
    this.proficiency = new Map()
    Object.values(WeaponType).forEach((type) => {
      this.proficiency.set(type, { kills: 0, damage: 0, rank: 0 })
    })
  }

  addKill(type: WeaponType): void {
    if (!this.proficiency.has(type)) {
      this.proficiency.set(type, { kills: 0, damage: 0, rank: 0 })
    }
    const prof = this.proficiency.get(type)
    if (!prof) return
    prof.kills++
    this.updateRank(type)
  }

  addDamage(type: WeaponType, damage: number): void {
    if (!this.proficiency.has(type)) {
      this.proficiency.set(type, { kills: 0, damage: 0, rank: 0 })
    }
    const prof = this.proficiency.get(type)
    if (!prof) return
    prof.damage += damage
    this.updateRank(type)
  }

  private updateRank(type: WeaponType): void {
    const prof = this.proficiency.get(type)
    if (!prof) return
    const killRank = Math.floor(prof.kills / 10)
    const damageRank = Math.floor(prof.damage / 500)
    prof.rank = Math.min(Math.max(killRank, damageRank), MAX_RANK)
  }

  getRank(type: WeaponType): number {
    return this.proficiency.get(type)?.rank ?? 0
  }

  getKills(type: WeaponType): number {
    return this.proficiency.get(type)?.kills ?? 0
  }

  getTotalDamage(type: WeaponType): number {
    return this.proficiency.get(type)?.damage ?? 0
  }

  getDamageBonus(type: WeaponType): number {
    const rank = this.getRank(type)
    return rank * 0.02 // +2% damage per rank
  }

  getSpeedBonus(type: WeaponType): number {
    const rank = this.getRank(type)
    return rank * 0.01 // +1% attack speed per rank
  }

  getLevel(type: WeaponType): ProficiencyLevel {
    const rank = this.getRank(type)
    return {
      rank,
      damageBonus: this.getDamageBonus(type),
      speedBonus: this.getSpeedBonus(type)
    }
  }

  getAllProficiencies(): Map<WeaponType, ProficiencyLevel> {
    const result = new Map<WeaponType, ProficiencyLevel>()
    Object.values(WeaponType).forEach((type) => {
      result.set(type, this.getLevel(type))
    })
    return result
  }

  serialize(): { type: string; kills: number; damage: number; rank: number }[] {
    const result: { type: string; kills: number; damage: number; rank: number }[] = []
    this.proficiency.forEach((value, key) => {
      result.push({ type: key, kills: value.kills, damage: value.damage, rank: value.rank })
    })
    return result
  }

  static deserialize(data: { type: string; kills: number; damage: number; rank: number }[]): WeaponProficiency {
    const prof = new WeaponProficiency()
    data.forEach((item) => {
      const type = item.type as WeaponType
      prof.proficiency.set(type, { kills: item.kills, damage: item.damage, rank: item.rank })
    })
    return prof
  }

  getEffectiveDamage(baseDamage: number, type: WeaponType): number {
    return baseDamage * (1 + this.getDamageBonus(type))
  }

  getEffectiveAttackSpeed(baseSpeed: number, type: WeaponType): number {
    return baseSpeed * (1 + this.getSpeedBonus(type))
  }
}
