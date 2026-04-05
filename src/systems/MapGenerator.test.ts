import { describe, it, expect } from 'vitest'
import { SeededRandom, MapGenerator } from './MapGenerator'

describe('SeededRandom', () => {
  it('produces deterministic sequence with same seed', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next())
    }
  })

  it('produces different sequences with different seeds', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(43)

    const values1 = Array.from({ length: 10 }, () => rng1.next())
    const values2 = Array.from({ length: 10 }, () => rng2.next())

    expect(values1).not.toEqual(values2)
  })

  it('returns values in range [0, 1)', () => {
    const rng = new SeededRandom(12345)

    for (let i = 0; i < 1000; i++) {
      const val = rng.next()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('nextInt returns values within specified range', () => {
    const rng = new SeededRandom(999)

    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10)
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(10)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('nextInt returns exact value when min equals max', () => {
    const rng = new SeededRandom(1)
    expect(rng.nextInt(7, 7)).toBe(7)
  })

  it('shuffle returns array with same elements in different order', () => {
    const rng = new SeededRandom(42)
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = rng.shuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect(shuffled.sort((a, b) => a - b)).toEqual(original)
  })

  it('shuffle does not mutate original array', () => {
    const rng = new SeededRandom(42)
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    rng.shuffle(original)

    expect(original).toEqual(copy)
  })

  it('different seeds produce different shuffles', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled1 = new SeededRandom(1).shuffle([...arr])
    const shuffled2 = new SeededRandom(2).shuffle([...arr])

    expect(shuffled1).not.toEqual(shuffled2)
  })

  it('same seed produces same shuffle', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled1 = new SeededRandom(42).shuffle([...arr])
    const shuffled2 = new SeededRandom(42).shuffle([...arr])

    expect(shuffled1).toEqual(shuffled2)
  })

  it('handles empty array shuffle', () => {
    const rng = new SeededRandom(1)
    expect(rng.shuffle([])).toEqual([])
  })

  it('handles single element array shuffle', () => {
    const rng = new SeededRandom(1)
    expect(rng.shuffle([42])).toEqual([42])
  })
})

describe('MapGenerator', () => {
  const seed = 12345
  const bounds = 50

  it('generates map data with all required fields', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    expect(map).toHaveProperty('rocks')
    expect(map).toHaveProperty('terrain')
    expect(map).toHaveProperty('vegetation')
    expect(map).toHaveProperty('resources')
    expect(map).toHaveProperty('playerSpawn')
  })

  it('generates rocks within bounds', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    for (const rock of map.rocks) {
      expect(rock.x).toBeGreaterThanOrEqual(-bounds + 2)
      expect(rock.x).toBeLessThanOrEqual(bounds - 2)
      expect(rock.z).toBeGreaterThanOrEqual(-bounds + 2)
      expect(rock.z).toBeLessThanOrEqual(bounds - 2)
      expect(rock.radius).toBeGreaterThanOrEqual(0.4)
      expect(rock.radius).toBeLessThanOrEqual(1.2)
      expect(rock.height).toBeGreaterThanOrEqual(0.5)
      expect(rock.height).toBeLessThanOrEqual(2.0)
    }
  })

  it('rocks are not too close to spawn', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    for (const rock of map.rocks) {
      const dist = Math.sqrt(rock.x * rock.x + rock.z * rock.z)
      expect(dist).toBeGreaterThanOrEqual(5)
    }
  })

  it('rocks are not overlapping', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    for (let i = 0; i < map.rocks.length; i++) {
      for (let j = i + 1; j < map.rocks.length; j++) {
        const dx = map.rocks[i].x - map.rocks[j].x
        const dz = map.rocks[i].z - map.rocks[j].z
        const dist = Math.sqrt(dx * dx + dz * dz)
        expect(dist).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('generates terrain within bounds', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    for (const t of map.terrain) {
      expect(t.x).toBeGreaterThanOrEqual(-bounds)
      expect(t.x).toBeLessThanOrEqual(bounds)
      expect(t.z).toBeGreaterThanOrEqual(-bounds)
      expect(t.z).toBeLessThanOrEqual(bounds)
    }
  })

  it('generates vegetation with valid types', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()
    const validTypes = ['tree', 'grass', 'flower', 'bush']

    for (const veg of map.vegetation) {
      expect(validTypes).toContain(veg.type)
      expect(veg.scale).toBeGreaterThanOrEqual(0.5)
      expect(veg.scale).toBeLessThanOrEqual(1.0)
    }
  })

  it('generates resources with valid types', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    for (const res of map.resources) {
      expect(['herb', 'ore']).toContain(res.type)
      const dist = Math.sqrt(res.x * res.x + res.z * res.z)
      expect(dist).toBeGreaterThanOrEqual(4)
    }
  })

  it('player spawn is at origin', () => {
    const gen = new MapGenerator(seed, bounds)
    const map = gen.generate()

    expect(map.playerSpawn).toEqual({ x: 0, z: 0 })
  })

  it('generates deterministic map with same seed', () => {
    const gen1 = new MapGenerator(seed, bounds)
    const gen2 = new MapGenerator(seed, bounds)
    const map1 = gen1.generate()
    const map2 = gen2.generate()

    expect(map1).toEqual(map2)
  })

  it('generates different maps with different seeds', () => {
    const gen1 = new MapGenerator(1, bounds)
    const gen2 = new MapGenerator(2, bounds)
    const map1 = gen1.generate()
    const map2 = gen2.generate()

    expect(map1).not.toEqual(map2)
  })
})

