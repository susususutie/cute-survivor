import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StartMenuManager } from './StartMenuManager'
import type { SaveInfo, SaveSystem } from './SaveSystem'

function createSaveInfo(slotIndex: number, hasData: boolean): SaveInfo {
  return {
    slotIndex,
    hasData,
    timestamp: hasData ? 1234567890 + slotIndex : 0,
    version: hasData ? '1.0.0' : '',
    seedPreview: hasData ? `seed-${slotIndex}` : ''
  }
}

function createSaveSystem(saves: SaveInfo[]): SaveSystem {
  return {
    getAllSaves: vi.fn(() => saves),
    getSave: vi.fn(() => null)
  } as unknown as SaveSystem
}

describe('StartMenuManager', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  it('opens world config from the new save button and starts in the first empty slot', () => {
    const saveSystem = createSaveSystem([
      createSaveInfo(0, true),
      createSaveInfo(1, false),
      createSaveInfo(2, false)
    ])
    const menu = new StartMenuManager(saveSystem)
    const onStart = vi.fn()
    menu.onStart = onStart

    menu.showStartMenu()
    getButtonByText('新建存档').click()

    expect(document.body.textContent).toContain('世界生成配置')

    getButtonByText('开始游戏').click()

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0][1]).toBe(1)
    expect(onStart.mock.calls[0][0].seed).toHaveLength(8)
  })

  it('chooses a valid slot when world config is opened directly', () => {
    const saveSystem = createSaveSystem([
      createSaveInfo(0, true),
      createSaveInfo(1, false),
      createSaveInfo(2, false)
    ])
    const menu = new StartMenuManager(saveSystem)
    const onStart = vi.fn()
    menu.onStart = onStart

    menu.showWorldConfig('FIXEDSEED')
    getButtonByText('开始游戏').click()

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart.mock.calls[0][1]).toBe(1)
    expect(onStart.mock.calls[0][0].seed).toBe('FIXEDSEED')
  })
})

function getButtonByText(text: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === text
  )
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${text}`)
  }
  return button
}
