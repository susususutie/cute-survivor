/**
 * Pure world / chunk management functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

// ---------------------------------------------------------------------------
// Chunk key helpers
// ---------------------------------------------------------------------------

/**
 * Returns the canonical string key for a chunk at grid coordinates (x, z).
 * Matches the format used throughout Game.ts (`"${cx},${cz}"`).
 */
export function calculateChunkKey(x: number, z: number): string {
  return `${x},${z}`
}

/**
 * Parses a chunk key back into its grid coordinates.
 * Returns `null` if the key is malformed.
 */
export function parseChunkKey(key: string): { x: number; z: number } | null {
  const parts = key.split(',')
  if (parts.length !== 2) return null
  const x = Number(parts[0])
  const z = Number(parts[1])
  if (Number.isNaN(x) || Number.isNaN(z)) return null
  return { x, z }
}

/**
 * Converts a world-space X or Z coordinate to the chunk-grid index.
 */
export function worldToChunk(worldCoord: number, chunkSize: number): number {
  return Math.floor(worldCoord / chunkSize)
}

// ---------------------------------------------------------------------------
// Load / unload decisions
// ---------------------------------------------------------------------------

/**
 * Returns the keys of all chunks that should be loaded around the player.
 * Only keys absent from `loadedChunkKeys` are included (i.e. need to be
 * created/fetched).
 *
 * @param playerChunkX   Player's current chunk X index.
 * @param playerChunkZ   Player's current chunk Z index.
 * @param loadedChunkKeys  Set of keys already in memory.
 * @param loadDistance   Radius of the square load area (chunks from centre).
 */
export function shouldLoadChunk(
  playerChunkX: number,
  playerChunkZ: number,
  loadedChunkKeys: ReadonlySet<string>,
  loadDistance: number
): string[] {
  const toLoad: string[] = []

  for (let dx = -loadDistance; dx <= loadDistance; dx++) {
    for (let dz = -loadDistance; dz <= loadDistance; dz++) {
      const key = calculateChunkKey(playerChunkX + dx, playerChunkZ + dz)
      if (!loadedChunkKeys.has(key)) {
        toLoad.push(key)
      }
    }
  }

  return toLoad
}

/**
 * Returns the keys of all loaded chunks that are too far from the player to
 * remain in memory.
 *
 * @param playerChunkX   Player's current chunk X index.
 * @param playerChunkZ   Player's current chunk Z index.
 * @param loadedChunkKeys  Keys currently in memory.
 * @param loadDistance   Radius of the square load area.
 */
export function shouldUnloadChunk(
  playerChunkX: number,
  playerChunkZ: number,
  loadedChunkKeys: ReadonlySet<string>,
  loadDistance: number
): string[] {
  const toUnload: string[] = []

  for (const key of loadedChunkKeys) {
    const coords = parseChunkKey(key)
    if (!coords) {
      toUnload.push(key)
      continue
    }
    const dx = Math.abs(coords.x - playerChunkX)
    const dz = Math.abs(coords.z - playerChunkZ)
    // Use loadDistance + 1 buffer matching Game.ts `cleanupDistantChunks`
    if (dx > loadDistance + 1 || dz > loadDistance + 1) {
      toUnload.push(key)
    }
  }

  return toUnload
}
