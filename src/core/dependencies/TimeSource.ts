import type { ITimeSource } from './interfaces'

/**
 * TimeSource provides time functionality using performance.now()
 * and tracks delta time between frames.
 */
export class TimeSource implements ITimeSource {
  private _deltaTime = 0

  now(): number {
    return performance.now()
  }

  get deltaTime(): number {
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
}

/**
 * Creates a real-time time source that uses requestAnimationFrame timing.
 */
export function createRealTimeSource(): ITimeSource {
  let lastTime = performance.now()

  // Return a wrapper that auto-updates delta time
  return {
    now: () => performance.now(),
    get deltaTime() {
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now
      return delta
    }
  }
}
