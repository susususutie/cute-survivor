import * as THREE from 'three'
import { EnemyType } from '../entities/Enemy'

export enum ItemType {
  Gold = 'gold',
  Herb = 'herb',
  Ore = 'ore',
  Ammo = 'ammo',
  HealthPotion = 'health_potion',
  SpeedPotion = 'speed_potion'
}

export interface ItemData {
  type: ItemType
  value: number
}

export class Item {
  public mesh: THREE.Mesh
  public data: ItemData
  private rotationSpeed: number

  constructor(type: ItemType, position: THREE.Vector3) {
    const colors: Record<ItemType, number> = {
      [ItemType.Gold]: 0xffdd00,
      [ItemType.Herb]: 0x44ff88,
      [ItemType.Ore]: 0x8888ff,
      [ItemType.Ammo]: 0xff8844,
      [ItemType.HealthPotion]: 0xff4444,
      [ItemType.SpeedPotion]: 0x44aaff
    }

    let geo: THREE.BufferGeometry
    if (type === ItemType.HealthPotion) {
      geo = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8)
    } else if (type === ItemType.SpeedPotion) {
      geo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8)
    } else {
      geo = new THREE.OctahedronGeometry(0.25, 0)
    }

    const mat = new THREE.MeshStandardMaterial({
      color: colors[type],
      emissive: colors[type],
      emissiveIntensity: 0.4,
      transparent: type === ItemType.HealthPotion || type === ItemType.SpeedPotion,
      opacity: type === ItemType.HealthPotion || type === ItemType.SpeedPotion ? 0.9 : 1
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.copy(position)
    this.mesh.position.y = 0.4

    if (type === ItemType.HealthPotion || type === ItemType.SpeedPotion) {
      const bottleGeo = new THREE.SphereGeometry(0.1, 8, 8)
      const bottleMat = new THREE.MeshStandardMaterial({
        color: type === ItemType.HealthPotion ? 0xff6666 : 0x66aaff,
        emissive: type === ItemType.HealthPotion ? 0xff0000 : 0x0088ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      })
      const bottle = new THREE.Mesh(bottleGeo, bottleMat)
      bottle.position.y = 0.25
      this.mesh.add(bottle)
    }

    const values: Record<ItemType, number> = {
      [ItemType.Gold]: 10,
      [ItemType.Herb]: 5,
      [ItemType.Ore]: 8,
      [ItemType.Ammo]: 15,
      [ItemType.HealthPotion]: 25,
      [ItemType.SpeedPotion]: 5
    }
    this.data = { type, value: values[type] }

    this.rotationSpeed = 1 + Math.random()
  }

  update(delta: number): void {
    this.mesh.rotation.y += this.rotationSpeed * delta
    this.mesh.position.y = 0.4 + Math.sin(performance.now() / 300) * 0.1
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }
}

export class ItemManager {
  private items: Item[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  spawn(type: ItemType, position: THREE.Vector3): Item {
    const item = new Item(type, position)
    this.items.push(item)
    this.scene.add(item.mesh)
    return item
  }

  spawnAtEnemyDeath(position: THREE.Vector3, enemyType: EnemyType): void {
    const drops: { type: ItemType; chance: number }[] = []

    switch (enemyType) {
      case EnemyType.Goblin:
        drops.push({ type: ItemType.Gold, chance: 0.5 })
        drops.push({ type: ItemType.Ammo, chance: 0.3 })
        drops.push({ type: ItemType.HealthPotion, chance: 0.15 })
        break
      case EnemyType.Orc:
        drops.push({ type: ItemType.Gold, chance: 0.6 })
        drops.push({ type: ItemType.HealthPotion, chance: 0.25 })
        drops.push({ type: ItemType.Ammo, chance: 0.15 })
        break
      case EnemyType.Slime:
        drops.push({ type: ItemType.HealthPotion, chance: 0.4 })
        drops.push({ type: ItemType.SpeedPotion, chance: 0.3 })
        drops.push({ type: ItemType.Gold, chance: 0.3 })
        break
      case EnemyType.Bat:
        drops.push({ type: ItemType.SpeedPotion, chance: 0.4 })
        drops.push({ type: ItemType.Gold, chance: 0.35 })
        drops.push({ type: ItemType.Ammo, chance: 0.25 })
        break
    }

    const roll = Math.random()
    let cumulative = 0
    for (const drop of drops) {
      cumulative += drop.chance
      if (roll < cumulative) {
        this.spawn(drop.type, position.clone())
        return
      }
    }
    this.spawn(ItemType.Gold, position.clone())
  }

  update(delta: number): void {
    for (const item of this.items) {
      item.update(delta)
    }
  }

  getItems(): Item[] {
    return this.items
  }

  remove(item: Item): void {
    this.scene.remove(item.mesh)
    const idx = this.items.indexOf(item)
    if (idx > -1) this.items.splice(idx, 1)
  }

  getItemsInRange(position: THREE.Vector3, range: number): Item[] {
    return this.items.filter(item => item.getPosition().distanceTo(position) < range)
  }

  collectItemsInRange(position: THREE.Vector3, range: number): ItemData[] {
    const inRange = this.getItemsInRange(position, range)
    const collected: ItemData[] = []

    for (const item of inRange) {
      collected.push(item.data)
      this.remove(item)
    }

    return collected
  }
}