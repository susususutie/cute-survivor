import * as THREE from 'three'

export enum EnemyState {
  Patrol = 'patrol',
  Alert = 'alert',
  Chase = 'chase',
  Attack = 'attack'
}

export enum EnemyType {
  Goblin = 'goblin',
  Orc = 'orc',
  Slime = 'slime',
  Bat = 'bat'
}

export interface EnemyConfig {
  type: EnemyType
  hp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  color: number
}

export interface Rock {
  x: number
  z: number
  radius: number
}

export class Enemy {
  public mesh: THREE.Group
  public hp: number
  public maxHp: number
  public speed: number
  public damage: number
  public type: EnemyType
  public state = EnemyState.Patrol
  private detectRange: number
  private attackRange: number
  private patrolTarget: THREE.Vector3
  private patrolDir = 1
  private attackCooldown = 0
  private rocks: Rock[] = []
  private colliderRadius = 0.5
  private animPhase = 0

  constructor(config: EnemyConfig, spawnPos: THREE.Vector3) {
    this.type = config.type
    this.mesh = new THREE.Group()
    this.buildModel(config)
    this.mesh.position.copy(spawnPos)
    this.mesh.position.y = 0

    this.hp = config.hp
    this.maxHp = config.hp
    this.speed = config.speed
    this.damage = config.damage
    this.detectRange = config.detectRange
    this.attackRange = config.attackRange

    this.patrolTarget = new THREE.Vector3(
      spawnPos.x + (Math.random() - 0.5) * 10,
      0,
      spawnPos.z + (Math.random() - 0.5) * 10
    )
  }

  private buildModel(config: EnemyConfig): void {
    switch (config.type) {
      case EnemyType.Goblin:
        this.buildGoblin(config.color)
        break
      case EnemyType.Orc:
        this.buildOrc(config.color)
        break
      case EnemyType.Slime:
        this.buildSlime(config.color)
        break
      case EnemyType.Bat:
        this.buildBat(config.color)
        break
      default:
        this.buildGoblin(config.color)
    }
  }

