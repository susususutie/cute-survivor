import * as THREE from 'three'

export interface PlayerState {
  hp: number
  maxHp: number
  speed: number
  position: THREE.Vector3
  rotation: number
}

export interface Rock {
  x: number
  z: number
  radius: number
}

export class Player {
  public mesh: THREE.Group
  public state: PlayerState

  private keys: Set<string> = new Set()
  private mousePos: THREE.Vector2 = new THREE.Vector2()
  private rocks: Rock[] = []
  private colliderRadius = 0.6

  constructor() {
    this.mesh = new THREE.Group()
    
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a7dcc,
      roughness: 0.4,
      metalness: 0.2
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.6
    this.mesh.add(body)
    
    const headGeo = new THREE.SphereGeometry(0.28, 16, 12)
    const headMat = new THREE.MeshStandardMaterial({ 
      color: 0xffe4c4,
      roughness: 0.6
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.castShadow = true
    head.position.y = 1.35
    this.mesh.add(head)
    
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.1, 1.38, 0.22)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.1, 1.38, 0.22)
    this.mesh.add(eyeR)
    
    const gunBodyGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8)
    const gunMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a3a,
      roughness: 0.3,
      metalness: 0.6
    })
    const gunBody = new THREE.Mesh(gunBodyGeo, gunMat)
    gunBody.rotation.x = Math.PI / 2
    gunBody.position.set(0, 0.7, 0.35)
    gunBody.castShadow = true
    this.mesh.add(gunBody)
    
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.25, 8)
    const barrel = new THREE.Mesh(barrelGeo, gunMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.7, 0.65)
    barrel.castShadow = true
    this.mesh.add(barrel)
    
    const muzzleGeo = new THREE.SphereGeometry(0.05, 8, 8)
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffff88 })
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat)
    muzzle.position.set(0, 0.7, 0.8)
    this.mesh.add(muzzle)
    
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a4a6a })
    const legL = new THREE.Mesh(legGeo, legMat)
    legL.position.set(-0.15, 0.2, 0)
    legL.castShadow = true
    this.mesh.add(legL)
    const legR = new THREE.Mesh(legGeo, legMat)
    legR.position.set(0.15, 0.2, 0)
    legR.castShadow = true
    this.mesh.add(legR)
    
    const packGeo = new THREE.BoxGeometry(0.3, 0.35, 0.15)
    const packMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.7 })
    const pack = new THREE.Mesh(packGeo, packMat)
    pack.position.set(0, 0.8, -0.25)
    pack.castShadow = true
    this.mesh.add(pack)

    this.mesh.position.set(0, 0, 0)

    this.state = {
      hp: 100,
      maxHp: 100,
      speed: 8,
      position: this.mesh.position.clone(),
      rotation: 0
    }

    this.setupInput()
  }

  setRocks(rocks: Rock[]): void {
    this.rocks = rocks
  }

  setRockMeshes(meshes: THREE.Mesh[]): void {
    this.rockMeshes = meshes
  }

  private rockMeshes: THREE.Mesh[] = []

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
      const newX = this.mesh.position.x + moveDir.x * this.state.speed * delta
      const newZ = this.mesh.position.z + moveDir.z * this.state.speed * delta

      let canMove = true
      for (const rock of this.rocks) {
        const dist = Math.sqrt((rock.x - newX) ** 2 + (rock.z - newZ) ** 2)
        if (dist < rock.radius + this.colliderRadius) {
          canMove = false
          break
        }
      }

      if (canMove) {
        this.mesh.position.x = newX
        this.mesh.position.z = newZ
      }

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

  getMuzzlePosition(): THREE.Vector3 {
    const pos = this.mesh.position.clone()
    const dir = this.getDirection()
    pos.y = 0.7
    pos.addScaledVector(dir, 0.8)
    return pos
  }
}