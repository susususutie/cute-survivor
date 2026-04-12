/**
 * Node.js CLI entry point for the game.
 * Allows running game logic without browser dependencies (no THREE.js, no DOM).
 *
 * Usage:
 *   pnpm node dist/main-node.js
 *   pnpm node dist/main-node.js --ticks 60  # Run 60 ticks then print state
 *   pnpm node dist/main-node.js --test      # Run built-in test scenarios
 */

import type { GameDependencies } from './core/logic/dependencies'
import { updateGame } from './core/logic/GameLogic'
import { createInitialGameState } from './core/GameState'
import { createDeterministicTimeSource, createNodeInputSource, createRandomSource, NodeChunkLoader, MemoryStorage } from './core/dependencies'
import type { NodeInputSource } from './core/dependencies'
import { WeaponType } from './core/Weapon'
import type { InputSnapshot, GameLogicState } from './core/logic/types'

// ============================================================================
// Game Runner for Node.js
// ============================================================================

export class NodeGameRunner {
  private state: GameLogicState
  private deps: GameDependencies
  private inputSource: NodeInputSource
  private timeSource: ReturnType<typeof createDeterministicTimeSource>
  private randomSource: ReturnType<typeof createRandomSource>
  private chunkLoader: NodeChunkLoader
  private isRunning = false
  private tickCount = 0
  private maxTicks: number | null = null

  constructor(seed?: string) {
    const worldSeed = seed ?? 'NODE_TEST'

    // Initialize dependencies
    this.timeSource = createDeterministicTimeSource(1 / 60) // 60 FPS
    this.randomSource = createRandomSource(Date.now())
    this.inputSource = createNodeInputSource()
    this.chunkLoader = new NodeChunkLoader(worldSeed)

    // Initialize game state using GameLogicState type (compatible with GameState + extra fields)
    const initialState = createInitialGameState(worldSeed, WeaponType.Pistol)
    this.state = {
      ...initialState,
      enemies: [] as GameLogicState['enemies'],
      items: [] as GameLogicState['items'],
      bullets: initialState.bullets as GameLogicState['bullets'],
      enemyBullets: [],
      enemySpawnTimer: 0,
      saveTimer: 0,
      isGameOver: false
    }

    // Create dependencies object for game logic
    this.deps = {
      time: this.timeSource,
      random: this.randomSource,
      chunkLoader: this.chunkLoader
    }
  }

  /**
   * Set input source (allows programmatic input)
   */
  setInputSource(input: NodeInputSource): void {
    this.inputSource = input
  }

  /**
   * Run a specific number of ticks
   */
  setMaxTicks(max: number): void {
    this.maxTicks = max
  }

  /**
   * Simulate pressing a movement key
   */
  pressKey(key: 'w' | 'a' | 's' | 'd' | 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright'): void {
    this.inputSource.pressKey(key)
  }

  /**
   * Release a movement key
   */
  releaseKey(key: string): void {
    this.inputSource.releaseKey(key)
  }

  /**
   * Simulate mouse click (attack)
   */
  mouseClick(): void {
    this.inputSource.pressMouse()
    this.inputSource.releaseMouse()
  }

  /**
   * Get current game state
   */
  getState(): GameLogicState {
    return this.state
  }

  /**
   * Get current tick count
   */
  getTickCount(): number {
    return this.tickCount
  }

  /**
   * Run one game tick
   */
  tick(): boolean {
    if (this.state.isGameOver) {
      return false
    }

    const input = this.buildInputSnapshot()
    this.state = updateGame(
      this.state,
      input,
      this.timeSource.deltaTime,
      this.deps
    )

    this.tickCount++
    return !this.state.isGameOver
  }

  /**
   * Run the game loop
   */
  run(): void {
    this.isRunning = true

    while (this.isRunning) {
      if (!this.tick()) {
        break
      }

      if (this.maxTicks !== null && this.tickCount >= this.maxTicks) {
        break
      }
    }
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false
  }

  private buildInputSnapshot(): InputSnapshot {
    const input = this.inputSource.getState()
    const moveDir = this.inputSource.getMovementDirection()

    return {
      moveX: moveDir.x,
      moveZ: moveDir.z,
      fire: input.mouse.down,
      fireDirX: 0,
      fireDirZ: -1 // Default firing forward
    }
  }
}

// ============================================================================
// Save System for Node.js
// ============================================================================

export class NodeSaveSystem {
  private storage: MemoryStorage

  constructor() {
    this.storage = new MemoryStorage()
  }

