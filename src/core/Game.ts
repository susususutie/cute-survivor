import * as THREE from 'three'
import { Player } from '../entities/Player'
import { BulletManager, Bullet } from '../systems/BulletSystem'
import { EnemyManager, EnemyConfig, Enemy } from '../entities/Enemy'
import { MapGenerator, MapData } from '../systems/MapGenerator'
import { ItemManager, ItemType, ItemData } from '../systems/ItemSystem'
import { UIManager } from '../systems/UIManager'

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
    this.generateMap()
    this.createLights()
    this.createGround()
    this.createMapObjects()
    this.createPlayer()
    this.bulletManager = new BulletManager(this.scene)
    this.enemyManager = new EnemyManager(this.scene)
    this.itemManager = new ItemManager(this.scene)
    this.spawnInitialEnemies()
    this.handleInput()
    this.handleResize()
    this.animate()
  }

  private generateMap(): void {
    this.mapGenerator = new MapGenerator(Date.now(), this.bounds)
    this.mapData = this.mapGenerator.generate()
  }

  private createMapObjects(): void {
    for (const rock of this.mapData.rocks) {
      const geo = new THREE.DodecahedronGeometry(rock.radius, 0)
      const mat = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(rock.x, rock.radius * 0.5, rock.z)
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
        const pos = this.player.mesh.position.clone()
        this.bulletManager.fire(pos, dir)
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
          const dead = enemy.takeDamage(bullet.state.damage)
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

  private checkEnemyPlayerCollisions(): void {
    const enemies = this.enemyManager.getEnemies()
    const playerPos = this.player.mesh.position

    for (const enemy of enemies) {
      const dist = enemy.getPosition().distanceTo(playerPos)
      if (dist < 1.2 && enemy.canAttack()) {
        enemy.attack()
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