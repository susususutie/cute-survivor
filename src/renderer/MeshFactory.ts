import * as THREE from 'three'
import { materialLibrary } from './MaterialLibrary'
import type { PlayerState } from '../entities/Player'
import { EnemyType, type EnemyState } from '../entities/Enemy'
import type { BulletState } from '../entities/Bullet'

const GRID_COLOR_A = 0x444466
const GRID_COLOR_B = 0x333355
import type { ItemState } from '../entities/Item'

export interface EnemyTypeMeshData {
  type: string
  color: number
}

export interface ItemMeshData {
  type: string
  position: THREE.Vector3
}

export interface RockMeshData {
  x: number
  z: number
  radius: number
  height: number
}

export interface VegetationMeshData {
  type: 'tree' | 'grass' | 'flower' | 'bush'
  x: number
  z: number
  scale: number
}

// ============================================================================
// Pure State Mesh Creation Functions
// ============================================================================

const ENEMY_COLORS: Record<string, number> = {
  goblin: 0x446622,
  orc: 0x557744,
  slime: 0x44aa44,
  bat: 0x443322,
  skeleton: 0xddeeff,
  mushroom: 0xcc2222
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

export function createPlayerMesh(state: PlayerState): THREE.Group {
  const group = new THREE.Group()

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
  group.add(body)

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
  group.add(armor)

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
  group.add(helmet)

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
  group.add(visor)

  // Visor glow
  const visorGlowGeo = new THREE.PlaneGeometry(0.3, 0.06)
  const visorGlowMat = new THREE.MeshBasicMaterial({
    color: 0x44aaff,
    transparent: true,
    opacity: 0.8
  })
  const visorGlow = new THREE.Mesh(visorGlowGeo, visorGlowMat)
  visorGlow.position.set(0, 1.25, 0.28)
  group.add(visorGlow)

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
  group.add(shoulderL)
  const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat)
  shoulderR.position.set(0.4, 0.9, 0)
  shoulderR.castShadow = true
  group.add(shoulderR)

  // Shoulder lights
  const shoulderLightGeo = new THREE.SphereGeometry(0.06, 8, 8)
  const shoulderLightL = new THREE.Mesh(
    shoulderLightGeo,
    new THREE.MeshBasicMaterial({ color: 0xff4444 })
  )
  shoulderLightL.position.set(-0.4, 0.95, 0.08)
  group.add(shoulderLightL)
  const shoulderLightR = new THREE.Mesh(
    shoulderLightGeo,
    new THREE.MeshBasicMaterial({ color: 0x44ff44 })
  )
  shoulderLightR.position.set(0.4, 0.95, 0.08)
  group.add(shoulderLightR)

  // Weapon
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.2,
    metalness: 0.8
  })

  const gunGroup = new THREE.Group()
  const gunBodyGeo = new THREE.BoxGeometry(0.12, 0.15, 0.6)
  const gunBody = new THREE.Mesh(gunBodyGeo, gunMat)
  gunBody.position.set(0, 0, 0.3)
  gunBody.castShadow = true
  gunGroup.add(gunBody)

  const barrelGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8)
  const barrel = new THREE.Mesh(barrelGeo, gunMat)
  barrel.rotation.x = Math.PI / 2
  barrel.position.set(0, 0, 0.65)
  barrel.castShadow = true
  gunGroup.add(barrel)

  const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.08, 8)
  const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffffaa })
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat)
  muzzle.rotation.x = Math.PI / 2
  muzzle.position.set(0, 0, 0.92)
  gunGroup.add(muzzle)

  const glowGeo = new THREE.SphereGeometry(0.04, 8, 8)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x44aaff,
    transparent: true,
    opacity: 0.9
  })
  const glowMesh = new THREE.Mesh(glowGeo, glowMat)
  glowMesh.position.set(0, 0, 0.95)
  gunGroup.add(glowMesh)

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
  gunGroup.add(energy)

  gunGroup.position.set(0, 0.65, 0.4)
  group.add(gunGroup)

  // Belt
  const beltGeo = new THREE.BoxGeometry(0.45, 0.08, 0.25)
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  const belt = new THREE.Mesh(beltGeo, beltMat)
  belt.position.set(0, 0.4, 0.05)
  group.add(belt)

  // Holsters
  const holsterGeo = new THREE.BoxGeometry(0.08, 0.2, 0.1)
  const holsterMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
  const holsterL = new THREE.Mesh(holsterGeo, holsterMat)
  holsterL.position.set(-0.2, 0.35, 0.1)
  group.add(holsterL)
  const holsterR = new THREE.Mesh(holsterGeo, holsterMat)
  holsterR.position.set(0.2, 0.35, 0.1)
  group.add(holsterR)

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a })
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.12, 0.18, 0)
  legL.castShadow = true
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.12, 0.18, 0)
  legR.castShadow = true
  group.add(legR)

  // Boots
  const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18)
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
  const bootL = new THREE.Mesh(bootGeo, bootMat)
  bootL.position.set(-0.12, 0.05, 0.02)
  group.add(bootL)
  const bootR = new THREE.Mesh(bootGeo, bootMat)
  bootR.position.set(0.12, 0.05, 0.02)
  group.add(bootR)

  // Backpack
  const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.18)
  const packMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8 })
  const pack = new THREE.Mesh(packGeo, packMat)
  pack.position.set(0, 0.75, -0.28)
  pack.castShadow = true
  group.add(pack)

  // Antennas
  const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4)
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
  const antennaL = new THREE.Mesh(antennaGeo, antennaMat)
  antennaL.position.set(-0.15, 1.45, -0.1)
  group.add(antennaL)
  const antennaR = new THREE.Mesh(antennaGeo, antennaMat)
  antennaR.position.set(0.15, 1.45, -0.1)
  group.add(antennaR)

  // Antenna tips
  const antennaTipGeo = new THREE.SphereGeometry(0.03, 6, 6)
  const antennaTipL = new THREE.Mesh(antennaTipGeo, new THREE.MeshBasicMaterial({ color: 0x44ff44 }))
  antennaTipL.position.set(-0.15, 1.55, -0.1)
  group.add(antennaTipL)
  const antennaTipR = new THREE.Mesh(
    antennaTipGeo,
    new THREE.MeshBasicMaterial({ color: 0xff4444 })
  )
  antennaTipR.position.set(0.15, 1.55, -0.1)
  group.add(antennaTipR)

  // Set position and rotation from state
  group.position.set(state.position.x, state.position.y, state.position.z)
  group.rotation.y = state.rotation

  return group
}

