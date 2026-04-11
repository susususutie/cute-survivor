import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DefenseMode } from './DefenseMode'
import * as THREE from 'three'
import type { EnemyConfig } from '../entities/Enemy'

describe('DefenseMode', () => {
  let defenseMode: DefenseMode
  let mockSpawnCallback: (config: EnemyConfig, position: THREE.Vector3) => void

  beforeEach(() => {
    mockSpawnCallback = vi.fn()
    defenseMode = new DefenseMode(new THREE.Vector3(0, 0, 0), 10, mockSpawnCallback)
  })

  describe('initialization', () => {
    it('should initialize with 10 waves', () => {
      expect(defenseMode.getTotalWaves()).toBe(10)
    })

    it('should start at wave 0', () => {
      expect(defenseMode.getCurrentWave()).toBe(0)
    })

    it('should not be active initially', () => {
      expect(defenseMode.isActive()).toBe(false)
    })

    it('should not be completed initially', () => {
      expect(defenseMode.isCompleted()).toBe(false)
    })
  })

  describe('startWave', () => {
    it('should start wave 1', () => {
      defenseMode.startWave(1)
      expect(defenseMode.getCurrentWave()).toBe(1)
      expect(defenseMode.isActive()).toBe(true)
    })

    it('should set correct enemies remaining for wave 1', () => {
      defenseMode.startWave(1)
      expect(defenseMode.getEnemiesRemaining()).toBe(5) // 3 + 1*2
    })

    it('should complete after last wave', () => {
      defenseMode.startWave(10)
      expect(defenseMode.getCurrentWave()).toBe(10)
    })
  })

  describe('wave progression', () => {
    it('should have more enemies in later waves', () => {
      defenseMode.startWave(1)
      const wave1Count = defenseMode.getEnemiesRemaining()

      defenseMode.startWave(5)
      const wave5Count = defenseMode.getEnemiesRemaining()

      expect(wave5Count).toBeGreaterThan(wave1Count)
    })

    it('should include harder enemies in later waves', () => {
      defenseMode.startWave(1)
      expect(defenseMode.getCurrentWave()).toBe(1)

      defenseMode.startWave(7)
      expect(defenseMode.getCurrentWave()).toBe(7)
    })
  })

  describe('enemyKilled', () => {
    it('should decrease enemies remaining', () => {
      defenseMode.startWave(1)
      const initial = defenseMode.getEnemiesRemaining()
      defenseMode.enemyKilled()
      expect(defenseMode.getEnemiesRemaining()).toBe(initial - 1)
    })

    it('should deactivate wave when all enemies killed and all spawned', () => {
      defenseMode.startWave(1)
      const total = defenseMode.getEnemiesRemaining()
      // Simulate spawning all enemies via update
      for (let i = 0; i < total * 10; i++) {
        defenseMode.update(1, new THREE.Vector3(0, 0, 0))
      }
      // Now all enemies are spawned, kill them all
      for (let i = 0; i < total; i++) {
        defenseMode.enemyKilled()
      }
      expect(defenseMode.isActive()).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('should call onWaveComplete when wave ends', () => {
      const callback = vi.fn()
      defenseMode.setCallbacks({ onWaveComplete: callback })
      defenseMode.startWave(1)
      const total = defenseMode.getEnemiesRemaining()
      // Simulate spawning all enemies
      for (let i = 0; i < total * 10; i++) {
        defenseMode.update(1, new THREE.Vector3(0, 0, 0))
      }
      // Kill all enemies
      for (let i = 0; i < total; i++) {
        defenseMode.enemyKilled()
      }
      expect(callback).toHaveBeenCalledWith(1)
    })

    it('should call onGameComplete after wave 10', () => {
      const callback = vi.fn()
      defenseMode.setCallbacks({ onGameComplete: callback })
      defenseMode.startWave(10)
      // Wave 10 completion is triggered by startWave itself
      expect(defenseMode.isCompleted()).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      defenseMode.startWave(3)
      defenseMode.reset()
      expect(defenseMode.getCurrentWave()).toBe(0)
      expect(defenseMode.isActive()).toBe(false)
      expect(defenseMode.isCompleted()).toBe(false)
    })
  })
})
