import type { ITimeSource } from './interfaces'

/**
 * NodeTimeSource provides time functionality for Node.js environments.
 * Uses Date.now() instead of performance.now() and allows manual deltaTime updates.
 */
export class NodeTimeSource implements ITimeSource {
  private _deltaTime = 0
  private autoIncrement = false
  private autoDelta = 0

  constructor(autoDelta = 0) {
    if (autoDelta > 0) {
      this.autoIncrement = true
      this.autoDelta = autoDelta
    }
  }

  now(): number {
    return Date.now()
  }

  get deltaTime(): number {
    if (this.autoIncrement) {
      return this.autoDelta
    }
    return this._deltaTime
  }

  set deltaTime(value: number) {
    this._deltaTime = value
  }

  /**
   * Update the delta time. Called once per frame with the elapsed time.
   * @param elapsed - Time elapsed since last update in seconds
   */
  updateDelta(elapsed: number): void {
    this._deltaTime = elapsed
  }

  /**
   * Advance time by a fixed amount (useful for deterministic simulation)
   * @param deltaSeconds - Time to advance in seconds
   */
  advance(deltaSeconds: number): void {
    this._deltaTime = deltaSeconds
  }

  /**
   * Reset the time source
   */
  reset(): void {
    this._deltaTime = 0
  }
}

/**
 * Creates a deterministic time source with fixed delta time per tick
 * @param deltaSeconds - Fixed delta time in seconds (e.g., 1/60 for 60fps)
 */
export function createDeterministicTimeSource(deltaSeconds: number = 1 / 60): ITimeSource {
  return new NodeTimeSource(deltaSeconds)
}