  saveGame(slotIndex: number, data: object): boolean {
    try {
      const key = `cute_survivor_save_${slotIndex}`
      this.storage.setItem(key, JSON.stringify({
        version: '1.1.0',
        timestamp: Date.now(),
        ...data
      }))
      return true
    } catch {
      return false
    }
  }

  loadGame(slotIndex: number): object | null {
    const key = `cute_survivor_save_${slotIndex}`
    const data = this.storage.getItem(key)
    if (!data) return null
    try {
      return JSON.parse(data) as object
    } catch {
      return null
    }
  }

  deleteGame(slotIndex: number): boolean {
    const key = `cute_survivor_save_${slotIndex}`
    this.storage.removeItem(key)
    return true
  }

  hasGame(slotIndex: number): boolean {
    const key = `cute_survivor_save_${slotIndex}`
    return this.storage.getItem(key) !== null
  }

  getAllSaves(): { slotIndex: number; timestamp: number }[] {
    const saves: { slotIndex: number; timestamp: number }[] = []
    for (let i = 0; i < 6; i++) {
      const data = this.loadGame(i)
      if (data && typeof data === 'object' && 'timestamp' in data) {
        saves.push({ slotIndex: i, timestamp: (data as { timestamp: number }).timestamp })
      }
    }
    return saves
  }
}

// ============================================================================
// Test Scenarios
// ============================================================================

function runTestScenarios(): void {
  console.warn('=== Node.js Game Logic Tests ===\n')

  // Test 1: Basic initialization
  console.warn('Test 1: Basic Initialization')
  const runner1 = new NodeGameRunner('TEST_SEED_1')
  const state1 = runner1.getState()
  console.warn(`  Player HP: ${state1.player.hp}`)
  console.warn(`  Player Position: (${state1.player.position.x}, ${state1.player.position.y}, ${state1.player.position.z})`)
  console.warn(`  Initial State: ${state1.player.hp === 100 ? 'PASS' : 'FAIL'}`)

  // Test 2: Forward movement simulation
  console.warn('\nTest 2: Forward Movement (W key)')
  const runner2 = new NodeGameRunner('TEST_SEED_2')
  runner2.pressKey('w')
  runner2.setMaxTicks(60) // 1 second at 60fps
  runner2.run()
  const state2 = runner2.getState()
  console.warn(`  Position after moving forward: (${state2.player.position.x.toFixed(2)}, ${state2.player.position.z.toFixed(2)})`)
  console.warn(`  Movement detected: ${state2.player.position.z < 0 ? 'PASS' : 'FAIL'}`)

  // Test 3: Backward movement simulation
  console.warn('\nTest 3: Backward Movement (S key)')
  const runner3 = new NodeGameRunner('TEST_SEED_3')
  runner3.pressKey('s')
  runner3.setMaxTicks(60)
  runner3.run()
  const state3 = runner3.getState()
  console.warn(`  Position after moving backward: (${state3.player.position.x.toFixed(2)}, ${state3.player.position.z.toFixed(2)})`)
  console.warn(`  Movement detected: ${state3.player.position.z > 0 ? 'PASS' : 'FAIL'}`)

  // Test 4: Left movement simulation
  console.warn('\nTest 4: Left Movement (A key)')
  const runner4 = new NodeGameRunner('TEST_SEED_4')
  runner4.pressKey('a')
  runner4.setMaxTicks(60)
  runner4.run()
  const state4 = runner4.getState()
  console.warn(`  Position after moving left: (${state4.player.position.x.toFixed(2)}, ${state4.player.position.z.toFixed(2)})`)
  console.warn(`  Movement detected: ${state4.player.position.x < 0 ? 'PASS' : 'FAIL'}`)

  // Test 5: Right movement simulation
  console.warn('\nTest 5: Right Movement (D key)')
  const runner5 = new NodeGameRunner('TEST_SEED_5')
  runner5.pressKey('d')
  runner5.setMaxTicks(60)
  runner5.run()
  const state5 = runner5.getState()
  console.warn(`  Position after moving right: (${state5.player.position.x.toFixed(2)}, ${state5.player.position.z.toFixed(2)})`)
  console.warn(`  Movement detected: ${state5.player.position.x > 0 ? 'PASS' : 'FAIL'}`)

  // Test 6: Game loop stability
  console.warn('\nTest 6: Game Loop Stability (100 ticks, no input)')
  const runner6 = new NodeGameRunner('TEST_SEED_6')
  runner6.setMaxTicks(100)
  runner6.run()
  const state6 = runner6.getState()
  console.warn(`  State after 100 ticks: ${!state6.isGameOver ? 'PASS' : 'FAIL'}`)
  console.warn(`  Player HP: ${state6.player.hp}`)

  // Test 7: Extended game loop stability
  console.warn('\nTest 7: Extended Game Loop (600 ticks, no input)')
  const runner7 = new NodeGameRunner('TEST_SEED_7')
  runner7.setMaxTicks(600) // 10 seconds
  runner7.run()
  const state7 = runner7.getState()
  console.warn(`  State after 600 ticks: ${!state7.isGameOver ? 'PASS' : 'FAIL'}`)
  console.warn(`  Player HP: ${state7.player.hp}`)
  console.warn(`  Enemies spawned: ${state7.enemies.length}`)

  // Test 8: Diagonal movement
  console.warn('\nTest 8: Diagonal Movement (W+D keys)')
  const runner8 = new NodeGameRunner('TEST_SEED_8')
  runner8.pressKey('w')
  runner8.pressKey('d')
  runner8.setMaxTicks(60)
  runner8.run()
  const state8 = runner8.getState()
  console.warn(`  Position after diagonal movement: (${state8.player.position.x.toFixed(2)}, ${state8.player.position.z.toFixed(2)})`)
  // Both x and z should be negative (moving forward-right)
  console.warn(`  Diagonal movement: ${state8.player.position.x > 0 && state8.player.position.z < 0 ? 'PASS' : 'FAIL'}`)

  // Test 9: Save/Load system
  console.warn('\nTest 9: Save/Load System')
  const saveSystem = new NodeSaveSystem()
  const testData = {
    player: { hp: 50, position: { x: 10, y: 0, z: 20 } },
    resources: { gold: 100 }
  }
  const saveResult = saveSystem.saveGame(0, testData)
  console.warn(`  Save result: ${saveResult ? 'PASS' : 'FAIL'}`)
  const loadedData = saveSystem.loadGame(0) as typeof testData | null
  console.warn(`  Load result: ${loadedData?.player?.hp === 50 ? 'PASS' : 'FAIL'}`)

  // Test 10: Multiple save slots
  console.warn('\nTest 10: Multiple Save Slots')
  const saveSystem2 = new NodeSaveSystem()
  saveSystem2.saveGame(0, { data: 'slot 0' })
  saveSystem2.saveGame(1, { data: 'slot 1' })
  saveSystem2.saveGame(2, { data: 'slot 2' })
  const saves = saveSystem2.getAllSaves()
  console.warn(`  Multiple saves created: ${saves.length === 3 ? 'PASS' : 'FAIL'}`)

  // Test 11: Delete save
  console.warn('\nTest 11: Delete Save')
  const saveSystem3 = new NodeSaveSystem()
  saveSystem3.saveGame(0, { data: 'test' })
  console.warn(`  Has save before delete: ${saveSystem3.hasGame(0) ? 'PASS' : 'FAIL'}`)
  saveSystem3.deleteGame(0)
  console.warn(`  Has save after delete: ${!saveSystem3.hasGame(0) ? 'PASS' : 'FAIL'}`)

  console.warn('\n=== All Tests Complete ===')
}

