import * as THREE from 'three'

export function setupLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)

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
  scene.add(directional)
}
