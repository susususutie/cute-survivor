export enum WeaponType {
  Pistol = 'pistol',
  Shotgun = 'shotgun',
  Rifle = 'rifle'
}

export enum AmmoType {
  LightAmmo = 'light_ammo',
  HeavyAmmo = 'heavy_ammo'
}

export interface WeaponStats {
  damage: number
  attackSpeed: number
  range: number
  ammoType: AmmoType
  magazineSize: number
  reloadTime: number
  projectileCount: number
  spreadAngle: number
  knockback: number
}

export interface WeaponDefinition {
  id: string
  name: string
  type: WeaponType
  stats: WeaponStats
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class WeaponRegistry {
  private static weapons = new Map<WeaponType, WeaponDefinition>()

  static {
    this.register({
      id: 'pistol',
      name: 'Pistol',
      type: WeaponType.Pistol,
      stats: {
        damage: 25,
        attackSpeed: 0.3,
        range: 15,
        ammoType: AmmoType.LightAmmo,
        magazineSize: 30,
        reloadTime: 1.5,
        projectileCount: 1,
        spreadAngle: 0,
        knockback: 5
      }
    })

    this.register({
      id: 'shotgun',
      name: 'Shotgun',
      type: WeaponType.Shotgun,
      stats: {
        damage: 15,
        attackSpeed: 0.8,
        range: 8,
        ammoType: AmmoType.HeavyAmmo,
        magazineSize: 8,
        reloadTime: 2.0,
        projectileCount: 5,
        spreadAngle: 30,
        knockback: 15
      }
    })

    this.register({
      id: 'rifle',
      name: 'Rifle',
      type: WeaponType.Rifle,
      stats: {
        damage: 40,
        attackSpeed: 0.5,
        range: 25,
        ammoType: AmmoType.LightAmmo,
        magazineSize: 20,
        reloadTime: 1.8,
        projectileCount: 1,
        spreadAngle: 5,
        knockback: 3
      }
    })
  }

  static register(weapon: WeaponDefinition): void {
    this.weapons.set(weapon.type, weapon)
  }

  static get(type: WeaponType): WeaponDefinition | undefined {
    return this.weapons.get(type)
  }

  static getAll(): WeaponDefinition[] {
    return Array.from(this.weapons.values())
  }
}

export class Weapon {
  public type: WeaponType
  public definition: WeaponDefinition
  private currentAmmo: number
  private isReloading: boolean
  private reloadTimer: number

  constructor(type: WeaponType) {
    this.type = type
    this.definition = WeaponRegistry.get(type) ?? this.getDefaultDefinition()
    this.currentAmmo = this.definition.stats.magazineSize
    this.isReloading = false
    this.reloadTimer = 0
  }

  getCurrentAmmo(): number {
    return this.currentAmmo
  }

  getMaxAmmo(): number {
    return this.definition.stats.magazineSize
  }

  canFire(): boolean {
    return this.currentAmmo > 0 && !this.isReloading
  }

  fire(): boolean {
    if (!this.canFire()) {
      return false
    }
    this.currentAmmo--
    return true
  }

  reload(): void {
    if (this.isReloading) return
    this.isReloading = true
    this.reloadTimer = this.definition.stats.reloadTime
  }

  update(delta: number): void {
    if (this.isReloading) {
      this.reloadTimer -= delta
      if (this.reloadTimer <= 0) {
        this.isReloading = false
        this.currentAmmo = this.definition.stats.magazineSize
      }
    }
  }

  isReloadingWeapon(): boolean {
    return this.isReloading
  }

  getReloadProgress(): number {
    if (!this.isReloading) return 1
    const elapsed = this.definition.stats.reloadTime - this.reloadTimer
    return elapsed / this.definition.stats.reloadTime
  }

  addAmmo(amount: number): void {
    this.currentAmmo = Math.min(this.currentAmmo + amount, this.definition.stats.magazineSize)
  }

  getDamage(): number {
    return this.definition.stats.damage
  }

  getAttackSpeed(): number {
    return this.definition.stats.attackSpeed
  }

  getRange(): number {
    return this.definition.stats.range
  }

  getProjectileCount(): number {
    return this.definition.stats.projectileCount
  }

  getSpreadAngle(): number {
    return this.definition.stats.spreadAngle
  }

  getKnockback(): number {
    return this.definition.stats.knockback
  }

  getAmmoType(): AmmoType {
    return this.definition.stats.ammoType
  }

  private getDefaultDefinition(): WeaponDefinition {
    const def = WeaponRegistry.get(WeaponType.Pistol)
    if (!def) throw new Error('Default weapon not found')
    return def
  }
}
