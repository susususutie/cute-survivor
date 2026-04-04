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
  private trail: THREE.Points
  private trailPositions: THREE.Vector3[] = []

  constructor(position: THREE.Vector3, direction: THREE.Vector3) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.copy(position)
    this.mesh.position.y = 0.6

    const trailGeo = new THREE.BufferGeometry()
    const trailMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.trail = new THREE.Points(trailGeo, trailMat)
    this.trail.frustumCulled = false
    
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

    this.trailPositions.push(this.mesh.position.clone())
    if (this.trailPositions.length > 15) {
      this.trailPositions.shift()
    }

    const positions = new Float32Array(this.trailPositions.length * 3)
    for (let i = 0; i < this.trailPositions.length; i++) {
      positions[i * 3] = this.trailPositions[i].x
      positions[i * 3 + 1] = this.trailPositions[i].y
      positions[i * 3 + 2] = this.trailPositions[i].z
    }
    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.trail.geometry.attributes.position.needsUpdate = true

    this.age += delta
    return this.age >= this.state.lifetime
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }

  getTrail(): THREE.Points {
    return this.trail
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
    this.scene.add(bullet.getTrail())
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
      this.scene.remove(bullet.getTrail())
      bullet.getTrail().geometry.dispose()
      ;(bullet.getTrail().material as THREE.PointsMaterial).dispose()
      const idx = this.bullets.indexOf(bullet)
      if (idx > -1) this.bullets.splice(idx, 1)
    }
  }

  getBullets(): Bullet[] {
    return this.bullets
  }

  remove(bullet: Bullet): void {
    this.scene.remove(bullet.mesh)
    this.scene.remove(bullet.getTrail())
    bullet.getTrail().geometry.dispose()
    ;(bullet.getTrail().material as THREE.PointsMaterial).dispose()
    const idx = this.bullets.indexOf(bullet)
    if (idx > -1) this.bullets.splice(idx, 1)
  }
}