export function updatePlayerMesh(mesh: THREE.Group, state: PlayerState): void {
  mesh.position.set(state.position.x, state.position.y, state.position.z)
  mesh.rotation.y = state.rotation
}

export function createEnemyMesh(state: EnemyState): THREE.Group {
  const group = new THREE.Group()
  const color = ENEMY_COLORS[state.type] ?? 0x888888

  switch (state.type) {
    case EnemyType.Skeleton:
      buildSkeletonMesh(group)
      break
    case EnemyType.Mushroom:
      buildMushroomMesh(group)
      break
    case EnemyType.Goblin:
      buildGoblinMesh(group, color)
      break
    case EnemyType.Orc:
      buildOrcMesh(group, color)
      break
    case EnemyType.Slime:
      buildSlimeMesh(group, color)
      break
    case EnemyType.Bat:
      buildBatMesh(group, color)
      break
    default:
      buildGoblinMesh(group, color)
  }

  group.position.set(state.position.x, state.position.y, state.position.z)
  group.rotation.y = state.rotation

  return group
}

function buildSkeletonMesh(group: THREE.Group): void {
  const boneColor = 0xddeeff

  const ribGeo = new THREE.BoxGeometry(0.8, 0.1, 0.3)
  const ribMat = new THREE.MeshStandardMaterial({ color: boneColor, roughness: 0.8 })
  const ribcage = new THREE.Mesh(ribGeo, ribMat)
  ribcage.castShadow = true
  ribcage.position.y = 0.5
  group.add(ribcage)

  const spineGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15)
  const spine = new THREE.Mesh(spineGeo, ribMat)
  spine.position.y = 0.4
  group.add(spine)

  const rib2Geo = new THREE.BoxGeometry(0.7, 0.08, 0.25)
  const rib2 = new THREE.Mesh(rib2Geo, ribMat)
  rib2.position.y = 0.65
  group.add(rib2)

  const skullGeo = new THREE.SphereGeometry(0.3, 10, 8)
  const skullMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 })
  const skull = new THREE.Mesh(skullGeo, skullMat)
  skull.castShadow = true
  skull.position.y = 1.1
  skull.scale.set(1, 1.15, 1)
  group.add(skull)

  const eyeSocketGeo = new THREE.SphereGeometry(0.08, 6, 6)
  const eyeSocketMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
  const eyeSocketL = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
  eyeSocketL.position.set(-0.1, 1.15, 0.22)
  group.add(eyeSocketL)
  const eyeSocketR = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
  eyeSocketR.position.set(0.1, 1.15, 0.22)
  group.add(eyeSocketR)

  const jawGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15)
  const jaw = new THREE.Mesh(jawGeo, ribMat)
  jaw.position.set(0, 0.88, 0.2)
  group.add(jaw)

  const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 6)
  const armL = new THREE.Mesh(armGeo, ribMat)
  armL.position.set(-0.5, 0.5, 0)
  armL.rotation.z = 0.3
  group.add(armL)
  const armR = new THREE.Mesh(armGeo, ribMat)
  armR.position.set(0.5, 0.5, 0)
  armR.rotation.z = -0.3
  group.add(armR)

  const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.6, 6)
  const legL = new THREE.Mesh(legGeo, ribMat)
  legL.position.set(-0.2, 0.1, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, ribMat)
  legR.position.set(0.2, 0.1, 0)
  group.add(legR)
}

function buildMushroomMesh(group: THREE.Group): void {
  const capColor = 0xcc2222
  const stemColor = 0xddaa77

  const capGeo = new THREE.SphereGeometry(0.5, 12, 8)
  const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.4 })
  const cap = new THREE.Mesh(capGeo, capMat)
  cap.castShadow = true
  cap.position.y = 0.8
  cap.scale.set(1.3, 0.6, 1.3)
  group.add(cap)

  const spotGeo = new THREE.SphereGeometry(0.08, 6, 6)
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const spot1 = new THREE.Mesh(spotGeo, spotMat)
  spot1.position.set(0.15, 0.85, 0.4)
  group.add(spot1)
  const spot2 = new THREE.Mesh(spotGeo, spotMat)
  spot2.position.set(-0.2, 0.8, 0.35)
  group.add(spot2)
  const spot3 = new THREE.Mesh(spotGeo, spotMat)
  spot3.position.set(0.05, 0.92, 0.28)
  group.add(spot3)

  const stemGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8)
  const stemMat = new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.7 })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.castShadow = true
  stem.position.y = 0.3
  group.add(stem)

  const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.1, 0.35, 0.22)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.1, 0.35, 0.22)
  group.add(eyeR)
}

