import * as THREE from 'three'
import type { GameState } from '../core/GameState'
import { meshFactory } from './MeshFactory'
import { materialLibrary } from './MaterialLibrary'

interface BulletRenderData {
  mesh: THREE.Mesh
  trail: THREE.Points
  positions: THREE.Vector3[]
}

export class EntityRenderer {
  private scene: THREE.Scene
  private playerMesh: THREE.Group | null = null
  private enemyMeshes = new Map<string, THREE.Group>()
  private bulletMeshes = new Map<string, BulletRenderData>()
  private itemMeshes = new Map<string, THREE.Group>()
  private effectParticles: THREE.Points[] = []
  private playerAnimTime = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  render(state: GameState): void {
    this.renderPlayer(state)
    this.renderEnemies(state)
    this.renderBullets(state)
    this.renderItems(state)
    this.renderEffects(state)
    this.updatePlayerAnimation(state)
  }

  private updatePlayerAnimation(_state: GameState): void {
    this.playerAnimTime += 1 / 60

    if (this.playerMesh) {
      const weaponGroup = this.playerMesh.children.find((c) => c instanceof THREE.Group && c.position.z > 0.3) as THREE.Group | undefined
      if (weaponGroup) {
        const glow = weaponGroup.children.find((c) => c instanceof THREE.Mesh && c.userData.isWeaponGlow) as THREE.Mesh | undefined
        if (glow && glow.material instanceof THREE.MeshBasicMaterial) {
          const pulse = 0.7 + Math.sin(this.playerAnimTime * 4) * 0.3
          glow.material.opacity = pulse
          const scale = 0.8 + Math.sin(this.playerAnimTime * 3) * 0.2
          glow.scale.setScalar(scale)
        }
      }
    }
  }

