import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UIManager } from './UIManager'

describe('UIManager', () => {
  let uiManager: UIManager

  beforeEach(() => {
    uiManager = new UIManager()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  it('creates HUD element', () => {
    const hud = document.getElementById('hud')
    expect(hud).not.toBeNull()
  })

  it('creates pause menu element', () => {
    const pauseMenu = document.getElementById('pause-menu')
    expect(pauseMenu).not.toBeNull()
  })

  it('creates game over element', () => {
    const gameOver = document.getElementById('game-over')
    expect(gameOver).not.toBeNull()
  })

  it('pause menu is hidden by default', () => {
    const pauseMenu = document.getElementById('pause-menu')
    expect(pauseMenu?.style.display).toBe('none')
  })

  it('game over screen is hidden by default', () => {
    const gameOver = document.getElementById('game-over')
    expect(gameOver?.style.display).toBe('none')
  })

  it('showPauseMenu displays pause menu', () => {
    uiManager.showPauseMenu()
    const pauseMenu = document.getElementById('pause-menu')
    expect(pauseMenu?.style.display).toBe('flex')
  })

  it('hidePauseMenu hides pause menu', () => {
    uiManager.showPauseMenu()
    uiManager.hidePauseMenu()
    const pauseMenu = document.getElementById('pause-menu')
    expect(pauseMenu?.style.display).toBe('none')
  })

  it('showGameOver displays game over screen', () => {
    uiManager.showGameOver()
    const gameOver = document.getElementById('game-over')
    expect(gameOver?.style.display).toBe('flex')
  })

  it('hideGameOver hides game over screen', () => {
    uiManager.showGameOver()
    uiManager.hideGameOver()
    const gameOver = document.getElementById('game-over')
    expect(gameOver?.style.display).toBe('none')
  })
})

describe('UIManager updateStats', () => {
  let uiManager: UIManager

  beforeEach(() => {
    uiManager = new UIManager()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  it('updates HP bar width', () => {
    uiManager.updateStats(50, 100, 30, 30, 0, 0, 0)
    const hpBar = document.getElementById('hp-bar')
    expect(hpBar?.style.width).toBe('50%')
  })

  it('updates HP value text', () => {
    uiManager.updateStats(75, 100, 30, 30, 0, 0, 0)
    const hpValue = document.getElementById('hp-value')
    expect(hpValue?.textContent).toBe('75')
  })

  it('updates ammo bar width', () => {
    uiManager.updateStats(100, 100, 15, 30, 0, 0, 0)
    const ammoBar = document.getElementById('ammo-bar')
    expect(ammoBar?.style.width).toBe('50%')
  })

  it('updates ammo value text', () => {
    uiManager.updateStats(100, 100, 20, 30, 0, 0, 0)
    const ammoValue = document.getElementById('ammo-value')
    expect(ammoValue?.textContent).toBe('20')
  })

  it('updates gold value text', () => {
    uiManager.updateStats(100, 100, 30, 30, 150, 0, 0)
    const goldValue = document.getElementById('gold-value')
    expect(goldValue?.textContent).toBe('150')
  })

  it('updates herb value text', () => {
    uiManager.updateStats(100, 100, 30, 30, 0, 25, 0)
    const herbValue = document.getElementById('herb-value')
    expect(herbValue?.textContent).toBe('25')
  })

  it('updates ore value text', () => {
    uiManager.updateStats(100, 100, 30, 30, 0, 0, 42)
    const oreValue = document.getElementById('ore-value')
    expect(oreValue?.textContent).toBe('42')
  })

  it('clamps HP to 0 minimum', () => {
    uiManager.updateStats(-10, 100, 30, 30, 0, 0, 0)
    const hpValue = document.getElementById('hp-value')
    expect(hpValue?.textContent).toBe('0')
  })

  it('updates all stats at once', () => {
    uiManager.updateStats(80, 100, 25, 30, 500, 10, 5)

    expect(document.getElementById('hp-bar')?.style.width).toBe('80%')
    expect(document.getElementById('hp-value')?.textContent).toBe('80')
    expect(document.getElementById('ammo-bar')?.style.width).toBe('83.33333333333334%')
    expect(document.getElementById('ammo-value')?.textContent).toBe('25')
    expect(document.getElementById('gold-value')?.textContent).toBe('500')
    expect(document.getElementById('herb-value')?.textContent).toBe('10')
    expect(document.getElementById('ore-value')?.textContent).toBe('5')
  })
})
