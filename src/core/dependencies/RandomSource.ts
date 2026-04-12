import type { IRandomSource } from './interfaces'

/**
 * SeededRandom implementation of IRandomSource.
 * Uses linear congruential generator (LCG) algorithm.
 */
export class RandomSource implements IRandomSource {
  private seedValue: number

  constructor(seed?: number) {
    this.seedValue = seed ?? Date.now()
  }

  /**
   * Returns a random number in [0, 1)
   */
  next(): number {
    this.seedValue = (this.seedValue * 1103515245 + 12345) & 0x7fffffff
    return this.seedValue / 0x7fffffff
  }

  /**
   * Returns a random number in [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /**
   * Returns a random integer in [min, max]
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Returns true with the given probability (0-1)
   */
  boolean(probability: number): boolean {
    return this.next() < probability
  }

  /**
   * Randomly picks an element from the array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array')
    }
    return array[Math.floor(this.next() * array.length)]
  }

  /**
   * Re-initializes the random number generator with a new seed
   * Returns this instance for chaining
   */
  seed(value: number): IRandomSource {
    this.seedValue = value
    return this
  }
}

/**
 * Creates a random source with optional seed
 */
export function createRandomSource(seed?: number): IRandomSource {
  return new RandomSource(seed)
}
