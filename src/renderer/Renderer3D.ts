import * as THREE from 'three'
import type { GameState } from '../core/GameState'
import { EntityRenderer } from './EntityRenderer'
import { setupLighting } from './Lighting'
import { meshFactory } from './MeshFactory'

export class Renderer3D {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private entityRenderer: EntityRenderer

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
    this.camera.position.set(0, 25, 20)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(this.renderer.domElement)

    setupLighting(this.scene)

    const gridHelper = meshFactory.createGridHelper()
    const groundPlane = meshFactory.createGroundPlane()
    this.scene.add(gridHelper)
    this.scene.add(groundPlane)

    this.entityRenderer = new EntityRenderer(this.scene)
  }

  render(state: GameState): void {
    this.updateCamera(state)
    this.entityRenderer.render(state)
    this.renderer.render(this.scene, this.camera)
  }

  private updateCamera(state: GameState): void {
    const targetX = state.player.position.x
    const targetZ = state.player.position.z + 20

    this.camera.position.x = targetX
    this.camera.position.z = targetZ
    this.camera.position.y = 25
    this.camera.lookAt(state.player.position.x, 0, state.player.position.z)
  }


  resize(width: number, height: number): void {
    const aspect = width / height
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    this.entityRenderer.dispose()
    this.renderer.dispose()
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
}
