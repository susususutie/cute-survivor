import type { SaveSystem } from './SaveSystem'
import type { SaveData } from './SaveSystem'
import {
  type WorldConfig,
  type TerrainConfig,
  type MonsterConfig,
  type MonsterTypeConfig,
  createDefaultWorldConfig,
  generateRandomSeed,
  DEFAULT_TERRAIN_CONFIG,
  DEFAULT_MONSTER_CONFIG,
  DEFAULT_DROP_CONFIG
} from '../core/WorldConfig'
import { EnemyType } from '../entities/Enemy'

export class StartMenuManager {
  private container: HTMLElement
  private saveSystem: SaveSystem
  private currentSeed = ''
  private selectedSlot = -1

  onContinue: ((saveData: SaveData) => void) | null = null
  onStart: ((config: WorldConfig, slotIndex: number) => void) | null = null

  constructor(saveSystem: SaveSystem) {
    this.saveSystem = saveSystem
    this.container = document.createElement('div')
    this.container.id = 'start-menu-container'
    document.body.appendChild(this.container)
    this.addStyles()
  }

  private addStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      #start-menu-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Courier New', monospace;
        color: #fff;
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
        box-sizing: border-box;
      }
      .menu-title {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 20px;
        text-shadow: 0 0 20px #ff6644, 0 0 40px #ff4422;
        letter-spacing: 4px;
      }
      .save-slots {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 400px;
        margin-bottom: 30px;
      }
      .save-slot {
        background: rgba(30, 40, 60, 0.8);
        border: 2px solid #334455;
        border-radius: 8px;
        padding: 16px 20px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .save-slot:hover {
        background: rgba(50, 70, 100, 0.9);
        border-color: #5588aa;
        transform: translateX(4px);
      }
      .save-slot.empty {
        opacity: 0.5;
        border-style: dashed;
      }
      .save-slot.empty:hover {
        opacity: 0.8;
      }
      .slot-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .slot-title {
        font-size: 18px;
        font-weight: bold;
        color: #aabbcc;
      }
      .slot-time {
        font-size: 12px;
        color: #667788;
      }
      .slot-info {
        font-size: 13px;
        color: #556677;
      }
      .seed-preview {
        font-family: monospace;
        color: #88aacc;
      }
      .btn {
        background: linear-gradient(135deg, #ff6644 0%, #ff4422 100%);
        border: none;
        border-radius: 8px;
        padding: 16px 40px;
        font-size: 18px;
        font-weight: bold;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(255, 100, 68, 0.5);
      }
      .btn-secondary {
        background: linear-gradient(135deg, #445566 0%, #334455 100%);
      }
      .btn-secondary:hover {
        box-shadow: 0 0 20px rgba(68, 85, 102, 0.5);
      }
      .config-section {
        background: rgba(20, 30, 50, 0.9);
        border: 1px solid #334455;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        width: 480px;
      }
      .config-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #aabbcc;
        border-bottom: 1px solid #334455;
        padding-bottom: 8px;
      }
      .config-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .config-label {
        color: #889999;
        font-size: 14px;
      }
      .config-input {
        background: #1a2535;
        border: 1px solid #334455;
        border-radius: 4px;
        padding: 8px 12px;
        color: #fff;
        font-family: 'Courier New', monospace;
        width: 120px;
        text-align: right;
      }
      .config-input:focus {
        outline: none;
        border-color: #5588aa;
      }
      .seed-input-group {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .seed-input {
        background: #1a2535;
        border: 1px solid #334455;
        border-radius: 4px;
        padding: 8px 12px;
        color: #fff;
        font-family: 'Courier New', monospace;
        width: 140px;
        text-align: center;
        letter-spacing: 2px;
      }
      .btn-random {
        background: linear-gradient(135deg, #44aa88 0%, #338866 100%);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
        font-family: 'Courier New', monospace;
      }
      .btn-random:hover {
        background: linear-gradient(135deg, #55bb99 0%, #449977 100%);
      }
      .btn-back {
        background: transparent;
        border: 1px solid #445566;
        border-radius: 4px;
        padding: 8px 16px;
        color: #889999;
        cursor: pointer;
        font-size: 14px;
        font-family: 'Courier New', monospace;
        margin-right: 12px;
      }
      .btn-back:hover {
        background: rgba(68, 85, 102, 0.3);
        color: #aabbcc;
      }
      .action-buttons {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
      .enemy-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding: 4px 0;
      }
      .enemy-name {
        color: #aabbcc;
        font-size: 13px;
        width: 80px;
      }
      .enemy-weight {
        width: 60px;
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .slider {
        -webkit-appearance: none;
        width: 100px;
        height: 6px;
        background: #223344;
        border-radius: 3px;
        outline: none;
      }
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: #5588aa;
        border-radius: 50%;
        cursor: pointer;
      }
      .slider-value {
        color: #88aacc;
        font-size: 12px;
        width: 30px;
        text-align: right;
      }
      .config-back-row {
        margin-bottom: 20px;
      }
    `
    document.head.appendChild(style)
  }

  showStartMenu(): void {
    this.container.innerHTML = ''
    this.container.style.display = 'flex'

    const title = document.createElement('h1')
    title.className = 'menu-title'
    title.textContent = 'CUTE SURVIVOR'
    this.container.appendChild(title)

    const saves = this.saveSystem.getAllSaves()
    const slotsDiv = document.createElement('div')
    slotsDiv.className = 'save-slots'

    saves.forEach((info, index) => {
      const slot = document.createElement('div')
      slot.className = `save-slot ${info.hasData ? '' : 'empty'}`

      if (info.hasData) {
        const slotData = this.saveSystem.getSave(index)
        slot.innerHTML = `
          <div class="slot-header">
            <span class="slot-title">存档 #${index + 1}</span>
            <span class="slot-time">${this.formatTime(info.timestamp)}</span>
          </div>
          <div class="slot-info">种子: <span class="seed-preview">${info.seedPreview}</span></div>
        `
        slot.addEventListener('click', () => {
          if (slotData && this.onContinue) {
            this.onContinue(slotData)
          }
        })
      } else {
        slot.innerHTML = `
          <div class="slot-header">
            <span class="slot-title">存档 #${index + 1}</span>
            <span class="slot-time">空</span>
          </div>
        `
        slot.addEventListener('click', () => {
          this.selectedSlot = index
          this.showWorldConfig()
        })
      }

      slotsDiv.appendChild(slot)
    })

    this.container.appendChild(slotsDiv)

    const newGameBtn = document.createElement('button')
    newGameBtn.className = 'btn btn-secondary'
    newGameBtn.textContent = '新建存档'
    newGameBtn.addEventListener('click', () => {
      // Find first empty slot or just use next slot
      const emptySlot = saves.findIndex(s => !s.hasData)
      this.selectedSlot = emptySlot >= 0 ? emptySlot : 0
      this.showWorldConfig()
    })
    this.container.appendChild(newGameBtn)
  }

  showWorldConfig(editSeed?: string): void {
    this.currentSeed = editSeed ?? generateRandomSeed()
    createDefaultWorldConfig(this.currentSeed)
    this.container.innerHTML = ''

    // Back button
    const backRow = document.createElement('div')
    backRow.className = 'config-back-row'
    const backBtn = document.createElement('button')
    backBtn.className = 'btn-back'
    backBtn.textContent = '← 返回'
    backBtn.addEventListener('click', () => { this.showStartMenu(); })
    backRow.appendChild(backBtn)
    this.container.appendChild(backRow)

    // Title
    const title = document.createElement('h2')
    title.className = 'menu-title'
    title.style.fontSize = '32px'
    title.textContent = '世界生成配置'
    this.container.appendChild(title)

    // Seed section
    const seedSection = document.createElement('div')
    seedSection.className = 'config-section'
    seedSection.innerHTML = `<div class="config-title">种子设置</div>`
    const seedRow = document.createElement('div')
    seedRow.className = 'config-row'
    seedRow.innerHTML = `
      <span class="config-label">种子:</span>
      <div class="seed-input-group">
        <input type="text" class="seed-input" id="seed-input" value="${this.currentSeed}" maxlength="16">
        <button class="btn-random" id="random-seed-btn">随机</button>
      </div>
    `
    seedSection.appendChild(seedRow)
    this.container.appendChild(seedSection)

    // Terrain section
    const terrainSection = document.createElement('div')
    terrainSection.className = 'config-section'
    terrainSection.innerHTML = `<div class="config-title">地形设置</div>`

    const terrainConfig = DEFAULT_TERRAIN_CONFIG
    terrainSection.appendChild(this.createSliderRow('岩石数量', 'rockCount', terrainConfig.rockCount, 5, 50))
    terrainSection.appendChild(this.createSliderRow('岩石密度', 'rockDensity', terrainConfig.rockDensity, 0.5, 2, 0.1))
    terrainSection.appendChild(this.createSliderRow('地形丘陵', 'terrainMoundCount', terrainConfig.terrainMoundCount, 5, 30))
    terrainSection.appendChild(this.createSliderRow('树木', 'treeCount', terrainConfig.vegetation.trees, 5, 30))
    terrainSection.appendChild(this.createSliderRow('草地', 'grassCount', terrainConfig.vegetation.grass, 5, 30))
    terrainSection.appendChild(this.createSliderRow('花朵', 'flowerCount', terrainConfig.vegetation.flowers, 2, 20))
    terrainSection.appendChild(this.createSliderRow('灌木', 'bushCount', terrainConfig.vegetation.bushes, 2, 20))
    terrainSection.appendChild(this.createSliderRow('草药', 'herbCount', terrainConfig.resources.herbs, 3, 25))
    terrainSection.appendChild(this.createSliderRow('矿石', 'oreCount', terrainConfig.resources.ores, 3, 25))
    this.container.appendChild(terrainSection)

    // Monster section
    const monsterSection = document.createElement('div')
    monsterSection.className = 'config-section'
    monsterSection.innerHTML = `<div class="config-title">怪物设置</div>`

    const monsterConfig = DEFAULT_MONSTER_CONFIG
    Object.keys(monsterConfig.types).forEach(type => {
      const config = monsterConfig.types[type as EnemyType]
      monsterSection.appendChild(this.createEnemyWeightRow(type as EnemyType, config.spawnWeight))
    })
    this.container.appendChild(monsterSection)

    // Action buttons
    const actions = document.createElement('div')
    actions.className = 'action-buttons'
    const startBtn = document.createElement('button')
    startBtn.className = 'btn'
    startBtn.textContent = '开始游戏'
    startBtn.addEventListener('click', () => { this.startGame(); })
    actions.appendChild(startBtn)
    this.container.appendChild(actions)

    // Event listeners
    document.getElementById('seed-input')?.addEventListener('input', (e) => {
      this.currentSeed = (e.target as HTMLInputElement).value.toUpperCase()
      ;(e.target as HTMLInputElement).value = this.currentSeed
    })
    document.getElementById('random-seed-btn')?.addEventListener('click', () => {
      this.currentSeed = generateRandomSeed()
      const input = document.getElementById('seed-input') as HTMLInputElement
      if (input) input.value = this.currentSeed
    })
  }

  private createSliderRow(
    label: string,
    id: string,
    value: number,
    min: number,
    max: number,
    step = 1
  ): HTMLElement {
    const row = document.createElement('div')
    row.className = 'config-row'
    row.innerHTML = `
      <span class="config-label">${label}:</span>
      <div class="slider-container">
        <input type="range" class="slider" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
        <span class="slider-value" id="${id}-value">${value}</span>
      </div>
    `
    row.querySelector(`#${id}`)?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value)
      const valueSpan = row.querySelector(`#${id}-value`)
      if (valueSpan) valueSpan.textContent = String(val)
    })
    return row
  }

  private createEnemyWeightRow(type: EnemyType, weight: number): HTMLElement {
    const row = document.createElement('div')
    row.className = 'enemy-row'
    const typeName = type.charAt(0).toUpperCase() + type.slice(1)
    row.innerHTML = `
      <span class="enemy-name">${typeName}</span>
      <div class="slider-container">
        <input type="range" class="slider enemy-weight" id="enemy-${type}" min="0" max="50" step="1" value="${weight}">
        <span class="slider-value" id="enemy-${type}-value">${weight}</span>
      </div>
    `
    row.querySelector(`#enemy-${type}`)?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value)
      const valueSpan = row.querySelector(`#enemy-${type}-value`)
      if (valueSpan) valueSpan.textContent = String(val)
    })
    return row
  }

  private collectConfig(): WorldConfig {
    const terrain: TerrainConfig = {
      rockCount: parseFloat((document.getElementById('rockCount') as HTMLInputElement)?.value || '20'),
      rockDensity: parseFloat((document.getElementById('rockDensity') as HTMLInputElement)?.value || '1'),
      terrainMoundCount: parseFloat((document.getElementById('terrainMoundCount') as HTMLInputElement)?.value || '12'),
      vegetation: {
        trees: parseFloat((document.getElementById('treeCount') as HTMLInputElement)?.value || '10'),
        grass: parseFloat((document.getElementById('grassCount') as HTMLInputElement)?.value || '10'),
        flowers: parseFloat((document.getElementById('flowerCount') as HTMLInputElement)?.value || '5'),
        bushes: parseFloat((document.getElementById('bushCount') as HTMLInputElement)?.value || '5'),
        density: 1.0
      },
      resources: {
        herbs: parseFloat((document.getElementById('herbCount') as HTMLInputElement)?.value || '8'),
        ores: parseFloat((document.getElementById('oreCount') as HTMLInputElement)?.value || '7'),
        density: 1.0
      }
    }

    const monsterTypes: Record<EnemyType, MonsterTypeConfig> = {} as Record<EnemyType, MonsterTypeConfig>
    Object.values(EnemyType).forEach(type => {
      const weight = parseFloat((document.getElementById(`enemy-${type}`) as HTMLInputElement)?.value || '10')
      monsterTypes[type] = {
        ...DEFAULT_MONSTER_CONFIG.types[type],
        spawnWeight: weight
      }
    })

    const monster: MonsterConfig = {
      spawnRate: 1.0,
      types: monsterTypes
    }

    return {
      seed: this.currentSeed,
      terrain,
      monster,
      drop: { ...DEFAULT_DROP_CONFIG }
    }
  }

  private startGame(): void {
    const config = this.collectConfig()
    if (this.onStart) {
      this.onStart(config, this.selectedSlot)
    }
  }

  private formatTime(timestamp: number): string {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  hide(): void {
    this.container.style.display = 'none'
  }
}
