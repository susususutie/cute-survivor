import type * as THREE from 'three'

export interface MiniMapConfig {
  size: number
  playerColor: string
  enemyColor: string
  resourceColor: string
  bgColor: string
}

export class MiniMap {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLElement
  private config: MiniMapConfig
  private worldSize: number

  constructor(worldSize = 1000, config?: Partial<MiniMapConfig>) {
    this.worldSize = worldSize
    this.config = {
      size: 150,
      playerColor: '#44ff44',
      enemyColor: '#ff4444',
      resourceColor: '#ffdd00',
      bgColor: 'rgba(20, 30, 40, 0.8)',
      ...config
    }

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.config.size
    this.canvas.height = this.config.size
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx

    this.container = document.createElement('div')
    this.container.id = 'minimap'
    this.container.appendChild(this.canvas)
    document.body.appendChild(this.container)
    this.addStyles()

    this.render()
  }

  private addStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      #minimap {
        position: fixed;
        bottom: 20px;
        right: 20px;
        border: 2px solid #334455;
        border-radius: 8px;
        overflow: hidden;
        z-index: 150;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }
      #minimap canvas {
        display: block;
      }
    `
    document.head.appendChild(style)
  }

  render(): void {
    // Clear canvas
    this.ctx.fillStyle = this.config.bgColor
    this.ctx.fillRect(0, 0, this.config.size, this.config.size)
  }

  update(
    playerPos: THREE.Vector3,
    _playerRotation: number,
    enemies: { pos: THREE.Vector3 }[],
    _resources: { pos: THREE.Vector3 }[]
  ): void {
    const ctx = this.ctx
    const size = this.config.size
    const scale = size / this.worldSize

    // Clear
    ctx.fillStyle = this.config.bgColor
    ctx.fillRect(0, 0, size, size)

    // Draw border
    ctx.strokeStyle = '#334455'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, size, size)

    // Draw center crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(size / 2, 0)
    ctx.lineTo(size / 2, size)
    ctx.moveTo(0, size / 2)
    ctx.lineTo(size, size / 2)
    ctx.stroke()

    // Draw enemies (red dots)
    ctx.fillStyle = this.config.enemyColor
    for (const enemy of enemies) {
      const relX = (enemy.pos.x - playerPos.x) * scale + size / 2
      const relZ = (enemy.pos.z - playerPos.z) * scale + size / 2
      if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
        ctx.beginPath()
        ctx.arc(relX, relZ, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw resources (yellow dots)
    ctx.fillStyle = this.config.resourceColor
    // Resources would be drawn here if passed in

    // Draw player (green dot at center)
    ctx.fillStyle = this.config.playerColor
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2)
    ctx.fill()

    // Draw player direction indicator
    ctx.strokeStyle = this.config.playerColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(size / 2, size / 2)
    ctx.lineTo(size / 2, size / 2 - 10)
    ctx.stroke()
  }

  setSize(size: number): void {
    this.config.size = size
    this.canvas.width = size
    this.canvas.height = size
  }

  show(): void {
    this.container.style.display = 'block'
  }

  hide(): void {
    this.container.style.display = 'none'
  }

  destroy(): void {
    this.container.remove()
  }
}
