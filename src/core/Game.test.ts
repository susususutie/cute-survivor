import { describe, it, expect, vi } from 'vitest'

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')

  class MockWebGLRenderer {
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    domElement = { style: {} }
    shadowMap = { enabled: false, type: 0 }
    render = vi.fn()
  }

  return {
    ...actual,
    WebGLRenderer: vi.fn(() => new MockWebGLRenderer()),
    Raycaster: vi.fn().mockImplementation(() => ({
      setFromCamera: vi.fn(),
      ray: {
        intersectPlane: vi.fn().mockReturnValue(new actual.Vector3(1, 0, 1))
      }
    })),
    Plane: vi.fn()
  }
})

describe('Game imports', () => {
  it('Game class can be imported without errors', async () => {
    const { Game } = await import('./Game')
    expect(Game).toBeDefined()
    expect(typeof Game).toBe('function')
  })

  it('Game has init method', async () => {
    const { Game } = await import('./Game')
    const proto = Game.prototype
    expect(typeof proto.init).toBe('function')
  })
})
