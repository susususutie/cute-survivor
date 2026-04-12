import * as THREE from 'three'
import { Player } from '../entities/Player'
import { BulletManager } from '../systems/BulletSystem'
import { EnemyManager, EnemyType } from '../entities/Enemy'
import type { EnemyConfig } from '../entities/Enemy'
import { MapGenerator, SeededRandom } from '../systems/MapGenerator'
import type { MapData, Vegetation } from '../systems/MapGenerator'
import { ItemManager, ItemType } from '../systems/ItemSystem'
import { UIManager } from '../systems/UIManager'
import { AudioManager } from '../systems/AudioManager'
import { SaveSystem } from '../systems/SaveSystem'
import { Inventory } from './Inventory'
import { WeaponProficiency } from './WeaponProficiency'
import { WeaponType, Weapon, WeaponRegistry } from './Weapon'
import { MiniMap } from '../systems/MiniMap'
import { SettingsUI } from '../systems/SettingsUI'
import { DefenseMode } from './DefenseMode'
import { createInitialGameState, type GameState } from './GameState'
import { StartMenuManager } from '../systems/StartMenuManager'
import { type WorldConfig } from './WorldConfig'
import type { SaveData, EnemySaveData } from '../systems/SaveSystem'

export class Game {
  private static readonly LEGACY_FIRE_RATE = 0.3

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
  private lastShotTime = 0
  private enemySpawnTimer = 0
  private isPaused = false
  private isGameOver = false
  private isInMenu = false
  private terrainChunks = new Map<string, THREE.Group>()
  private chunkSize = 24
  private loadDistance = 2
  private saveSystem!: SaveSystem
  private inventory!: Inventory
  private weaponProficiency!: WeaponProficiency
  private miniMap!: MiniMap
  private settingsUI!: SettingsUI
  private saveTimer = 0
  private playerWeapon!: Weapon
  private defenseMode!: DefenseMode
  private isDefenseMode = false
  private state!: GameState
  private worldConfig!: WorldConfig
  private startMenuManager!: StartMenuManager
  private currentSlotIndex = -1
  private monsterRNG!: SeededRandom
  private effectParticles: THREE.Points[] = []
  private eventHandlers: {
    mouseDown: ((e: MouseEvent) => void) | null
    keyDown: ((e: KeyboardEvent) => void) | null
    resize: (() => void) | null
  } = { mouseDown: null, keyDown: null, resize: null }

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

    // Keep a concrete state object from construction time so tests/debugging can
    // read defaults before init() wires up the runtime systems.
    this.state = createInitialGameState(Date.now().toString(), WeaponType.Pistol)