// ============================================================================
// CLI Interface
// ============================================================================

function parseArgs(): { ticks: number | null; test: boolean } {
  const args = process.argv.slice(2)
  const result = { ticks: null as number | null, test: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ticks' && i + 1 < args.length) {
      result.ticks = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--test') {
      result.test = true
    }
  }

  return result
}

function main(): void {
  const { ticks, test } = parseArgs()

  if (test) {
    runTestScenarios()
    return
  }

  console.warn('=== Cute Survivor - Node.js Mode ===\n')

  const runner = new NodeGameRunner()
  runner.setMaxTicks(ticks ?? 60)

  console.warn(`Running ${ticks ?? 60} ticks...`)
  runner.run()

  const state = runner.getState()
  console.warn('\nFinal State:')
  console.warn(`  Tick Count: ${runner.getTickCount()}`)
  console.warn(`  Player HP: ${state.player.hp}/${state.player.maxHp}`)
  console.warn(`  Player Position: (${state.player.position.x.toFixed(2)}, ${state.player.position.y.toFixed(2)}, ${state.player.position.z.toFixed(2)})`)
  console.warn(`  Player Rotation: ${state.player.rotation.toFixed(2)}`)
  console.warn(`  Gold: ${state.resources.gold}`)
  console.warn(`  Ammo: ${state.combat.ammo}/${state.combat.maxAmmo}`)
  console.warn(`  Enemies: ${state.enemies.length}`)
  console.warn(`  Items: ${state.items.length}`)
  console.warn(`  Game Over: ${state.isGameOver}`)
}

// Run if executed directly
main()
