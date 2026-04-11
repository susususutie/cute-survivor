export interface Settings {
  bgmVolume: number
  seVolume: number
  quality: 'low' | 'medium' | 'high'
}

export interface SettingsCallbacks {
  onVolumeChange?: (bgmVolume: number, seVolume: number) => void
  onQualityChange?: (quality: 'low' | 'medium' | 'high') => void
  onClose?: () => void
}

export class SettingsUI {
  private container: HTMLElement
  private settings: Settings
  private callbacks: SettingsCallbacks

  constructor(callbacks?: SettingsCallbacks) {
    this.settings = {
      bgmVolume: 0.7,
      seVolume: 0.8,
      quality: 'medium'
    }
    this.callbacks = callbacks ?? {}

    this.container = this.createSettingsUI()
    this.container.style.display = 'none'
    document.body.appendChild(this.container)
    this.addStyles()
  }

  private createSettingsUI(): HTMLElement {
    const container = document.createElement('div')
    container.id = 'settings-panel'
    container.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="close-btn" id="settings-close">×</button>
        </div>
        <div class="settings-body">
          <div class="setting-group">
            <label>Music Volume</label>
            <div class="slider-container">
              <input type="range" id="bgm-volume" min="0" max="100" value="70">
              <span id="bgm-volume-value">70%</span>
            </div>
          </div>
          <div class="setting-group">
            <label>Sound Effects</label>
            <div class="slider-container">
              <input type="range" id="se-volume" min="0" max="100" value="80">
              <span id="se-volume-value">80%</span>
            </div>
          </div>
          <div class="setting-group">
            <label>Graphics Quality</label>
            <div class="quality-buttons">
              <button class="quality-btn" data-quality="low">Low</button>
              <button class="quality-btn active" data-quality="medium">Medium</button>
              <button class="quality-btn" data-quality="high">High</button>
            </div>
          </div>
          <div class="controls-info">
            <h3>Controls</h3>
            <ul>
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> - Move</li>
              <li><kbd>Mouse</kbd> - Aim</li>
              <li><kbd>Left Click</kbd> - Shoot</li>
              <li><kbd>ESC</kbd> - Pause</li>
              <li><kbd>M</kbd> - Mute</li>
              <li><kbd>R</kbd> - Reload</li>
            </ul>
          </div>
        </div>
      </div>
    `

    this.attachEventListeners(container)
    return container
  }

  private attachEventListeners(container: HTMLElement): void {
    const closeBtn = container.querySelector('#settings-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    const bgmSlider = container.querySelector('#bgm-volume') as HTMLInputElement
    const bgmValue = container.querySelector('#bgm-volume-value') as HTMLElement
    bgmSlider.addEventListener('input', () => {
      const value = parseInt(bgmSlider.value) / 100
      this.settings.bgmVolume = value
      bgmValue.textContent = `${bgmSlider.value}%`
      this.callbacks.onVolumeChange?.(this.settings.bgmVolume, this.settings.seVolume)
    })

    const seSlider = container.querySelector('#se-volume') as HTMLInputElement
    const seValue = container.querySelector('#se-volume-value') as HTMLElement
    seSlider.addEventListener('input', () => {
      const value = parseInt(seSlider.value) / 100
      this.settings.seVolume = value
      seValue.textContent = `${seSlider.value}%`
      this.callbacks.onVolumeChange?.(this.settings.bgmVolume, this.settings.seVolume)
    })

    const qualityBtns = container.querySelectorAll('.quality-btn')
    qualityBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        qualityBtns.forEach((b) => {
          b.classList.remove('active')
        })
        btn.classList.add('active')
        this.settings.quality = btn.getAttribute('data-quality') as 'low' | 'medium' | 'high'
        this.callbacks.onQualityChange?.(this.settings.quality)
      })
    })
  }

  private addStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      #settings-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 10, 20, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 300;
      }
      #settings-panel .settings-content {
        background: #1a2030;
        border: 2px solid #334455;
        border-radius: 12px;
        padding: 24px;
        min-width: 320px;
        max-width: 400px;
        font-family: 'Courier New', monospace;
        color: #fff;
      }
      #settings-panel .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      #settings-panel h2 {
        margin: 0;
        font-size: 24px;
        color: #88ccff;
        text-shadow: 0 0 10px rgba(136, 204, 255, 0.5);
      }
      #settings-panel .close-btn {
        background: #ff4444;
        border: none;
        color: white;
        font-size: 24px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        line-height: 1;
        transition: background 0.2s;
      }
      #settings-panel .close-btn:hover {
        background: #ff6666;
      }
      #settings-panel .setting-group {
        margin-bottom: 20px;
      }
      #settings-panel .setting-group label {
        display: block;
        font-size: 14px;
        color: #88aacc;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      #settings-panel .slider-container {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #settings-panel input[type="range"] {
        flex: 1;
        height: 8px;
        -webkit-appearance: none;
        background: #334455;
        border-radius: 4px;
        outline: none;
      }
      #settings-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #44aaff;
        border-radius: 50%;
        cursor: pointer;
      }
      #settings-panel .slider-container span {
        min-width: 45px;
        text-align: right;
        color: #aaccdd;
      }
      #settings-panel .quality-buttons {
        display: flex;
        gap: 8px;
      }
      #settings-panel .quality-btn {
        flex: 1;
        padding: 10px 16px;
        background: #334455;
        border: 2px solid #445566;
        border-radius: 6px;
        color: #aabbcc;
        font-family: inherit;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      #settings-panel .quality-btn:hover {
        background: #445566;
      }
      #settings-panel .quality-btn.active {
        background: #44aaff;
        border-color: #66ccff;
        color: #fff;
      }
      #settings-panel .controls-info {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #334455;
      }
      #settings-panel .controls-info h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #88ccff;
      }
      #settings-panel .controls-info ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      #settings-panel .controls-info li {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #99aabb;
      }
      #settings-panel .controls-info kbd {
        background: #2a3a4a;
        padding: 4px 8px;
        border-radius: 4px;
        font-family: inherit;
        font-size: 12px;
        color: #ccddee;
        border: 1px solid #3a4a5a;
      }
    `
    document.head.appendChild(style)
  }

  show(): void {
    this.container.style.display = 'flex'
  }

  hide(): void {
    this.container.style.display = 'none'
    this.callbacks.onClose?.()
  }

  getSettings(): Settings {
    return { ...this.settings }
  }

  setSettings(settings: Settings): void {
    this.settings = { ...settings }
    this.updateUI()
  }

  private updateUI(): void {
    const bgmSlider = this.container.querySelector('#bgm-volume') as HTMLInputElement
    const bgmValue = this.container.querySelector('#bgm-volume-value')
    if (bgmSlider && bgmValue) {
      bgmSlider.value = String(this.settings.bgmVolume * 100)
      bgmValue.textContent = `${Math.round(this.settings.bgmVolume * 100)}%`
    }

    const seSlider = this.container.querySelector('#se-volume') as HTMLInputElement
    const seValue = this.container.querySelector('#se-volume-value')
    if (seSlider && seValue) {
      seSlider.value = String(this.settings.seVolume * 100)
      seValue.textContent = `${Math.round(this.settings.seVolume * 100)}%`
    }

    const qualityBtns = this.container.querySelectorAll('.quality-btn')
    qualityBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-quality') === this.settings.quality)
    })
  }

  destroy(): void {
    this.container.remove()
  }
}
