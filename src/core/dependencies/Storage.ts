/**
 * Storage interface for Node.js / CLI environments.
 * Abstracts away localStorage so it can be backed by in-memory, file, or other storage.
 * Only includes methods actually used by SaveSystem.
 */
export interface IStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * In-memory storage implementation.
 */
export class MemoryStorage implements IStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  /**
   * Export all data as a plain object (useful for debugging/saving to file)
   */
  toObject(): Record<string, string> {
    const obj: Record<string, string> = {}
    this.data.forEach((value, key) => {
      obj[key] = value
    })
    return obj
  }

  /**
   * Import data from a plain object
   */
  fromObject(data: Record<string, string>): void {
    this.data = new Map(Object.entries(data))
  }
}
