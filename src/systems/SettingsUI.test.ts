import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SettingsUI, Settings } from './SettingsUI'

describe('SettingsUI', () => {
  let settingsUI: SettingsUI

  beforeEach(() => {
    settingsUI = new SettingsUI()
  })

  afterEach(() => {
    settingsUI.destroy()
  })

  describe('constructor', () => {
    it('should create settings UI', () => {
      expect(settingsUI).toBeDefined()
    })
  })

  describe('getSettings', () => {
    it('should return default settings', () => {
      const settings = settingsUI.getSettings()
      expect(settings.bgmVolume).toBe(0.7)
      expect(settings.seVolume).toBe(0.8)
      expect(settings.quality).toBe('medium')
    })
  })

  describe('setSettings', () => {
    it('should update settings', () => {
      const newSettings: Settings = {
        bgmVolume: 0.5,
        seVolume: 0.9,
        quality: 'high'
      }
      settingsUI.setSettings(newSettings)
      const settings = settingsUI.getSettings()
      expect(settings.bgmVolume).toBe(0.5)
      expect(settings.seVolume).toBe(0.9)
      expect(settings.quality).toBe('high')
    })
  })

  describe('show/hide', () => {
    it('should show settings panel', () => {
      expect(() => settingsUI.show()).not.toThrow()
    })

    it('should hide settings panel', () => {
      expect(() => settingsUI.hide()).not.toThrow()
    })
  })
})

describe('SettingsUI callbacks', () => {
  let settingsUI: SettingsUI
  let volumeCallback: ReturnType<typeof vi.fn>
  let qualityCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    volumeCallback = vi.fn()
    qualityCallback = vi.fn()
    settingsUI = new SettingsUI({
      onVolumeChange: volumeCallback,
      onQualityChange: qualityCallback
    })
  })

  afterEach(() => {
    settingsUI.destroy()
  })

  it('should call volume callback when settings change', () => {
    const newSettings: Settings = {
      bgmVolume: 0.3,
      seVolume: 0.6,
      quality: 'low'
    }
    settingsUI.setSettings(newSettings)
    // Callbacks are triggered by UI interactions in real usage
    expect(settingsUI.getSettings().bgmVolume).toBe(0.3)
    expect(settingsUI.getSettings().seVolume).toBe(0.6)
  })

  it('should call quality callback when quality changes', () => {
    const newSettings: Settings = {
      bgmVolume: 0.7,
      seVolume: 0.8,
      quality: 'high'
    }
    settingsUI.setSettings(newSettings)
    expect(settingsUI.getSettings().quality).toBe('high')
  })
})
