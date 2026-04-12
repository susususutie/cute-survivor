import * as THREE from 'three'

const PLAYER_BODY_COLOR = 0x2a5a8a
const PLAYER_ARMOR_COLOR = 0x4a7aaa
const PLAYER_HELMET_COLOR = 0x5a6a7a
const PLAYER_VISOR_COLOR = 0x222233
const PLAYER_BELT_COLOR = 0x2a2a2a
const PLAYER_LEG_COLOR = 0x2a3a4a
const PLAYER_BOOT_COLOR = 0x3a3a3a
const PLAYER_GUN_COLOR = 0x1a1a2a
const PLAYER_MUZZLE_COLOR = 0xffffaa
const PLAYER_ENERGY_COLOR = 0x44aaff

const ENEMY_COLORS: Record<string, number> = {
  goblin: 0x44aa44,
  orc: 0x665533,
  slime: 0x44ff88,
  bat: 0x443366,
  skeleton: 0xddeeff,
  mushroom: 0xff6644
}

const ITEM_COLORS: Record<string, number> = {
  gold: 0xffdd00,
  herb: 0x44ff88,
  ore: 0x8888ff,
  ammo: 0xff8844,
  gunpowder: 0xff4400,
  light_ammo: 0xffaa44,
  heavy_ammo: 0xff6600,
  health_potion: 0xff4444,
  speed_potion: 0x44aaff
}

const ROCK_COLOR = 0x666688
const VEG_TRUNK_COLOR = 0x4a3520
const VEG_LEAVES_COLOR = 0x2a5a2a
const VEG_GRASS_COLOR = 0x4a8a4a
const VEG_BUSH_COLOR = 0x3a6a3a

const BULLET_COLOR = 0xffff00
const BULLET_TRAIL_COLOR = 0xffaa00

const GROUND_COLOR = 0x222233