  private buildGoblin(color: number): void {
    const bodyGeo = new THREE.BoxGeometry(0.9, 1, 0.7)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.5
    this.mesh.add(body)
    
    const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xcc4433, roughness: 0.5 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.castShadow = true
    head.position.y = 1.15
    this.mesh.add(head)
    
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.15, 1.2, 0.25)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.15, 1.2, 0.25)
    this.mesh.add(eyeR)
    
    const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 6)
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
    const hornL = new THREE.Mesh(hornGeo, hornMat)
    hornL.position.set(-0.2, 1.5, -0.1)
    hornL.rotation.z = 0.3
    this.mesh.add(hornL)
    const hornR = new THREE.Mesh(hornGeo, hornMat)
    hornR.position.set(0.2, 1.5, -0.1)
    hornR.rotation.z = -0.3
    this.mesh.add(hornR)
    
    const armGeo = new THREE.BoxGeometry(0.25, 0.5, 0.2)
    const armMat = new THREE.MeshStandardMaterial({ color })
    const armL = new THREE.Mesh(armGeo, armMat)
    armL.position.set(-0.55, 0.5, 0)
    armL.rotation.z = 0.3
    this.mesh.add(armL)
    const armR = new THREE.Mesh(armGeo, armMat)
    armR.position.set(0.55, 0.5, 0)
    armR.rotation.z = -0.3
    this.mesh.add(armR)
    
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x442211 })
    const legL = new THREE.Mesh(legGeo, legMat)
    legL.position.set(-0.25, 0.1, 0)
    this.mesh.add(legL)
    const legR = new THREE.Mesh(legGeo, legMat)
    legR.position.set(0.25, 0.1, 0)
    this.mesh.add(legR)
  }

  private buildOrc(color: number): void {
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.9)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.7
    this.mesh.add(body)
    
    const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.7)
    const headMat = new THREE.MeshStandardMaterial({ color: 0x665533, roughness: 0.6 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.castShadow = true
    head.position.y = 1.55
    this.mesh.add(head)
    
    const tuskGeo = new THREE.ConeGeometry(0.08, 0.25, 6)
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xffffee })
    const tuskL = new THREE.Mesh(tuskGeo, tuskMat)
    tuskL.position.set(-0.2, 1.2, 0.35)
    tuskL.rotation.x = 0.3
    this.mesh.add(tuskL)
    const tuskR = new THREE.Mesh(tuskGeo, tuskMat)
    tuskR.position.set(0.2, 1.2, 0.35)
    tuskR.rotation.x = 0.3
    this.mesh.add(tuskR)
    
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.2, 1.6, 0.35)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.2, 1.6, 0.35)
    this.mesh.add(eyeR)
    
    const armGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8)
    const armMat = new THREE.MeshStandardMaterial({ color })
    const armL = new THREE.Mesh(armGeo, armMat)
    armL.position.set(-0.7, 0.6, 0)
    armL.rotation.z = 0.2
    this.mesh.add(armL)
    const armR = new THREE.Mesh(armGeo, armMat)
    armR.position.set(0.7, 0.6, 0)
    armR.rotation.z = -0.2
    this.mesh.add(armR)
    
    const clubGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 8)
    const clubMat = new THREE.MeshStandardMaterial({ color: 0x4a3520 })
    const club = new THREE.Mesh(clubGeo, clubMat)
    club.position.set(0.75, 0.8, 0.2)
    club.rotation.x = 0.3
    this.mesh.add(club)
  }

  private buildSlime(color: number): void {
    const bodyGeo = new THREE.SphereGeometry(0.6, 16, 12)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.85,
      roughness: 0.2
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.5
    body.scale.set(1, 0.8, 1)
    this.mesh.add(body)
    
    const innerGeo = new THREE.SphereGeometry(0.35, 12, 8)
    const innerMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.4 
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.position.set(0, 0.55, 0.1)
    this.mesh.add(inner)
    
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.15, 0.6, 0.35)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.15, 0.6, 0.35)
    this.mesh.add(eyeR)
  }

  private buildBat(color: number): void {
    const bodyGeo = new THREE.SphereGeometry(0.3, 12, 8)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.position.y = 0.3
    body.scale.set(1, 1.2, 1.5)
    this.mesh.add(body)
    
    const headGeo = new THREE.SphereGeometry(0.2, 10, 8)
    const headMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 0.55
    this.mesh.add(head)
    
    const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4)
    const earMat = new THREE.MeshStandardMaterial({ color: 0x332211 })
    const earL = new THREE.Mesh(earGeo, earMat)
    earL.position.set(-0.1, 0.7, 0)
    this.mesh.add(earL)
    const earR = new THREE.Mesh(earGeo, earMat)
    earR.position.set(0.1, 0.7, 0)
    this.mesh.add(earR)
    
    const wingGeo = new THREE.PlaneGeometry(0.8, 0.4)
    const wingMat = new THREE.MeshStandardMaterial({ 
      color, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    })
    const wingL = new THREE.Mesh(wingGeo, wingMat)
    wingL.position.set(-0.5, 0.35, 0)
    this.mesh.add(wingL)
    const wingR = new THREE.Mesh(wingGeo, wingMat)
    wingR.position.set(0.5, 0.35, 0)
    this.mesh.add(wingR)
    
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.08, 0.58, 0.15)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.08, 0.58, 0.15)
    this.mesh.add(eyeR)
  }

  setRocks(rocks: Rock[]): void {
    this.rocks = rocks
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    this.animPhase += delta * 3
    this.animate()

    const distToPlayer = this.mesh.position.distanceTo(playerPos)

    if (distToPlayer <= this.attackRange) {
      this.state = EnemyState.Attack
      this.handleAttack(delta)
    } else if (distToPlayer <= this.detectRange) {
      this.state = EnemyState.Chase
      this.chase(playerPos, delta)
    } else if (this.state === EnemyState.Chase || this.state === EnemyState.Alert) {
      this.state = EnemyState.Patrol
      this.patrol(delta)
    } else {
      this.state = EnemyState.Patrol
      this.patrol(delta)
    }
  }

  private animate(): void {
    if (this.type === EnemyType.Slime) {
      const scale = 0.8 + Math.sin(this.animPhase) * 0.1
      const body = this.mesh.children[0] as THREE.Mesh
      if (body) body.scale.set(1, scale, 1)
    } else if (this.type === EnemyType.Bat) {
      const flap = Math.sin(this.animPhase * 2) * 0.3
      const wingL = this.mesh.children[5] as THREE.Mesh
      const wingR = this.mesh.children[6] as THREE.Mesh
      if (wingL) wingL.rotation.z = flap
      if (wingR) wingR.rotation.z = -flap
      this.mesh.position.y = 0.3 + Math.sin(this.animPhase) * 0.2
    }
  }

  private patrol(delta: number): void {
    const dir = new THREE.Vector3()
      .subVectors(this.patrolTarget, this.mesh.position)
      .setY(0)

    if (dir.length() < 0.5) {
      this.patrolTarget.set(
        (Math.random() - 0.5) * 40,
        0,
        (Math.random() - 0.5) * 40
      )
    } else {
      dir.normalize()
      const newX = this.mesh.position.x + dir.x * this.speed * 0.5 * delta
      const newZ = this.mesh.position.z + dir.z * this.speed * 0.5 * delta
      
      if (!this.checkRockCollision(newX, newZ)) {
        this.mesh.position.x = newX
        this.mesh.position.z = newZ
      }
      this.mesh.lookAt(this.patrolTarget)
    }
  }

  private chase(target: THREE.Vector3, delta: number): void {
    const dir = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .setY(0)
      .normalize()

    const newX = this.mesh.position.x + dir.x * this.speed * delta
    const newZ = this.mesh.position.z + dir.z * this.speed * delta
    
    if (!this.checkRockCollision(newX, newZ)) {
      this.mesh.position.x = newX
      this.mesh.position.z = newZ
    }
    this.mesh.lookAt(target)
  }

  private checkRockCollision(x: number, z: number): boolean {
    for (const rock of this.rocks) {
      const dist = Math.sqrt((rock.x - x) ** 2 + (rock.z - z) ** 2)
      if (dist < rock.radius + this.colliderRadius) {
        return true
      }
    }
    return false
  }

  private handleAttack(delta: number): void {
    this.attackCooldown -= delta
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0
  }

  attack(): void {
    this.attackCooldown = 1
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount

    for (const child of this.mesh.children) {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const mat = child.material
        const originalColor = mat.color.getHex()
        mat.color.setHex(0xffffff)
        
        setTimeout(() => {
          mat.color.setHex(originalColor)
        }, 100)
        break
      }
    }

    return this.hp <= 0
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }
}

