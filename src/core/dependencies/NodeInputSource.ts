import type { IInputSource, InputState } from './interfaces'

/**
 * NodeInputSource provides programmable input for Node.js / CLI environments.
 * Allows scripts to simulate keyboard and mouse input without DOM events.
 */
export class NodeInputSource implements IInputSource {
  private state: InputState
  private keysPreviouslyDown = new Set<string>()
  private eventQueue: InputEvent[] = []

  constructor() {
    this.state = this.createEmptyState()
  }

  private createEmptyState(): InputState {
    return {
      keys: new Set<string>(),
      mouse: { x: 0, y: 0, down: false, dx: 0, dy: 0 },
      movement: { forward: false, backward: false, left: false, right: false },
      actions: { attack: false, defend: false, interact: false, inventory: false }
    }
  }

  /**
   * Press a key down
   */
  pressKey(key: string): void {
    const k = key.toLowerCase()
    this.state.keys.add(k)
    this.updateMovementFromKeys()
  }

  /**
   * Release a key
   */
  releaseKey(key: string): void {
    const k = key.toLowerCase()
    this.state.keys.delete(k)
    this.updateMovementFromKeys()
  }

  /**
   * Set a key state directly (useful for hold/release patterns)
   */
  setKey(key: string, pressed: boolean): void {
    const k = key.toLowerCase()
    if (pressed) {
      this.state.keys.add(k)
    } else {
      this.state.keys.delete(k)
    }
    this.updateMovementFromKeys()
  }

  /**
   * Press and release a key instantly (for button clicks etc)
   */
  tapKey(key: string): void {
    this.pressKey(key)
    // Key will be released on next update if not held
  }

  /**
   * Press mouse button
   */
  pressMouse(): void {
    this.state.mouse.down = true
  }

  /**
   * Release mouse button
   */
  releaseMouse(): void {
    this.state.mouse.down = false
  }

  /**
   * Set mouse position
   */
  setMousePosition(x: number, y: number): void {
    this.state.mouse.x = x
    this.state.mouse.y = y
  }

  /**
   * Add mouse movement delta
   */
  addMouseDelta(dx: number, dy: number): void {
    this.state.mouse.dx += dx
    this.state.mouse.dy += dy
  }

  /**
   * Clear all input state
   */
  clear(): void {
    this.state = this.createEmptyState()
  }

  /**
   * Queue an input sequence to be processed
   */
  queueInput(sequence: InputEvent[]): void {
    this.eventQueue.push(...sequence)
  }

  /**
   * Process queued input events
   */
  processQueue(): void {
    const now = Date.now()
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue[0]
      const eventTime = event.time ?? now
      if (eventTime <= now) {
        this.eventQueue.shift()
        this.applyEvent(event)
      } else {
        break
      }
    }
  }

  private applyEvent(event: InputEvent): void {
    switch (event.type) {
      case 'keydown':
        if (event.key !== undefined) this.pressKey(event.key)
        break
      case 'keyup':
        if (event.key !== undefined) this.releaseKey(event.key)
        break
      case 'mousedown':
        this.pressMouse()
        break
      case 'mouseup':
        this.releaseMouse()
        break
      case 'move':
        if (event.x !== undefined && event.y !== undefined) {
          this.setMousePosition(event.x, event.y)
        }
        if (event.dx !== undefined && event.dy !== undefined) {
          this.addMouseDelta(event.dx, event.dy)
        }
        break
    }
  }

  private updateMovementFromKeys(): void {
    this.state.movement.forward = this.state.keys.has('w') || this.state.keys.has('arrowup')
    this.state.movement.backward = this.state.keys.has('s') || this.state.keys.has('arrowdown')
    this.state.movement.left = this.state.keys.has('a') || this.state.keys.has('arrowleft')
    this.state.movement.right = this.state.keys.has('d') || this.state.keys.has('arrowright')
  }

  /**
   * Returns the complete input state snapshot
   */
  getState(): InputState {
    return this.state
  }

  /**
   * Check if a specific key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this.state.keys.has(key.toLowerCase())
  }

  /**
   * Check if mouse button is currently pressed
   */
  isMouseDown(): boolean {
    return this.state.mouse.down
  }

  /**
   * Returns normalized movement direction based on WASD/arrow keys
   * Returns { x, z } where each component is in [-1, 1]
   */
  getMovementDirection(): { x: number; z: number } {
    let x = 0
    let z = 0

    if (this.state.movement.forward) z -= 1
    if (this.state.movement.backward) z += 1
    if (this.state.movement.left) x -= 1
    if (this.state.movement.right) x += 1

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const len = Math.sqrt(x * x + z * z)
      x /= len
      z /= len
    }

    return { x, z }
  }

  /**
   * Clear accumulated mouse movement deltas
   */
  clearMovementDeltas(): void {
    this.state.mouse.dx = 0
    this.state.mouse.dy = 0
  }

  /**
   * Check if a key was just pressed this frame (not held)
   */
  isKeyJustPressed(key: string): boolean {
    const k = key.toLowerCase()
    const isDown = this.state.keys.has(k)
    const wasDown = this.keysPreviouslyDown.has(k)
    return isDown && !wasDown
  }

  /**
   * Check if a key was just released this frame
   */
  isKeyJustReleased(key: string): boolean {
    const k = key.toLowerCase()
    const isDown = this.state.keys.has(k)
    const wasDown = this.keysPreviouslyDown.has(k)
    return !isDown && wasDown
  }

  /**
   * Update the "previous" key states for just-pressed detection
   * Should be called once per frame
   */
  updatePreviousState(): void {
    this.keysPreviouslyDown = new Set(this.state.keys)
  }
}

export interface InputEvent {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'move'
  key?: string
  x?: number
  y?: number
  dx?: number
  dy?: number
  time?: number
}

/**
 * Creates a new NodeInputSource
 */
export function createNodeInputSource(): NodeInputSource {
  return new NodeInputSource()
}

/**
 * Helper to create input event
 */
export function inputEvent(
  type: InputEvent['type'],
  options: Partial<Pick<InputEvent, 'key' | 'x' | 'y' | 'dx' | 'dy' | 'time'>> = {}
): InputEvent {
  return { type, ...options, time: options.time ?? Date.now() }
}
