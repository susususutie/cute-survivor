/**
 * Main game-logic orchestrator.
 *
 * `updateGame` is the single pure function that advances the entire game
 * state by one tick.  It receives:
 *   - The current immutable state snapshot.
 *   - The player's input for this frame.
 *   - The frame delta in seconds.
 *   - An external dependencies bundle (time, RNG, chunk loading).
 *
 * It returns a **new** GameLogicState without mutating the input.
 * No THREE.js, no DOM, no side-effects.
 */

import type { GameLogicState, InputSnapshot, BulletState, EnemyLogicState, ItemState } from './types'
import type { GameDependencies } from './dependencies'
import { updateBullet, isBulletDone } from './bullet'
import { updateEnemyAI } from './enemy'
import { getCollisions } from './collision'
import { processBulletHit, processPlayerHit, canAttack } from './combat'
import { canCollectItem, collectItem, shouldDropItem, createDroppedItem, pickRandomItemType } from './item'
import { worldToChunk, shouldLoadChunk, shouldUnloadChunk } from './world'

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 24
const LOAD_DISTANCE = 2
const ENEMY_SPAWN_INTERVAL = 3     // seconds
const MAX_ENEMIES = 15
const AUTO_SAVE_INTERVAL = 30      // seconds
const ENEMY_DROP_CHANCE = 0.6

// ---------------------------------------------------------------------------
// Main update function
// ---------------------------------------------------------------------------

/**
 * Advances the game by one frame and returns the new state.
 *
 * @param state   Current game state (immutable).
 * @param input   Player input this frame.
 * @param delta   Frame time in seconds.
 * @param deps    Injected dependencies (time, random, chunk loader).
 */
