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
  height: number
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
    
    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.4, 1.1, 12)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a5a8a,
      roughness: 0.35,
      metalness: 0.3
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.55
    this.mesh.add(body)
    
    const armorGeo = new THREE.BoxGeometry(0.5, 0.6, 0.35)
    const armorMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a7aaa,
      roughness: 0.25,
      metalness: 0.5
    })
    const armor = new THREE.Mesh(armorGeo, armorMat)
    armor.position.set(0, 0.5, 0.15)
    armor.castShadow = true
    this.mesh.add(armor)
    
    const helmetGeo = new THREE.SphereGeometry(0.26, 16, 12)
    const helmetMat = new THREE.MeshStandardMaterial({ 
      color: 0x5a6a7a,
      roughness: 0.3,
      metalness: 0.6
    })
    const helmet = new THREE.Mesh(helmetGeo, helmetMat)
    helmet.castShadow = true
    helmet.position.y = 1.25
    this.mesh.add(helmet)
    
    const visorGeo = new THREE.BoxGeometry(0.35, 0.1, 0.15)
    const visorMat = new THREE.MeshStandardMaterial({ 
      color: 0x222233,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x44aaff,
      emissiveIntensity: 0.3
    })
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 1.25, 0.2)
    this.mesh.add(visor)
    
    const shoulderGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const shoulderMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a5a6a,
      roughness: 0.4,
      metalness: 0.5
    })
    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat)
    shoulderL.position.set(-0.4, 0.9, 0)
    shoulderL.castShadow = true
    this.mesh.add(shoulderL)
    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat)
    shoulderR.position.set(0.4, 0.9, 0)
    shoulderR.castShadow = true
    this.mesh.add(shoulderR)
    
    const gunMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2a,
      roughness: 0.2,
      metalness: 0.8
    })
    
    const gunBodyGeo = new THREE.BoxGeometry(0.12, 0.15, 0.6)
    const gunBody = new THREE.Mesh(gunBodyGeo, gunMat)
    gunBody.position.set(0, 0.65, 0.4)
    gunBody.castShadow = true
    this.mesh.add(gunBody)
    
    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8)
    const barrel = new THREE.Mesh(barrelGeo, gunMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.65, 0.75)
    barrel.castShadow = true
    this.mesh.add(barrel)
    
    const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.08, 8)
    const muzzleMat = new THREE.MeshBasicMaterial({ color: 0xffffaa })
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat)
    muzzle.rotation.x = Math.PI / 2
    muzzle.position.set(0, 0.65, 1.02)
    this.mesh.add(muzzle)
    
    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const glowMat = new THREE.MeshBasicMaterial({ 
      color: 0x44aaff,
      transparent: true,
      opacity: 0.8
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.set(0, 0.65, 1.05)
    this.mesh.add(glow)
    
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a })
    const legL = new THREE.Mesh(legGeo, legMat)
    legL.position.set(-0.12, 0.18, 0)
    legL.castShadow = true
    this.mesh.add(legL)
    const legR = new THREE.Mesh(legGeo, legMat)
    legR.position.set(0.12, 0.18, 0)
    legR.castShadow = true
    this.mesh.add(legR)
    
    const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.18)
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
    const bootL = new THREE.Mesh(bootGeo, bootMat)
    bootL.position.set(-0.12, 0.05, 0.02)
    this.mesh.add(bootL)
    const bootR = new THREE.Mesh(bootGeo, bootMat)
    bootR.position.set(0.12, 0.05, 0.02)
    this.mesh.add(bootR)
    
    const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.18)
    const packMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8 })
    const pack = new THREE.Mesh(packGeo, packMat)
    pack.position.set(0, 0.75, -0.28)
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