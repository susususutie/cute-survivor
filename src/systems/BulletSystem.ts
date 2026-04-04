import * as THREE from 'three'

export interface BulletState {
  damage: number
  speed: number
  lifetime: number
  position: THREE.Vector3
  direction: THREE.Vector3
}

export class Bullet {
  public mesh: THREE.Mesh
  public state: BulletState
  private age = 0

  constructor(position: THREE.Vector3, direction: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.1, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.copy(position)
    this.mesh.position.y = 0.6

    this.state = {
      damage: 25,
      speed: 20,
      lifetime: 3,
      position: this.mesh.position.clone(),
      direction: direction.clone()
    }
  }

  update(delta: number): boolean {
    this.mesh.position.addScaledVector(this.state.direction, this.state.speed * delta)
    this.state.position.copy(this.mesh.position)

    this.age += delta
    return this.age >= this.state.lifetime
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }
}

export class BulletManager {
  private bullets: Bullet[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  fire(position: THREE.Vector3, direction: THREE.Vector3): Bullet {
    const bullet = new Bullet(position, direction)
    this.bullets.push(bullet)
    this.scene.add(bullet.mesh)
    return bullet
  }

  update(delta: number): void {
    const toRemove: Bullet[] = []

    for (const bullet of this.bullets) {
      if (bullet.update(delta)) {
        toRemove.push(bullet)
      }
    }

    for (const bullet of toRemove) {
      this.scene.remove(bullet.mesh)
      const idx = this.bullets.indexOf(bullet)
      if (idx > -1) this.bullets.splice(idx, 1)
    }
  }

  getBullets(): Bullet[] {
    return this.bullets
  }

  remove(bullet: Bullet): void {
    this.scene.remove(bullet.mesh)
    const idx = this.bullets.indexOf(bullet)
    if (idx > -1) this.bullets.splice(idx, 1)
  }
}