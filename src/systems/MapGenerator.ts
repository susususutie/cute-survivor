export class SeededRandom {
  public seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      const temp = result[i]
      result[i] = result[j]
      result[j] = temp
    }
    return result
  }
}

export interface Rock {
  x: number
  z: number
  radius: number
  height: number
}

export interface TerrainHeight {
  x: number
  z: number
  height: number
}

export interface Vegetation {
  x: number
  z: number
  type: 'tree' | 'grass' | 'flower' | 'bush'
  scale: number
}

export interface ResourcePoint {
  x: number
  z: number
  type: 'herb' | 'ore'
}

export interface MapData {
  rocks: Rock[]
  terrain: TerrainHeight[]
  vegetation: Vegetation[]
  resources: ResourcePoint[]
  playerSpawn: { x: number; z: number }
}

export class MapGenerator {
  private rng: SeededRandom
  private bounds: number
  private chunkSize = 48

  constructor(seed: number, bounds: number) {
    this.rng = new SeededRandom(seed)
    this.bounds = bounds
  }

  generate(): MapData {
    const rocks = this.generateRocks(20)
    const terrain = this.generateTerrain(12)
    const vegetation = this.generateVegetation(30)
    const resources = this.generateResources(15)
    const playerSpawn = this.getPlayerSpawn()

    return { rocks, terrain, vegetation, resources, playerSpawn }
  }

  generateChunk(chunkX: number, chunkZ: number): MapData {
    const chunkSeed = this.rng.seed + chunkX * 73856093 + chunkZ * 19349663
    const chunkRng = new SeededRandom(chunkSeed)
    
    const rocks = this.generateRocksInChunk(chunkX, chunkZ, chunkRng, 8)
    const terrain = this.generateTerrainInChunk(chunkX, chunkZ, chunkRng, 6)
    const vegetation = this.generateVegetationInChunk(chunkX, chunkZ, chunkRng, 15)
    const resources = this.generateResourcesInChunk(chunkX, chunkZ, chunkRng, 5)
    
    return { 
      rocks, 
      terrain, 
      vegetation, 
      resources, 
      playerSpawn: { x: 0, z: 0 } 
    }
  }

  private generateRocks(count: number): Rock[] {
    const rocks: Rock[] = []

    for (let i = 0; i < count; i++) {
      const x = this.rng.nextInt(-this.bounds + 2, this.bounds - 2)
      const z = this.rng.nextInt(-this.bounds + 2, this.bounds - 2)

      const distToCenter = Math.sqrt(x * x + z * z)
      if (distToCenter < 5) continue

      let tooClose = false
      for (const rock of rocks) {
        const dist = Math.sqrt((rock.x - x) ** 2 + (rock.z - z) ** 2)
        if (dist < 3) {
          tooClose = true
          break
        }
      }
      if (tooClose) continue

      const radius = this.rng.next() * 0.8 + 0.4
      const height = this.rng.next() * 1.5 + 0.5
      rocks.push({ x, z, radius, height })
    }

    return rocks
  }

  private generateRocksInChunk(chunkX: number, chunkZ: number, rng: SeededRandom, count: number): Rock[] {
    const rocks: Rock[] = []
    const offsetX = chunkX * this.chunkSize
    const offsetZ = chunkZ * this.chunkSize

    for (let i = 0; i < count; i++) {
      const x = offsetX + rng.nextInt(-this.chunkSize / 2 + 2, this.chunkSize / 2 - 2)
      const z = offsetZ + rng.nextInt(-this.chunkSize / 2 + 2, this.chunkSize / 2 - 2)

      const distToCenter = Math.sqrt(x * x + z * z)
      if (distToCenter < 8) continue

      let tooClose = false
      for (const rock of rocks) {
        const dist = Math.sqrt((rock.x - x) ** 2 + (rock.z - z) ** 2)
        if (dist < 2.5) {
          tooClose = true
          break
        }
      }
      if (tooClose) continue

      const radius = rng.next() * 0.8 + 0.4
      const height = rng.next() * 1.5 + 0.5
      rocks.push({ x, z, radius, height })
    }

    return rocks
  }