    this.boot()
  }

  boot(): void {
    this.saveSystem = new SaveSystem()
    this.startMenuManager = new StartMenuManager(this.saveSystem)

    this.startMenuManager.onContinue = (saveData: SaveData) => {
      this.currentSlotIndex = saveData.slotIndex
      this.worldConfig = saveData.world.worldConfig
      this.state.world.seed = saveData.world.seed
      this.initGameplay(saveData)
    }

    this.startMenuManager.onStart = (config: WorldConfig, slotIndex: number) => {
      this.currentSlotIndex = slotIndex
      this.worldConfig = config
      this.state.world.seed = config.seed
      this.initGameplay()
    }

    this.startMenuManager.showStartMenu()
    this.isInMenu = true
    this.animate()
  }

  initGameplay(savedData?: SaveData): void {
    // Clean up any existing game state before starting fresh
    this.cleanupGame()

    // Hide the start menu first
    this.startMenuManager.hide()

    this.isInMenu = false
    this.isPaused = false
    this.isGameOver = false
    this.isDefenseMode = false
    this.saveTimer = 0
    this.enemySpawnTimer = 0
    this.lastShotTime = 0

    // Initialize monster RNG for spawning (separate from terrain)
    this.monsterRNG = new SeededRandom(Date.now())

    // Initialize state if not continuing
    if (!savedData) {
      this.state = createInitialGameState(this.worldConfig.seed, WeaponType.Pistol)
    }

    this.uiManager = new UIManager()
    this.audioManager = new AudioManager()
    this.inventory = new Inventory()
    this.weaponProficiency = new WeaponProficiency()
    this.miniMap = new MiniMap(this.bounds * 2)
    this.settingsUI = new SettingsUI()
    this.playerWeapon = new Weapon(this.state.combat.currentWeaponType)

    this.defenseMode = new DefenseMode(new THREE.Vector3(0, 0, 0), 30, (config, position) => {
      this.enemyManager.spawnAtWithCallback(
        config,
        position,
        this.getAllRocks(),
        (pos, dir, dmg) => (this.enemyBulletManager.fire(pos, dir, 12).state.damage = dmg)
      )
    })
    this.defenseMode.setCallbacks({
      onWaveComplete: (wave) => {
        this.uiManager.updateDefenseWave(wave, this.defenseMode.getTotalWaves())
      },
      onGameComplete: () => {
        this.isGameOver = true
        this.uiManager.showGameOver()
      },
      onPlayerOutOfBounds: () => {
        // Push player back into defense area
        const playerPos = this.player.mesh.position
        const dx = playerPos.x
        const dz = playerPos.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist >= 25) {
          const angle = Math.atan2(dz, dx)
          this.player.mesh.position.x = Math.cos(angle) * 26
          this.player.mesh.position.z = Math.sin(angle) * 26
        }
      }
    })

    this.generateMap()
    this.createLights()
    this.createGround()
    this.createPlayer()
    this.bulletManager = new BulletManager(this.scene)
    this.enemyBulletManager = new BulletManager(this.scene)
    this.enemyManager = new EnemyManager(this.scene)
    this.itemManager = new ItemManager(this.scene)
    this.createMapObjects()

    // Only spawn initial enemies if not loading a save
    // (when loading a save, enemies are dynamically generated as player explores)
    if (!savedData) {
      this.spawnInitialEnemies()
    }

    this.handleInput()
    this.handleResize()

    if (savedData) {
      this.applySaveData(savedData)
    }

    this.uiManager.onSave = () => {
      this.saveGame()
    }

    this.settingsUI.onSave = () => {
      this.saveGame()
    }

    this.settingsUI.onReturnToMenu = () => {
      this.returnToMenu()
    }

    this.audioManager.startBGM()
  }

  private cleanupGame(): void {
    // Remove player
    if (this.player) {
      this.scene.remove(this.player.mesh)
    }

    // Remove all terrain chunks
    for (const [, chunk] of this.terrainChunks) {
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
    this.terrainChunks.clear()

    // Remove ground and grid
    const gridHelper = this.scene.getObjectByName('groundGrid')
    if (gridHelper) this.scene.remove(gridHelper)
    const groundPlane = this.scene.getObjectByName('groundPlane')
    if (groundPlane) this.scene.remove(groundPlane)

    // Remove effect particles
    for (const p of this.effectParticles) {
      this.scene.remove(p)
      if (p.geometry) p.geometry.dispose()
      if (p.material) (p.material as THREE.Material).dispose()
    }
    this.effectParticles = []

    // Clear scene objects added directly (vegetation, rocks, resources from main map)
    const toRemove: THREE.Object3D[] = []
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        const name = obj.name || ''
        if (name.startsWith('rock_') || name.startsWith('veg_') || name.startsWith('res_')) {
          toRemove.push(obj)
        }
      }
    })
    for (const obj of toRemove) {
      this.scene.remove(obj)
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose()
        }
      }
    }

    // Remove enemies and their meshes
    if (this.enemyManager) {
      const enemies = this.enemyManager.getEnemies()
      for (const enemy of enemies) {
        this.scene.remove(enemy.mesh)
      }
    }

    // Clear bullets
    if (this.bulletManager) {
      const bullets = this.bulletManager.getBullets()
      for (const bullet of bullets) {
        this.scene.remove(bullet.mesh)
      }
    }
    if (this.enemyBulletManager) {
      const bullets = this.enemyBulletManager.getBullets()
      for (const bullet of bullets) {
        this.scene.remove(bullet.mesh)
      }
    }

    // Remove UI elements
    if (this.uiManager) {
      this.uiManager.hidePauseMenu()
      this.uiManager.hideGameOver()
      this.uiManager.updateDefenseMode(false)
    }

    if (this.settingsUI) {
      this.settingsUI.hide()
    }

    // Remove HUD
    const hud = document.getElementById('hud')
    if (hud) hud.remove()
    const pauseMenu = document.getElementById('pause-menu')
    if (pauseMenu) pauseMenu.remove()
    const gameOver = document.getElementById('game-over')
    if (gameOver) gameOver.remove()
    const defenseHud = document.getElementById('defense-hud')
    if (defenseHud) defenseHud.remove()

    // Remove defense HUD from UIManager
    this.uiManager?.updateDefenseMode(false)

    // Remove event listeners
    if (this.eventHandlers.mouseDown) {
      window.removeEventListener('mousedown', this.eventHandlers.mouseDown)
      this.eventHandlers.mouseDown = null
    }
    if (this.eventHandlers.keyDown) {
      window.removeEventListener('keydown', this.eventHandlers.keyDown)
      this.eventHandlers.keyDown = null
    }
    if (this.eventHandlers.resize) {
      window.removeEventListener('resize', this.eventHandlers.resize)
      this.eventHandlers.resize = null
    }
  }

  private returnToMenu(): void {
    this.cleanupGame()
    this.isInMenu = true
    this.startMenuManager.showStartMenu()
  }

  private applySaveData(saveData: SaveData): void {
    // Restore player state - both Player instance state and GameState player state
    this.player.state.hp = saveData.player.hp
    this.player.state.maxHp = saveData.player.maxHp
    this.player.state.position.x = saveData.player.position.x
    this.player.state.position.y = saveData.player.position.y
    this.player.state.position.z = saveData.player.position.z
    this.player.state.rotation = saveData.player.rotation
    // Move player mesh to saved position
    this.player.mesh.position.set(saveData.player.position.x, saveData.player.position.y, saveData.player.position.z)
    this.player.mesh.rotation.y = saveData.player.rotation

    // Also update GameState.player to keep them in sync
    this.state.player.hp = saveData.player.hp
    this.state.player.maxHp = saveData.player.maxHp
    this.state.player.position.x = saveData.player.position.x
    this.state.player.position.y = saveData.player.position.y
    this.state.player.position.z = saveData.player.position.z
    this.state.player.rotation = saveData.player.rotation

    // Restore resources
    this.state.resources.gold = saveData.player.gold
    this.state.resources.herbs = saveData.player.herbs
    this.state.resources.ores = saveData.player.ores
    this.state.resources.gunpowder = saveData.player.gunpowder
    this.state.resources.lightAmmo = saveData.player.lightAmmo
    this.state.resources.heavyAmmo = saveData.player.heavyAmmo

    // Restore combat state
    this.state.combat.ammo = saveData.player.ammo
    this.state.combat.maxAmmo = saveData.player.maxAmmo ?? this.state.combat.maxAmmo
    const loadedWeaponType = saveData.player.currentWeaponType
    this.state.combat.currentWeaponType = loadedWeaponType !== undefined &&
      (WeaponType as Record<string, string>)[loadedWeaponType] !== undefined
      ? loadedWeaponType
      : WeaponType.Pistol
    this.playerWeapon = new Weapon(this.state.combat.currentWeaponType)

    // Restore world state
    this.state.world.currentChunkX = saveData.world.currentChunkX
    this.state.world.currentChunkZ = saveData.world.currentChunkZ

    // Restore enemies from save data
    // Remove old enemy meshes from scene and create new manager
    if (this.enemyManager) {
      const enemies = this.enemyManager.getEnemies()
      for (const enemy of enemies) {
        this.scene.remove(enemy.mesh)
      }
    }
    this.enemyManager = new EnemyManager(this.scene)

    // Restore saved enemies
    if (saveData.enemies && saveData.enemies.length > 0) {
      for (const enemyData of saveData.enemies) {
        this.restoreEnemyFromSave(enemyData)
      }
    }

    // Clear items when loading a save - they will be regenerated as player explores
    this.state.items = []

    // Remove old item meshes from scene and create new manager
    if (this.itemManager) {
      const items = this.itemManager.getItems()
      for (const item of items) {
        this.scene.remove(item.mesh)
      }
    }
    this.itemManager = new ItemManager(this.scene)

    // Restore inventory
    if (saveData.player.inventory) {
      // Reset all items to 0
      const allItems = this.inventory.getAllItems()
      allItems.forEach((_, key) => {
        this.inventory.removeItem(key, this.inventory.getItemCount(key))
      })
      if (saveData.player.inventory.items) {
        for (const [itemType, count] of saveData.player.inventory.items) {
          for (let i = 0; i < count; i++) {
            this.inventory.addItem(itemType as ItemType, 1)
          }
        }
      }
      // Restore equipment
      if (saveData.player.inventory.equipment) {
        if (saveData.player.inventory.equipment.weapon) {
          this.inventory.setEquipment('weapon', saveData.player.inventory.equipment.weapon as ItemType)
        }
        if (saveData.player.inventory.equipment.armor) {
          this.inventory.setEquipment('armor', saveData.player.inventory.equipment.armor as ItemType)
        }
      }
    }
  }

  private getEnemySaveData(): EnemySaveData[] {
    const enemies = this.enemyManager.getEnemies()
    return enemies.map(enemy => {
      // Access private properties via type assertion for serialization
      const enemyAny = enemy as unknown as {
        detectRange: number
        attackRange: number
        animPhase: number
        isAggro: boolean
        patrolTarget: THREE.Vector3
        attackCooldown: number
        hasRangedAttack: boolean
        rangedAttackRange: number
        rangedAttackDamage: number
        rangedAttackCooldown: number
        rangedAttackTimer: number
        aggroRange: number
        leashRange: number
      }

      return {
        id: `enemy_${enemy.type}_${enemy.hp}_${enemy.getPosition().x.toFixed(0)}`,
        type: enemy.type,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        position: {
          x: enemy.mesh.position.x,
          y: enemy.mesh.position.y,
          z: enemy.mesh.position.z
        },
        rotation: enemy.mesh.rotation.y,
        speed: enemy.speed,
        damage: enemy.damage,
        detectRange: enemyAny.detectRange ?? 12,
        attackRange: enemyAny.attackRange ?? 1.2,
        state: enemy.state,
        animPhase: enemyAny.animPhase ?? 0,
        isAggro: enemyAny.isAggro ?? false,
        patrolTarget: {
          x: enemyAny.patrolTarget?.x ?? enemy.mesh.position.x,
          y: 0,
          z: enemyAny.patrolTarget?.z ?? enemy.mesh.position.z
        },
        attackCooldown: enemyAny.attackCooldown ?? 1,
        hasRangedAttack: enemyAny.hasRangedAttack ?? false,
        rangedAttackRange: enemyAny.rangedAttackRange ?? 10,
        rangedAttackDamage: enemyAny.rangedAttackDamage ?? 10,
        rangedAttackCooldown: enemyAny.rangedAttackCooldown ?? 2,
        rangedAttackTimer: enemyAny.rangedAttackTimer ?? 0,
        aggroRange: enemyAny.aggroRange ?? 15,
        leashRange: enemyAny.leashRange ?? 25
      }
    })
  }

  private restoreEnemyFromSave(enemyData: EnemySaveData): void {
    const colors: Record<EnemyType, number> = {
      [EnemyType.Goblin]: 0x44aa44,
      [EnemyType.Orc]: 0x665533,
      [EnemyType.Slime]: 0x44ff88,
      [EnemyType.Bat]: 0x443366,
      [EnemyType.Skeleton]: 0xddddcc,
      [EnemyType.Mushroom]: 0xff6644
    }

    const type = enemyData.type as EnemyType
    const config: EnemyConfig = {
      type,
      hp: enemyData.maxHp,
      speed: enemyData.speed,
      damage: enemyData.damage,
      detectRange: enemyData.detectRange,
      attackRange: enemyData.attackRange,
      color: colors[type] ?? 0x888888,
      hasRangedAttack: enemyData.hasRangedAttack,
      rangedAttackRange: enemyData.rangedAttackRange,
      rangedAttackDamage: enemyData.rangedAttackDamage,
      rangedAttackCooldown: enemyData.rangedAttackCooldown
    }

    const position = new THREE.Vector3(
      enemyData.position.x,
      enemyData.position.y,
      enemyData.position.z
    )

    this.enemyManager.spawnAt(config, position, this.getAllRocks())

    const enemies = this.enemyManager.getEnemies()
    const restoredEnemy = enemies[enemies.length - 1]
    if (restoredEnemy) {
      // Use type assertion to access private properties for restoration
      const enemyPrivate = restoredEnemy as unknown as {
        animPhase: number
        isAggro: boolean
        attackCooldown: number
        rangedAttackTimer: number
        patrolTarget: THREE.Vector3
        state: string
      }

      restoredEnemy.hp = enemyData.hp
      enemyPrivate.state = enemyData.state
      restoredEnemy.mesh.position.set(
        enemyData.position.x,
        enemyData.position.y,
        enemyData.position.z
      )
      restoredEnemy.mesh.rotation.y = enemyData.rotation
      enemyPrivate.animPhase = enemyData.animPhase ?? 0
      enemyPrivate.isAggro = enemyData.isAggro
      enemyPrivate.attackCooldown = enemyData.attackCooldown ?? 1
      enemyPrivate.rangedAttackTimer = enemyData.rangedAttackTimer ?? 0
      enemyPrivate.patrolTarget = new THREE.Vector3(
        enemyData.patrolTarget.x,
        enemyData.patrolTarget.y,
        enemyData.patrolTarget.z
      )
    }
  }

  private saveGame(): void {
    if (this.currentSlotIndex < 0) return

    const enemySaveData = this.getEnemySaveData()

    this.saveSystem.saveGame({
      player: {
        hp: this.player.state.hp,
        maxHp: this.player.state.maxHp,
        speed: this.player.state.speed,
        position: {
          x: this.player.state.position.x,
          y: this.player.state.position.y,
          z: this.player.state.position.z
        },
        rotation: this.player.state.rotation
      },
      resources: { ...this.state.resources },
      combat: { ...this.state.combat },
      inventory: this.inventory,
      world: {
        seed: this.worldConfig.seed,
        currentChunkX: this.state.world.currentChunkX,
        currentChunkZ: this.state.world.currentChunkZ,
        worldConfig: this.worldConfig
      },
      slotIndex: this.currentSlotIndex,
      enemies: enemySaveData
    })

    // Show save notification
    const notification = document.createElement('div')
    notification.textContent = '游戏已保存'
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(68, 170, 136, 0.95);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      z-index: 1000;
      pointer-events: none;
    `
    document.body.appendChild(notification)
    setTimeout(() => { notification.remove(); }, 1500)
  }

  // Back-compat getters (used by existing tests and handy for debugging).
  get ammo(): number {
    return this.state.combat.ammo
  }
  get maxAmmo(): number {
    return this.state.combat.maxAmmo
  }
  get gold(): number {
    return this.state.resources.gold
  }
  get herbs(): number {
    return this.state.resources.herbs
  }
  get ores(): number {
    return this.state.resources.ores
  }
  get currentChunkX(): number {
    return this.state.world.currentChunkX
  }
  get currentChunkZ(): number {
    return this.state.world.currentChunkZ
  }
  get fireRate(): number {
    // The runtime fire rate is driven by weapon stats + proficiency; keep this
    // constant exposed for existing tests.
    return Game.LEGACY_FIRE_RATE
  }

  private generateMap(): void {
    this.mapGenerator = new MapGenerator(this.worldConfig, this.bounds)
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
        const cx = this.state.world.currentChunkX + dx
        const cz = this.state.world.currentChunkZ + dz
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
      const dx = Math.abs(cx - this.state.world.currentChunkX)
      const dz = Math.abs(cz - this.state.world.currentChunkZ)
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
    const colors: Record<EnemyType, number> = {
      [EnemyType.Goblin]: 0x44aa44,
      [EnemyType.Orc]: 0x665533,
      [EnemyType.Slime]: 0x44ff88,
      [EnemyType.Bat]: 0x443366,
      [EnemyType.Skeleton]: 0xddddcc,
      [EnemyType.Mushroom]: 0xff6644
    }

    // Weighted random selection based on worldConfig
    const types = Object.keys(this.worldConfig.monster.types) as EnemyType[]
    const weights = types.map(t => this.worldConfig.monster.types[t].spawnWeight)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = this.monsterRNG.next() * totalWeight
    let selectedType = types[0]
    for (let i = 0; i < types.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedType = types[i]
        break
      }
    }

    const typeConfig = this.worldConfig.monster.types[selectedType]
    const config: EnemyConfig = {
      type: selectedType,
      hp: typeConfig.hp,
      speed: typeConfig.speed,
      damage: typeConfig.damage,
      detectRange: typeConfig.detectRange,
      attackRange: typeConfig.attackRange,
      color: colors[selectedType],
      hasRangedAttack: typeConfig.hasRangedAttack,
      rangedAttackRange: typeConfig.rangedAttackRange,
      rangedAttackDamage: typeConfig.rangedAttackDamage,
      rangedAttackCooldown: typeConfig.rangedAttackCooldown
    }

    const angle = this.monsterRNG.next() * Math.PI * 2
    const distance = 15 + this.monsterRNG.next() * 20
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
    // Remove old event listeners if they exist
    if (this.eventHandlers.mouseDown) {
      window.removeEventListener('mousedown', this.eventHandlers.mouseDown)
    }
    if (this.eventHandlers.keyDown) {
      window.removeEventListener('keydown', this.eventHandlers.keyDown)
    }

    this.eventHandlers.mouseDown = (_e: MouseEvent) => {
      if (this.isPaused || this.isGameOver) return

      const now = performance.now() / 1000
      const weaponDef = WeaponRegistry.get(this.state.combat.currentWeaponType)
      if (!weaponDef) return

      const effectiveFireRate = this.weaponProficiency.getEffectiveAttackSpeed(
        weaponDef.stats.attackSpeed,
        this.state.combat.currentWeaponType
      )

      if (now - this.lastShotTime >= effectiveFireRate && this.playerWeapon.canFire()) {
        this.lastShotTime = now
        this.playerWeapon.fire()

        const baseDamage = this.weaponProficiency.getEffectiveDamage(
          weaponDef.stats.damage,
          this.state.combat.currentWeaponType
        )
        const projectileCount = weaponDef.stats.projectileCount
        const spreadAngle = weaponDef.stats.spreadAngle

        for (let i = 0; i < projectileCount; i++) {
          let dir = this.player.getDirection()

          if (projectileCount > 1) {
            const angleOffset = (i / (projectileCount - 1) - 0.5) * ((spreadAngle * Math.PI) / 180)
            dir = dir.clone()
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset)
          }

          const pos = this.player.getMuzzlePosition()
          this.bulletManager.fire(pos, dir, weaponDef.stats.range).state.damage = baseDamage
        }
        this.audioManager.playShoot()
      }
    }

    this.eventHandlers.keyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this.isGameOver) return
        this.isPaused = !this.isPaused
        if (this.isPaused) {
          this.uiManager.showPauseMenu()
          this.settingsUI.show()
        } else {
          this.uiManager.hidePauseMenu()
          this.settingsUI.hide()
        }
      }
      if (e.key.toLowerCase() === 'r' && this.isGameOver) {
        location.reload()
      }
      if (e.key.toLowerCase() === 'm') {
        this.audioManager.toggleMute()
      }
      if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {
        this.switchWeapon(e.key.toLowerCase() === 'q' ? -1 : 1)
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        this.toggleDefenseMode()
      }
    }

    window.addEventListener('mousedown', this.eventHandlers.mouseDown)
    window.addEventListener('keydown', this.eventHandlers.keyDown)
  }

  private switchWeapon(direction: number): void {
    const types = Object.values(WeaponType)
    const currentIndex = types.indexOf(this.state.combat.currentWeaponType)
    let newIndex = currentIndex + direction
    if (newIndex < 0) newIndex = types.length - 1
    if (newIndex >= types.length) newIndex = 0
    this.state.combat.currentWeaponType = types[newIndex]
    this.playerWeapon = new Weapon(this.state.combat.currentWeaponType)
  }

  private toggleDefenseMode(): void {
    if (this.isDefenseMode) {
      // Exit defense mode
      this.defenseMode.reset()
      this.isDefenseMode = false
      this.uiManager.updateDefenseMode(false)
    } else {
      // Enter defense mode
      this.isDefenseMode = true
      this.defenseMode.startWave(1)
      this.uiManager.updateDefenseMode(true)
      this.uiManager.updateDefenseWave(1, this.defenseMode.getTotalWaves())
    }
  }

  private autoSave(): void {
    if (this.currentSlotIndex < 0) return

    const enemySaveData = this.getEnemySaveData()

    this.saveSystem.saveGame({
      player: {
        hp: this.player.state.hp,
        maxHp: this.player.state.maxHp,
        speed: this.player.state.speed,
        position: {
          x: this.player.state.position.x,
          y: this.player.state.position.y,
          z: this.player.state.position.z
        },
        rotation: this.player.state.rotation
      },
      resources: { ...this.state.resources },
      combat: { ...this.state.combat },
      inventory: this.inventory,
      world: {
        seed: this.worldConfig.seed,
        currentChunkX: this.state.world.currentChunkX,
        currentChunkZ: this.state.world.currentChunkZ,
        worldConfig: this.worldConfig
      },
      slotIndex: this.currentSlotIndex,
      enemies: enemySaveData
    })
  }

  private handleResize(): void {
    if (this.eventHandlers.resize) {
      window.removeEventListener('resize', this.eventHandlers.resize)
    }

    this.eventHandlers.resize = () => {
      const aspect = window.innerWidth / window.innerHeight
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()

      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', this.eventHandlers.resize)
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

    if (this.isPaused || this.isGameOver || this.isInMenu) {
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
          this.state.resources.gold += item.value
          this.inventory.addItem(ItemType.Gold, item.value)
          break
        case ItemType.Ammo:
          this.state.combat.ammo = Math.min(
            this.state.combat.ammo + item.value,
            this.state.combat.maxAmmo
          )
          this.inventory.addItem(ItemType.Ammo, item.value)
          break
        case ItemType.Herb:
          this.state.resources.herbs += item.value
          this.inventory.addItem(ItemType.Herb, item.value)
          break
        case ItemType.Ore:
          this.state.resources.ores += item.value
          this.inventory.addItem(ItemType.Ore, item.value)
          break
        case ItemType.Gunpowder:
          this.state.resources.gunpowder += item.value
          this.inventory.addItem(ItemType.Gunpowder, item.value)
          break
        case ItemType.LightAmmo:
          this.state.resources.lightAmmo += item.value
          this.inventory.addItem(ItemType.LightAmmo, item.value)
          break
        case ItemType.HeavyAmmo:
          this.state.resources.heavyAmmo += item.value
          this.inventory.addItem(ItemType.HeavyAmmo, item.value)
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
            this.weaponProficiency.addKill(this.state.combat.currentWeaponType)
            this.weaponProficiency.addDamage(
              this.state.combat.currentWeaponType,
              bullet.state.damage
            )
            this.itemManager.spawnAtEnemyDeath(enemy.getPosition(), enemy.type)
            this.enemyManager.remove(enemy)
            if (this.isDefenseMode) {
              this.defenseMode.enemyKilled()
            }
          }
          break
        }
      }
    }
  }

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
      }
    }
  }

  private update(delta: number): void {
    const px = Math.floor(this.player.mesh.position.x / this.chunkSize)
    const pz = Math.floor(this.player.mesh.position.z / this.chunkSize)

    if (px !== this.state.world.currentChunkX || pz !== this.state.world.currentChunkZ) {
      this.state.world.currentChunkX = px
      this.state.world.currentChunkZ = pz
      this.updateTerrainChunks()
    }

    this.updateCamera()

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

    this.miniMap.update(
      this.player.mesh.position,
      this.player.state.rotation,
      this.enemyManager.getEnemies().map((e) => ({ pos: e.getPosition() })),
      []
    )

    this.uiManager.updateStats(
      this.player.state.hp,
      this.player.state.maxHp,
      this.state.combat.ammo,
      this.state.combat.maxAmmo,
      this.state.resources.gold,
      this.state.resources.herbs,
      this.state.resources.ores
    )

    if (this.isDefenseMode) {
      this.defenseMode.update(delta, this.player.mesh.position)
      this.uiManager.updateDefenseEnemies(this.defenseMode.getEnemiesRemaining())
    } else {
      this.enemySpawnTimer += delta
      if (this.enemySpawnTimer >= 3) {
        this.enemySpawnTimer = 0
        const playerPos = this.player.mesh.position

        if (this.enemyManager.getEnemies().length < 15) {
          this.spawnEnemyNearPlayer(playerPos)
        }
      }
    }

    this.saveTimer += delta
    if (this.saveTimer >= 30) {
      this.saveTimer = 0
      this.autoSave()
    }
  }
}