function buildGoblinMesh(group: THREE.Group, color: number): void {
  const bodyGeo = new THREE.BoxGeometry(0.9, 1, 0.7)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.castShadow = true
  body.position.y = 0.5
  group.add(body)

  const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xcc4433, roughness: 0.5 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.castShadow = true
  head.position.y = 1.15
  group.add(head)

  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.15, 1.2, 0.25)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.15, 1.2, 0.25)
  group.add(eyeR)

  const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 6)
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
  const hornL = new THREE.Mesh(hornGeo, hornMat)
  hornL.position.set(-0.2, 1.5, -0.1)
  hornL.rotation.z = 0.3
  group.add(hornL)
  const hornR = new THREE.Mesh(hornGeo, hornMat)
  hornR.position.set(0.2, 1.5, -0.1)
  hornR.rotation.z = -0.3
  group.add(hornR)

  const armGeo = new THREE.BoxGeometry(0.25, 0.5, 0.2)
  const armMat = new THREE.MeshStandardMaterial({ color })
  const armL = new THREE.Mesh(armGeo, armMat)
  armL.position.set(-0.55, 0.5, 0)
  armL.rotation.z = 0.3
  group.add(armL)
  const armR = new THREE.Mesh(armGeo, armMat)
  armR.position.set(0.55, 0.5, 0)
  armR.rotation.z = -0.3
  group.add(armR)

  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x442211 })
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.25, 0.1, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.25, 0.1, 0)
  group.add(legR)
}

function buildOrcMesh(group: THREE.Group, color: number): void {
  const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.9)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.castShadow = true
  body.position.y = 0.7
  group.add(body)

  const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.7)
  const headMat = new THREE.MeshStandardMaterial({ color: 0x665533, roughness: 0.6 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.castShadow = true
  head.position.y = 1.55
  group.add(head)

  const tuskGeo = new THREE.ConeGeometry(0.08, 0.25, 6)
  const tuskMat = new THREE.MeshStandardMaterial({ color: 0xffffee })
  const tuskL = new THREE.Mesh(tuskGeo, tuskMat)
  tuskL.position.set(-0.2, 1.2, 0.35)
  tuskL.rotation.x = 0.3
  group.add(tuskL)
  const tuskR = new THREE.Mesh(tuskGeo, tuskMat)
  tuskR.position.set(0.2, 1.2, 0.35)
  tuskR.rotation.x = 0.3
  group.add(tuskR)

  const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.2, 1.6, 0.35)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.2, 1.6, 0.35)
  group.add(eyeR)

  const armGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8)
  const armMat = new THREE.MeshStandardMaterial({ color })
  const armL = new THREE.Mesh(armGeo, armMat)
  armL.position.set(-0.7, 0.6, 0)
  armL.rotation.z = 0.2
  group.add(armL)
  const armR = new THREE.Mesh(armGeo, armMat)
  armR.position.set(0.7, 0.6, 0)
  armR.rotation.z = -0.2
  group.add(armR)

  const clubGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 8)
  const clubMat = new THREE.MeshStandardMaterial({ color: 0x4a3520 })
  const club = new THREE.Mesh(clubGeo, clubMat)
  club.position.set(0.75, 0.8, 0.2)
  club.rotation.x = 0.3
  group.add(club)
}

function buildSlimeMesh(group: THREE.Group, color: number): void {
  const bodyGeo = new THREE.SphereGeometry(0.6, 16, 12)
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    roughness: 0.2
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.castShadow = true
  body.position.y = 0.5
  body.scale.set(1, 0.8, 1)
  group.add(body)

  const innerGeo = new THREE.SphereGeometry(0.35, 12, 8)
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4
  })
  const inner = new THREE.Mesh(innerGeo, innerMat)
  inner.position.set(0, 0.55, 0.1)
  group.add(inner)

  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.15, 0.6, 0.35)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.15, 0.6, 0.35)
  group.add(eyeR)
}

function buildBatMesh(group: THREE.Group, color: number): void {
  const bodyGeo = new THREE.SphereGeometry(0.3, 12, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.castShadow = true
  body.position.y = 0.3
  body.scale.set(1, 1.2, 1.5)
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.2, 10, 8)
  const headMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.55
  group.add(head)

  const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4)
  const earMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
  const earL = new THREE.Mesh(earGeo, earMat)
  earL.position.set(-0.1, 0.7, 0)
  group.add(earL)
  const earR = new THREE.Mesh(earGeo, earMat)
  earR.position.set(0.1, 0.7, 0)
  group.add(earR)

  const wingGeo = new THREE.PlaneGeometry(0.8, 0.4)
  const wingMat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7
  })
  const wingL = new THREE.Mesh(wingGeo, wingMat)
  wingL.position.set(-0.5, 0.35, 0)
  group.add(wingL)
  const wingR = new THREE.Mesh(wingGeo, wingMat)
  wingR.position.set(0.5, 0.35, 0)
  group.add(wingR)

  const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.08, 0.58, 0.15)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.08, 0.58, 0.15)
  group.add(eyeR)
}

export function updateEnemyMesh(mesh: THREE.Group, state: EnemyState): void {
  mesh.position.set(state.position.x, state.position.y, state.position.z)
  mesh.rotation.y = state.rotation

  // Animate based on enemy type
  if (state.type === EnemyType.Slime) {
    const scale = 0.8 + Math.sin(state.animPhase) * 0.1
    const body = mesh.children[0] as THREE.Mesh
    if (body) body.scale.set(1, scale, 1)
  } else if (state.type === EnemyType.Bat) {
    const flap = Math.sin(state.animPhase * 2) * 0.3
    const wingL = mesh.children[5] as THREE.Mesh
    const wingR = mesh.children[6] as THREE.Mesh
    if (wingL) wingL.rotation.z = flap
    if (wingR) wingR.rotation.z = -flap
    mesh.position.y = 0.3 + Math.sin(state.animPhase) * 0.2
  }
}

