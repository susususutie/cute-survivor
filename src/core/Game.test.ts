import { beforeEach, describe, expect, it, vi } from 'vitest'

const showStartMenu = vi.fn()
const hideStartMenu = vi.fn()

vi.mock('../systems/StartMenuManager', () => ({
  StartMenuManager: vi.fn().mockImplementation(() => ({
    onContinue: undefined,
    onStart: undefined,
    showStartMenu,
    hide: hideStartMenu
  }))
}))

vi.mock('../systems/SaveSystem', () => ({
  SaveSystem: vi.fn().mockImplementation(() => ({}))
}))

vi.mock('three', () => ({
  Scene: vi.fn(() => ({ background: null, add: vi.fn(), remove: vi.fn(), traverse: vi.fn(), getObjectByName: vi.fn(() => null) })),
  Color: vi.fn(() => ({})),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    lookAt: vi.fn(),
    aspect: 1,
    updateProjectionMatrix: vi.fn()
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    domElement: {},
    shadowMap: { enabled: false, type: 0 },
    render: vi.fn()
  })),
  Clock: vi.fn(() => ({ getDelta: vi.fn(() => 1 / 60) })),
  PCFSoftShadowMap: 1,
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z, set: vi.fn() }))
}))

describe('Game', () => {
  beforeEach(() => {
    showStartMenu.mockClear()
    hideStartMenu.mockClear()

    Object.defineProperty(global, 'window', {
      value: {
        innerWidth: 800,
        innerHeight: 600,
        devicePixelRatio: 1,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true
    })

    Object.defineProperty(global, 'document', {
      value: {
        getElementById: vi.fn(() => ({ appendChild: vi.fn() }))
      },
      writable: true
    })
  })

  it('does not boot automatically by default', async () => {
    const { Game } = await import('./Game')
    const game = new Game({ requestFrame: vi.fn(() => 1) })

    expect(game).toBeDefined()
    expect(showStartMenu).not.toHaveBeenCalled()
  })

  it('boots when explicitly requested', async () => {
    const { Game } = await import('./Game')
    const game = new Game({ requestFrame: vi.fn(() => 1) })

    game.boot()

    expect(showStartMenu).toHaveBeenCalledTimes(1)
  })

  it('supports autoBoot option for main entry', async () => {
    const { Game } = await import('./Game')

    new Game({ autoBoot: true, requestFrame: vi.fn(() => 1) })

    expect(showStartMenu).toHaveBeenCalledTimes(1)
  })
})
