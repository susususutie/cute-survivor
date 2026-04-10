import * as THREE from 'three'
import { EnemyType } from '../entities/Enemy'
import type { EnemyConfig } from '../entities/Enemy'

export interface WaveConfig {
  enemyCount: number
  enemyTypes: EnemyType[]
  spawnDelay: number
}

export class DefenseMode {
  private scene: THREE.Scene
  private spawnCallback: (config: EnemyConfig, position: THREE.Vector3) => void
  private defenseCenter: THREE.Vector3
  private defenseRadius: number
  private currentWave = 0
  private enemiesRemaining = 0
  private totalWaves = 10
  private waveConfigs: WaveConfig[] = []
  private spawnTimer = 0
  private enemiesToSpawn = 0
  private enemiesSpawned = 0
  private isWaveActive = false
  private isComplete = false
  private onWaveComplete: ((wave: number) => void) | null = null
  private onGameComplete: (() => void) | null = null
  private onPlayerOutOfBounds: (() => void) | null = null

  constructor(
    scene: THREE.Scene,
    defenseCenter: THREE.Vector3,
    defenseRadius: number,
    spawnCallback: (config: EnemyConfig, position: THREE.Vector3) => void
  ) {
    this.scene = scene
    this.defenseCenter = defenseCenter
    this.defenseRadius = defenseRadius
    this.spawnCallback = spawnCallback
    this.initWaveConfigs()
  }

  private initWaveConfigs(): void {
    this.waveConfigs = []
    for (let i = 1; i <= this.totalWaves; i++) {
      const baseCount = 3 + i * 2
      const enemyTypes: EnemyType[] = [EnemyType.Goblin, EnemyType.Slime]
      if (i >= 3) enemyTypes.push(EnemyType.Orc)
      if (i >= 5) enemyTypes.push(EnemyType.Bat)
      if (i >= 7) enemyTypes.push(EnemyType.Skeleton)
      if (i >= 9) enemyTypes.push(EnemyType.Mushroom)

      this.waveConfigs.push({
        enemyCount: baseCount,
        enemyTypes,
        spawnDelay: Math.max(0.5, 2 - i * 0.1)
      })
    }
  }

  startWave(waveNumber: number): void {
    if (waveNumber > this.totalWaves) {
      this.isComplete = true
      this.onGameComplete?.()
      return
    }

    this.currentWave = waveNumber

    if (waveNumber === this.totalWaves) {
      this.isComplete = true
      this.onGameComplete?.()
      return
    }

    const config = this.waveConfigs[waveNumber - 1]
    this.enemiesToSpawn = config.enemyCount
    this.enemiesSpawned = 0
    this.enemiesRemaining = config.enemyCount
    this.isWaveActive = true
    this.spawnTimer = 0
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    if (!this.isWaveActive) return

    const config = this.waveConfigs[this.currentWave - 1]
    if (!config) return

    if (this.enemiesSpawned < this.enemiesToSpawn) {
      this.spawnTimer += delta
      if (this.spawnTimer >= config.spawnDelay) {
        this.spawnTimer = 0
        this.spawnEnemy(config)
        this.enemiesSpawned++
      }
    }

    if (!this.isPlayerInDefenseArea(playerPos)) {
      this.onPlayerOutOfBounds?.()
    }
  }

  private spawnEnemy(config: WaveConfig): void {
    const angle = Math.random() * Math.PI * 2
    const distance = this.defenseRadius + 5 + Math.random() * 10
    const x = this.defenseCenter.x + Math.cos(angle) * distance
    const z = this.defenseCenter.z + Math.sin(angle) * distance

    const enemyTypes = config.enemyTypes.length > 0 ? config.enemyTypes : [EnemyType.Goblin]
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
    const stats = this.getEnemyStats(type)

    const enemyConfig: EnemyConfig = {
      type,
      ...stats,
      color: this.getEnemyColor(type)
    }

    this.spawnCallback(enemyConfig, new THREE.Vector3(x, 0, z))
  }

