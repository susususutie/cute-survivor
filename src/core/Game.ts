import * as THREE from 'three'
import { Player } from '../entities/Player'
import { BulletManager, Bullet } from '../systems/BulletSystem'
import { EnemyManager, EnemyConfig, Enemy } from '../entities/Enemy'
import { MapGenerator, MapData } from '../systems/MapGenerator'
import { ItemManager, ItemType, ItemData } from '../systems/ItemSystem'
import { UIManager } from '../systems/UIManager'
import { AudioManager } from '../systems/AudioManager'

export class Game {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private clock: THREE.Clock
  private player!: Player
  private bulletManager!: BulletManager
  private enemyManager!: EnemyManager
  private mapGenerator!: MapGenerator
  private mapData!: MapData
  private itemManager!: ItemManager
  private uiManager!: UIManager
  private audioManager!: AudioManager
  private bounds = 24
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
    this.createMapObjects()
    this.bulletManager = new BulletManager(this.scene)
    this.enemyManager = new EnemyManager(this.scene)
    this.itemManager = new ItemManager(this.scene)
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
      mesh.position.set(rock.x, rock.radius * 0.5, rock.z)
      this.scene.add(mesh)
      rockMeshes.push(mesh)
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
    const gridHelper = new THREE.GridHelper(50, 50, 0x444466, 0x333355)
    this.scene.add(gridHelper)

    const groundGeo = new THREE.PlaneGeometry(50, 50)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222233 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  private createPlayer(): void {
    this.player = new Player()
    this.scene.add(this.player.mesh)
  }

  private spawnInitialEnemies(): void {
    const basicConfig: EnemyConfig = {
      hp: 50,
      speed: 3,
      damage: 10,
      detectRange: 15,
      attackRange: 1.5,
      color: 0xff6644
    }

    for (let i = 0; i < 5; i++) {
      this.enemyManager.spawn(basicConfig, this.bounds)
    }
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
        this.bulletManager.fire(pos, dir)
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
            this.itemManager.spawnAtEnemyDeath(enemy.getPosition())
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
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        3 + Math.random() * 5,
        Math.sin(angle) * speed
      ))
      
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
      const life = particles.userData.life
      
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

  private update(delta: number): void {
    this.player.update(delta, this.camera, this.bounds)
    this.bulletManager.update(delta)
    this.enemyManager.update(delta, this.player.mesh.position)
    this.itemManager.update(delta)
    this.updateEffects(delta)

    this.checkBulletEnemyCollisions()
    this.checkEnemyPlayerCollisions()
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
      const config: EnemyConfig = {
        hp: 50,
        speed: 3,
        damage: 10,
        detectRange: 15,
        attackRange: 1.5,
        color: 0xff6644
      }
      this.enemyManager.spawn(config, this.bounds)
    }
  }
}