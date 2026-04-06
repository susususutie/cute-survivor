import * as THREE from 'three'
import { Player } from '../entities/Player'
import { BulletManager } from '../systems/BulletSystem'
import { EnemyManager, EnemyType } from '../entities/Enemy'
import type { EnemyConfig } from '../entities/Enemy'
import { MapGenerator } from '../systems/MapGenerator'
import type { MapData, Vegetation } from '../systems/MapGenerator'
import { ItemManager, ItemType } from '../systems/ItemSystem'
import { UIManager } from '../systems/UIManager'
import { AudioManager } from '../systems/AudioManager'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock
  private player!: Player
  private bulletManager!: BulletManager
  private enemyBulletManager!: BulletManager
  private enemyManager!: EnemyManager
  private mapGenerator!: MapGenerator
  private mapData!: MapData
  private itemManager!: ItemManager
  private uiManager!: UIManager
  private audioManager!: AudioManager
  private bounds = 1000
  private ammo = 30
  private maxAmmo = 30
  private lastShotTime = 0
  private fireRate = 0.3
  private enemySpawnTimer = 0
  private gold = 0
  private herbs = 0
  private ores = 0
  private isPaused = false
  private isGameOver = false
  private terrainChunks = new Map<string, THREE.Group>()
  private currentChunkX = 0
  private currentChunkZ = 0
  private chunkSize = 24
  private loadDistance = 2

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
    this.camera.position.set(0, 25, 20)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const app = document.getElementById('app')
    if (app) {
      app.appendChild(this.renderer.domElement)
    }

    this.clock = new THREE.Clock()
  }

  init(): void {
    this.uiManager = new UIManager()
    this.audioManager = new AudioManager()
    this.generateMap()
    this.createLights()
    this.createGround()
    this.createPlayer()
    this.bulletManager = new BulletManager(this.scene)
    this.enemyBulletManager = new BulletManager(this.scene)
    this.enemyManager = new EnemyManager(this.scene)
    this.itemManager = new ItemManager(this.scene)
    this.createMapObjects()
    this.spawnInitialEnemies()
    this.handleInput()
    this.handleResize()
    this.animate()
    this.audioManager.startBGM()
  }

  private generateMap(): void {
    this.mapGenerator = new MapGenerator(Date.now(), this.bounds)
    this.mapData = this.mapGenerator.generate()
  }

  private createMapObjects(): void {
    const rockMeshes: THREE.Mesh[] = []

    for (const rock of this.mapData.rocks) {
      const geo = new THREE.DodecahedronGeometry(rock.radius, 0)
      const mat = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(rock.x, rock.height * 0.5, rock.z)
      mesh.scale.y = rock.height / rock.radius
      this.scene.add(mesh)
      rockMeshes.push(mesh)
    }

    for (const veg of this.mapData.vegetation) {
      this.createVegetationMesh(veg)
    }

    for (const t of this.mapData.terrain) {
      const geo = new THREE.CylinderGeometry(2, 3, t.height + 0.5, 8)
      const mat = new THREE.MeshStandardMaterial({
        color: t.height > 0.5 ? 0x3a5a3a : 0x4a6a4a,
        roughness: 0.9
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(t.x, t.height / 2, t.z)
      mesh.receiveShadow = true
      this.scene.add(mesh)
    }

    for (const res of this.mapData.resources) {
      const geo = new THREE.OctahedronGeometry(0.3, 0)
      const color = res.type === 'herb' ? 0x44ff88 : 0x8888ff
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      mesh.position.set(res.x, 0.5, res.z)
      this.scene.add(mesh)
    }

    this.player.setRocks(this.mapData.rocks)
    this.player.setRockMeshes(rockMeshes)

    this.updateTerrainChunks()
  }

  private updateTerrainChunks(): void {
    for (let dx = -this.loadDistance; dx <= this.loadDistance; dx++) {
      for (let dz = -this.loadDistance; dz <= this.loadDistance; dz++) {
        const cx = this.currentChunkX + dx
        const cz = this.currentChunkZ + dz
        const key = `${cx},${cz}`

        if (this.terrainChunks.has(key)) continue

        const chunkData = this.mapGenerator.generateChunk(cx, cz)
        const chunkGroup = new THREE.Group()
        chunkGroup.name = `chunk_${key}`

        for (const rock of chunkData.rocks) {
          const geo = new THREE.DodecahedronGeometry(rock.radius, 0)
          const mat = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8 })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.castShadow = true
          mesh.receiveShadow = true
          mesh.position.set(rock.x, rock.height * 0.5, rock.z)
          mesh.scale.y = rock.height / rock.radius
          chunkGroup.add(mesh)
        }

        for (const veg of chunkData.vegetation) {
          this.createVegetationMeshInChunk(veg, chunkGroup)
        }

        for (const res of chunkData.resources) {
          const geo = new THREE.OctahedronGeometry(0.3, 0)
          const color = res.type === 'herb' ? 0x44ff88 : 0x8888ff
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3
          })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.castShadow = true
          mesh.position.set(res.x, 0.5, res.z)
          chunkGroup.add(mesh)
        }

        this.scene.add(chunkGroup)
        this.terrainChunks.set(key, chunkGroup)
      }
    }

    const allRocks = [...this.mapData.rocks, ...this.getAllChunkRocks()]
    this.player.setRocks(allRocks)
    this.enemyManager.setRocks(allRocks)

    this.cleanupDistantChunks()
  }

  private getAllChunkRocks(): { x: number; z: number; radius: number; height: number }[] {
    const rocks: { x: number; z: number; radius: number; height: number }[] = []
    for (const [, chunk] of this.terrainChunks) {
      chunk.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.DodecahedronGeometry) {
          rocks.push({
            x: obj.position.x,
            z: obj.position.z,
            radius: 0.6,
            height: 1
          })
        }
      })
    }
    return rocks
  }

  private getAllRocks(): { x: number; z: number; radius: number; height: number }[] {
    return [...this.mapData.rocks, ...this.getAllChunkRocks()]
  }

  private createVegetationMeshInChunk(veg: Vegetation, parent: THREE.Group): void {
    switch (veg.type) {
      case 'tree':
        const trunkGeo = new THREE.CylinderGeometry(
          0.1 * veg.scale,
          0.15 * veg.scale,
          1 * veg.scale,
          8
        )
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })
        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.position.set(veg.x, 0.5 * veg.scale, veg.z)
        trunk.castShadow = true
        parent.add(trunk)

        const leavesGeo = new THREE.SphereGeometry(0.6 * veg.scale, 8, 6)
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.8 })
        const leaves = new THREE.Mesh(leavesGeo, leavesMat)
        leaves.position.set(veg.x, 1.2 * veg.scale, veg.z)
        leaves.castShadow = true
        parent.add(leaves)
        break

      case 'grass':
        const grassGeo = new THREE.ConeGeometry(0.15 * veg.scale, 0.5 * veg.scale, 4)
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x4a8a4a })
        const grass = new THREE.Mesh(grassGeo, grassMat)
        grass.position.set(veg.x, 0.25 * veg.scale, veg.z)
        parent.add(grass)
        break

      case 'flower':
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3 * veg.scale, 4)
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a })
        const stem = new THREE.Mesh(stemGeo, stemMat)
        stem.position.set(veg.x, 0.15 * veg.scale, veg.z)
        parent.add(stem)

        const petalGeo = new THREE.SphereGeometry(0.1 * veg.scale, 6, 6)
        const petalMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff66aa : 0xffaa66,
          emissive: 0xff6688,
          emissiveIntensity: 0.2
        })
        const petal = new THREE.Mesh(petalGeo, petalMat)
        petal.position.set(veg.x, 0.35 * veg.scale, veg.z)
        parent.add(petal)
        break

      case 'bush':
        const bushGeo = new THREE.SphereGeometry(0.4 * veg.scale, 8, 6)
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.9 })
        const bush = new THREE.Mesh(bushGeo, bushMat)
        bush.position.set(veg.x, 0.25 * veg.scale, veg.z)
        bush.scale.set(1.2, 0.8, 1.2)
        bush.castShadow = true
        parent.add(bush)
        break
    }
  }

  private cleanupDistantChunks(): void {
    const toRemove: string[] = []
    for (const [key] of this.terrainChunks) {
      const [cx, cz] = key.split(',').map(Number)
      const dx = Math.abs(cx - this.currentChunkX)
      const dz = Math.abs(cz - this.currentChunkZ)
      if (dx > this.loadDistance + 1 || dz > this.loadDistance + 1) {
        toRemove.push(key)
      }
    }
    for (const key of toRemove) {
      const chunk = this.terrainChunks.get(key)
      if (chunk) {
        this.scene.remove(chunk)
        chunk.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose()
            }
          }
        })
      }
      this.terrainChunks.delete(key)
    }
  }

  private createVegetationMesh(veg: Vegetation): void {
    switch (veg.type) {
      case 'tree':
        const trunkGeo = new THREE.CylinderGeometry(
          0.1 * veg.scale,
          0.15 * veg.scale,
          1 * veg.scale,
          8
        )
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })
        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.position.set(veg.x, 0.5 * veg.scale, veg.z)
        trunk.castShadow = true
        this.scene.add(trunk)

        const leavesGeo = new THREE.SphereGeometry(0.6 * veg.scale, 8, 6)
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.8 })
        const leaves = new THREE.Mesh(leavesGeo, leavesMat)
        leaves.position.set(veg.x, 1.2 * veg.scale, veg.z)
        leaves.castShadow = true
        this.scene.add(leaves)
        break

      case 'grass':
        const grassGeo = new THREE.ConeGeometry(0.15 * veg.scale, 0.5 * veg.scale, 4)
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x4a8a4a })
        const grass = new THREE.Mesh(grassGeo, grassMat)
        grass.position.set(veg.x, 0.25 * veg.scale, veg.z)
        this.scene.add(grass)
        break

      case 'flower':
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3 * veg.scale, 4)
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a })
        const stem = new THREE.Mesh(stemGeo, stemMat)
        stem.position.set(veg.x, 0.15 * veg.scale, veg.z)
        this.scene.add(stem)

        const petalGeo = new THREE.SphereGeometry(0.1 * veg.scale, 6, 6)
        const petalMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff66aa : 0xffaa66,
          emissive: 0xff6688,
          emissiveIntensity: 0.2
        })
        const petal = new THREE.Mesh(petalGeo, petalMat)
        petal.position.set(veg.x, 0.35 * veg.scale, veg.z)
        this.scene.add(petal)
        break

      case 'bush':
        const bushGeo = new THREE.SphereGeometry(0.4 * veg.scale, 8, 6)
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.9 })
        const bush = new THREE.Mesh(bushGeo, bushMat)
        bush.position.set(veg.x, 0.25 * veg.scale, veg.z)
        bush.scale.set(1.2, 0.8, 1.2)
        bush.castShadow = true
        this.scene.add(bush)
        break
    }
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xfff5e0, 1)
    directional.position.set(15, 30, 10)
    directional.castShadow = true
    directional.shadow.mapSize.width = 2048
    directional.shadow.mapSize.height = 2048
    directional.shadow.camera.near = 0.5
    directional.shadow.camera.far = 100
    directional.shadow.camera.left = -30
    directional.shadow.camera.right = 30
    directional.shadow.camera.top = 30
    directional.shadow.camera.bottom = -30
    this.scene.add(directional)
  }

  private createGround(): void {
    const gridSize = 200
    const gridDivisions = 100

    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444466, 0x333355)
    gridHelper.name = 'groundGrid'
    this.scene.add(gridHelper)

    const groundGeo = new THREE.PlaneGeometry(gridSize, gridSize)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222233 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    ground.name = 'groundPlane'
    this.scene.add(ground)
  }

  private updateGround(): void {
    const playerPos = this.player.mesh.position
    const gridHelper = this.scene.getObjectByName('groundGrid') as THREE.GridHelper
    const groundPlane = this.scene.getObjectByName('groundPlane') as THREE.Mesh

    if (gridHelper) {
      gridHelper.position.x = playerPos.x
      gridHelper.position.z = playerPos.z
    }
    if (groundPlane) {
      groundPlane.position.x = playerPos.x
      groundPlane.position.z = playerPos.z
    }
  }

  private createPlayer(): void {
    this.player = new Player()
    this.scene.add(this.player.mesh)
  }

  private spawnInitialEnemies(): void {
    const playerPos = this.player.mesh.position

    for (let i = 0; i < 8; i++) {
      this.spawnEnemyNearPlayer(playerPos)
    }
  }

  private spawnEnemyNearPlayer(playerPos: THREE.Vector3): void {
    const enemyTypes: EnemyType[] = [
      EnemyType.Goblin,
      EnemyType.Orc,
      EnemyType.Slime,
      EnemyType.Bat
    ]
    const colors: Record<EnemyType, number> = {
      [EnemyType.Goblin]: 0x44aa44,
      [EnemyType.Orc]: 0x665533,
      [EnemyType.Slime]: 0x44ff88,
      [EnemyType.Bat]: 0x443366
    }
    const stats: Record<
      EnemyType,
      {
        hp: number
        speed: number
        damage: number
        detectRange: number
        attackRange: number
        hasRangedAttack?: boolean
        rangedAttackRange?: number
        rangedAttackDamage?: number
        rangedAttackCooldown?: number
      }
    > = {
      [EnemyType.Goblin]: {
        hp: 40,
        speed: 3.5,
        damage: 8,
        detectRange: 12,
        attackRange: 1.2,
        hasRangedAttack: true,
        rangedAttackRange: 12,
        rangedAttackDamage: 8,
        rangedAttackCooldown: 2
      },
      [EnemyType.Orc]: { hp: 80, speed: 2, damage: 15, detectRange: 10, attackRange: 1.5 },
      [EnemyType.Slime]: { hp: 30, speed: 2.5, damage: 5, detectRange: 8, attackRange: 1 },
      [EnemyType.Bat]: { hp: 20, speed: 5, damage: 4, detectRange: 15, attackRange: 0.8 }
    }

    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
    const config: EnemyConfig = {
      type,
      hp: stats[type].hp,
      speed: stats[type].speed,
      damage: stats[type].damage,
      detectRange: stats[type].detectRange,
      attackRange: stats[type].attackRange,
      color: colors[type],
      hasRangedAttack: stats[type].hasRangedAttack,
      rangedAttackRange: stats[type].rangedAttackRange,
      rangedAttackDamage: stats[type].rangedAttackDamage,
      rangedAttackCooldown: stats[type].rangedAttackCooldown
    }

    const angle = Math.random() * Math.PI * 2
    const distance = 15 + Math.random() * 20
    const x = playerPos.x + Math.cos(angle) * distance
    const z = playerPos.z + Math.sin(angle) * distance

    this.enemyManager.spawnAtWithCallback(
      config,
      new THREE.Vector3(x, 0, z),
      this.getAllRocks(),
      (pos, dir, dmg) => (this.enemyBulletManager.fire(pos, dir, 12).state.damage = dmg)
    )
  }

  private handleInput(): void {
    window.addEventListener('mousedown', () => {
      if (this.isPaused || this.isGameOver) return

      const now = performance.now() / 1000
      if (now - this.lastShotTime >= this.fireRate && this.ammo > 0) {
        this.lastShotTime = now
        this.ammo--

        const dir = this.player.getDirection()
        const pos = this.player.getMuzzlePosition()
        this.bulletManager.fire(pos, dir, 15)
        this.audioManager.playShoot()
      }
    })

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isGameOver) return
        this.isPaused = !this.isPaused
        if (this.isPaused) {
          this.uiManager.showPauseMenu()
        } else {
          this.uiManager.hidePauseMenu()
        }
      }
      if (e.key.toLowerCase() === 'r' && this.isGameOver) {
        location.reload()
      }
      if (e.key.toLowerCase() === 'm') {
        this.audioManager.toggleMute()
      }
    })
  }

  private handleResize(): void {
    window.addEventListener('resize', () => {
      const aspect = window.innerWidth / window.innerHeight
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  private updateCamera(): void {
    const targetX = this.player.mesh.position.x
    const targetZ = this.player.mesh.position.z + 20

    this.camera.position.x = targetX
    this.camera.position.z = targetZ
    this.camera.position.y = 25
    this.camera.lookAt(this.player.mesh.position.x, 0, this.player.mesh.position.z)
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    if (this.isPaused || this.isGameOver) {
      this.renderer.render(this.scene, this.camera)
      return
    }

    const delta = this.clock.getDelta()
    this.update(delta)
    this.renderer.render(this.scene, this.camera)
  }

  private collectItems(): void {
    const collected = this.itemManager.collectItemsInRange(this.player.mesh.position, 1.5)

    if (collected.length > 0) {
      this.audioManager.playPickup()
    }

    for (const item of collected) {
      switch (item.type) {
        case ItemType.Gold:
          this.gold += item.value
          break
        case ItemType.Ammo:
          this.ammo = Math.min(this.ammo + item.value, this.maxAmmo)
          break
        case ItemType.Herb:
          this.herbs += item.value
          break
        case ItemType.Ore:
          this.ores += item.value
          break
        case ItemType.HealthPotion:
          this.player.heal(item.value)
          break
        case ItemType.SpeedPotion:
          this.player.applySpeedBoost(item.value, 5)
          break
      }
    }
  }

  private checkBulletEnemyCollisions(): void {
    const bullets = this.bulletManager.getBullets()
    const enemies = this.enemyManager.getEnemies()

    for (const bullet of bullets) {
      for (const enemy of enemies) {
        const dist = bullet.getPosition().distanceTo(enemy.getPosition())
        if (dist < 1) {
          this.createKillEffect(enemy.getPosition())
          const dead = enemy.takeDamage(bullet.state.damage)
          this.audioManager.playHit()
          this.bulletManager.remove(bullet)

          if (dead) {
            this.itemManager.spawnAtEnemyDeath(enemy.getPosition(), enemy.type)
            this.enemyManager.remove(enemy)
          }
          break
        }
      }
    }
  }

  private effectParticles: THREE.Points[] = []

  private createKillEffect(position: THREE.Vector3): void {
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
    this.scene.add(particles)
    this.effectParticles.push(particles)

    const ringGeo = new THREE.RingGeometry(0.1, 0.3, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(position.x, position.y + 0.3, position.z)
    ring.rotation.x = -Math.PI / 2
    ring.userData = { isRing: true, life: 0.5, scale: 1 }
    this.scene.add(ring)
    this.effectParticles.push(ring as unknown as THREE.Points)
  }

  private updateEffects(delta: number): void {
    const toRemove: THREE.Points[] = []

    for (const particles of this.effectParticles) {
      if ((particles.userData as { isRing?: boolean }).isRing) {
        const ring = particles as unknown as THREE.Mesh
        const data = ring.userData as { life: number; scale: number }
        data.life -= delta * 2
        data.scale += delta * 8
        ring.scale.set(data.scale, data.scale, 1)
        ;(ring.material as THREE.MeshBasicMaterial).opacity = data.life * 1.5

        if (data.life <= 0) {
          toRemove.push(particles)
        }
        continue
      }

      const positions = particles.geometry.attributes.position.array as Float32Array
      const velocities = particles.userData.velocities

      for (let i = 0; i < velocities.length; i++) {
        positions[i * 3] += velocities[i].x * delta
        positions[i * 3 + 1] += velocities[i].y * delta
        positions[i * 3 + 2] += velocities[i].z * delta
        velocities[i].y -= 10 * delta
      }

      particles.geometry.attributes.position.needsUpdate = true
      particles.userData.life -= delta * 2
      ;(particles.material as THREE.PointsMaterial).opacity = particles.userData.life

      if (particles.userData.life <= 0) {
        toRemove.push(particles)
      }
    }

    for (const p of toRemove) {
      this.scene.remove(p)
      const idx = this.effectParticles.indexOf(p)
      if (idx > -1) this.effectParticles.splice(idx, 1)
      if (p.geometry) p.geometry.dispose()
      if (p.material) (p.material as THREE.Material).dispose()
    }
  }

  private checkEnemyPlayerCollisions(): void {
    const enemies = this.enemyManager.getEnemies()
    const playerPos = this.player.mesh.position

    for (const enemy of enemies) {
      const dist = enemy.getPosition().distanceTo(playerPos)
      if (dist < 1.2 && enemy.canAttack()) {
        enemy.attack()
        this.audioManager.playEnemyAttack()
        const dead = this.player.takeDamage(enemy.damage)
        if (dead) {
          this.isGameOver = true
          this.uiManager.showGameOver()
        }
      }
    }
  }

  private checkEnemyBulletCollisions(): void {
    const bullets = this.enemyBulletManager.getBullets()
    const playerPos = this.player.mesh.position

    for (const bullet of bullets) {
      const dist = bullet.getPosition().distanceTo(playerPos)
      if (dist < 0.8) {
        this.audioManager.playHit()
        const dead = this.player.takeDamage(bullet.state.damage)
        this.enemyBulletManager.remove(bullet)
        if (dead) {
          this.isGameOver = true
          this.uiManager.showGameOver()
        }
        break
      }
    }
  }

  private update(delta: number): void {
    const px = Math.floor(this.player.mesh.position.x / this.chunkSize)
    const pz = Math.floor(this.player.mesh.position.z / this.chunkSize)

    if (px !== this.currentChunkX || pz !== this.currentChunkZ) {
      this.currentChunkX = px
      this.currentChunkZ = pz
      this.updateTerrainChunks()
    }

    this.updateCamera()
    this.updateGround()

    this.player.update(delta, this.camera, this.bounds)
    this.bulletManager.update(delta)
    this.enemyBulletManager.update(delta)
    this.enemyManager.update(delta, this.player.mesh.position)
    this.itemManager.update(delta)
    this.updateEffects(delta)

    this.checkBulletEnemyCollisions()
    this.checkEnemyPlayerCollisions()
    this.checkEnemyBulletCollisions()
    this.collectItems()

    this.uiManager.updateStats(
      this.player.state.hp,
      this.player.state.maxHp,
      this.ammo,
      this.maxAmmo,
      this.gold,
      this.herbs,
      this.ores
    )

    this.enemySpawnTimer += delta
    if (this.enemySpawnTimer >= 3) {
      this.enemySpawnTimer = 0
      const playerPos = this.player.mesh.position

      if (this.enemyManager.getEnemies().length < 15) {
        this.spawnEnemyNearPlayer(playerPos)
      }
    }
  }
}
