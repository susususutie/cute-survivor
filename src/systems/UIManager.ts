export class UIManager {
  private pauseMenu: HTMLElement
  private gameOverScreen: HTMLElement

  constructor() {
    this.createHUD()
    this.pauseMenu = this.createPauseMenu()
    this.gameOverScreen = this.createGameOverScreen()
  }

  private createHUD(): HTMLElement {
    const hud = document.createElement('div')
    hud.id = 'hud'
    hud.innerHTML = `
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
    document.body.appendChild(hud)
    this.addHUDStyles()
    return hud
  }

  private addHUDStyles(): void {
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
      .stat .bar #ammo-bar .fill {
        background: linear-gradient(90deg, #ff8844, #ffaa66);
      }
      .stat .value {
        font-size: 16px;
        font-weight: bold;
        min-width: 32px;
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
    `
    document.head.appendChild(style)
  }

  private createPauseMenu(): HTMLElement {
    const menu = document.createElement('div')
    menu.id = 'pause-menu'
    menu.innerHTML = `
      <div class="menu-content">
        <h1>Paused</h1>
        <p>Press ESC to resume</p>
      </div>
    `
    menu.style.display = 'none'
    document.body.appendChild(menu)
    this.addMenuStyles('pause-menu')
    return menu
  }

  private createGameOverScreen(): HTMLElement {
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
    this.addMenuStyles('game-over')
    return screen
  }

  private addMenuStyles(id: string): void {
    const style = document.createElement('style')
    style.textContent = `
      #${id} {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 10, 20, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
      }
      #${id} .menu-content {
        text-align: center;
        color: #fff;
        font-family: 'Courier New', monospace;
      }
      #${id} h1 {
        font-size: 48px;
        margin-bottom: 16px;
        text-shadow: 0 0 20px #ff4444;
      }
      #${id} p {
        font-size: 18px;
        color: #88aacc;
      }
    `
    document.head.appendChild(style)
  }

  updateStats(
    hp: number,
    maxHp: number,
    ammo: number,
    maxAmmo: number,
    gold: number,
    herbs: number,
    ores: number
  ): void {
    const hpBar = document.getElementById('hp-bar')!
    const hpValue = document.getElementById('hp-value')!
    const ammoBar = document.getElementById('ammo-bar')!
    const ammoValue = document.getElementById('ammo-value')!
    const goldValue = document.getElementById('gold-value')!
    const herbValue = document.getElementById('herb-value')!
    const oreValue = document.getElementById('ore-value')!

    hpBar.style.width = `${(hp / maxHp) * 100}%`
    hpValue.textContent = String(Math.max(0, hp))
    ammoBar.style.width = `${(ammo / maxAmmo) * 100}%`
    ammoValue.textContent = String(ammo)
    goldValue.textContent = String(gold)
    herbValue.textContent = String(herbs)
    oreValue.textContent = String(ores)
  }

  showPauseMenu(): void {
    this.pauseMenu.style.display = 'flex'
  }

  hidePauseMenu(): void {
    this.pauseMenu.style.display = 'none'
  }

  showGameOver(): void {
    this.gameOverScreen.style.display = 'flex'
  }

  hideGameOver(): void {
    this.gameOverScreen.style.display = 'none'
  }
}