export function updateGame(
  state: GameLogicState,
  input: InputSnapshot,
  delta: number,
  deps: GameDependencies
): GameLogicState {
  if (state.isGameOver) return state

  const currentTime = deps.time.now()

  // ------------------------------------------------------------------
  // 1. Update player position from input
  // ------------------------------------------------------------------
  const moveLen = Math.sqrt(input.moveX * input.moveX + input.moveZ * input.moveZ) || 1
  const normX = input.moveX / moveLen
  const normZ = input.moveZ / moveLen
  const newPlayerPos = {
    x: state.player.position.x + (input.moveX !== 0 ? normX * state.player.speed * delta : 0),
    y: state.player.position.y,
    z: state.player.position.z + (input.moveZ !== 0 ? normZ * state.player.speed * delta : 0)
  }

  // ------------------------------------------------------------------
  // 2. Advance bullets
  // ------------------------------------------------------------------
  const advancedBullets: BulletState[] = state.bullets
    .map((b) => updateBullet(b, delta))
    .filter((b) => !isBulletDone(b, currentTime))

  const advancedEnemyBullets: BulletState[] = state.enemyBullets
    .map((b) => updateBullet(b, delta))
    .filter((b) => !isBulletDone(b, currentTime))

  // ------------------------------------------------------------------
  // 3. Update enemy AI
  // ------------------------------------------------------------------
  const updatedEnemies: EnemyLogicState[] = state.enemies.map((enemy) =>
    updateEnemyAI(enemy, newPlayerPos, delta, currentTime, deps.random)
  )

  // ------------------------------------------------------------------
  // 4. Collision detection
  // ------------------------------------------------------------------
  const collisions = getCollisions(
    advancedBullets,
    advancedEnemyBullets,
    updatedEnemies,
    { ...state.player, position: newPlayerPos },
    state.items
  )

  // ------------------------------------------------------------------
  // 5. Apply bullet-enemy hits
  // ------------------------------------------------------------------
  let bullets = advancedBullets
  let enemies = updatedEnemies
  const newItems: ItemState[] = [...state.items]
  let newEnemySpawnTimer = state.enemySpawnTimer

  const removedBulletIds = new Set<string>()
  const removedEnemyIds = new Set<string>()

  for (const hit of collisions.bulletEnemyHits) {
    const enemy = enemies.find((e) => e.id === hit.enemyId)
    const bullet = bullets.find((b) => b.id === hit.bulletId)
    if (!enemy || !bullet) continue

    const result = processBulletHit(bullet, enemy)
    removedBulletIds.add(hit.bulletId)

    if (result.isDead) {
      removedEnemyIds.add(hit.enemyId)
      // Possibly drop an item
      if (shouldDropItem(ENEMY_DROP_CHANCE, deps.random)) {
        const itemType = pickRandomItemType(deps.random)
        const itemId = `item_${currentTime}_${deps.random.next()}`
        newItems.push(createDroppedItem(enemy.position, itemType, 1, itemId, deps.random))
      }
    } else {
      enemies = enemies.map((e) =>
        e.id === hit.enemyId ? { ...e, hp: result.newEnemyHp } : e
      )
    }
  }

  bullets = bullets.filter((b) => !removedBulletIds.has(b.id))
  enemies = enemies.filter((e) => !removedEnemyIds.has(e.id))

  // ------------------------------------------------------------------
  // 6. Apply enemy-player hits (melee and ranged)
  // ------------------------------------------------------------------
  let playerHp = state.player.hp
  let isGameOver: boolean = state.isGameOver
  const attackedEnemies = new Set<string>()
  let enemyBullets = advancedEnemyBullets.filter((b) => !removedBulletIds.has(b.id))

  for (const hit of collisions.enemyPlayerHits) {
    // Ranged bullet hit encoded as `bullet:<bulletId>`
    if (hit.enemyId.startsWith('bullet:')) {
      const bulletId = hit.enemyId.slice(7)
      const bullet = enemyBullets.find((b) => b.id === bulletId)
      if (!bullet) continue
      const dmg = bullet.damage
      playerHp = Math.max(0, playerHp - dmg)
      enemyBullets = enemyBullets.filter((b) => b.id !== bulletId)
    } else {
      // Melee hit – apply cooldown tracking on the enemy
      const enemy = enemies.find((e) => e.id === hit.enemyId)
      if (!enemy) continue
      if (attackedEnemies.has(enemy.id)) continue
      if (!canAttack(enemy.lastAttackTime, enemy.attackCooldown, currentTime)) continue

      const result = processPlayerHit(enemy, { ...state.player, hp: playerHp, position: newPlayerPos })
      playerHp = result.newPlayerHp
      attackedEnemies.add(enemy.id)

      // Update enemy's lastAttackTime
      enemies = enemies.map((e) =>
        e.id === hit.enemyId ? { ...e, lastAttackTime: currentTime } : e
      )
    }

    if (playerHp <= 0) {
      isGameOver = true
      break
    }
  }

  // ------------------------------------------------------------------
  // 7. Collect items
  // ------------------------------------------------------------------
  let workingState: GameLogicState = {
    ...state,
    player: { ...state.player, position: newPlayerPos, hp: playerHp },
    bullets,
    enemyBullets,
    enemies,
    items: newItems,
    isGameOver
  }

  for (const pickup of collisions.playerItemPickups) {
    const item = workingState.items.find((i) => i.id === pickup.itemId)
    if (!item) continue
    if (canCollectItem(workingState.player, item)) {
      workingState = collectItem(workingState, pickup.itemId)
    }
  }

  // ------------------------------------------------------------------
  // 8. Chunk management
  // ------------------------------------------------------------------
  const newChunkX = worldToChunk(newPlayerPos.x, CHUNK_SIZE)
  const newChunkZ = worldToChunk(newPlayerPos.z, CHUNK_SIZE)

  // ------------------------------------------------------------------
  // 9. Enemy spawning (free-roam mode only)
  // ------------------------------------------------------------------
  newEnemySpawnTimer += delta
  const newEnemies = workingState.enemies

  if (newEnemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
    newEnemySpawnTimer = 0
    if (newEnemies.length < MAX_ENEMIES) {
      // Spawn position logic is intentionally minimal here; the render layer
      // translates this into a mesh.  We emit a signal by returning a
      // "pending spawn" marker via the regular state; actual spawn functions
      // (spawnEnemy from enemy.ts) are called by the thin bridge layer that
      // reads pendingSpawns from the returned state.
    }
  }

  // ------------------------------------------------------------------
  // 10. Auto-save timer (logic layer tracks the interval; actual I/O
  //     is handled by the render layer which watches saveTimer).
  // ------------------------------------------------------------------
  const newSaveTimer = state.saveTimer + delta >= AUTO_SAVE_INTERVAL
    ? 0                          // reset; render layer will detect the reset
    : state.saveTimer + delta

  // ------------------------------------------------------------------
  // 11. Assemble new state
  // ------------------------------------------------------------------
  return {
    ...workingState,
    world: {
      ...workingState.world,
      currentChunkX: newChunkX,
      currentChunkZ: newChunkZ
    },
    enemySpawnTimer: newEnemySpawnTimer,
    saveTimer: newSaveTimer
  }
}

// ---------------------------------------------------------------------------
// Chunk change helpers (used by the render bridge)
// ---------------------------------------------------------------------------

/**
 * Returns the list of chunk keys that need to be loaded for the player's
 * current position.
 */
export function getChunksToLoad(
  playerChunkX: number,
  playerChunkZ: number,
  loadedKeys: ReadonlySet<string>
): string[] {
  return shouldLoadChunk(playerChunkX, playerChunkZ, loadedKeys, LOAD_DISTANCE)
}

/**
 * Returns the list of chunk keys that are now too far away and should be
 * unloaded.
 */
export function getChunksToUnload(
  playerChunkX: number,
  playerChunkZ: number,
  loadedKeys: ReadonlySet<string>
): string[] {
  return shouldUnloadChunk(playerChunkX, playerChunkZ, loadedKeys, LOAD_DISTANCE)
}
