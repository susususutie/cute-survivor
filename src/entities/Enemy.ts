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
  Bat = 'bat',
  Skeleton = 'skeleton',
  Mushroom = 'mushroom'
}

export interface EnemyConfig {
  type: EnemyType
  hp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  color: number
  hasRangedAttack?: boolean
  rangedAttackRange?: number
  rangedAttackDamage?: number
  rangedAttackCooldown?: number
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
  private aggroRange: number
  private leashRange: number
  private isAggro = false
  private deaggroTimer = 0
  private patrolTarget: THREE.Vector3
  private attackCooldown = 1
  private rocks: Rock[] = []
  private colliderRadius = 0.5
  private animPhase = 0
  private hasRangedAttack = false
  private rangedAttackRange = 0
  private rangedAttackDamage = 0
  private rangedAttackCooldown = 0
  private rangedAttackTimer = 0
  public onRangedAttack?: (
    position: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number
  ) => void

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
    this.aggroRange = config.detectRange * 1.3
    this.leashRange = config.detectRange * 2

    this.hasRangedAttack = config.hasRangedAttack ?? false
    this.rangedAttackRange = config.rangedAttackRange ?? 10
    this.rangedAttackDamage = config.rangedAttackDamage ?? 10
    this.rangedAttackCooldown = config.rangedAttackCooldown ?? 2

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
      case EnemyType.Skeleton:
        this.buildSkeleton()
        break
      case EnemyType.Mushroom:
        this.buildMushroom()
        break
      default:
        this.buildGoblin(config.color)
    }
  }

  private buildSkeleton(): void {
    const boneColor = 0xddeeff

    const ribGeo = new THREE.BoxGeometry(0.8, 0.1, 0.3)
    const ribMat = new THREE.MeshStandardMaterial({ color: boneColor, roughness: 0.8 })
    const ribcage = new THREE.Mesh(ribGeo, ribMat)
    ribcage.castShadow = true
    ribcage.position.y = 0.5
    this.mesh.add(ribcage)

    const spineGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15)
    const spine = new THREE.Mesh(spineGeo, ribMat)
    spine.position.y = 0.4
    this.mesh.add(spine)

    const rib2Geo = new THREE.BoxGeometry(0.7, 0.08, 0.25)
    const rib2 = new THREE.Mesh(rib2Geo, ribMat)
    rib2.position.y = 0.65
    this.mesh.add(rib2)

    const skullGeo = new THREE.SphereGeometry(0.3, 10, 8)
    const skullMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 })
    const skull = new THREE.Mesh(skullGeo, skullMat)
    skull.castShadow = true
    skull.position.y = 1.1
    skull.scale.set(1, 1.15, 1)
    this.mesh.add(skull)

    const eyeSocketGeo = new THREE.SphereGeometry(0.08, 6, 6)
    const eyeSocketMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
    const eyeSocketL = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
    eyeSocketL.position.set(-0.1, 1.15, 0.22)
    this.mesh.add(eyeSocketL)
    const eyeSocketR = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
    eyeSocketR.position.set(0.1, 1.15, 0.22)
    this.mesh.add(eyeSocketR)

    const jawGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15)
    const jaw = new THREE.Mesh(jawGeo, ribMat)
    jaw.position.set(0, 0.88, 0.2)
    this.mesh.add(jaw)

    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 6)
    const armL = new THREE.Mesh(armGeo, ribMat)
    armL.position.set(-0.5, 0.5, 0)
    armL.rotation.z = 0.3
    this.mesh.add(armL)
    const armR = new THREE.Mesh(armGeo, ribMat)
    armR.position.set(0.5, 0.5, 0)
    armR.rotation.z = -0.3
    this.mesh.add(armR)

    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.6, 6)
    const legL = new THREE.Mesh(legGeo, ribMat)
    legL.position.set(-0.2, 0.1, 0)
    this.mesh.add(legL)
    const legR = new THREE.Mesh(legGeo, ribMat)
    legR.position.set(0.2, 0.1, 0)
    this.mesh.add(legR)
  }

  private buildMushroom(): void {
    const capColor = 0xcc2222
    const stemColor = 0xddaa77

    const capGeo = new THREE.SphereGeometry(0.5, 12, 8)
    const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.4 })
    const cap = new THREE.Mesh(capGeo, capMat)
    cap.castShadow = true
    cap.position.y = 0.8
    cap.scale.set(1.3, 0.6, 1.3)
    this.mesh.add(cap)

    const spotGeo = new THREE.SphereGeometry(0.08, 6, 6)
    const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const spot1 = new THREE.Mesh(spotGeo, spotMat)
    spot1.position.set(0.15, 0.85, 0.4)
    this.mesh.add(spot1)
    const spot2 = new THREE.Mesh(spotGeo, spotMat)
    spot2.position.set(-0.2, 0.8, 0.35)
    this.mesh.add(spot2)
    const spot3 = new THREE.Mesh(spotGeo, spotMat)
    spot3.position.set(0.05, 0.92, 0.28)
    this.mesh.add(spot3)

    const stemGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8)
    const stemMat = new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.7 })
    const stem = new THREE.Mesh(stemGeo, stemMat)
    stem.castShadow = true
    stem.position.y = 0.3
    this.mesh.add(stem)

    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.1, 0.35, 0.22)
    this.mesh.add(eyeL)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeR.position.set(0.1, 0.35, 0.22)
    this.mesh.add(eyeR)
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

  setRangedAttackCallback(
    callback: (position: THREE.Vector3, direction: THREE.Vector3, damage: number) => void
  ): void {
    this.onRangedAttack = callback
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    this.animPhase += delta * 3
    this.animate()

    const distToPlayer = this.mesh.position.distanceTo(playerPos)

    if (distToPlayer <= this.attackRange) {
      this.state = EnemyState.Attack
      this.isAggro = true
      this.deaggroTimer = 0
      if (this.hasRangedAttack && distToPlayer <= this.rangedAttackRange) {
        this.handleRangedAttack(delta, playerPos)
      } else {
        this.handleAttack(delta)
      }
    } else if (this.hasRangedAttack && distToPlayer <= this.rangedAttackRange && this.isAggro) {
      this.state = EnemyState.Chase
      this.handleRangedAttack(delta, playerPos)
    } else if (distToPlayer <= this.detectRange) {
      this.state = EnemyState.Chase
      this.isAggro = true
      this.deaggroTimer = 0
      this.chase(playerPos, delta)
    } else if (this.isAggro && distToPlayer <= this.aggroRange) {
      this.state = EnemyState.Chase
      this.deaggroTimer += delta
      if (this.deaggroTimer >= 3) {
        this.isAggro = false
        this.state = EnemyState.Patrol
        this.patrol(delta)
      } else {
        this.chase(playerPos, delta)
      }
    } else if (distToPlayer > this.leashRange) {
      this.isAggro = false
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
    const dir = new THREE.Vector3().subVectors(this.patrolTarget, this.mesh.position).setY(0)

    if (dir.length() < 0.5) {
      this.patrolTarget.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40)
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
    const dir = new THREE.Vector3().subVectors(target, this.mesh.position).setY(0).normalize()

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

  private handleRangedAttack(delta: number, playerPos: THREE.Vector3): void {
    this.rangedAttackTimer -= delta
    const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).setY(0).normalize()
    this.mesh.lookAt(new THREE.Vector3(playerPos.x, this.mesh.position.y, playerPos.z))

    if (this.rangedAttackTimer <= 0) {
      const muzzlePos = this.mesh.position.clone().add(dir.clone().multiplyScalar(0.8))
      muzzlePos.y = 0.6
      if (this.onRangedAttack) {
        this.onRangedAttack(muzzlePos, dir, this.rangedAttackDamage)
      }
      this.rangedAttackTimer = this.rangedAttackCooldown
    }
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0
  }

  attack(): void {
    this.attackCooldown = 1
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount
    this.isAggro = true
    this.deaggroTimer = 0

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

  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.dispose()
          } else if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.dispose()
          }
        }
      }
    })
  }
}