export function createBulletMesh(state: BulletState): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.12, 8, 8)
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(state.position.x, state.position.y, state.position.z)
  return mesh
}

export function updateBulletMesh(mesh: THREE.Mesh, state: BulletState): void {
  mesh.position.set(state.position.x, state.position.y, state.position.z)
}

export function createBulletTrail(): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const mat = new THREE.PointsMaterial({
    size: 0.08,
    color: 0xffaa00,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const trail = new THREE.Points(geo, mat)
  trail.frustumCulled = false
  return trail
}

export function updateBulletTrail(trail: THREE.Points, positions: THREE.Vector3[]): void {
  const posArray = new Float32Array(positions.length * 3)
  for (let i = 0; i < positions.length; i++) {
    posArray[i * 3] = positions[i].x
    posArray[i * 3 + 1] = positions[i].y
    posArray[i * 3 + 2] = positions[i].z
  }
  trail.geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
  trail.geometry.attributes.position.needsUpdate = true
}

export function createItemMesh(state: ItemState): THREE.Group {
  const group = new THREE.Group()
  const color = ITEM_COLORS[state.type] ?? 0xffffff

  let geo: THREE.BufferGeometry
  if (state.type === 'health_potion') {
    geo = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8)
  } else if (state.type === 'speed_potion') {
    geo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8)
  } else {
    geo = new THREE.OctahedronGeometry(0.25, 0)
  }

  const isPotion = state.type === 'health_potion' || state.type === 'speed_potion'
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    transparent: isPotion,
    opacity: isPotion ? 0.9 : 1
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  group.add(mesh)

  // Add bottle for potions
  if (isPotion) {
    const bottleGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const bottleColor = state.type === 'health_potion' ? 0xff6666 : 0x66aaff
    const bottleEmissive = state.type === 'health_potion' ? 0xff0000 : 0x0088ff
    const bottleMat = new THREE.MeshStandardMaterial({
      color: bottleColor,
      emissive: bottleEmissive,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    })
    const bottle = new THREE.Mesh(bottleGeo, bottleMat)
    bottle.position.y = 0.25
    group.add(bottle)
  }

  group.position.set(state.position.x, 0.4, state.position.z)

  return group
}

export function updateItemMesh(group: THREE.Group, state: ItemState, time: number): void {
  if (state.isCollected) return

  const mesh = group.children[0] as THREE.Mesh
  if (mesh) {
    mesh.position.set(state.position.x, 0.4 + Math.sin(time / 300) * 0.1, state.position.z)
    mesh.rotation.y = state.rotation
  }
}

export function disposePlayerMesh(mesh: THREE.Group): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => { m.dispose() })
        } else {
          child.material.dispose()
        }
      }
    }
  })
}

export function disposeEnemyMesh(mesh: THREE.Group): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.dispose()
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.dispose()
        }
      }
    }
  })
}

export function disposeBulletMesh(mesh: THREE.Mesh, trail: THREE.Points): void {
  mesh.geometry.dispose()
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => { m.dispose() })
    } else {
      mesh.material.dispose()
    }
  }
  trail.geometry.dispose()
  ;(trail.material as THREE.Material).dispose()
}

export function disposeItemMesh(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => { m.dispose() })
        } else {
          child.material.dispose()
        }
      }
    }
  })
}

// ============================================================================
// Original MeshFactory Class (for backward compatibility)
// ============================================================================

class MeshFactory {
  createBulletMesh(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(0.12, 8, 8)
    const mesh = new THREE.Mesh(geo, materialLibrary.getBulletMat())
    mesh.castShadow = false
    return mesh
  }

  createTrailMesh(): THREE.Points {
    const geo = new THREE.BufferGeometry()
    const mesh = new THREE.Points(geo, materialLibrary.getTrailMat())
    mesh.frustumCulled = false
    return mesh
  }

  createPlayerGroup(): THREE.Group {
    const group = new THREE.Group()
    const lib = materialLibrary

    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.4, 1.1, 12)
    const body = new THREE.Mesh(bodyGeo, lib.getPlayerBodyMat())
    body.castShadow = true
    body.position.y = 0.55
    group.add(body)

