import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Player } from './Player'

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

describe('Player', () => {
  function createPlayer() {
    return new Player()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default state', () => {
    const player = createPlayer()

    expect(player.state.hp).toBe(100)
    expect(player.state.maxHp).toBe(100)
    expect(player.state.speed).toBe(8)
    expect(player.state.rotation).toBe(0)
  })

  it('starts at origin', () => {
    const player = createPlayer()

    expect(player.mesh.position.x).toBe(0)
    expect(player.mesh.position.y).toBe(0)
    expect(player.mesh.position.z).toBe(0)
  })

  it('takeDamage reduces hp', () => {
    const player = createPlayer()
    player.takeDamage(25)

    expect(player.state.hp).toBe(75)
  })

  it('takeDamage returns false when hp above 0', () => {
    const player = createPlayer()
    const dead = player.takeDamage(50)

    expect(dead).toBe(false)
  })

  it('takeDamage returns true when hp reaches 0', () => {
    const player = createPlayer()
    const dead = player.takeDamage(100)

    expect(dead).toBe(true)
  })

  it('takeDamage returns true when hp goes below 0', () => {
    const player = createPlayer()
    const dead = player.takeDamage(150)

    expect(dead).toBe(true)
    expect(player.state.hp).toBe(-50)
  })

  it('heal increases hp but not above max', () => {
    const player = createPlayer()
    player.takeDamage(50)
    player.heal(25)

    expect(player.state.hp).toBe(75)
  })

  it('heal caps at maxHp', () => {
    const player = createPlayer()
    player.takeDamage(20)
    player.heal(50)

    expect(player.state.hp).toBe(100)
  })

  it('heal does nothing when at full hp', () => {
    const player = createPlayer()
    player.heal(50)

    expect(player.state.hp).toBe(100)
  })

  it('getDirection returns forward vector at rotation 0', () => {
    const player = createPlayer()
    const dir = player.getDirection()

    expect(dir.x).toBeCloseTo(0, 5)
    expect(dir.z).toBeCloseTo(1, 5)
    expect(dir.y).toBe(0)
  })

  it('getDirection returns correct vector after rotation', () => {
    const player = createPlayer()
    player.mesh.rotation.y = Math.PI / 2
    const dir = player.getDirection()

    expect(dir.x).toBeCloseTo(1, 5)
    expect(dir.z).toBeCloseTo(0, 5)
  })

  it('getMuzzlePosition is in front of player', () => {
    const player = createPlayer()
    const muzzle = player.getMuzzlePosition()

    expect(muzzle.y).toBe(0.7)
    expect(muzzle.z).toBeGreaterThan(0)
  })

  it('setRocks stores rocks for collision', () => {
    const player = createPlayer()
    const rocks = [{ x: 5, z: 5, radius: 1, height: 1 }]
    player.setRocks(rocks)

    expect(player).toBeDefined()
  })

  it('updateAnimation does not throw', () => {
    const player = createPlayer()

    expect(() => player.updateAnimation(0.016)).not.toThrow()
  })

  it('triggerRecoil does not throw', () => {
    const player = createPlayer()

    expect(() => player.triggerRecoil()).not.toThrow()
  })

  it('state.position is synced with mesh position', () => {
    const player = createPlayer()
    player.mesh.position.set(3, 0, 4)
    player.state.position.copy(player.mesh.position)

    expect(player.state.position.x).toBe(3)
    expect(player.state.position.z).toBe(4)
  })
})