  private generateTerrain(count: number): TerrainHeight[] {
    const terrain: TerrainHeight[] = []
    
    for (let i = 0; i < count; i++) {
      const x = this.rng.nextInt(-this.bounds, this.bounds)
      const z = this.rng.nextInt(-this.bounds, this.bounds)
      const height = this.rng.next() * 2 - 0.5
      terrain.push({ x, z, height })
    }
    return terrain
  }

  private generateTerrainInChunk(chunkX: number, chunkZ: number, rng: SeededRandom, count: number): TerrainHeight[] {
    const terrain: TerrainHeight[] = []
    const offsetX = chunkX * this.chunkSize
    const offsetZ = chunkZ * this.chunkSize
    
    for (let i = 0; i < count; i++) {
      const x = offsetX + rng.nextInt(-this.chunkSize / 2, this.chunkSize / 2)
      const z = offsetZ + rng.nextInt(-this.chunkSize / 2, this.chunkSize / 2)
      const height = rng.next() * 2 - 0.5
      terrain.push({ x, z, height })
    }
    return terrain
  }

  private generateVegetation(count: number): Vegetation[] {
    const vegetation: Vegetation[] = []
    const types: ('tree' | 'grass' | 'flower' | 'bush')[] = ['tree', 'grass', 'flower', 'bush']

    for (let i = 0; i < count; i++) {
      const x = this.rng.nextInt(-this.bounds + 1, this.bounds - 1)
      const z = this.rng.nextInt(-this.bounds + 1, this.bounds - 1)
      const type = types[this.rng.nextInt(0, types.length - 1)]
      const scale = this.rng.next() * 0.5 + 0.5
      vegetation.push({ x, z, type, scale })
    }

    return vegetation
  }

  private generateVegetationInChunk(chunkX: number, chunkZ: number, rng: SeededRandom, count: number): Vegetation[] {
    const vegetation: Vegetation[] = []
    const types: ('tree' | 'grass' | 'flower' | 'bush')[] = ['tree', 'grass', 'flower', 'bush']
    const offsetX = chunkX * this.chunkSize
    const offsetZ = chunkZ * this.chunkSize

    for (let i = 0; i < count; i++) {
      const x = offsetX + rng.nextInt(-this.chunkSize / 2 + 1, this.chunkSize / 2 - 1)
      const z = offsetZ + rng.nextInt(-this.chunkSize / 2 + 1, this.chunkSize / 2 - 1)
      const type = types[rng.nextInt(0, types.length - 1)]
      const scale = rng.next() * 0.5 + 0.5
      vegetation.push({ x, z, type, scale })
    }

    return vegetation
  }

  private generateResources(count: number): ResourcePoint[] {
    const resources: ResourcePoint[] = []

    for (let i = 0; i < count; i++) {
      const x = this.rng.nextInt(-this.bounds + 3, this.bounds - 3)
      const z = this.rng.nextInt(-this.bounds + 3, this.bounds - 3)

      const distToCenter = Math.sqrt(x * x + z * z)
      if (distToCenter < 4) continue

      const type = this.rng.next() > 0.5 ? 'herb' : 'ore'
      resources.push({ x, z, type })
    }

    return resources
  }

  private generateResourcesInChunk(chunkX: number, chunkZ: number, rng: SeededRandom, count: number): ResourcePoint[] {
    const resources: ResourcePoint[] = []
    const offsetX = chunkX * this.chunkSize
    const offsetZ = chunkZ * this.chunkSize

    for (let i = 0; i < count; i++) {
      const x = offsetX + rng.nextInt(-this.chunkSize / 2 + 3, this.chunkSize / 2 - 3)
      const z = offsetZ + rng.nextInt(-this.chunkSize / 2 + 3, this.chunkSize / 2 - 3)
      const type = rng.next() > 0.5 ? 'herb' : 'ore'
      resources.push({ x, z, type })
    }

    return resources
  }

  private getPlayerSpawn(): { x: number; z: number } {
    return { x: 0, z: 0 }
  }

  isWalkable(x: number, z: number, rocks: Rock[]): boolean {
    for (const rock of rocks) {
      const dist = Math.sqrt((rock.x - x) ** 2 + (rock.z - z) ** 2)
      if (dist < rock.radius + 0.5) return false
    }
    return true
  }
}