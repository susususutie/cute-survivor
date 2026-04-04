import * as THREE from 'three'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private bgmOscillator: OscillatorNode | null = null
  private isMuted = false

  constructor() {
    this.initContext()
  }

  private initContext(): void {
    document.addEventListener('click', () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        this.createMixer()
      }
    }, { once: true })
  }

  private createMixer(): void {
    if (!this.audioContext) return

    this.sfxGain = this.audioContext.createGain()
    this.sfxGain.gain.value = 0.3
    this.sfxGain.connect(this.audioContext.destination)

    this.bgmGain = this.audioContext.createGain()
    this.bgmGain.gain.value = 0.15
    this.bgmGain.connect(this.audioContext.destination)
  }

  playShoot(): void {
    if (!this.audioContext || !this.sfxGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(220, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1)

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.15)
  }

  playHit(): void {
    if (!this.audioContext || !this.sfxGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.08)

    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.1)
  }

  playPickup(): void {
    if (!this.audioContext || !this.sfxGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1)

    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }

  playEnemyAttack(): void {
    if (!this.audioContext || !this.sfxGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.15)

    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }

  startBGM(): void {
    if (!this.audioContext || !this.bgmGain || this.bgmOscillator) return

    const notes = [220, 261, 329, 261, 220, 196, 220, 261]
    let noteIndex = 0
    const noteLength = 0.4

    const playNote = () => {
      if (!this.audioContext || !this.bgmGain || this.isMuted) return

      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.type = 'triangle'
      osc.frequency.value = notes[noteIndex]

      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.05)
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + noteLength)

      osc.connect(gain)
      gain.connect(this.bgmGain)

      osc.start()
      osc.stop(this.audioContext.currentTime + noteLength)

      noteIndex = (noteIndex + 1) % notes.length
      if (!this.isMuted) {
        setTimeout(playNote, noteLength * 1000)
      }
    }

    playNote()
  }

  stopBGM(): void {
    if (this.bgmOscillator) {
      this.bgmOscillator.stop()
      this.bgmOscillator = null
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.15
    }
    return this.isMuted
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.15
    }
  }
}
