import * as THREE from 'three'

export enum ItemType {
  Gold = 'gold',
  Herb = 'herb',
  Ore = 'ore',
  Ammo = 'ammo'
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
    const geo = new THREE.OctahedronGeometry(0.25, 0)
    const colors: Record<ItemType, number> = {
      [ItemType.Gold]: 0xffdd00,
      [ItemType.Herb]: 0x44ff88,
      [ItemType.Ore]: 0x8888ff,
      [ItemType.Ammo]: 0xff8844
    }
    const mat = new THREE.MeshStandardMaterial({
      color: colors[type],
      emissive: colors[type],
      emissiveIntensity: 0.4
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.copy(position)
    this.mesh.position.y = 0.4

    const values: Record<ItemType, number> = {
      [ItemType.Gold]: 10,
      [ItemType.Herb]: 5,
      [ItemType.Ore]: 8,
      [ItemType.Ammo]: 15
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

  spawnAtEnemyDeath(position: THREE.Vector3): void {
    const rand = Math.random()
    if (rand < 0.6) {
      this.spawn(ItemType.Gold, position.clone())
    } else if (rand < 0.8) {
      this.spawn(ItemType.Ammo, position.clone())
    } else {
      this.spawn(Math.random() > 0.5 ? ItemType.Herb : ItemType.Ore, position.clone())
    }
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