export class UIManager {
  private pauseMenu: HTMLElement
  private gameOverScreen: HTMLElement
  private defenseHUD: HTMLElement | null = null

  onSave: (() => void) | null = null

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
        <span class="item">⚙ <span id="gunpowder-value">0</span></span>
        <span class="item">L <span id="light-ammo-value">0</span></span>
        <span class="item">H <span id="heavy-ammo-value">0</span></span>
        <span class="item">✚ <span id="potion-value">0</span></span>
      </div>
      <div class="mission-panel">
        <div class="mission-title">探索协议</div>
        <div id="objective-text">收集矿石与草药，维持弹药和生命补给。</div>
      </div>
      <div class="loadout-panel">
        <span id="weapon-value">Pistol</span>
        <span id="reserve-value">备用 0</span>
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
        gap: 12px;
        font-size: 14px;
        flex-wrap: wrap;
      }
      .inventory .item {
        color: #aabbcc;
      }
      .mission-panel {
        position: fixed;
        left: 24px;
        bottom: 24px;
        width: min(380px, calc(100vw - 48px));
        background: rgba(12, 18, 28, 0.72);
        border: 1px solid rgba(136, 170, 204, 0.28);
        border-radius: 8px;
        padding: 12px 14px;
        color: #d8eef0;
        backdrop-filter: blur(10px);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.26);
      }
      .mission-title {
        color: #88ffcc;
        font-size: 12px;
        letter-spacing: 0;
        margin-bottom: 6px;
      }
      #objective-text {
        font-size: 14px;
        line-height: 1.45;
      }
      .loadout-panel {
        position: fixed;
        right: 24px;
        bottom: 24px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        color: #fff;
        background: rgba(12, 18, 28, 0.72);
        border: 1px solid rgba(255, 170, 68, 0.32);
        border-radius: 8px;
        padding: 12px 14px;
        backdrop-filter: blur(10px);
      }
      #weapon-value {
        color: #ffaa44;
        font-weight: bold;
        font-size: 18px;
      }
      #reserve-value {
        color: #aabbcc;
        font-size: 12px;
      }
      .game-toast {
        position: fixed;
        left: 50%;
        bottom: 112px;
        transform: translateX(-50%);
        background: rgba(20, 28, 38, 0.92);
        border: 1px solid rgba(136, 255, 204, 0.35);
        border-radius: 8px;
        color: #f2fff8;
        padding: 10px 16px;
        font-size: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }
      .game-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(-6px);
      }
      @media (max-width: 720px) {
        #hud {
          padding: 12px;
        }
        .stat-bar {
          gap: 10px;
          flex-wrap: wrap;
        }
        .stat .bar {
          width: 84px;
        }
        .mission-panel {
          left: 12px;
          bottom: 12px;
          width: calc(100vw - 24px);
        }
        .loadout-panel {
          right: 12px;
          bottom: 150px;
        }
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
        <button class="menu-btn" id="save-btn">保存游戏</button>
      </div>
    `
    menu.style.display = 'none'
    document.body.appendChild(menu)
    this.addMenuStyles('pause-menu')
    this.addPauseMenuButtonStyles()
    return menu
  }

  private addPauseMenuButtonStyles(): void {
    if (document.getElementById('pause-menu-btn-styles')) return
    const style = document.createElement('style')
    style.id = 'pause-menu-btn-styles'
    style.textContent = `
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
    `
    document.head.appendChild(style)
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
    ores: number,
    gunpowder = 0,
    lightAmmo = 0,
    heavyAmmo = 0,
    potions = 0
  ): void {
    const hpBar = document.getElementById('hp-bar')
    const hpValue = document.getElementById('hp-value')
    const ammoBar = document.getElementById('ammo-bar')
    const ammoValue = document.getElementById('ammo-value')
    const goldValue = document.getElementById('gold-value')
    const herbValue = document.getElementById('herb-value')
    const oreValue = document.getElementById('ore-value')
    const gunpowderValue = document.getElementById('gunpowder-value')
    const lightAmmoValue = document.getElementById('light-ammo-value')
    const heavyAmmoValue = document.getElementById('heavy-ammo-value')
    const potionValue = document.getElementById('potion-value')

    if (hpBar) hpBar.style.width = `${(hp / maxHp) * 100}%`
    if (hpValue) hpValue.textContent = String(Math.max(0, hp))
    if (ammoBar) ammoBar.style.width = `${(ammo / maxAmmo) * 100}%`
    if (ammoValue) ammoValue.textContent = String(ammo)
    if (goldValue) goldValue.textContent = String(gold)
    if (herbValue) herbValue.textContent = String(herbs)
    if (oreValue) oreValue.textContent = String(ores)
    if (gunpowderValue) gunpowderValue.textContent = String(gunpowder)
    if (lightAmmoValue) lightAmmoValue.textContent = String(lightAmmo)
    if (heavyAmmoValue) heavyAmmoValue.textContent = String(heavyAmmo)
    if (potionValue) potionValue.textContent = String(potions)
  }

  updateLoadout(weaponName: string, reserveLabel: string, objective: string): void {
    const weaponValue = document.getElementById('weapon-value')
    const reserveValue = document.getElementById('reserve-value')
    const objectiveText = document.getElementById('objective-text')

    if (weaponValue) weaponValue.textContent = weaponName
    if (reserveValue) reserveValue.textContent = reserveLabel
    if (objectiveText) objectiveText.textContent = objective
  }

  showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'game-toast'
    toast.textContent = message
    document.body.appendChild(toast)
    requestAnimationFrame(() => {
      toast.classList.add('visible')
    })
    setTimeout(() => {
      toast.classList.remove('visible')
      setTimeout(() => {
        toast.remove()
      }, 220)
    }, 1600)
  }

  showPauseMenu(): void {
    this.pauseMenu.style.display = 'flex'
    const saveBtn = document.getElementById('save-btn')
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (this.onSave) this.onSave()
      }
    }
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

  updateDefenseMode(active: boolean): void {
    if (active) {
      this.defenseHUD = document.createElement('div')
      this.defenseHUD.id = 'defense-hud'
      this.defenseHUD.innerHTML = `
        <div class="defense-info">
          <span class="mode-badge">DEFENSE MODE</span>
          <span class="wave-info">Wave <span id="wave-number">1</span>/<span id="wave-total">10</span></span>
          <span class="enemies-info">Enemies: <span id="enemies-remaining">0</span></span>
        </div>
      `
      this.defenseHUD.style.cssText = `
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
      `
      this.addDefenseStyles()
      document.body.appendChild(this.defenseHUD)
    } else {
      if (this.defenseHUD) {
        this.defenseHUD.remove()
        this.defenseHUD = null
      }
    }
  }

  updateDefenseWave(wave: number, total: number): void {
    const waveNum = document.getElementById('wave-number')
    const waveTot = document.getElementById('wave-total')
    if (waveNum) waveNum.textContent = String(wave)
    if (waveTot) waveTot.textContent = String(total)
  }

  updateDefenseEnemies(count: number): void {
    const enemiesEl = document.getElementById('enemies-remaining')
    if (enemiesEl) enemiesEl.textContent = String(count)
  }

  private addDefenseStyles(): void {
    if (document.getElementById('defense-styles')) return
    const style = document.createElement('style')
    style.id = 'defense-styles'
    style.textContent = `
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
}