  private renderPlayer(state: GameState): void {
    if (!this.playerMesh) {
      this.playerMesh = meshFactory.createPlayerGroup()
      this.scene.add(this.playerMesh)
    }

    const playerPos = state.player.position
    this.playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z)
    this.playerMesh.rotation.y = state.player.rotation
  }

  private renderEnemies(state: GameState): void {
    const enemyIds = new Set<string>()

    for (const enemy of state.enemies) {
      enemyIds.add(enemy.id)

      if (!this.enemyMeshes.has(enemy.id)) {
        const colors = materialLibrary.getEnemyColors()
        const color = colors[enemy.type] ?? 0x44aa44
        const mesh = meshFactory.createEnemyGroup({ type: enemy.type, color })
        this.scene.add(mesh)
        this.enemyMeshes.set(enemy.id, mesh)
      }

      const mesh = this.enemyMeshes.get(enemy.id)
      if (!mesh) continue
      mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z)
      mesh.rotation.y = enemy.rotation

      // Animate based on type
      if (enemy.type === 'slime' && mesh.children.length > 0) {
        const body = mesh.children[0] as THREE.Mesh
        if (body && body.geometry instanceof THREE.SphereGeometry) {
          const scale = 0.8 + Math.sin(this.playerAnimTime * 3) * 0.1
          body.scale.set(1, scale, 1)
        }
      }
      if (enemy.type === 'bat') {
        const wingL = mesh.children[5] as THREE.Mesh
        const wingR = mesh.children[6] as THREE.Mesh
        if (wingL) wingL.rotation.z = Math.sin(this.playerAnimTime * 6) * 0.3
        if (wingR) wingR.rotation.z = -Math.sin(this.playerAnimTime * 6) * 0.3
        mesh.position.y = 0.3 + Math.sin(this.playerAnimTime * 3) * 0.2
      }
    }

    // Remove meshes for enemies that no longer exist
    for (const [id, mesh] of this.enemyMeshes) {
      if (!enemyIds.has(id)) {
        this.scene.remove(mesh)
        meshFactory.disposeMesh(mesh)
        this.enemyMeshes.delete(id)
      }
    }
  }

  private renderBullets(state: GameState): void {
    const bulletIds = new Set<string>()

    for (const bullet of state.bullets) {
      bulletIds.add(bullet.id)

      if (!this.bulletMeshes.has(bullet.id)) {
        const mesh = meshFactory.createBulletMesh()
        const trail = meshFactory.createTrailMesh()
        this.scene.add(mesh)
        this.scene.add(trail)
        this.bulletMeshes.set(bullet.id, { mesh, trail, positions: [] })
      }

      const data = this.bulletMeshes.get(bullet.id)
      if (!data) continue
      data.mesh.position.set(bullet.position.x, bullet.position.y, bullet.position.z)

      // Update trail
      data.positions.push(data.mesh.position.clone())
      if (data.positions.length > 15) {
        data.positions.shift()
      }

      const positions = new Float32Array(data.positions.length * 3)
      for (let i = 0; i < data.positions.length; i++) {
        positions[i * 3] = data.positions[i].x
        positions[i * 3 + 1] = data.positions[i].y
        positions[i * 3 + 2] = data.positions[i].z
      }
      data.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      data.trail.geometry.attributes.position.needsUpdate = true
    }

    // Remove meshes for bullets that no longer exist
    for (const [id, data] of this.bulletMeshes) {
      if (!bulletIds.has(id)) {
        this.scene.remove(data.mesh)
        this.scene.remove(data.trail)
        data.mesh.geometry.dispose()
        ;(data.mesh.material as THREE.Material).dispose()
        data.trail.geometry.dispose()
        ;(data.trail.material as THREE.Material).dispose()
        this.bulletMeshes.delete(id)
      }
    }
  }

  private renderItems(state: GameState): void {
    const itemIds = new Set<string>()

    for (const item of state.items) {
      itemIds.add(item.id)

      if (!this.itemMeshes.has(item.id)) {
        const pos = new THREE.Vector3(item.position.x, item.position.y, item.position.z)
        const mesh = meshFactory.createItemMesh({ type: item.type, position: pos })
        this.scene.add(mesh)
        this.itemMeshes.set(item.id, mesh)
      }

      const mesh = this.itemMeshes.get(item.id)
      if (!mesh) continue
      // Items float and rotate based on time
      const time = performance.now() / 1000
      mesh.rotation.y = time * (1 + parseInt(item.id) % 3)
      mesh.position.y = 0.4 + Math.sin(time * 3) * 0.1
    }

    // Remove meshes for items that no longer exist
    for (const [id, mesh] of this.itemMeshes) {
      if (!itemIds.has(id)) {
        this.scene.remove(mesh)
        meshFactory.disposeMesh(mesh)
        this.itemMeshes.delete(id)
      }
    }
  }

  private renderEffects(state: GameState): void {
    // Remove expired effects
    const toRemove: THREE.Points[] = []
    for (const particles of this.effectParticles) {
      const userData = particles.userData as { isRing?: boolean; life?: number }
      if (userData.isRing) {
        const ring = particles as unknown as THREE.Mesh
        const data = ring.userData as { life: number; scale: number }
        data.life -= 1 / 60 * 2
        data.scale += 1 / 60 * 8
        ring.scale.set(data.scale, data.scale, 1)
        ;(ring.material as THREE.MeshBasicMaterial).opacity = data.life * 1.5

        if (data.life <= 0) {
          toRemove.push(particles)
        }
      } else {
        const positions = particles.geometry.attributes.position.array as Float32Array
        const velocities = particles.userData.velocities

        for (let i = 0; i < velocities.length; i++) {
          positions[i * 3] += velocities[i].x * (1 / 60)
          positions[i * 3 + 1] += velocities[i].y * (1 / 60)
          positions[i * 3 + 2] += velocities[i].z * (1 / 60)
          velocities[i].y -= 10 * (1 / 60)
        }

        particles.geometry.attributes.position.needsUpdate = true
        particles.userData.life -= 1 / 60 * 2
        ;(particles.material as THREE.PointsMaterial).opacity = particles.userData.life

        if (particles.userData.life <= 0) {
          toRemove.push(particles)
        }
      }
    }

    for (const p of toRemove) {
      this.scene.remove(p)
      const idx = this.effectParticles.indexOf(p)
      if (idx > -1) this.effectParticles.splice(idx, 1)
      if (p.geometry) p.geometry.dispose()
      if (p.material) (p.material as THREE.Material).dispose()
    }

    // Add new effects from state
    for (const effect of state.effects) {
      if (effect.type === 'kill') {
        const pos = new THREE.Vector3(effect.position.x, effect.position.y, effect.position.z)
        const particles = meshFactory.createKillEffectParticles(pos)
        const ring = meshFactory.createKillEffectRing(pos)
        this.scene.add(particles)
        this.scene.add(ring)
        this.effectParticles.push(particles)
        this.effectParticles.push(ring as unknown as THREE.Points)
      }
    }
  }

  getPlayerMesh(): THREE.Group | null {
    return this.playerMesh
  }

  dispose(): void {
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh)
      meshFactory.disposeMesh(this.playerMesh)
      this.playerMesh = null
    }

    for (const [, mesh] of this.enemyMeshes) {
      this.scene.remove(mesh)
      meshFactory.disposeMesh(mesh)
    }
    this.enemyMeshes.clear()

    for (const [, data] of this.bulletMeshes) {
      this.scene.remove(data.mesh)
      this.scene.remove(data.trail)
      data.mesh.geometry.dispose()
      ;(data.mesh.material as THREE.Material).dispose()
      data.trail.geometry.dispose()
      ;(data.trail.material as THREE.Material).dispose()
    }
    this.bulletMeshes.clear()

    for (const [, mesh] of this.itemMeshes) {
      this.scene.remove(mesh)
      meshFactory.disposeMesh(mesh)
    }
    this.itemMeshes.clear()

    for (const p of this.effectParticles) {
      this.scene.remove(p)
      if (p.geometry) p.geometry.dispose()
      if (p.material) (p.material as THREE.Material).dispose()
    }
    this.effectParticles = []
  }
}
