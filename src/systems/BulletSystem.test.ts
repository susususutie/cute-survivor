import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Bullet, BulletManager } from './BulletSystem'

function createMockScene() {
  const scene = new THREE.Scene()
  vi.spyOn(scene, 'add')
  vi.spyOn(scene, 'remove')
  return scene
}

describe('Bullet', () => {
  it('creates bullet with correct state', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    const dir = new THREE.Vector3(0, 0, 1)
    const bullet = new Bullet(pos, dir)

    expect(bullet.state.damage).toBe(25)
    expect(bullet.state.speed).toBe(20)
    expect(bullet.state.lifetime).toBe(3)
  })

  it('bullet position matches constructor position with y offset', () => {
    const pos = new THREE.Vector3(5, 2, 3)
    const dir = new THREE.Vector3(0, 0, 1)
    const bullet = new Bullet(pos, dir)

    expect(bullet.mesh.position.x).toBe(5)
    expect(bullet.mesh.position.y).toBe(0.6)
    expect(bullet.mesh.position.z).toBe(3)
  })

  it('bullet direction is cloned', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    const dir = new THREE.Vector3(1, 0, 0)
    const bullet = new Bullet(pos, dir)

    dir.x = 999
    expect(bullet.state.direction.x).toBe(1)
  })

  it('getPosition returns cloned position', () => {
    const bullet = new Bullet(new THREE.Vector3(1, 2, 3), new THREE.Vector3(0, 0, 1))
    const pos = bullet.getPosition()

    expect(pos).not.toBe(bullet.mesh.position)
    expect(pos.x).toBe(1)
    expect(pos.y).toBe(0.6)
    expect(pos.z).toBe(3)
  })

  it('getTrail returns THREE.Points', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    const trail = bullet.getTrail()

    expect(trail).toBeInstanceOf(THREE.Points)
  })

  it('update returns false before lifetime expires', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    const expired = bullet.update(1)

    expect(expired).toBe(false)
  })

  it('update returns true after lifetime expires', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    bullet.update(1)
    bullet.update(1)
    const expired = bullet.update(1)

    expect(expired).toBe(true)
  })

  it('update moves bullet in direction', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    bullet.update(1)

    expect(bullet.mesh.position.z).toBeGreaterThan(0)
  })

  it('update moves bullet at correct speed', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0))
    bullet.update(0.5)

    expect(bullet.mesh.position.x).toBeCloseTo(10, 1)
  })

  it('update builds trail positions', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    bullet.update(0.1)
    bullet.update(0.1)
    bullet.update(0.1)

    const trail = bullet.getTrail()
    const attr = trail.geometry.getAttribute('position')
    expect(attr.count).toBe(3)
  })

  it('trail positions are capped at 15', () => {
    const bullet = new Bullet(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))

    for (let i = 0; i < 20; i++) {
      bullet.update(0.1)
    }

    const trail = bullet.getTrail()
    const attr = trail.geometry.getAttribute('position')
    expect(attr.count).toBe(15)
  })
})

describe('BulletManager', () => {
  let scene: THREE.Scene
  let manager: BulletManager

  beforeEach(() => {
    scene = createMockScene()
    manager = new BulletManager(scene)
  })

  it('fires bullet and adds to scene', () => {
    const pos = new THREE.Vector3(0, 0, 0)
    const dir = new THREE.Vector3(0, 0, 1)
    const bullet = manager.fire(pos, dir)

    expect(bullet).toBeInstanceOf(Bullet)
    expect(manager.getBullets()).toHaveLength(1)
    expect(scene.add).toHaveBeenCalledTimes(2)
  })

  it('removes bullet from manager and scene', () => {
    const bullet = manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    manager.remove(bullet)

    expect(manager.getBullets()).toHaveLength(0)
    expect(scene.remove).toHaveBeenCalled()
  })

  it('update removes expired bullets', () => {
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))

    for (let i = 0; i < 4; i++) {
      manager.update(1)
    }

    expect(manager.getBullets()).toHaveLength(0)
  })

  it('update keeps alive bullets', () => {
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    manager.update(0.5)

    expect(manager.getBullets()).toHaveLength(1)
  })

  it('manages multiple bullets independently', () => {
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0))

    expect(manager.getBullets()).toHaveLength(2)
  })

  it('getBullets returns array of bullets', () => {
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1))
    manager.fire(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0))

    const bullets = manager.getBullets()
    expect(Array.isArray(bullets)).toBe(true)
    expect(bullets.every((b) => b instanceof Bullet)).toBe(true)
  })
})
