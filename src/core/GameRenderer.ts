import * as THREE from 'three'

/**
 * GameRenderer handles all THREE.js rendering operations.
 * This is separated from game logic to allow testing without a DOM.
 */
export class GameRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private eventHandlers: {
    resize: (() => void) | null
  } = { resize: null }

  constructor() {
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

    const app = document.getElementById('app')
    if (app) {
      app.appendChild(this.renderer.domElement)
    }
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  /**
   * Update camera position to follow player
   */
  updateCamera(targetX: number, targetZ: number, playerY: number): void {
    this.camera.position.x = targetX
    this.camera.position.z = targetZ + 20
    this.camera.position.y = 25
    this.camera.lookAt(targetX, playerY, targetZ)
  }

  /**
   * Render a single frame
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Handle window resize
   */
  handleResize(): void {
    if (this.eventHandlers.resize) {
      window.removeEventListener('resize', this.eventHandlers.resize)
    }

    this.eventHandlers.resize = () => {
      const aspect = window.innerWidth / window.innerHeight
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', this.eventHandlers.resize)
  }

  /**
   * Create initial lighting
   */
  createLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xfff5e0, 1)
    directional.position.set(15, 30, 10)
    directional.castShadow = true
    directional.shadow.mapSize.width = 2048
    directional.shadow.mapSize.height = 2048
    directional.shadow.camera.near = 0.5
    directional.shadow.camera.far = 100
    directional.shadow.camera.left = -30
    directional.shadow.camera.right = 30
    directional.shadow.camera.top = 30
    directional.shadow.camera.bottom = -30
    this.scene.add(directional)
  }

  /**
   * Create ground plane and grid helper
   */
  createGround(): void {
    const gridSize = 200
    const gridDivisions = 100

    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444466, 0x333355)
    gridHelper.name = 'groundGrid'
    this.scene.add(gridHelper)

    const groundGeo = new THREE.PlaneGeometry(gridSize, gridSize)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222233 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    ground.name = 'groundPlane'
    this.scene.add(ground)
  }

  /**
   * Remove an object from the scene
   */
  removeObject(obj: THREE.Object3D): void {
    this.scene.remove(obj)
  }

  /**
   * Add an object to the scene
   */
  addObject(obj: THREE.Object3D): void {
    this.scene.add(obj)
  }

  /**
   * Dispose of all Three.js resources
   */
  dispose(): void {
    if (this.eventHandlers.resize) {
      window.removeEventListener('resize', this.eventHandlers.resize)
      this.eventHandlers.resize = null
    }

    this.renderer.dispose()
  }
}
