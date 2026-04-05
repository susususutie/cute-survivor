import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Item, ItemManager, ItemType } from './ItemSystem'
import { EnemyType } from '../entities/Enemy'

function createMockScene() {
  const scene = new THREE.Scene()
  vi.spyOn(scene, 'add')
  vi.spyOn(scene, 'remove')
  return scene
}

describe('ItemType enum', () => {
  it('has all expected item types', () => {
    expect(ItemType.Gold).toBe('gold')
    expect(ItemType.Herb).toBe('herb')
    expect(ItemType.Ore).toBe('ore')
    expect(ItemType.Ammo).toBe('ammo')
    expect(ItemType.HealthPotion).toBe('health_potion')
    expect(ItemType.SpeedPotion).toBe('speed_potion')
  })
})

describe('Item', () => {
  it('creates item with correct type and value for Gold', () => {
    const pos = new THREE.Vector3(1, 0, 2)
    const item = new Item(ItemType.Gold, pos)

    expect(item.data.type).toBe(ItemType.Gold)
    expect(item.data.value).toBe(10)
  })

  it('creates item with correct type and value for Herb', () => {
    const item = new Item(ItemType.Herb, new THREE.Vector3(0, 0, 0))
    expect(item.data.type).toBe(ItemType.Herb)
    expect(item.data.value).toBe(5)
  })

  it('creates item with correct type and value for Ore', () => {
    const item = new Item(ItemType.Ore, new THREE.Vector3(0, 0, 0))
    expect(item.data.type).toBe(ItemType.Ore)
    expect(item.data.value).toBe(8)
  })

  it('creates item with correct type and value for Ammo', () => {
    const item = new Item(ItemType.Ammo, new THREE.Vector3(0, 0, 0))
    expect(item.data.type).toBe(ItemType.Ammo)
    expect(item.data.value).toBe(15)
  })

  it('creates item with correct type and value for HealthPotion', () => {
    const item = new Item(ItemType.HealthPotion, new THREE.Vector3(0, 0, 0))
    expect(item.data.type).toBe(ItemType.HealthPotion)
    expect(item.data.value).toBe(25)
  })

  it('creates item with correct type and value for SpeedPotion', () => {
    const item = new Item(ItemType.SpeedPotion, new THREE.Vector3(0, 0, 0))
    expect(item.data.type).toBe(ItemType.SpeedPotion)
    expect(item.data.value).toBe(5)
  })

  it('positions item at y=0.4', () => {
    const pos = new THREE.Vector3(5, 10, 15)
    const item = new Item(ItemType.Gold, pos)

    expect(item.mesh.position.x).toBe(5)
    expect(item.mesh.position.y).toBe(0.4)
    expect(item.mesh.position.z).toBe(15)
  })

  it('returns cloned position from getPosition', () => {
    const pos = new THREE.Vector3(3, 0, 4)
    const item = new Item(ItemType.Gold, pos)
    const result = item.getPosition()

    expect(result).toEqual(new THREE.Vector3(3, 0.4, 4))
    expect(result).not.toBe(item.mesh.position)
  })
})

describe('ItemManager', () => {
  let scene: THREE.Scene
  let manager: ItemManager

  beforeEach(() => {
    scene = createMockScene()
    manager = new ItemManager(scene)
  })

  it('spawns item and adds to scene', () => {
    const pos = new THREE.Vector3(1, 0, 2)
    const item = manager.spawn(ItemType.Gold, pos)

    expect(item.data.type).toBe(ItemType.Gold)
    expect(manager.getItems()).toHaveLength(1)
    expect(scene.add).toHaveBeenCalledTimes(1)
  })

  it('removes item from scene and list', () => {
    const item = manager.spawn(ItemType.Gold, new THREE.Vector3(0, 0, 0))
    manager.remove(item)

    expect(manager.getItems()).toHaveLength(0)
    expect(scene.remove).toHaveBeenCalled()
  })

  it('returns items within range', () => {
    manager.spawn(ItemType.Gold, new THREE.Vector3(0, 0, 0))
    manager.spawn(ItemType.Herb, new THREE.Vector3(10, 0, 0))
    manager.spawn(ItemType.Ore, new THREE.Vector3(1, 0, 0))

    const nearby = manager.getItemsInRange(new THREE.Vector3(0, 0, 0), 2)

    expect(nearby).toHaveLength(2)
  })

  it('collects items within range and returns their data', () => {
    manager.spawn(ItemType.Gold, new THREE.Vector3(0, 0, 0))
    manager.spawn(ItemType.Herb, new THREE.Vector3(1, 0, 0))
    manager.spawn(ItemType.Ore, new THREE.Vector3(10, 0, 0))

    const collected = manager.collectItemsInRange(new THREE.Vector3(0, 0, 0), 2)

    expect(collected).toHaveLength(2)
    expect(collected.map((i) => i.type)).toContain(ItemType.Gold)
    expect(collected.map((i) => i.type)).toContain(ItemType.Herb)
    expect(manager.getItems()).toHaveLength(1)
  })

  it('returns empty array when no items in range', () => {
    manager.spawn(ItemType.Gold, new THREE.Vector3(100, 0, 0))

    const collected = manager.collectItemsInRange(new THREE.Vector3(0, 0, 0), 1)

    expect(collected).toHaveLength(0)
  })
})

describe('ItemManager spawnAtEnemyDeath', () => {
  let scene: THREE.Scene
  let manager: ItemManager

  beforeEach(() => {
    scene = createMockScene()
    manager = new ItemManager(scene)
  })

  it('drops items for Goblin death', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    manager.spawnAtEnemyDeath(pos, EnemyType.Goblin)

    expect(manager.getItems().length).toBe(1)
  })

  it('drops items for Orc death', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    manager.spawnAtEnemyDeath(pos, EnemyType.Orc)

    expect(manager.getItems().length).toBe(1)
  })

  it('drops items for Slime death', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    manager.spawnAtEnemyDeath(pos, EnemyType.Slime)

    expect(manager.getItems().length).toBe(1)
  })

  it('drops items for Bat death', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    manager.spawnAtEnemyDeath(pos, EnemyType.Bat)

    expect(manager.getItems().length).toBe(1)
  })

  it('drops items at enemy death position', () => {
    const pos = new THREE.Vector3(5, 0, 7)
    manager.spawnAtEnemyDeath(pos, EnemyType.Goblin)

    const items = manager.getItems()
    expect(items).toHaveLength(1)
    expect(items[0].getPosition().x).toBe(5)
    expect(items[0].getPosition().z).toBe(7)
  })
})
