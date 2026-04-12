/**
 * Simple dependency injection container.
 * Allows setting and retrieving dependencies by string key.
 */
export class DependencyContainer {
  private deps = new Map<string, unknown>()

  /**
   * Set a dependency by key
   */
  set(key: string, value: unknown): void {
    this.deps.set(key, value)
  }

  /**
   * Get a dependency by key, throws if not found
   */
  get(key: string): unknown {
    const dep = this.deps.get(key)
    if (dep === undefined) {
      throw new Error(`Dependency not found: ${key}`)
    }
    return dep
  }

  /**
   * Check if a dependency exists
   */
  has(key: string): boolean {
    return this.deps.has(key)
  }

  /**
   * Remove a dependency
   */
  remove(key: string): boolean {
    return this.deps.delete(key)
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.deps.clear()
  }
}

// Container instance keys
export const DependencyKeys = {
  TimeSource: 'timeSource',
  RandomSource: 'randomSource',
  InputSource: 'inputSource',
  ChunkLoader: 'chunkLoader'
} as const

export type DependencyKey = (typeof DependencyKeys)[keyof typeof DependencyKeys]
