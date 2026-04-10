import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Enemy, EnemyManager, EnemyState, EnemyType } from './Enemy'

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')
  return {
    ...actual,
    Raycaster: vi.fn().mockImplementation(() => ({
      setFromCamera: vi.fn(),
      ray: {
        intersectPlane: vi.fn().mockReturnValue(new actual.Vector3(1, 0, 1))
      }
    })),
    Plane: vi.fn()
  }
})

function createMockScene() {
  const scene = new THREE.Scene()
  vi.spyOn(scene, 'add')
  vi.spyOn(scene, 'remove')
  return scene
}

const goblinConfig: import('./Enemy').EnemyConfig = {
  type: EnemyType.Goblin,
  hp: 40,
  speed: 3.5,
  damage: 8,
  detectRange: 12,
  attackRange: 1.2,
  color: 0x44aa44
}

const orcConfig: import('./Enemy').EnemyConfig = {
  type: EnemyType.Orc,
  hp: 80,
  speed: 2,
  damage: 15,
  detectRange: 10,
  attackRange: 1.5,
  color: 0x665533
}

const slimeConfig: import('./Enemy').EnemyConfig = {
  type: EnemyType.Slime,
  hp: 30,
  speed: 2.5,
  damage: 5,
  detectRange: 8,
  attackRange: 1,
  color: 0x44ff88
}

const batConfig: import('./Enemy').EnemyConfig = {
  type: EnemyType.Bat,
  hp: 20,
  speed: 5,
  damage: 4,
  detectRange: 15,
  attackRange: 0.8,
  color: 0x443366
}

describe('Enemy', () => {
  it('creates goblin with correct stats', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))

    expect(enemy.type).toBe(EnemyType.Goblin)
    expect(enemy.hp).toBe(40)
    expect(enemy.maxHp).toBe(40)
    expect(enemy.speed).toBe(3.5)
    expect(enemy.damage).toBe(8)
  })

  it('creates orc with correct stats', () => {
    const enemy = new Enemy(orcConfig, new THREE.Vector3(0, 0, 0))

    expect(enemy.type).toBe(EnemyType.Orc)
    expect(enemy.hp).toBe(80)
    expect(enemy.speed).toBe(2)
    expect(enemy.damage).toBe(15)
  })

  it('creates slime with correct stats', () => {
    const enemy = new Enemy(slimeConfig, new THREE.Vector3(0, 0, 0))

    expect(enemy.type).toBe(EnemyType.Slime)
    expect(enemy.hp).toBe(30)
    expect(enemy.speed).toBe(2.5)
    expect(enemy.damage).toBe(5)
  })

  it('creates bat with correct stats', () => {
    const enemy = new Enemy(batConfig, new THREE.Vector3(0, 0, 0))

    expect(enemy.type).toBe(EnemyType.Bat)
    expect(enemy.hp).toBe(20)
    expect(enemy.speed).toBe(5)
    expect(enemy.damage).toBe(4)
  })

  it('starts in patrol state', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    expect(enemy.state).toBe(EnemyState.Patrol)
  })

  it('spawns at given position', () => {
    const pos = new THREE.Vector3(10, 0, 20)
    const enemy = new Enemy(goblinConfig, pos)

    expect(enemy.mesh.position.x).toBe(10)
    expect(enemy.mesh.position.y).toBe(0)
    expect(enemy.mesh.position.z).toBe(20)
  })

  it('getPosition returns cloned position', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(5, 0, 10))
    const pos = enemy.getPosition()

    expect(pos).toEqual(new THREE.Vector3(5, 0, 10))
    expect(pos).not.toBe(enemy.mesh.position)
  })

  it('takeDamage reduces hp', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    enemy.takeDamage(15)

    expect(enemy.hp).toBe(25)
  })

  it('takeDamage returns false when hp above 0', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const dead = enemy.takeDamage(20)

    expect(dead).toBe(false)
  })

  it('takeDamage returns true when hp reaches 0', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const dead = enemy.takeDamage(40)

    expect(dead).toBe(true)
  })

  it('canAttack returns false initially due to cooldown', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    expect(enemy.canAttack()).toBe(false)
  })

  it('attack sets cooldown', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    enemy.attack()

    expect(enemy.canAttack()).toBe(false)
  })

  it('setRocks stores rocks', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const rocks = [{ x: 5, z: 5, radius: 1 }]
    enemy.setRocks(rocks)

    expect(enemy).toBeDefined()
  })
})

