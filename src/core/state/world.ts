/**
 * World state - pure data, no methods.
 */

/** Rock obstacle data within a chunk */
export interface RockData {
  x: number
  z: number
  radius: number
  height: number
}

/** Vegetation data within a chunk */
export interface VegetationData {
  type: 'tree' | 'grass' | 'flower' | 'bush'
  x: number
  z: number
  scale: number
}

/** Resource node data within a chunk */
export interface ResourceData {
  type: 'herb' | 'ore'
  x: number
  z: number
}

/** Terrain mound data within a chunk */
export interface TerrainData {
  x: number
  z: number
  height: number
}

/** Chunk data keyed by "chunkX,chunkZ" string */
export interface ChunkData {
  x: number
  z: number
  rocks: RockData[]
  vegetation: VegetationData[]
  resources: ResourceData[]
  terrain: TerrainData[]
}

/** World state - all fields are plain serializable data */
export interface WorldState {
  seed: string
  currentChunkX: number
  currentChunkZ: number
  chunks: Record<string, ChunkData>
  loadedChunkIds: string[]
  loadDistance: number
  chunkSize: number
  terrainSeed: number
  monsterSeed: number
  loadedChunkKeys: string[]
}

/** Map generator seed state */
export interface SeededRngState {
  seed: number
  index: number
}