describe('MapGenerator chunk generation', () => {
  const seed = 54321

  it('generates chunk data with all required fields', () => {
    const gen = new MapGenerator(seed, 50)
    const chunk = gen.generateChunk(0, 0)

    expect(chunk).toHaveProperty('rocks')
    expect(chunk).toHaveProperty('terrain')
    expect(chunk).toHaveProperty('vegetation')
    expect(chunk).toHaveProperty('resources')
    expect(chunk).toHaveProperty('playerSpawn')
  })

  it('generates different chunks for different coordinates', () => {
    const gen = new MapGenerator(seed, 50)
    const chunk1 = gen.generateChunk(0, 0)
    const chunk2 = gen.generateChunk(1, 0)

    expect(chunk1).not.toEqual(chunk2)
  })

  it('generates same chunk for same coordinates', () => {
    const gen = new MapGenerator(seed, 50)
    const chunk1 = gen.generateChunk(2, 3)
    const chunk2 = gen.generateChunk(2, 3)

    expect(chunk1).toEqual(chunk2)
  })

  it('chunk rocks are positioned relative to chunk offset', () => {
    const gen = new MapGenerator(seed, 50)
    const chunk = gen.generateChunk(1, 1)
    const chunkSize = 48

    for (const rock of chunk.rocks) {
      const expectedCenterX = 1 * chunkSize
      const expectedCenterZ = 1 * chunkSize
      expect(rock.x).toBeGreaterThanOrEqual(expectedCenterX - chunkSize / 2)
      expect(rock.x).toBeLessThanOrEqual(expectedCenterX + chunkSize / 2)
      expect(rock.z).toBeGreaterThanOrEqual(expectedCenterZ - chunkSize / 2)
      expect(rock.z).toBeLessThanOrEqual(expectedCenterZ + chunkSize / 2)
    }
  })
})

describe('MapGenerator.isWalkable', () => {
  it('returns true when no rocks', () => {
    const gen = new MapGenerator(1, 50)
    expect(gen.isWalkable(0, 0, [])).toBe(true)
  })

  it('returns true when far from rocks', () => {
    const gen = new MapGenerator(1, 50)
    const rocks = [{ x: 10, z: 10, radius: 1, height: 1 }]
    expect(gen.isWalkable(0, 0, rocks)).toBe(true)
  })

  it('returns false when inside rock radius', () => {
    const gen = new MapGenerator(1, 50)
    const rocks = [{ x: 0, z: 0, radius: 2, height: 1 }]
    expect(gen.isWalkable(0, 0, rocks)).toBe(false)
  })

  it('returns false when near rock edge', () => {
    const gen = new MapGenerator(1, 50)
    const rocks = [{ x: 0, z: 0, radius: 1, height: 1 }]
    expect(gen.isWalkable(1.2, 0, rocks)).toBe(false)
  })

  it('returns true when just outside rock radius plus margin', () => {
    const gen = new MapGenerator(1, 50)
    const rocks = [{ x: 0, z: 0, radius: 1, height: 1 }]
    expect(gen.isWalkable(2, 0, rocks)).toBe(true)
  })
})
