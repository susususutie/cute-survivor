/**
 * Player entity - Pure game logic without rendering code.
 * Rendering is handled by PlayerRenderer.
 */

import * as THREE from 'three'
import { PlayerRenderer } from '../renderer/PlayerRenderer'

/** Plain object Vector3 for use in pure logic (no THREE dependency) */
export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface PlayerState {
  id: string
  hp: number
  maxHp: number
  speed: number
  position: THREE.Vector3
  rotation: number
}

export interface PlayerSnapshotDTO {
  id: string
  hp: number
  maxHp: number
  speed: number
  position: { x: number; y: number; z: number }
  rotation: number
}

export interface Rock {
  x: number
  z: number
  radius: number
  height: number
}

export class Player {
  /** Renderer instance (can be null for headless testing) */
  private _renderer: PlayerRenderer | null = null

  /** Player state - pure data */
  public state: PlayerState

  /** Movement input */
  private keys = new Set<string>()
  private mousePos: THREE.Vector2 = new THREE.Vector2()
  private rocks: Rock[] = []
  private colliderRadius = 0.6

  // Store event handler references for cleanup
  private boundKeyDown!: (e: KeyboardEvent) => void
  private boundKeyUp!: (e: KeyboardEvent) => void
  private boundMouseMove!: (e: MouseEvent) => void

  // Timer cleanup
  private activeTimers = new Set<ReturnType<typeof setTimeout>>()

  /** Whether to initialize renderer (disable for testing) */
  constructor(withRenderer = true) {
    if (withRenderer) {
      this._renderer = new PlayerRenderer()
    }

    this.state = {
      id: `player_${Date.now()}`,
      hp: 100,
      maxHp: 100,
      speed: 8,
      position: new THREE.Vector3(0, 0, 0),
      rotation: 0
    }

    this.setupInput()
  }

  /** Get renderer mesh (for scene attachment) */
  get mesh(): THREE.Group {
    if (!this._renderer) {
      throw new Error('Player renderer not initialized')
    }
    return this._renderer.mesh
  }

  /** Check if renderer is available */
  get hasRenderer(): boolean {
    return this._renderer !== null
  }

  /**
   * Update animation (delegated to renderer)
   */
  updateAnimation(delta: number): void {
    this._renderer?.updateAnimation(delta)
  }

  /**
   * Trigger recoil animation (delegated to renderer)
   */
  triggerRecoil(): void {
    this._renderer?.triggerRecoil()
  }

  setRocks(rocks: Rock[]): void {
    this.rocks = rocks
  }

  setRockMeshes(_meshes: THREE.Mesh[]): void {
    // Reserved for future rock mesh collision system
  }

  toSnapshot(): PlayerSnapshotDTO {
    return {
      id: this.state.id,
      hp: this.state.hp,
      maxHp: this.state.maxHp,
      speed: this.state.speed,
      position: {
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z
      },
      rotation: this.state.rotation
    }
  }

  applySnapshot(snapshot: PlayerSnapshotDTO): void {
    this.state.id = snapshot.id
    this.state.hp = snapshot.hp
    this.state.maxHp = snapshot.maxHp
    this.state.speed = snapshot.speed
    this.state.rotation = snapshot.rotation
    this.state.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z)
    this.mesh.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z)
    this.mesh.rotation.y = snapshot.rotation
  }

  private setupInput(): void {
    // Create bound handlers and store references for cleanup
    this.boundKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase())
    }
    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase())
    }
    this.boundMouseMove = (e: MouseEvent) => {
      this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('keydown', this.boundKeyDown)
    window.addEventListener('keyup', this.boundKeyUp)
    window.addEventListener('mousemove', this.boundMouseMove)
  }

  /**
   * Main update loop - handles movement and rotation logic
   */
  update(delta: number, camera: THREE.Camera, _bounds: number): void {
    this.updateAnimation(delta)

    const moveDir = new THREE.Vector3()

    if (this.keys.has('w')) moveDir.z -= 1
    if (this.keys.has('s')) moveDir.z += 1
    if (this.keys.has('a')) moveDir.x -= 1
    if (this.keys.has('d')) moveDir.x += 1

    if (moveDir.length() > 0) {
      moveDir.normalize()
      const newX = this.state.position.x + moveDir.x * this.state.speed * delta
      const newZ = this.state.position.z + moveDir.z * this.state.speed * delta

      let canMove = true
      for (const rock of this.rocks) {
        const dist = Math.sqrt((rock.x - newX) ** 2 + (rock.z - newZ) ** 2)
        if (dist < rock.radius + this.colliderRadius) {
          canMove = false
          break
        }
      }

      if (canMove) {
        this.state.position.x = newX
        this.state.position.z = newZ
      }
    }

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(this.mousePos, camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)

    if (target) {
      const angle = Math.atan2(target.x - this.state.position.x, target.z - this.state.position.z)
      this.state.rotation = angle
    }

    // Sync renderer with state
    this._renderer?.syncPosition(
      { x: this.state.position.x, y: this.state.position.y, z: this.state.position.z },
      this.state.rotation
    )
  }

  takeDamage(amount: number): boolean {
    this.state.hp -= amount
    return this.state.hp <= 0
  }

  heal(amount: number): void {
    this.state.hp = Math.min(this.state.hp + amount, this.state.maxHp)
  }

  applySpeedBoost(amount: number, duration: number): void {
    const originalSpeed = this.state.speed
    this.state.speed += amount

    const timerId = setTimeout(() => {
      this.activeTimers.delete(timerId)
      this.state.speed = originalSpeed
    }, duration * 1000)
    this.activeTimers.add(timerId)
  }

  getDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, 1)
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.state.rotation)
    return dir
  }

  getMuzzlePosition(): THREE.Vector3 {
    const pos = this.state.position.clone()
    const dir = this.getDirection()
    pos.y = 0.7
    pos.addScaledVector(dir, 0.8)
    return pos
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Clear all active timers
    this.activeTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    this.activeTimers.clear()

    // Remove event listeners
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown)
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp)
    }
    if (this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove)
    }

    // Dispose renderer
    this._renderer?.dispose()
    this._renderer = null
  }
}