class MaterialLibrary {
  // Player materials
  private playerBodyMat = new THREE.MeshStandardMaterial({
    color: PLAYER_BODY_COLOR,
    roughness: 0.35,
    metalness: 0.3
  })
  private playerArmorMat = new THREE.MeshStandardMaterial({
    color: PLAYER_ARMOR_COLOR,
    roughness: 0.25,
    metalness: 0.5
  })
  private playerHelmetMat = new THREE.MeshStandardMaterial({
    color: PLAYER_HELMET_COLOR,
    roughness: 0.3,
    metalness: 0.6
  })
  private playerVisorMat = new THREE.MeshStandardMaterial({
    color: PLAYER_VISOR_COLOR,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x44aaff,
    emissiveIntensity: 0.5
  })
  private playerVisorGlowMat = new THREE.MeshBasicMaterial({
    color: 0x44aaff,
    transparent: true,
    opacity: 0.8
  })
  private playerShoulderMat = new THREE.MeshStandardMaterial({
    color: 0x3a5a6a,
    roughness: 0.4,
    metalness: 0.5
  })
  private playerShoulderLightMatL = new THREE.MeshBasicMaterial({ color: 0xff4444 })
  private playerShoulderLightMatR = new THREE.MeshBasicMaterial({ color: 0x44ff44 })
  private playerGunMat = new THREE.MeshStandardMaterial({
    color: PLAYER_GUN_COLOR,
    roughness: 0.2,
    metalness: 0.8
  })
  private playerMuzzleMat = new THREE.MeshBasicMaterial({ color: PLAYER_MUZZLE_COLOR })
  private playerGlowMat = new THREE.MeshBasicMaterial({
    color: PLAYER_ENERGY_COLOR,
    transparent: true,
    opacity: 0.9
  })
  private playerEnergyMat = new THREE.MeshStandardMaterial({
    color: PLAYER_ENERGY_COLOR,
    emissive: PLAYER_ENERGY_COLOR,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7
  })
  private playerBeltMat = new THREE.MeshStandardMaterial({ color: PLAYER_BELT_COLOR })
  private playerHolsterMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
  private playerLegMat = new THREE.MeshStandardMaterial({ color: PLAYER_LEG_COLOR })
  private playerBootMat = new THREE.MeshStandardMaterial({ color: PLAYER_BOOT_COLOR })
  private playerPackMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8 })
  private playerAntennaMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
  private playerAntennaTipMatL = new THREE.MeshBasicMaterial({ color: 0x44ff44 })
  private playerAntennaTipMatR = new THREE.MeshBasicMaterial({ color: 0xff4444 })

  // Bullet materials
  private bulletMat = new THREE.MeshBasicMaterial({ color: BULLET_COLOR })
  private trailMat = new THREE.PointsMaterial({
    size: 0.08,
    color: BULLET_TRAIL_COLOR,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  // Environment materials
  private rockMat = new THREE.MeshStandardMaterial({ color: ROCK_COLOR, roughness: 0.8 })
  private groundMat = new THREE.MeshStandardMaterial({ color: GROUND_COLOR })

  // Effect materials
  private killParticleMat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  private killRingMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })

  getPlayerBodyMat(): THREE.MeshStandardMaterial {
    return this.playerBodyMat
  }
  getPlayerArmorMat(): THREE.MeshStandardMaterial {
    return this.playerArmorMat
  }
  getPlayerHelmetMat(): THREE.MeshStandardMaterial {
    return this.playerHelmetMat
  }
  getPlayerVisorMat(): THREE.MeshStandardMaterial {
    return this.playerVisorMat
  }
  getPlayerVisorGlowMat(): THREE.MeshBasicMaterial {
    return this.playerVisorGlowMat
  }
  getPlayerShoulderMat(): THREE.MeshStandardMaterial {
    return this.playerShoulderMat
  }
  getPlayerShoulderLightMatL(): THREE.MeshBasicMaterial {
    return this.playerShoulderLightMatL
  }
  getPlayerShoulderLightMatR(): THREE.MeshBasicMaterial {
    return this.playerShoulderLightMatR
  }
  getPlayerGunMat(): THREE.MeshStandardMaterial {
    return this.playerGunMat
  }
  getPlayerMuzzleMat(): THREE.MeshBasicMaterial {
    return this.playerMuzzleMat
  }
  getPlayerGlowMat(): THREE.MeshBasicMaterial {
    return this.playerGlowMat
  }
  getPlayerEnergyMat(): THREE.MeshStandardMaterial {
    return this.playerEnergyMat
  }
  getPlayerBeltMat(): THREE.MeshStandardMaterial {
    return this.playerBeltMat
  }
  getPlayerHolsterMat(): THREE.MeshStandardMaterial {
    return this.playerHolsterMat
  }
  getPlayerLegMat(): THREE.MeshStandardMaterial {
    return this.playerLegMat
  }
  getPlayerBootMat(): THREE.MeshStandardMaterial {
    return this.playerBootMat
  }
  getPlayerPackMat(): THREE.MeshStandardMaterial {
    return this.playerPackMat
  }
  getPlayerAntennaMat(): THREE.MeshStandardMaterial {
    return this.playerAntennaMat
  }
  getPlayerAntennaTipMatL(): THREE.MeshBasicMaterial {
    return this.playerAntennaTipMatL
  }
  getPlayerAntennaTipMatR(): THREE.MeshBasicMaterial {
    return this.playerAntennaTipMatR
  }

  getBulletMat(): THREE.MeshBasicMaterial {
    return this.bulletMat
  }
  getTrailMat(): THREE.PointsMaterial {
    return this.trailMat
  }

  getRockMat(): THREE.MeshStandardMaterial {
    return this.rockMat
  }
  getGroundMat(): THREE.MeshStandardMaterial {
    return this.groundMat
  }

  getEnemyBodyMat(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  }

  getEnemyHeadMat(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
  }

  getEnemyEyeMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  }

  getEnemyHornMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x332211 })
  }

  getEnemyLegMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x442211 })
  }

  getEnemySlimeBodyMat(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2
    })
  }

  getEnemySlimeInnerMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    })
  }

  getEnemySlimeEyeMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0x111111 })
  }

  getEnemyBoneMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.8 })
  }

  getEnemySkullMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 })
  }

  getEnemyEyeSocketMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0x111111 })
  }

  getEnemyBatWingMat(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    })
  }

  getEnemyBatEyeMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0xff0000 })
  }

  getEnemyBatEarMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x332211 })
  }

  getEnemyMushroomCapMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 })
  }

  getEnemyMushroomStemMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0xddaa77, roughness: 0.7 })
  }

  getEnemyMushroomSpotMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0xffffff })
  }

  getEnemyMushroomEyeMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0x111111 })
  }

  getEnemyOrcTuskMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0xffffee })
  }

  getEnemyOrcEyeMat(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color: 0xff3300 })
  }

  getEnemyOrcClubMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x4a3520 })
  }

  getEnemyOrcHeadMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x665533, roughness: 0.6 })
  }

  getEnemyOrcTuskGeo(): THREE.ConeGeometry {
    return new THREE.ConeGeometry(0.08, 0.25, 6)
  }

  getEnemyOrcEyeGeo(): THREE.SphereGeometry {
    return new THREE.SphereGeometry(0.1, 8, 8)
  }

  getEnemyOrcArmGeo(): THREE.CylinderGeometry {
    return new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8)
  }

  getEnemyOrcClubGeo(): THREE.CylinderGeometry {
    return new THREE.CylinderGeometry(0.1, 0.15, 1, 8)
  }

  getItemMat(color: number, emissiveIntensity = 0.4, transparent = false, opacity = 1): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      transparent,
      opacity
    })
  }

  getItemColors(): Record<string, number> {
    return { ...ITEM_COLORS }
  }

  getEnemyColors(): Record<string, number> {
    return { ...ENEMY_COLORS }
  }

  getVegetationTrunkMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: VEG_TRUNK_COLOR, roughness: 0.9 })
  }

  getVegetationLeavesMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: VEG_LEAVES_COLOR, roughness: 0.8 })
  }

  getVegetationGrassMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: VEG_GRASS_COLOR })
  }

  getVegetationBushMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: VEG_BUSH_COLOR, roughness: 0.9 })
  }

  getVegetationStemMat(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: 0x3a5a3a })
  }

  getKillParticleMat(): THREE.PointsMaterial {
    return this.killParticleMat
  }

  getKillRingMat(): THREE.MeshBasicMaterial {
    return this.killRingMat
  }

  dispose(): void {
    // Player materials
    this.playerBodyMat.dispose()
    this.playerArmorMat.dispose()
    this.playerHelmetMat.dispose()
    this.playerVisorMat.dispose()
    this.playerVisorGlowMat.dispose()
    this.playerShoulderMat.dispose()
    this.playerShoulderLightMatL.dispose()
    this.playerShoulderLightMatR.dispose()
    this.playerGunMat.dispose()
    this.playerMuzzleMat.dispose()
    this.playerGlowMat.dispose()
    this.playerEnergyMat.dispose()
    this.playerBeltMat.dispose()
    this.playerHolsterMat.dispose()
    this.playerLegMat.dispose()
    this.playerBootMat.dispose()
    this.playerPackMat.dispose()
    this.playerAntennaMat.dispose()
    this.playerAntennaTipMatL.dispose()
    this.playerAntennaTipMatR.dispose()

    // Bullet materials
    this.bulletMat.dispose()
    this.trailMat.dispose()

    // Environment materials
    this.rockMat.dispose()
    this.groundMat.dispose()

    // Effect materials
    this.killParticleMat.dispose()
    this.killRingMat.dispose()
  }
}

export const materialLibrary = new MaterialLibrary()
