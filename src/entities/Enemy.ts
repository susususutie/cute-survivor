import * as THREE from 'three'

export enum EnemyState {
  Patrol = 'patrol',
  Alert = 'alert',
  Chase = 'chase',
  Attack = 'attack'
}

export interface EnemyConfig {
  hp: number
  speed: number
  damage: number
  detectRange: number
  attackRange: number
  color: number
}

export class Enemy {
  public mesh: THREE.Group
  public hp: number
  public maxHp: number
  public speed: number
  public damage: number
  public state = EnemyState.Patrol
  private detectRange: number
  private attackRange: number
  private patrolTarget: THREE.Vector3
  private patrolDir = 1
  private attackCooldown = 0

  constructor(config: EnemyConfig, spawnPos: THREE.Vector3) {
    this.mesh = new THREE.Group()
    
    const bodyGeo = new THREE.BoxGeometry(0.9, 1, 0.7)
    const bodyMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.6 })
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
    const armMat = new THREE.MeshStandardMaterial({ color: config.color })
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

  update(delta: number, playerPos: THREE.Vector3): void {
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
      this.mesh.position.addScaledVector(dir, this.speed * 0.5 * delta)
      this.mesh.lookAt(this.patrolTarget)
    }
  }

  private chase(target: THREE.Vector3, delta: number): void {
    const dir = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .setY(0)
      .normalize()

    this.mesh.position.addScaledVector(dir, this.speed * delta)
    this.mesh.lookAt(target)
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

  spawn(config: EnemyConfig, bounds: number): void {
    const x = (Math.random() - 0.5) * bounds * 1.6
    const z = (Math.random() - 0.5) * bounds * 1.6

    const distToCenter = Math.sqrt(x * x + z * z)
    if (distToCenter < 8) return

    const enemy = new Enemy(config, new THREE.Vector3(x, 0, z))
    this.enemies.push(enemy)
    this.scene.add(enemy.mesh)
  }

  update(delta: number, playerPos: THREE.Vector3): void {
    for (const enemy of this.enemies) {
      enemy.update(delta, playerPos)
    }
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