export class EnemyManager {
  private enemies: Enemy[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  spawn(config: EnemyConfig, bounds: number, rocks: Rock[] = []): void {
    const x = (Math.random() - 0.5) * bounds * 1.6
    const z = (Math.random() - 0.5) * bounds * 1.6

    const distToCenter = Math.sqrt(x * x + z * z)
    if (distToCenter < 8) return

    const enemy = new Enemy(config, new THREE.Vector3(x, 0, z))
    enemy.setRocks(rocks)
    this.enemies.push(enemy)
    this.scene.add(enemy.mesh)
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    for (const enemy of this.enemies) {
      enemy.update(delta, playerPos)
    }
  }

  setRocks(rocks: Rock[]): void {
    for (const enemy of this.enemies) {
      enemy.setRocks(rocks)
    }
  }

  spawnAt(config: EnemyConfig, position: THREE.Vector3, rocks: Rock[]): void {
    const enemy = new Enemy(config, position)
    enemy.setRocks(rocks)
    this.enemies.push(enemy)
    this.scene.add(enemy.mesh)
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }

  remove(enemy: Enemy): void {
    this.scene.remove(enemy.mesh)
    const idx = this.enemies.indexOf(enemy)
    if (idx > -1) this.enemies.splice(idx, 1)
  }
}