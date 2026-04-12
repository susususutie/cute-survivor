import type { PlayerState } from './Player'
import type { EnemyState } from './Enemy'
import type { BulletState } from './Bullet'
import type { ItemState } from './Item'

export class EntityManager {
  private players = new Map<string, PlayerState>()
  private enemies = new Map<string, EnemyState>()
  private bullets = new Map<string, BulletState>()
  private items = new Map<string, ItemState>()

  // Player methods
  addPlayer(player: PlayerState): void {
    this.players.set(player.id, player)
  }

  getPlayer(id: string): PlayerState | undefined {
    return this.players.get(id)
  }

  getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values())
  }

  updatePlayer(id: string, updatedPlayer: PlayerState): void {
    if (this.players.has(id)) {
      this.players.set(id, updatedPlayer)
    }
  }

  // Enemy methods
  addEnemy(enemy: EnemyState): void {
    this.enemies.set(enemy.id, enemy)
  }

  getEnemy(id: string): EnemyState | undefined {
    return this.enemies.get(id)
  }

  getAllEnemies(): EnemyState[] {
    return Array.from(this.enemies.values())
  }

  getAliveEnemies(): EnemyState[] {
    return this.getAllEnemies().filter((enemy) => enemy.hp > 0)
  }

  updateEnemy(id: string, updatedEnemy: EnemyState): void {
    if (this.enemies.has(id)) {
      this.enemies.set(id, updatedEnemy)
    }
  }

  removeEnemy(id: string): void {
    this.enemies.delete(id)
  }

  // Bullet methods
  addBullet(bullet: BulletState): void {
    this.bullets.set(bullet.id, bullet)
  }

  getBullet(id: string): BulletState | undefined {
    return this.bullets.get(id)
  }

  getAllBullets(): BulletState[] {
    return Array.from(this.bullets.values())
  }

  updateBullet(id: string, updatedBullet: BulletState): void {
    if (this.bullets.has(id)) {
      this.bullets.set(id, updatedBullet)
    }
  }

  removeBullet(id: string): void {
    this.bullets.delete(id)
  }

  // Item methods
  addItem(item: ItemState): void {
    this.items.set(item.id, item)
  }

  getItem(id: string): ItemState | undefined {
    return this.items.get(id)
  }

  getAllItems(): ItemState[] {
    return Array.from(this.items.values())
  }

  getUncollectedItems(): ItemState[] {
    return this.getAllItems().filter((item) => !item.isCollected)
  }

  updateItem(id: string, updatedItem: ItemState): void {
    if (this.items.has(id)) {
      this.items.set(id, updatedItem)
    }
  }

  removeItem(id: string): void {
    this.items.delete(id)
  }

  // Utility methods
  clear(): void {
    this.players.clear()
    this.enemies.clear()
    this.bullets.clear()
    this.items.clear()
  }

  getEntityCount(): { players: number; enemies: number; bullets: number; items: number } {
    return {
      players: this.players.size,
      enemies: this.enemies.size,
      bullets: this.bullets.size,
      items: this.items.size
    }
  }

  // Cleanup expired entities
  cleanupExpiredBullets(): string[] {
    const expiredIds: string[] = []
    for (const [id, bullet] of this.bullets) {
      if (bullet.lifetime >= bullet.maxLifetime || bullet.traveledDistance >= bullet.maxRange) {
        expiredIds.push(id)
      }
    }
    return expiredIds
  }

  cleanupDeadEnemies(): string[] {
    const deadIds: string[] = []
    for (const [id, enemy] of this.enemies) {
      if (enemy.hp <= 0) {
        deadIds.push(id)
      }
    }
    return deadIds
  }

  cleanupCollectedItems(): string[] {
    const collectedIds: string[] = []
    for (const [id, item] of this.items) {
      if (item.isCollected) {
        collectedIds.push(id)
      }
    }
    return collectedIds
  }
}

// Singleton instance for easy access
let entityManagerInstance: EntityManager | null = null

export function getEntityManager(): EntityManager {
  entityManagerInstance ??= new EntityManager()
  return entityManagerInstance
}

export function resetEntityManager(): void {
  if (entityManagerInstance) {
    entityManagerInstance.clear()
  }
  entityManagerInstance = new EntityManager()
}