export class EnemyManager {
  private enemies: Enemy[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  spawn(config: EnemyConfig, bounds: number, rocks: Rock[] = []): void {
    let x: number, z: number, distToCenter: number
    let attempts = 0
    do {
      x = (Math.random() - 0.5) * bounds * 1.6
      z = (Math.random() - 0.5) * bounds * 1.6
      distToCenter = Math.sqrt(x * x + z * z)
      attempts++
    } while (distToCenter < 8 && attempts < 10)

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

  setRangedAttackCallback(
    callback: (position: THREE.Vector3, direction: THREE.Vector3, damage: number) => void
  ): void {
    for (const enemy of this.enemies) {
      enemy.setRangedAttackCallback(callback)
    }
  }

  spawnAt(config: EnemyConfig, position: THREE.Vector3, rocks: Rock[]): void {
    const enemy = new Enemy(config, position)
    enemy.setRocks(rocks)
    this.enemies.push(enemy)
    this.scene.add(enemy.mesh)
  }

  spawnAtWithCallback(
    config: EnemyConfig,
    position: THREE.Vector3,
    rocks: Rock[],
    rangedCallback: (position: THREE.Vector3, direction: THREE.Vector3, damage: number) => void
  ): void {
    const enemy = new Enemy(config, position)
    enemy.setRocks(rocks)
    enemy.setRangedAttackCallback(rangedCallback)
    this.enemies.push(enemy)
    this.scene.add(enemy.mesh)
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }

  remove(enemy: Enemy): void {
    enemy.dispose()
    this.scene.remove(enemy.mesh)
    const idx = this.enemies.indexOf(enemy)
    if (idx > -1) this.enemies.splice(idx, 1)
  }
}
