import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

function createMockGain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  }
}

function createMockOscillator() {
  return {
    type: '',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 0
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }
}

function createMockAudioContext() {
  return {
    createOscillator: vi.fn(() => createMockOscillator()),
    createGain: vi.fn(() => createMockGain()),
    destination: {},
    currentTime: 0
  }
}

describe('AudioManager', () => {
  let audioManager: InstanceType<typeof import('./AudioManager').AudioManager>
  let mockCtx: ReturnType<typeof createMockAudioContext>

  beforeEach(async () => {
    mockCtx = createMockAudioContext()

    // Mock window.AudioContext (used by initContext)
    Object.defineProperty(global, 'window', {
      value: {
        AudioContext: vi.fn(() => mockCtx),
        webkitAudioContext: vi.fn(() => mockCtx)
      },
      writable: true
    })

    // Mock document
    Object.defineProperty(global, 'document', {
      value: {
        addEventListener: vi.fn()
      },
      writable: true
    })

    const { AudioManager } = await import('./AudioManager')
    audioManager = new AudioManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** Simulate the click that lazily initializes AudioContext */
  function initAudioContext() {
    document.addEventListener.mock.calls[0][1](new Event('click'))
  }

  // ---- Initialization ----

  describe('Initialization', () => {
    it('should create audio manager without throwing', () => {
      expect(audioManager).toBeDefined()
    })

    it('should register a once click listener', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), {
        once: true
      })
    })

    it('should start with null audio context', () => {
      expect((audioManager as any).audioContext).toBeNull()
    })

    it('should initialize audio context on click', () => {
      initAudioContext()
      expect((audioManager as any).audioContext).toBe(mockCtx)
    })
  })

  // ---- Mute ----

  describe('Mute', () => {
    it('toggleMute returns true then false', () => {
      expect(audioManager.toggleMute()).toBe(true)
      expect(audioManager.toggleMute()).toBe(false)
    })

    it('setMuted(true) then toggleMute returns false', () => {
      audioManager.setMuted(true)
      expect(audioManager.toggleMute()).toBe(false)
    })

    it('setMuted changes isMuted state', () => {
      audioManager.setMuted(true)
      expect(audioManager.toggleMute()).toBe(false)
      audioManager.setMuted(false)
      expect(audioManager.toggleMute()).toBe(true)
    })

    it('toggleMute sets bgmGain to 0 when muted', () => {
      initAudioContext()
      audioManager.toggleMute()
      expect((audioManager as any).bgmGain.gain.value).toBe(0)
    })

    it('toggleMute restores bgmGain to 0.15 when unmuted', () => {
      initAudioContext()
      audioManager.toggleMute() // mute
      audioManager.toggleMute() // unmute
      expect((audioManager as any).bgmGain.gain.value).toBe(0.15)
    })

    it('setMuted sets bgmGain to 0', () => {
      initAudioContext()
      audioManager.setMuted(true)
      expect((audioManager as any).bgmGain.gain.value).toBe(0)
    })

    it('toggleMute does not throw when bgmGain is null', () => {
      expect(() => audioManager.toggleMute()).not.toThrow()
    })
  })

  // ---- Mixer ----

  describe('Mixer', () => {
    beforeEach(() => initAudioContext())

    it('creates sfxGain with value 0.3', () => {
      expect((audioManager as any).sfxGain.gain.value).toBe(0.3)
    })

    it('creates bgmGain with value 0.15', () => {
      expect((audioManager as any).bgmGain.gain.value).toBe(0.15)
    })

    it('connects sfxGain to destination', () => {
      expect((audioManager as any).sfxGain.connect).toHaveBeenCalledWith(mockCtx.destination)
    })

    it('connects bgmGain to destination', () => {
      expect((audioManager as any).bgmGain.connect).toHaveBeenCalledWith(mockCtx.destination)
    })
  })

  // ---- playShoot ----

  describe('playShoot', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('creates oscillator with square wave', () => {
      audioManager.playShoot()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.type).toBe('square')
    })

    it('sets frequency ramp 220 -> 80', () => {
      audioManager.playShoot()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(220, 0)
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(80, 0.1)
    })

    it('sets gain ramp 0.2 -> 0.01', () => {
      audioManager.playShoot()
      const gain = mockCtx.createGain.mock.results[0].value
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 0)
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.1)
    })

    it('connects osc -> gain -> sfxGain', () => {
      audioManager.playShoot()
      const osc = mockCtx.createOscillator.mock.results[0].value
      const gain = mockCtx.createGain.mock.results[0].value
      expect(osc.connect).toHaveBeenCalledWith(gain)
      expect(gain.connect).toHaveBeenCalledWith((audioManager as any).sfxGain)
    })

    it('starts and stops oscillator', () => {
      audioManager.playShoot()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.start).toHaveBeenCalled()
      expect(osc.stop).toHaveBeenCalledWith(0.15)
    })

    it('does nothing when muted', () => {
      audioManager.setMuted(true)
      audioManager.playShoot()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })

    it('does nothing when audioContext is null', () => {
      // Create a fresh manager without initializing audio context
      const freshManager = new (audioManager.constructor as any)()
      freshManager.playShoot()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })
  })

  // ---- playHit ----

  describe('playHit', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('uses sawtooth wave 150 -> 50', () => {
      audioManager.playHit()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.type).toBe('sawtooth')
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(150, 0)
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(50, 0.08)
    })

    it('gain ramp 0.15 -> 0.01', () => {
      audioManager.playHit()
      const gain = mockCtx.createGain.mock.results[0].value
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 0)
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.08)
    })

    it('does nothing when muted', () => {
      audioManager.setMuted(true)
      audioManager.playHit()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })
  })

  // ---- playPickup ----

  describe('playPickup', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('uses sine wave 600 -> 1200', () => {
      audioManager.playPickup()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.type).toBe('sine')
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(600, 0)
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1200, 0.1)
    })

    it('gain ramp 0.15 -> 0.01 over 0.15s', () => {
      audioManager.playPickup()
      const gain = mockCtx.createGain.mock.results[0].value
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 0)
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.15)
    })

    it('does nothing when muted', () => {
      audioManager.setMuted(true)
      audioManager.playPickup()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })
  })

  // ---- playEnemyAttack ----

  describe('playEnemyAttack', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('uses sawtooth wave 100 -> 40', () => {
      audioManager.playEnemyAttack()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.type).toBe('sawtooth')
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(100, 0)
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(40, 0.15)
    })

    it('gain ramp 0.12 -> 0.01', () => {
      audioManager.playEnemyAttack()
      const gain = mockCtx.createGain.mock.results[0].value
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.12, 0)
      expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.15)
    })

    it('does nothing when muted', () => {
      audioManager.setMuted(true)
      audioManager.playEnemyAttack()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })
  })

  // ---- BGM ----

  describe('startBGM', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('creates a triangle-wave oscillator', () => {
      audioManager.startBGM()
      const osc = mockCtx.createOscillator.mock.results[0].value
      expect(osc.type).toBe('triangle')
    })

    it('does not start a second BGM if bgmOscillator is set', () => {
      ;(audioManager as any).bgmOscillator = createMockOscillator()
      audioManager.startBGM()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })

    it('does nothing when muted', () => {
      audioManager.setMuted(true)
      audioManager.startBGM()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })

    it('uses linear ramp for gain envelope', () => {
      audioManager.startBGM()
      const gain = mockCtx.createGain.mock.results[0].value
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0)
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.08, 0.05)
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.4)
    })
  })

  describe('stopBGM', () => {
    it('does not throw when bgmOscillator is null', () => {
      expect(() => audioManager.stopBGM()).not.toThrow()
    })

    it('stops and clears bgmOscillator', () => {
      const mockOsc = { stop: vi.fn() }
      ;(audioManager as any).bgmOscillator = mockOsc

      audioManager.stopBGM()

      expect(mockOsc.stop).toHaveBeenCalled()
      expect((audioManager as any).bgmOscillator).toBeNull()
    })
  })

  // ---- Integration ----

  describe('Integration', () => {
    beforeEach(() => {
      initAudioContext()
      mockCtx.createOscillator.mockClear()
      mockCtx.createGain.mockClear()
    })

    it('plays 4 sfx in sequence without error', () => {
      audioManager.playShoot()
      audioManager.playHit()
      audioManager.playPickup()
      audioManager.playEnemyAttack()
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4)
    })

    it('all sfx are silent when muted', () => {
      audioManager.setMuted(true)
      audioManager.playShoot()
      audioManager.playHit()
      audioManager.playPickup()
      audioManager.playEnemyAttack()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()
    })

    it('sfx resume after unmuting', () => {
      audioManager.setMuted(true)
      audioManager.playShoot()
      expect(mockCtx.createOscillator).not.toHaveBeenCalled()

      audioManager.setMuted(false)
      audioManager.playShoot()
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1)
    })
  })
})
