export interface MiniMapConfig {
  size: number
  playerColor: string
  enemyColor: string
  resourceColor: string
  bgColor: string
}

const DEFAULT_CONFIG: MiniMapConfig = {
  size: 150,
  playerColor: '#44ff44',
  enemyColor: '#ff4444',
  resourceColor: '#ffdd00',
  bgColor: 'rgba(20, 30, 40, 0.8)'
}

export class MiniMapRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private container: HTMLElement
  private config: MiniMapConfig
  private worldSize: number

  constructor(worldSize = 1000, config?: Partial<MiniMapConfig>) {
    this.worldSize = worldSize
    this.config = { ...DEFAULT_CONFIG, ...config }

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

  render(state: { player: { position: { x: number; z: number }; rotation: number }; enemies: { position: { x: number; z: number } }[]; items: { position: { x: number; z: number } }[] }): void {
    const ctx = this.ctx
    const size = this.config.size
    const scale = size / this.worldSize
    const playerPos = state.player.position

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
    for (const enemy of state.enemies) {
      const relX = (enemy.position.x - playerPos.x) * scale + size / 2
      const relZ = (enemy.position.z - playerPos.z) * scale + size / 2
      if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
        ctx.beginPath()
        ctx.arc(relX, relZ, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw items (yellow dots)
    ctx.fillStyle = this.config.resourceColor
    for (const item of state.items) {
      const relX = (item.position.x - playerPos.x) * scale + size / 2
      const relZ = (item.position.z - playerPos.z) * scale + size / 2
      if (relX >= 0 && relX <= size && relZ >= 0 && relZ <= size) {
        ctx.beginPath()
        ctx.arc(relX, relZ, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

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
    const dirX = Math.sin(state.player.rotation) * 10
    const dirZ = -Math.cos(state.player.rotation) * 10
    ctx.lineTo(size / 2 + dirX, size / 2 + dirZ)
    ctx.stroke()
  }

  resize(size: number): void {
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

  dispose(): void {
    this.container.remove()
  }
}
