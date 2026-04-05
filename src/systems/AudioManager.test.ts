import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioManager } from './AudioManager'

const mockAudioContext = {
  createOscillator: vi.fn().mockReturnValue({
    type: '',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }),
  createGain: vi.fn().mockReturnValue({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  }),
  destination: {},
  currentTime: 0
}

vi.stubGlobal(
  'AudioContext',
  vi.fn(() => mockAudioContext)
)
vi.stubGlobal(
  'webkitAudioContext',
  vi.fn(() => mockAudioContext)
)

describe('AudioManager', () => {
  let audioManager: AudioManager

  beforeEach(() => {
    vi.clearAllMocks()
    audioManager = new AudioManager()
  })

  it('is created without throwing', () => {
    expect(audioManager).toBeDefined()
  })

  it('toggleMute toggles mute state', () => {
    const muted1 = audioManager.toggleMute()
    expect(muted1).toBe(true)

    const muted2 = audioManager.toggleMute()
    expect(muted2).toBe(false)
  })

  it('setMuted sets mute state to true', () => {
    audioManager.setMuted(true)
    const result = audioManager.toggleMute()
    expect(result).toBe(false)
  })

  it('setMuted sets mute state to false', () => {
    audioManager.setMuted(true)
    audioManager.setMuted(false)
    const result = audioManager.toggleMute()
    expect(result).toBe(true)
  })

  it('playShoot does not throw', () => {
    expect(() => audioManager.playShoot()).not.toThrow()
  })

  it('playHit does not throw', () => {
    expect(() => audioManager.playHit()).not.toThrow()
  })

  it('playPickup does not throw', () => {
    expect(() => audioManager.playPickup()).not.toThrow()
  })

  it('playEnemyAttack does not throw', () => {
    expect(() => audioManager.playEnemyAttack()).not.toThrow()
  })

  it('startBGM does not throw', () => {
    expect(() => audioManager.startBGM()).not.toThrow()
  })

  it('stopBGM does not throw', () => {
    expect(() => audioManager.stopBGM()).not.toThrow()
  })

  it('sound methods are silent when muted', () => {
    audioManager.setMuted(true)

    audioManager.playShoot()
    audioManager.playHit()
    audioManager.playPickup()
    audioManager.playEnemyAttack()

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
  })
})