    const armorGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35)
    const armor = new THREE.Mesh(armorGeo, lib.getPlayerArmorMat())
    armor.position.set(0, 0.5, 0.15)
    armor.castShadow = true
    group.add(armor)

    const helmetGeo = new THREE.SphereGeometry(0.26, 16, 12)
    const helmet = new THREE.Mesh(helmetGeo, lib.getPlayerHelmetMat())
    helmet.castShadow = true
    helmet.position.y = 1.25
    group.add(helmet)

    const visorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.15)
    const visor = new THREE.Mesh(visorGeo, lib.getPlayerVisorMat())
    visor.position.set(0, 1.25, 0.2)
    group.add(visor)

    const visorGlowGeo = new THREE.PlaneGeometry(0.3, 0.06)
    const visorGlow = new THREE.Mesh(visorGlowGeo, lib.getPlayerVisorGlowMat())
    visorGlow.position.set(0, 1.25, 0.28)
    group.add(visorGlow)

    const shoulderGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const shoulderL = new THREE.Mesh(shoulderGeo, lib.getPlayerShoulderMat())
    shoulderL.position.set(-0.4, 0.9, 0)
    shoulderL.castShadow = true
    group.add(shoulderL)
    const shoulderR = new THREE.Mesh(shoulderGeo, lib.getPlayerShoulderMat())
    shoulderR.position.set(0.4, 0.9, 0)
    shoulderR.castShadow = true
    group.add(shoulderR)

    const shoulderLightGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const shoulderLightL = new THREE.Mesh(shoulderLightGeo, lib.getPlayerShoulderLightMatL())
    shoulderLightL.position.set(-0.4, 0.95, 0.08)
    group.add(shoulderLightL)
    const shoulderLightR = new THREE.Mesh(shoulderLightGeo, lib.getPlayerShoulderLightMatR())
    shoulderLightR.position.set(0.4, 0.95, 0.08)
    group.add(shoulderLightR)

    const gunGroup = this.createPlayerWeaponGroup()
    gunGroup.position.set(0, 0.65, 0.4)
    group.add(gunGroup)

    const beltGeo = new THREE.BoxGeometry(0.45, 0.08, 0.25)
    const belt = new THREE.Mesh(beltGeo, lib.getPlayerBeltMat())
    belt.position.set(0, 0.4, 0.05)
    group.add(belt)

    const holsterGeo = new THREE.BoxGeometry(0.08, 0.2, 0.1)
    const holsterL = new THREE.Mesh(holsterGeo, lib.getPlayerHolsterMat())
    holsterL.position.set(-0.2, 0.35, 0.1)
    group.add(holsterL)
    const holsterR = new THREE.Mesh(holsterGeo, lib.getPlayerHolsterMat())
    holsterR.position.set(0.2, 0.35, 0.1)
    group.add(holsterR)

    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8)
    const legL = new THREE.Mesh(legGeo, lib.getPlayerLegMat())
    legL.position.set(-0.12, 0.18, 0)
    legL.castShadow = true
    group.add(legL)
    const legR = new THREE.Mesh(legGeo, lib.getPlayerLegMat())
    legR.position.set(0.12, 0.18, 0)
    legR.castShadow = true
    group.add(legR)

    const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18)
    const bootL = new THREE.Mesh(bootGeo, lib.getPlayerBootMat())
    bootL.position.set(-0.12, 0.05, 0.02)
    group.add(bootL)
    const bootR = new THREE.Mesh(bootGeo, lib.getPlayerBootMat())
    bootR.position.set(0.12, 0.05, 0.02)
    group.add(bootR)

    const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.18)
    const pack = new THREE.Mesh(packGeo, lib.getPlayerPackMat())
    pack.position.set(0, 0.75, -0.28)
    pack.castShadow = true
    group.add(pack)

    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4)
    const antennaL = new THREE.Mesh(antennaGeo, lib.getPlayerAntennaMat())
    antennaL.position.set(-0.15, 1.45, -0.1)
    group.add(antennaL)
    const antennaR = new THREE.Mesh(antennaGeo, lib.getPlayerAntennaMat())
    antennaR.position.set(0.15, 1.45, -0.1)
    group.add(antennaR)

    const antennaTipGeo = new THREE.SphereGeometry(0.03, 6, 6)
    const antennaTipL = new THREE.Mesh(antennaTipGeo, lib.getPlayerAntennaTipMatL())
    antennaTipL.position.set(-0.15, 1.55, -0.1)
    group.add(antennaTipL)
    const antennaTipR = new THREE.Mesh(antennaTipGeo, lib.getPlayerAntennaTipMatR())
    antennaTipR.position.set(0.15, 1.55, -0.1)
    group.add(antennaTipR)

    return group
  }

  private createPlayerWeaponGroup(): THREE.Group {
    const lib = materialLibrary
    const gunGroup = new THREE.Group()

    const gunBodyGeo = new THREE.BoxGeometry(0.12, 0.15, 0.6)
    const gunBody = new THREE.Mesh(gunBodyGeo, lib.getPlayerGunMat())
    gunBody.position.set(0, 0, 0.3)
    gunBody.castShadow = true
    gunGroup.add(gunBody)

    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8)
    const barrel = new THREE.Mesh(barrelGeo, lib.getPlayerGunMat())
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0, 0.65)
    barrel.castShadow = true
    gunGroup.add(barrel)

    const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.08, 8)
    const muzzle = new THREE.Mesh(muzzleGeo, lib.getPlayerMuzzleMat())
    muzzle.rotation.x = Math.PI / 2
    muzzle.position.set(0, 0, 0.92)
    gunGroup.add(muzzle)

    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const glow = new THREE.Mesh(glowGeo, lib.getPlayerGlowMat())
    glow.position.set(0, 0, 0.95)
    glow.userData.isWeaponGlow = true
    gunGroup.add(glow)

    const energyGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.3, 6)
    const energy = new THREE.Mesh(energyGeo, lib.getPlayerEnergyMat())
    energy.rotation.x = Math.PI / 2
    energy.position.set(0, 0.06, 0.5)
    gunGroup.add(energy)

    return gunGroup
  }

  createEnemyGroup(data: EnemyTypeMeshData): THREE.Group {
    const group = new THREE.Group()
    const type = data.type
    const color = data.color
    const lib = materialLibrary

    switch (type) {
      case 'goblin':
        this.buildGoblin(group, color, lib)
        break
      case 'orc':
        this.buildOrc(group, color, lib)
        break
      case 'slime':
        this.buildSlime(group, color, lib)
        break
      case 'bat':
        this.buildBat(group, color, lib)
        break
      case 'skeleton':
        this.buildSkeleton(group, lib)
        break
      case 'mushroom':
        this.buildMushroom(group, lib)
        break
      default:
        this.buildGoblin(group, color, lib)
    }

    return group
  }

  private buildGoblin(group: THREE.Group, color: number, lib: typeof materialLibrary): void {
    const bodyGeo = new THREE.BoxGeometry(0.9, 1, 0.7)
    const body = new THREE.Mesh(bodyGeo, lib.getEnemyBodyMat(color))
    body.castShadow = true
    body.position.y = 0.5
    group.add(body)

    const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5)
    const head = new THREE.Mesh(headGeo, lib.getEnemyHeadMat(0xcc4433))
    head.castShadow = true
    head.position.y = 1.15
    group.add(head)

    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeL = new THREE.Mesh(eyeGeo, lib.getEnemyEyeMat())
    eyeL.position.set(-0.15, 1.2, 0.25)
    group.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, lib.getEnemyEyeMat())
    eyeR.position.set(0.15, 1.2, 0.25)
    group.add(eyeR)

    const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 6)
    const hornL = new THREE.Mesh(hornGeo, lib.getEnemyHornMat())
    hornL.position.set(-0.2, 1.5, -0.1)
    hornL.rotation.z = 0.3
    group.add(hornL)
    const hornR = new THREE.Mesh(hornGeo, lib.getEnemyHornMat())
    hornR.position.set(0.2, 1.5, -0.1)
    hornR.rotation.z = -0.3
    group.add(hornR)

    const armGeo = new THREE.BoxGeometry(0.25, 0.5, 0.2)
    const armMat = lib.getEnemyBodyMat(color)
    const armL = new THREE.Mesh(armGeo, armMat)
    armL.position.set(-0.55, 0.5, 0)
    armL.rotation.z = 0.3
    group.add(armL)
    const armR = new THREE.Mesh(armGeo, armMat)
    armR.position.set(0.55, 0.5, 0)
    armR.rotation.z = -0.3
    group.add(armR)

    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8)
    const legL = new THREE.Mesh(legGeo, lib.getEnemyLegMat())
    legL.position.set(-0.25, 0.1, 0)
    group.add(legL)
    const legR = new THREE.Mesh(legGeo, lib.getEnemyLegMat())
    legR.position.set(0.25, 0.1, 0)
    group.add(legR)
  }

  private buildOrc(group: THREE.Group, color: number, lib: typeof materialLibrary): void {
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.9)
    const body = new THREE.Mesh(bodyGeo, lib.getEnemyBodyMat(color))
    body.castShadow = true
    body.position.y = 0.7
    group.add(body)

    const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.7)
    const head = new THREE.Mesh(headGeo, lib.getEnemyOrcHeadMat())
    head.castShadow = true
    head.position.y = 1.55
    group.add(head)

    const tuskL = new THREE.Mesh(lib.getEnemyOrcTuskGeo(), lib.getEnemyOrcTuskMat())
    tuskL.position.set(-0.2, 1.2, 0.35)
    tuskL.rotation.x = 0.3
    group.add(tuskL)
    const tuskR = new THREE.Mesh(lib.getEnemyOrcTuskGeo(), lib.getEnemyOrcTuskMat())
    tuskR.position.set(0.2, 1.2, 0.35)
    tuskR.rotation.x = 0.3
    group.add(tuskR)

    const eyeL = new THREE.Mesh(lib.getEnemyOrcEyeGeo(), lib.getEnemyOrcEyeMat())
    eyeL.position.set(-0.2, 1.6, 0.35)
    group.add(eyeL)
    const eyeR = new THREE.Mesh(lib.getEnemyOrcEyeGeo(), lib.getEnemyOrcEyeMat())
    eyeR.position.set(0.2, 1.6, 0.35)
    group.add(eyeR)

    const armL = new THREE.Mesh(lib.getEnemyOrcArmGeo(), lib.getEnemyBodyMat(color))
    armL.position.set(-0.7, 0.6, 0)
    armL.rotation.z = 0.2
    group.add(armL)
    const armR = new THREE.Mesh(lib.getEnemyOrcArmGeo(), lib.getEnemyBodyMat(color))
    armR.position.set(0.7, 0.6, 0)
    armR.rotation.z = -0.2
    group.add(armR)

    const club = new THREE.Mesh(lib.getEnemyOrcClubGeo(), lib.getEnemyOrcClubMat())
    club.position.set(0.75, 0.8, 0.2)
    club.rotation.x = 0.3
    group.add(club)
  }

  private buildSlime(group: THREE.Group, color: number, lib: typeof materialLibrary): void {
    const bodyGeo = new THREE.SphereGeometry(0.6, 16, 12)
    const body = new THREE.Mesh(bodyGeo, lib.getEnemySlimeBodyMat(color))
    body.castShadow = true
    body.position.y = 0.5
    body.scale.set(1, 0.8, 1)
    group.add(body)

    const innerGeo = new THREE.SphereGeometry(0.35, 12, 8)
    const inner = new THREE.Mesh(innerGeo, lib.getEnemySlimeInnerMat())
    inner.position.set(0, 0.55, 0.1)
    group.add(inner)

    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeL = new THREE.Mesh(eyeGeo, lib.getEnemySlimeEyeMat())
    eyeL.position.set(-0.15, 0.6, 0.35)
    group.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, lib.getEnemySlimeEyeMat())
    eyeR.position.set(0.15, 0.6, 0.35)
    group.add(eyeR)
  }

  private buildBat(group: THREE.Group, color: number, lib: typeof materialLibrary): void {
    const bodyGeo = new THREE.SphereGeometry(0.3, 12, 8)
    const body = new THREE.Mesh(bodyGeo, lib.getEnemyBodyMat(color))
    body.castShadow = true
    body.position.y = 0.3
    body.scale.set(1, 1.2, 1.5)
    group.add(body)

    const headGeo = new THREE.SphereGeometry(0.2, 10, 8)
    const head = new THREE.Mesh(headGeo, lib.getEnemyBatEarMat())
    head.position.y = 0.55
    group.add(head)

    const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4)
    const earL = new THREE.Mesh(earGeo, lib.getEnemyBatEarMat())
    earL.position.set(-0.1, 0.7, 0)
    group.add(earL)
    const earR = new THREE.Mesh(earGeo, lib.getEnemyBatEarMat())
    earR.position.set(0.1, 0.7, 0)
    group.add(earR)

    const wingGeo = new THREE.PlaneGeometry(0.8, 0.4)
    const wingL = new THREE.Mesh(wingGeo, lib.getEnemyBatWingMat(color))
    wingL.position.set(-0.5, 0.35, 0)
    group.add(wingL)
    const wingR = new THREE.Mesh(wingGeo, lib.getEnemyBatWingMat(color))
    wingR.position.set(0.5, 0.35, 0)
    group.add(wingR)

    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6)
    const eyeL = new THREE.Mesh(eyeGeo, lib.getEnemyBatEyeMat())
    eyeL.position.set(-0.08, 0.58, 0.15)
    group.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, lib.getEnemyBatEyeMat())
    eyeR.position.set(0.08, 0.58, 0.15)
    group.add(eyeR)
  }

  private buildSkeleton(group: THREE.Group, lib: typeof materialLibrary): void {
    const boneMat = lib.getEnemyBoneMat()
    const ribGeo = new THREE.BoxGeometry(0.8, 0.1, 0.3)
    const ribcage = new THREE.Mesh(ribGeo, boneMat)
    ribcage.castShadow = true
    ribcage.position.y = 0.5
    group.add(ribcage)

    const spineGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15)
    const spine = new THREE.Mesh(spineGeo, boneMat)
    spine.position.y = 0.4
    group.add(spine)

    const rib2Geo = new THREE.BoxGeometry(0.7, 0.08, 0.25)
    const rib2 = new THREE.Mesh(rib2Geo, boneMat)
    rib2.position.y = 0.65
    group.add(rib2)

    const skullGeo = new THREE.SphereGeometry(0.3, 10, 8)
    const skull = new THREE.Mesh(skullGeo, lib.getEnemySkullMat())
    skull.castShadow = true
    skull.position.y = 1.1
    skull.scale.set(1, 1.15, 1)
    group.add(skull)

    const eyeSocketGeo = new THREE.SphereGeometry(0.08, 6, 6)
    const eyeSocketL = new THREE.Mesh(eyeSocketGeo, lib.getEnemyEyeSocketMat())
    eyeSocketL.position.set(-0.1, 1.15, 0.22)
    group.add(eyeSocketL)
    const eyeSocketR = new THREE.Mesh(eyeSocketGeo, lib.getEnemyEyeSocketMat())
    eyeSocketR.position.set(0.1, 1.15, 0.22)
    group.add(eyeSocketR)

    const jawGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15)
    const jaw = new THREE.Mesh(jawGeo, boneMat)
    jaw.position.set(0, 0.88, 0.2)
    group.add(jaw)

    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 6)
    const armL = new THREE.Mesh(armGeo, boneMat)
    armL.position.set(-0.5, 0.5, 0)
    armL.rotation.z = 0.3
    group.add(armL)
    const armR = new THREE.Mesh(armGeo, boneMat)
    armR.position.set(0.5, 0.5, 0)
    armR.rotation.z = -0.3
    group.add(armR)

    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.6, 6)
    const legL = new THREE.Mesh(legGeo, boneMat)
    legL.position.set(-0.2, 0.1, 0)
    group.add(legL)
    const legR = new THREE.Mesh(legGeo, boneMat)
    legR.position.set(0.2, 0.1, 0)
    group.add(legR)
  }

  private buildMushroom(group: THREE.Group, lib: typeof materialLibrary): void {
    const capGeo = new THREE.SphereGeometry(0.5, 12, 8)
    const cap = new THREE.Mesh(capGeo, lib.getEnemyMushroomCapMat())
    cap.castShadow = true
    cap.position.y = 0.8
    cap.scale.set(1.3, 0.6, 1.3)
    group.add(cap)

    const spotGeo = new THREE.SphereGeometry(0.08, 6, 6)
    const spot1 = new THREE.Mesh(spotGeo, lib.getEnemyMushroomSpotMat())
    spot1.position.set(0.15, 0.85, 0.4)
    group.add(spot1)
    const spot2 = new THREE.Mesh(spotGeo, lib.getEnemyMushroomSpotMat())
    spot2.position.set(-0.2, 0.8, 0.35)
    group.add(spot2)
    const spot3 = new THREE.Mesh(spotGeo, lib.getEnemyMushroomSpotMat())
    spot3.position.set(0.05, 0.92, 0.28)
    group.add(spot3)

    const stemGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8)
    const stem = new THREE.Mesh(stemGeo, lib.getEnemyMushroomStemMat())
    stem.castShadow = true
    stem.position.y = 0.3
    group.add(stem)

    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6)
    const eyeL = new THREE.Mesh(eyeGeo, lib.getEnemyMushroomEyeMat())
    eyeL.position.set(-0.1, 0.35, 0.22)
    group.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, lib.getEnemyMushroomEyeMat())
    eyeR.position.set(0.1, 0.35, 0.22)
    group.add(eyeR)
  }

  createItemMesh(data: ItemMeshData): THREE.Group {
    const group = new THREE.Group()
    const colors = materialLibrary.getItemColors()
    const color = colors[data.type] ?? 0xffdd00
    const isPotion = data.type === 'health_potion' || data.type === 'speed_potion'

    let geo: THREE.BufferGeometry
    if (isPotion) {
      geo =
        data.type === 'health_potion'
          ? new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8)
          : new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8)
    } else {
      geo = new THREE.OctahedronGeometry(0.25, 0)
    }

    const mat = materialLibrary.getItemMat(color, 0.4, isPotion, isPotion ? 0.9 : 1)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    group.add(mesh)

    if (isPotion) {
      const bottleGeo = new THREE.SphereGeometry(0.1, 8, 8)
      const bottleColor = data.type === 'health_potion' ? 0xff6666 : 0x66aaff
      const bottleEmissive = data.type === 'health_potion' ? 0xff0000 : 0x0088ff
      const bottleMat = new THREE.MeshStandardMaterial({
        color: bottleColor,
        emissive: bottleEmissive,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      })
      const bottle = new THREE.Mesh(bottleGeo, bottleMat)
      bottle.position.y = 0.25
      group.add(bottle)
    }

    group.position.copy(data.position)
    group.position.y = 0.4
    group.userData.itemType = data.type

    return group
  }

  createRockMesh(data: RockMeshData): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(data.radius, 0)
    const mesh = new THREE.Mesh(geo, materialLibrary.getRockMat())
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(data.x, data.height * 0.5, data.z)
    mesh.scale.y = data.height / data.radius
    mesh.name = `rock_${data.x}_${data.z}`
    return mesh
  }

  createVegetationMesh(data: VegetationMeshData): THREE.Group {
    const group = new THREE.Group()
    const lib = materialLibrary

    switch (data.type) {
      case 'tree':
        this.buildTree(group, data, lib)
        break
      case 'grass':
        this.buildGrass(group, data, lib)
        break
      case 'flower':
        this.buildFlower(group, data, lib)
        break
      case 'bush':
        this.buildBush(group, data, lib)
        break
    }

    return group
  }

  private buildTree(group: THREE.Group, data: VegetationMeshData, lib: typeof materialLibrary): void {
    const trunkGeo = new THREE.CylinderGeometry(0.1 * data.scale, 0.15 * data.scale, 1 * data.scale, 8)
    const trunk = new THREE.Mesh(trunkGeo, lib.getVegetationTrunkMat())
    trunk.position.set(data.x, 0.5 * data.scale, data.z)
    trunk.castShadow = true
    group.add(trunk)

    const leavesGeo = new THREE.SphereGeometry(0.6 * data.scale, 8, 6)
    const leaves = new THREE.Mesh(leavesGeo, lib.getVegetationLeavesMat())
    leaves.position.set(data.x, 1.2 * data.scale, data.z)
    leaves.castShadow = true
    group.add(leaves)
  }

  private buildGrass(group: THREE.Group, data: VegetationMeshData, lib: typeof materialLibrary): void {
    const grassGeo = new THREE.ConeGeometry(0.15 * data.scale, 0.5 * data.scale, 4)
    const grass = new THREE.Mesh(grassGeo, lib.getVegetationGrassMat())
    grass.position.set(data.x, 0.25 * data.scale, data.z)
    group.add(grass)
  }

  private buildFlower(group: THREE.Group, data: VegetationMeshData, lib: typeof materialLibrary): void {
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3 * data.scale, 4)
    const stem = new THREE.Mesh(stemGeo, lib.getVegetationStemMat())
    stem.position.set(data.x, 0.15 * data.scale, data.z)
    group.add(stem)

    const petalColor = Math.random() > 0.5 ? 0xff66aa : 0xffaa66
    const petalGeo = new THREE.SphereGeometry(0.1 * data.scale, 6, 6)
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColor,
      emissive: 0xff6688,
      emissiveIntensity: 0.2
    })
    const petal = new THREE.Mesh(petalGeo, petalMat)
    petal.position.set(data.x, 0.35 * data.scale, data.z)
    group.add(petal)
  }

  private buildBush(group: THREE.Group, data: VegetationMeshData, lib: typeof materialLibrary): void {
    const bushGeo = new THREE.SphereGeometry(0.4 * data.scale, 8, 6)
    const bush = new THREE.Mesh(bushGeo, lib.getVegetationBushMat())
    bush.position.set(data.x, 0.25 * data.scale, data.z)
    bush.scale.set(1.2, 0.8, 1.2)
    bush.castShadow = true
    group.add(bush)
  }

  createGroundPlane(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(200, 200)
    const mesh = new THREE.Mesh(geo, materialLibrary.getGroundMat())
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = -0.01
    mesh.receiveShadow = true
    mesh.name = 'groundPlane'
    return mesh
  }

  createGridHelper(): THREE.GridHelper {
    const grid = new THREE.GridHelper(200, 100, GRID_COLOR_A, GRID_COLOR_B)
    grid.name = 'groundGrid'
    return grid
  }

  createKillEffectParticles(position: THREE.Vector3): THREE.Points {
    const particleCount = 50
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities: THREE.Vector3[] = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y + 0.5
      positions[i * 3 + 2] = position.z

      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 6
      velocities.push(
        new THREE.Vector3(Math.cos(angle) * speed, 3 + Math.random() * 5, Math.sin(angle) * speed)
      )

      const color = new THREE.Color()
      const hue = Math.random() < 0.5 ? 0.05 + Math.random() * 0.1 : 0.5 + Math.random() * 0.2
      color.setHSL(hue, 1, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const particles = new THREE.Points(geometry, material)
    particles.userData = { velocities, life: 1.2 }
    return particles
  }

  createKillEffectRing(position: THREE.Vector3): THREE.Mesh {
    const geo = new THREE.RingGeometry(0.1, 0.3, 32)
    const mesh = new THREE.Mesh(geo, materialLibrary.getKillRingMat())
    mesh.position.set(position.x, position.y + 0.3, position.z)
    mesh.rotation.x = -Math.PI / 2
    mesh.userData = { isRing: true, life: 0.5, scale: 1 }
    return mesh
  }

  disposeMesh(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => { m.dispose() })
          } else {
            child.material.dispose()
          }
        }
      }
    })
  }
}

export const meshFactory = new MeshFactory()
