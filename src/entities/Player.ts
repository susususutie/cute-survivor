import * as THREE from 'three'

export interface PlayerState {
  hp: number
  maxHp: number
  speed: number
  position: THREE.Vector3
  rotation: number
}

export class Player {
  public mesh: THREE.Mesh
  public state: PlayerState

  private keys: Set<string> = new Set()
  private mousePos: THREE.Vector2 = new THREE.Vector2()

  constructor() {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16)
    const mat = new THREE.MeshStandardMaterial({ color: 0x44aaff })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.castShadow = true
    this.mesh.position.set(0, 0.5, 0)

    const barrelGeo = new THREE.BoxGeometry(0.15, 0.15, 0.6)
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x88ccff })
    const barrel = new THREE.Mesh(barrelGeo, barrelMat)
    barrel.castShadow = true
    barrel.position.set(0, 0.3, 0.4)
    this.mesh.add(barrel)

    this.state = {
      hp: 100,
      maxHp: 100,
      speed: 8,
      position: this.mesh.position.clone(),
      rotation: 0
    }

    this.setupInput()
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1
    })
  }

  update(delta: number, camera: THREE.Camera, bounds: number): void {
    const moveDir = new THREE.Vector3()

    if (this.keys.has('w')) moveDir.z -= 1
    if (this.keys.has('s')) moveDir.z += 1
    if (this.keys.has('a')) moveDir.x -= 1
    if (this.keys.has('d')) moveDir.x += 1

    if (moveDir.length() > 0) {
      moveDir.normalize()
      this.mesh.position.x += moveDir.x * this.state.speed * delta
      this.mesh.position.z += moveDir.z * this.state.speed * delta

      this.mesh.position.x = THREE.MathUtils.clamp(
        this.mesh.position.x,
        -bounds + 0.5,
        bounds - 0.5
      )
      this.mesh.position.z = THREE.MathUtils.clamp(
        this.mesh.position.z,
        -bounds + 0.5,
        bounds - 0.5
      )
    }

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(this.mousePos, camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)

    if (target) {
      const angle = Math.atan2(
        target.x - this.mesh.position.x,
        target.z - this.mesh.position.z
      )
      this.mesh.rotation.y = angle
      this.state.rotation = angle
    }

    this.state.position.copy(this.mesh.position)
  }

  takeDamage(amount: number): boolean {
    this.state.hp -= amount
    return this.state.hp <= 0
  }

  getDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, 1)
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y)
    return dir
  }
}