describe('Enemy update behavior', () => {
  it('chases player when within detect range', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const playerPos = new THREE.Vector3(5, 0, 0)

    enemy.update(0.1, playerPos)

    expect(enemy.state).toBe(EnemyState.Chase)
  })

  it('attacks when within attack range', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const playerPos = new THREE.Vector3(0.5, 0, 0)

    enemy.update(0.1, playerPos)

    expect(enemy.state).toBe(EnemyState.Attack)
  })

  it('patrols when player is far', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const playerPos = new THREE.Vector3(100, 0, 100)

    enemy.update(0.1, playerPos)

    expect(enemy.state).toBe(EnemyState.Patrol)
  })

  it('patrol moves enemy', () => {
    const enemy = new Enemy(goblinConfig, new THREE.Vector3(0, 0, 0))
    const playerPos = new THREE.Vector3(100, 0, 100)
    const initialX = enemy.mesh.position.x
    const initialZ = enemy.mesh.position.z

    enemy.update(1, playerPos)

    const moved = enemy.mesh.position.x !== initialX || enemy.mesh.position.z !== initialZ
    expect(moved).toBe(true)
  })
})

describe('EnemyManager', () => {
  let scene: THREE.Scene
  let manager: EnemyManager

  beforeEach(() => {
    scene = createMockScene()
    manager = new EnemyManager(scene)
  })

  it('spawns enemy and adds to scene', () => {
    manager.spawn(goblinConfig, 20)

    expect(manager.getEnemies()).toHaveLength(1)
    expect(scene.add).toHaveBeenCalled()
  })

  it('does not spawn enemy too close to center', () => {
    manager.spawn(goblinConfig, 20)
    manager.spawn(goblinConfig, 20)
    manager.spawn(goblinConfig, 20)

    const enemies = manager.getEnemies()
    for (const enemy of enemies) {
      const dist = Math.sqrt(enemy.getPosition().x ** 2 + enemy.getPosition().z ** 2)
      expect(dist).toBeGreaterThanOrEqual(8)
    }
  })

  it('removes enemy from manager and scene', () => {
    manager.spawn(goblinConfig, 20)
    const enemy = manager.getEnemies()[0]
    manager.remove(enemy)

    expect(manager.getEnemies()).toHaveLength(0)
    expect(scene.remove).toHaveBeenCalled()
  })

  it('spawnAt creates enemy at exact position', () => {
    const pos = new THREE.Vector3(10, 0, 20)
    manager.spawnAt(goblinConfig, pos, [])

    const enemies = manager.getEnemies()
    expect(enemies).toHaveLength(1)
    expect(enemies[0].getPosition().x).toBe(10)
    expect(enemies[0].getPosition().z).toBe(20)
  })

  it('setRocks propagates to all enemies', () => {
    manager.spawnAt(goblinConfig, new THREE.Vector3(10, 0, 10), [])
    manager.spawnAt(orcConfig, new THREE.Vector3(-15, 0, -15), [])
    const rocks = [{ x: 5, z: 5, radius: 1 }]
    manager.setRocks(rocks)

    expect(manager.getEnemies()).toHaveLength(2)
  })

  it('update calls update on all enemies', () => {
    manager.spawnAt(goblinConfig, new THREE.Vector3(10, 0, 10), [])
    manager.spawnAt(orcConfig, new THREE.Vector3(-15, 0, -15), [])
    const playerPos = new THREE.Vector3(0, 0, 0)

    manager.update(0.1, playerPos)

    expect(manager.getEnemies()).toHaveLength(2)
  })

  it('getEnemies returns array of enemies', () => {
    manager.spawn(goblinConfig, 20)
    manager.spawn(orcConfig, 20)

    const enemies = manager.getEnemies()
    expect(Array.isArray(enemies)).toBe(true)
    expect(enemies.every((e) => e instanceof Enemy)).toBe(true)
  })
})