  private getEnemyStats(type: EnemyType): {
    hp: number
    speed: number
    damage: number
    detectRange: number
    attackRange: number
    hasRangedAttack?: boolean
    rangedAttackRange?: number
    rangedAttackDamage?: number
    rangedAttackCooldown?: number
  } {
    switch (type) {
      case EnemyType.Goblin:
        return {
          hp: 30 + this.currentWave * 5,
          speed: 3.5,
          damage: 8 + this.currentWave,
          detectRange: 15,
          attackRange: 1.2,
          hasRangedAttack: true,
          rangedAttackRange: 12,
          rangedAttackDamage: 8 + this.currentWave,
          rangedAttackCooldown: 2
        }
      case EnemyType.Orc:
        return {
          hp: 60 + this.currentWave * 10,
          speed: 2,
          damage: 15 + this.currentWave * 2,
          detectRange: 10,
          attackRange: 1.5
        }
      case EnemyType.Slime:
        return {
          hp: 25 + this.currentWave * 3,
          speed: 2.5,
          damage: 5 + this.currentWave,
          detectRange: 8,
          attackRange: 1
        }
      case EnemyType.Bat:
        return {
          hp: 15 + this.currentWave * 2,
          speed: 5,
          damage: 4 + this.currentWave,
          detectRange: 15,
          attackRange: 0.8
        }
      case EnemyType.Skeleton:
        return {
          hp: 30 + this.currentWave * 5,
          speed: 2.8,
          damage: 10 + this.currentWave * 2,
          detectRange: 14,
          attackRange: 1.0,
          hasRangedAttack: true,
          rangedAttackRange: 15,
          rangedAttackDamage: 12 + this.currentWave * 2,
          rangedAttackCooldown: 2.5
        }
      case EnemyType.Mushroom:
        return {
          hp: 40 + this.currentWave * 5,
          speed: 1.5,
          damage: 8 + this.currentWave,
          detectRange: 10,
          attackRange: 1.5
        }
      default:
        return {
          hp: 30,
          speed: 3,
          damage: 8,
          detectRange: 10,
          attackRange: 1.2
        }
    }
  }

  private getEnemyColor(type: EnemyType): number {
    switch (type) {
      case EnemyType.Goblin:
        return 0x44aa44
      case EnemyType.Orc:
        return 0x665533
      case EnemyType.Slime:
        return 0x44ff88
      case EnemyType.Bat:
        return 0x443366
      case EnemyType.Skeleton:
        return 0xddddcc
      case EnemyType.Mushroom:
        return 0xff6644
      default:
        return 0x888888
    }
  }

  private isPlayerInDefenseArea(playerPos: THREE.Vector3): boolean {
    const dx = playerPos.x - this.defenseCenter.x
    const dz = playerPos.z - this.defenseCenter.z
    return Math.sqrt(dx * dx + dz * dz) <= this.defenseRadius
  }

  enemyKilled(): void {
    this.enemiesRemaining--
    if (this.enemiesRemaining <= 0 && this.enemiesSpawned >= this.enemiesToSpawn) {
      this.isWaveActive = false
      this.onWaveComplete?.(this.currentWave)
    }
  }

  getCurrentWave(): number {
    return this.currentWave
  }

  getTotalWaves(): number {
    return this.totalWaves
  }

  getEnemiesRemaining(): number {
    return this.enemiesRemaining
  }

  isActive(): boolean {
    return this.isWaveActive
  }

  isCompleted(): boolean {
    return this.isComplete
  }

  setCallbacks(callbacks: {
    onWaveComplete?: (wave: number) => void
    onGameComplete?: () => void
    onPlayerOutOfBounds?: () => void
  }): void {
    this.onWaveComplete = callbacks.onWaveComplete ?? null
    this.onGameComplete = callbacks.onGameComplete ?? null
    this.onPlayerOutOfBounds = callbacks.onPlayerOutOfBounds ?? null
  }

  reset(): void {
    this.currentWave = 0
    this.enemiesRemaining = 0
    this.enemiesToSpawn = 0
    this.enemiesSpawned = 0
    this.isWaveActive = false
    this.isComplete = false
    this.spawnTimer = 0
  }
}
