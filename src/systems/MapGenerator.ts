export class SeededRandom {
  private seed: number

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
}

export interface ResourcePoint {
  x: number
  z: number
  type: 'herb' | 'ore'
}

export interface MapData {
  rocks: Rock[]
  resources: ResourcePoint[]
  playerSpawn: { x: number; z: number }
}

export class MapGenerator {
  private rng: SeededRandom
  private bounds: number

  constructor(seed: number, bounds: number) {
    this.rng = new SeededRandom(seed)
    this.bounds = bounds
  }

  generate(): MapData {
    const rocks = this.generateRocks(15)
    const resources = this.generateResources(10)
    const playerSpawn = this.getPlayerSpawn()

    return { rocks, resources, playerSpawn }
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

      const radius = this.rng.next() * 0.5 + 0.5
      rocks.push({ x, z, radius })
    }

    return rocks
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