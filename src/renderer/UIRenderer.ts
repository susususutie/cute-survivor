import type { GameState } from '../core/GameState'

export class UIRenderer {
  private hudContainer: HTMLElement | null = null
  private pauseMenu: HTMLElement | null = null
  private gameOverScreen: HTMLElement | null = null
  private defenseHUD: HTMLElement | null = null
  private stylesAdded = false

  onSave: (() => void) | null = null

  constructor() {
    this.createHUD()
    this.pauseMenu = this.createPauseMenu()
    this.gameOverScreen = this.createGameOverScreen()
  }

  private ensureStyles(): void {
    if (this.stylesAdded) return
    this.stylesAdded = true

    const style = document.createElement('style')
    style.textContent = `
      #hud {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 16px 24px;
        pointer-events: none;
        font-family: 'Courier New', monospace;
        color: #fff;
        z-index: 100;
      }
      .stat-bar {
        display: flex;
        gap: 24px;
        align-items: center;
      }
      .stat {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stat .label {
        font-size: 12px;
        color: #88aacc;
        text-transform: uppercase;
      }
      .stat .bar {
        width: 120px;
        height: 12px;
        background: #223344;
        border-radius: 6px;
        overflow: hidden;
      }
      .stat .bar .fill {
        height: 100%;
        background: linear-gradient(90deg, #44ff88, #88ffcc);
        transition: width 0.2s;
      }
      .stat.gold {
        margin-left: auto;
        font-size: 18px;
      }
      .stat.gold .icon {
        font-size: 20px;
      }
      .inventory {
        margin-top: 8px;
        display: flex;
        gap: 16px;
        font-size: 14px;
      }
      .inventory .item {
        color: #aabbcc;
      }
      #pause-menu, #game-over {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 10, 20, 0.9);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 200;
      }
      #pause-menu .menu-content, #game-over .menu-content {
        text-align: center;
        color: #fff;
        font-family: 'Courier New', monospace;
      }
      #pause-menu h1, #game-over h1 {
        font-size: 48px;
        margin-bottom: 16px;
      }
      #game-over h1 {
        text-shadow: 0 0 20px #ff4444;
      }
      #pause-menu h1 {
        text-shadow: 0 0 20px #4488ff;
      }
      #pause-menu p, #game-over p {
        font-size: 18px;
        color: #88aacc;
      }
      .menu-btn {
        display: block;
        background: linear-gradient(135deg, #445566 0%, #334455 100%);
        border: 2px solid #5588aa;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
        margin: 12px auto;
        min-width: 140px;
      }
      .menu-btn:hover {
        background: linear-gradient(135deg, #5588aa 0%, #446688 100%);
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(85, 136, 170, 0.5);
      }
      #defense-hud {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 40, 0.9);
        padding: 12px 24px;
        border-radius: 8px;
        border: 2px solid #ff6644;
        font-family: 'Courier New', monospace;
        color: #fff;
        z-index: 150;
        display: flex;
        gap: 24px;
        align-items: center;
      }
      .defense-info {
        display: flex;
        gap: 24px;
        align-items: center;
      }
      .mode-badge {
        background: #ff6644;
        color: #fff;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
      }
      .wave-info, .enemies-info {
        font-size: 14px;
        color: #aabbcc;
      }
      .wave-info span, .enemies-info span {
        color: #ffaa44;
        font-weight: bold;
      }
    `
    document.head.appendChild(style)
  }

  private createHUD(): void {
    this.ensureStyles()
    this.hudContainer = document.createElement('div')
    this.hudContainer.id = 'hud'
    this.hudContainer.innerHTML = `
      <div class="stat-bar">
        <div class="stat">
          <span class="label">HP</span>
          <div class="bar"><div class="fill" id="hp-bar"></div></div>
          <span class="value" id="hp-value">100</span>
        </div>
        <div class="stat">
          <span class="label">AMMO</span>
          <div class="bar"><div class="fill" id="ammo-bar"></div></div>
          <span class="value" id="ammo-value">30</span>
        </div>
        <div class="stat gold">
          <span class="icon">💰</span>
          <span class="value" id="gold-value">0</span>
        </div>
      </div>
      <div class="inventory">
        <span class="item">🌿 <span id="herb-value">0</span></span>
        <span class="item">💎 <span id="ore-value">0</span></span>
      </div>
    `
    document.body.appendChild(this.hudContainer)
  }

