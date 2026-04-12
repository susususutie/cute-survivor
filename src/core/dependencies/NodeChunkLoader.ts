import type { IChunkLoader, ChunkData } from './interfaces'

/**
 * In-memory chunk loader for Node.js environments.
 * Provides procedural chunk generation using world seed.
 */
export class NodeChunkLoader implements IChunkLoader {
  private loadedChunks = new Map<string, ChunkData>()
  private worldSeed: string

  constructor(worldSeed = 'default') {
    this.worldSeed = worldSeed
  }

  getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  loadChunk(x: number, z: number): ChunkData | null {
    const key = this.getChunkKey(x, z)
    if (this.loadedChunks.has(key)) {
      return this.loadedChunks.get(key) ?? null
    }

    // Generate chunk procedurally based on seed and position
    const chunk = this.generateChunk(x, z)
    this.loadedChunks.set(key, chunk)
    return chunk
  }

  saveChunk(x: number, z: number, data: ChunkData): void {
    const key = this.getChunkKey(x, z)
    this.loadedChunks.set(key, data)
  }

  private generateChunk(chunkX: number, chunkZ: number): ChunkData {
    // Use world seed + chunk coordinates to generate deterministic terrain
    const seed = this.hashString(`${this.worldSeed}_${chunkX}_${chunkZ}`)
    const rng = this.createSeededRandom(seed)

    const rocks: ChunkData['rocks'] = []
    const rockCount = rng() * 3 + 1

    for (let i = 0; i < rockCount; i++) {
      rocks.push({
        x: (rng() - 0.5) * 20 + chunkX * 24,
        z: (rng() - 0.5) * 20 + chunkZ * 24,
        radius: rng() * 0.5 + 0.3,
        height: rng() * 1.5 + 0.5
      })
    }

    const vegetation: ChunkData['vegetation'] = []
    const vegCount = rng() * 5 + 2

    const vegTypes: ('tree' | 'grass' | 'flower' | 'bush')[] = ['tree', 'grass', 'flower', 'bush']
    for (let i = 0; i < vegCount; i++) {
      vegetation.push({
        x: (rng() - 0.5) * 20 + chunkX * 24,
        z: (rng() - 0.5) * 20 + chunkZ * 24,
        type: vegTypes[Math.floor(rng() * vegTypes.length)],
        scale: rng() * 0.5 + 0.5
      })
    }

    const resources: ChunkData['resources'] = []
    if (rng() > 0.5) {
      const resType = rng() > 0.5 ? 'herb' : 'ore'
      resources.push({
        x: (rng() - 0.5) * 20 + chunkX * 24,
        z: (rng() - 0.5) * 20 + chunkZ * 24,
        type: resType
      })
    }

    return { rocks, vegetation, resources }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private createSeededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
  }

  /**
   * Clear all loaded chunks
   */
  clear(): void {
    this.loadedChunks.clear()
  }

  /**
   * Set world seed (for regeneration)
   */
  setWorldSeed(seed: string): void {
    this.worldSeed = seed
    this.clear()
  }
}
