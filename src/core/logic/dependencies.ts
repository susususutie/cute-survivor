/**
 * Dependency interfaces injected into the pure logic layer.
 *
 * Implementations (real, test, deterministic replay, …) live outside this
 * module. The logic functions only depend on these interfaces, never on the
 * concrete classes in the systems/ folder.
 */

import type { ChunkData } from '../dependencies/interfaces'

// ---------------------------------------------------------------------------
// Time source
// ---------------------------------------------------------------------------

/**
 * Provides the current wall-clock time.
 * Using an interface rather than Date.now() / performance.now() directly
 * keeps pure functions deterministic under test.
 */
export interface ITimeSource {
  /** Monotonic time in seconds, equivalent to performance.now() / 1000. */
  now(): number
  /** Frame delta in seconds. Provided externally so logic is not coupled to
   *  a Clock object. */
  readonly deltaTime: number
}

// ---------------------------------------------------------------------------
// Random source
// ---------------------------------------------------------------------------

/**
 * Seeded random-number generator interface.
 * The logic layer never calls Math.random() directly.
 */
export interface IRandomSource {
  /** Returns the next value in [0, 1). */
  next(): number
  /** Returns a value uniformly distributed in [min, max). */
  range(min: number, max: number): number
  /** Picks a random element from the array. Throws if the array is empty. */
  pick<T>(array: readonly T[]): T
}

// ---------------------------------------------------------------------------
// Chunk loader
// ---------------------------------------------------------------------------

/**
 * Loads terrain chunk data for a given grid coordinate.
 * The returned data is plain serialisable JSON – no meshes, no scene objects.
 */
export interface IChunkLoader {
  loadChunk(chunkX: number, chunkZ: number): ChunkData | null
}

// ---------------------------------------------------------------------------
// Combined deps bundle
// ---------------------------------------------------------------------------

export interface GameDependencies {
  time: ITimeSource
  random: IRandomSource
  chunkLoader: IChunkLoader
}
