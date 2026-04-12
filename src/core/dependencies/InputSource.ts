import type { IInputSource, InputState } from './interfaces'

/**
 * InputSource handles keyboard and mouse input, providing a clean interface
 * for game logic to query input state without coupling to event system.
 */
export class InputSource implements IInputSource {
  private state: InputState
  private element: HTMLElement | Window

  constructor(element?: HTMLElement | Window) {
    this.element = element ?? window
    this.state = {
      keys: new Set(),
      mouse: { x: 0, y: 0, down: false, dx: 0, dy: 0 },
      movement: { forward: false, backward: false, left: false, right: false },
      actions: { attack: false, defend: false, interact: false, inventory: false }
    }

    this.bindEvents()
  }

  private bindEvents(): void {
    const win = this.element as Window

    win.addEventListener('keydown', this.onKeyDown.bind(this))
    win.addEventListener('keyup', this.onKeyUp.bind(this))
    win.addEventListener('mousedown', this.onMouseDown.bind(this))
    win.addEventListener('mouseup', this.onMouseUp.bind(this))
    win.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.state.keys.add(e.key.toLowerCase())
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.state.keys.delete(e.key.toLowerCase())
  }

  private onMouseDown(_e: MouseEvent): void {
    this.state.mouse.down = true
  }

  private onMouseUp(_e: MouseEvent): void {
    this.state.mouse.down = false
  }

  private onMouseMove(e: MouseEvent): void {
    // Track mouse delta while button is held
    if (this.state.mouse.down) {
      this.state.mouse.dx += e.movementX
      this.state.mouse.dy += e.movementY
    }

    // Update absolute position
    this.state.mouse.x = e.clientX
    this.state.mouse.y = e.clientY
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

    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) z -= 1
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) z += 1
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1

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
   * Remove all event listeners
   */
  dispose(): void {
    const win = this.element as Window
    win.removeEventListener('keydown', this.onKeyDown.bind(this))
    win.removeEventListener('keyup', this.onKeyUp.bind(this))
    win.removeEventListener('mousedown', this.onMouseDown.bind(this))
    win.removeEventListener('mouseup', this.onMouseUp.bind(this))
    win.removeEventListener('mousemove', this.onMouseMove.bind(this))
  }
}

/**
 * Creates an input source with default window element
 */
export function createInputSource(): IInputSource {
  return new InputSource()
}
