/**
 * PlayerRenderer - Pure rendering logic for Player entity.
 * Separated from Player class to enable testing of game logic without THREE.js.
 */

import * as THREE from 'three'

export class PlayerRenderer {
  public mesh: THREE.Group
  private weapon!: THREE.Group
  private glowMesh!: THREE.Mesh
  private animTime = 0

  // Timer cleanup
  private activeTimers = new Set<ReturnType<typeof setTimeout>>()

  constructor() {
    this.mesh = new THREE.Group()
    this.buildModel()
    this.mesh.position.set(0, 0, 0)
  }

  private buildModel(): void {
    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.4, 1.1, 12)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a5a8a,
      roughness: 0.35,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.55
    this.mesh.add(body)

    // Armor
    const armorGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35)
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x4a7aaa,
      roughness: 0.25,
      metalness: 0.5
    })
    const armor = new THREE.Mesh(armorGeo, armorMat)
    armor.position.set(0, 0.5, 0.15)
    armor.castShadow = true
    this.mesh.add(armor)

    // Helmet
    const helmetGeo = new THREE.SphereGeometry(0.26, 16, 12)
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x5a6a7a,
      roughness: 0.3,
      metalness: 0.6
    })
    const helmet = new THREE.Mesh(helmetGeo, helmetMat)
    helmet.castShadow = true
    helmet.position.y = 1.25
    this.mesh.add(helmet)

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.15)
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x44aaff,
      emissiveIntensity: 0.5
    })
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 1.25, 0.2)
    this.mesh.add(visor)

    // Visor Glow
    const visorGlowGeo = new THREE.PlaneGeometry(0.3, 0.06)
    const visorGlowMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.8
    })
    const visorGlow = new THREE.Mesh(visorGlowGeo, visorGlowMat)
    visorGlow.position.set(0, 1.25, 0.28)
    this.mesh.add(visorGlow)

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a6a,
      roughness: 0.4,
      metalness: 0.5
    })
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat)
    shoulderL.position.set(-0.4, 0.9, 0)
    shoulderL.castShadow = true
    this.mesh.add(shoulderL)
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat)
    shoulderR.position.set(0.4, 0.9, 0)
    shoulderR.castShadow = true
    this.mesh.add(shoulderR)

    // Shoulder Lights
    const shoulderLightGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const shoulderLightMat = new THREE.MeshBasicMaterial({ color: 0xff4444 })
    const shoulderLightL = new THREE.Mesh(shoulderLightGeo, shoulderLightMat)
    shoulderLightL.position.set(-0.4, 0.95, 0.08)
    this.mesh.add(shoulderLightL)
    const shoulderLightR = new THREE.Mesh(
      shoulderLightGeo,
      new THREE.MeshBasicMaterial({ color: 0x44ff44 })
    )
    shoulderLightR.position.set(0.4, 0.95, 0.08)
    this.mesh.add(shoulderLightR)

    // Gun
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      roughness: 0.2,
      metalness: 0.8
    })

    this.weapon = new THREE.Group()
    const gunBodyGeo = new THREE.BoxGeometry(0.12, 0.15, 0.6)
    const gunBody = new THREE.Mesh(gunBodyGeo, gunMat)
    gunBody.position.set(0, 0, 0.3)
    gunBody.castShadow = true
    this.weapon.add(gunBody)

    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8)
    const barrel = new THREE.Mesh(barrelGeo, gunMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0, 0.65)
    barrel.castShadow = true
    this.weapon.add(barrel)

    const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.08, 8)
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffffaa })
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat)
    muzzle.rotation.x = Math.PI / 2
    muzzle.position.set(0, 0, 0.92)
    this.weapon.add(muzzle)

    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.9
    })
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat)
    this.glowMesh.position.set(0, 0, 0.95)
    this.weapon.add(this.glowMesh)

    const energyGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.3, 6)
    const energyMat = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      emissive: 0x44aaff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7
    })
    const energy = new THREE.Mesh(energyGeo, energyMat)
    energy.rotation.x = Math.PI / 2
    energy.position.set(0, 0.06, 0.5)
    this.weapon.add(energy)

    this.weapon.position.set(0, 0.65, 0.4)
    this.mesh.add(this.weapon)

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.45, 0.08, 0.25)
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    const belt = new THREE.Mesh(beltGeo, beltMat)
    belt.position.set(0, 0.4, 0.05)
    this.mesh.add(belt)

    // Holsters
    const holsterGeo = new THREE.BoxGeometry(0.08, 0.2, 0.1)
    const holsterMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
    const holsterL = new THREE.Mesh(holsterGeo, holsterMat)
    holsterL.position.set(-0.2, 0.35, 0.1)
    this.mesh.add(holsterL)
    const holsterR = new THREE.Mesh(holsterGeo, holsterMat)
    holsterR.position.set(0.2, 0.35, 0.1)
    this.mesh.add(holsterR)

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a })
    const legL = new THREE.Mesh(legGeo, legMat)
    legL.position.set(-0.12, 0.18, 0)
    legL.castShadow = true
    this.mesh.add(legL)
    const legR = new THREE.Mesh(legGeo, legMat)
    legR.position.set(0.12, 0.18, 0)
    legR.castShadow = true
    this.mesh.add(legR)

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18)
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
    const bootL = new THREE.Mesh(bootGeo, bootMat)
    bootL.position.set(-0.12, 0.05, 0.02)
    this.mesh.add(bootL)
    const bootR = new THREE.Mesh(bootGeo, bootMat)
    bootR.position.set(0.12, 0.05, 0.02)
    this.mesh.add(bootR)

    // Backpack
    const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.18)
    const packMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8 })
    const pack = new THREE.Mesh(packGeo, packMat)
    pack.position.set(0, 0.75, -0.28)
    pack.castShadow = true
    this.mesh.add(pack)

    // Antennas
    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4)
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
    const antennaL = new THREE.Mesh(antennaGeo, antennaMat)
    antennaL.position.set(-0.15, 1.45, -0.1)
    this.mesh.add(antennaL)
    const antennaR = new THREE.Mesh(antennaGeo, antennaMat)
    antennaR.position.set(0.15, 1.45, -0.1)
    this.mesh.add(antennaR)

    // Antenna Tips
    const antennaTipGeo = new THREE.SphereGeometry(0.03, 6, 6)
    const antennaTipMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 })
    const antennaTipL = new THREE.Mesh(antennaTipGeo, antennaTipMat)
    antennaTipL.position.set(-0.15, 1.55, -0.1)
    this.mesh.add(antennaTipL)
    const antennaTipR = new THREE.Mesh(
      antennaTipGeo,
      new THREE.MeshBasicMaterial({ color: 0xff4444 })
    )
    antennaTipR.position.set(0.15, 1.55, -0.1)
    this.mesh.add(antennaTipR)
  }

  /**
   * Update animation effects (glow pulse, etc.)
   */
  updateAnimation(delta: number): void {
    this.animTime += delta

    if (this.glowMesh) {
      const pulse = 0.7 + Math.sin(this.animTime * 4) * 0.3
      ;(this.glowMesh.material as THREE.MeshBasicMaterial).opacity = pulse
      const scale = 0.8 + Math.sin(this.animTime * 3) * 0.2
      this.glowMesh.scale.setScalar(scale)
    }
  }

  /**
   * Trigger weapon recoil animation
   */
  triggerRecoil(): void {
    if (this.weapon) {
      const originalZ = 0.4
      this.weapon.position.z = originalZ + 0.15

      const timerId = setTimeout(() => {
        this.activeTimers.delete(timerId)
        if (this.weapon) {
          this.weapon.position.z = originalZ
        }
      }, 50)
      this.activeTimers.add(timerId)
    }
  }

  /**
   * Sync mesh position and rotation with player state
   */
  syncPosition(position: { x: number; y: number; z: number }, rotation: number): void {
    this.mesh.position.set(position.x, position.y, position.z)
    this.mesh.rotation.y = rotation
  }

  /**
   * Get current mesh position
   */
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }

  /**
   * Get current mesh rotation
   */
  getRotation(): number {
    return this.mesh.rotation.y
  }

  /**
   * Dispose all THREE.js resources
   */
  dispose(): void {
    // Clear all active timers
    this.activeTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    this.activeTimers.clear()

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          for (const mat of materials) {
            mat.dispose()
          }
        }
      }
    })
  }
}