  private createPauseMenu(): HTMLElement {
    this.ensureStyles()
    const menu = document.createElement('div')
    menu.id = 'pause-menu'
    menu.innerHTML = `
      <div class="menu-content">
        <h1>Paused</h1>
        <p>Press ESC to resume</p>
        <button class="menu-btn" id="save-btn">保存游戏</button>
      </div>
    `
    menu.style.display = 'none'
    document.body.appendChild(menu)
    return menu
  }

  private createGameOverScreen(): HTMLElement {
    this.ensureStyles()
    const screen = document.createElement('div')
    screen.id = 'game-over'
    screen.innerHTML = `
      <div class="menu-content">
        <h1>Game Over</h1>
        <p>Press R to restart</p>
      </div>
    `
    screen.style.display = 'none'
    document.body.appendChild(screen)
    return screen
  }

  renderHUD(state: GameState): void {
    const hpBar = document.getElementById('hp-bar')
    const hpValue = document.getElementById('hp-value')
    const ammoBar = document.getElementById('ammo-bar')
    const ammoValue = document.getElementById('ammo-value')
    const goldValue = document.getElementById('gold-value')
    const herbValue = document.getElementById('herb-value')
    const oreValue = document.getElementById('ore-value')

    if (hpBar) hpBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`
    if (hpValue) hpValue.textContent = String(Math.max(0, state.player.hp))
    if (ammoBar) ammoBar.style.width = `${(state.combat.ammo / state.combat.maxAmmo) * 100}%`
    if (ammoValue) ammoValue.textContent = String(state.combat.ammo)
    if (goldValue) goldValue.textContent = String(state.resources.gold)
    if (herbValue) herbValue.textContent = String(state.resources.herbs)
    if (oreValue) oreValue.textContent = String(state.resources.ores)
  }

  renderPauseMenu(_state: GameState): void {
    if (this.pauseMenu) {
      this.pauseMenu.style.display = 'flex'
    }
    const saveBtn = document.getElementById('save-btn')
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (this.onSave) this.onSave()
      }
    }
  }

  hidePauseMenu(): void {
    if (this.pauseMenu) {
      this.pauseMenu.style.display = 'none'
    }
  }

  renderGameOver(_state: GameState): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'flex'
    }
  }

  hideGameOver(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'none'
    }
  }

  renderDefenseMode(state: GameState): void {
    if (state.defense.active) {
      if (!this.defenseHUD) {
        this.defenseHUD = document.createElement('div')
        this.defenseHUD.id = 'defense-hud'
        this.defenseHUD.innerHTML = `
          <div class="defense-info">
            <span class="mode-badge">DEFENSE MODE</span>
            <span class="wave-info">Wave <span id="wave-number">1</span>/<span id="wave-total">10</span></span>
            <span class="enemies-info">Enemies: <span id="enemies-remaining">0</span></span>
          </div>
        `
        document.body.appendChild(this.defenseHUD)
      }

      const waveNum = document.getElementById('wave-number')
      const waveTot = document.getElementById('wave-total')
      const enemiesEl = document.getElementById('enemies-remaining')
      if (waveNum) waveNum.textContent = String(state.defense.wave)
      if (waveTot) waveTot.textContent = String(state.defense.totalWaves)
      if (enemiesEl) enemiesEl.textContent = String(state.defense.enemiesRemaining)
    } else {
      if (this.defenseHUD) {
        this.defenseHUD.remove()
        this.defenseHUD = null
      }
    }
  }

  dispose(): void {
    if (this.hudContainer) {
      this.hudContainer.remove()
      this.hudContainer = null
    }
    if (this.pauseMenu) {
      this.pauseMenu.remove()
      this.pauseMenu = null
    }
    if (this.gameOverScreen) {
      this.gameOverScreen.remove()
      this.gameOverScreen = null
    }
    if (this.defenseHUD) {
      this.defenseHUD.remove()
      this.defenseHUD = null
    }
  }
}
