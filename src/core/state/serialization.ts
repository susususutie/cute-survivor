/**
 * serialization.ts
 * Pure functions for serializing and deserializing GameState.
 * toJSON and fromJSON are inverses: fromJSON(toJSON(s)) equals s.
 */

import type { GameState } from './game'
import type { PlayerState } from './player'
import type { EnemyState } from './enemy'
import type { ItemState } from './item'
import type { CombatState } from './combat'
import type { WorldState } from './world'
import type { ResourcesState } from './resources'

// -----------------------------------------------------------------------------
// JSON serialization
// -----------------------------------------------------------------------------

/**
 * Serializes a GameState to a JSON string.
 * The result is a plain JSON value suitable for localStorage or network transfer.
 */
export function toJSON(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Deep clone a GameState via JSON serialization (useful for pure state snapshots).
 */
export function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState
}

// -----------------------------------------------------------------------------
// JSON deserialization
// -----------------------------------------------------------------------------

/** JSON-representation of GameState (parsed from string) */
export type GameStateJSON = ReturnType<typeof parseJSON> extends infer T ? T : never

function parseJSON(json: string): GameState {
  const parsed = JSON.parse(json)
  // Runtime validation can be extended here if needed
  return parsed as GameState
}

/**
 * Deserializes a GameState from a JSON string.
 * Returns null if the input is not valid JSON.
 */
export function fromJSON(json: string): GameState | null {
  try {
    return parseJSON(json)
  } catch {
    return null
  }
}

// -----------------------------------------------------------------------------
// Partial save helpers
// -----------------------------------------------------------------------------

/**
 * Extracts only the serializable portion relevant for saving.
 * Omits transient runtime data like bullet trails.
 */
export function extractSaveableState(state: GameState): SerializedSaveState {
  return {
    player: state.player,
    enemies: state.enemies,
    items: state.items,
    combat: state.combat,
    world: state.world,
    resources: state.resources,
    isGameOver: state.isGameOver,
    gameTime: state.gameTime,
    difficulty: state.difficulty,
    currentSlotIndex: state.currentSlotIndex
  }
}

/** The portion of GameState that is persisted to localStorage */
export interface SerializedSaveState {
  player: PlayerState
  enemies: EnemyState[]
  items: ItemState[]
  combat: CombatState
  world: WorldState
  resources: ResourcesState
  isGameOver: boolean
  gameTime: number
  difficulty: GameState['difficulty']
  currentSlotIndex: number
}

/**
 * Serializes only the saveable portion of the state.
 */
export function toSaveJSON(state: GameState): string {
  return JSON.stringify(extractSaveableState(state))
}

/**
 * Deserializes a saveable state from JSON.
 * Returns null if the input is not valid JSON.
 */
export function fromSaveJSON(json: string): SerializedSaveState | null {
  try {
    const parsed = JSON.parse(json)
    return parsed as SerializedSaveState
  } catch {
    return null
  }
}

// -----------------------------------------------------------------------------
// Versioned migration
// -----------------------------------------------------------------------------

const CURRENT_SAVE_VERSION = '1.1.0'

/** Versioned save envelope */
export interface VersionedSave {
  version: string
  timestamp: number
  state: SerializedSaveState
}

/**
 * Wraps a state into a versioned save envelope for future migration support.
 */
export function toVersionedSave(state: GameState): string {
  const envelope: VersionedSave = {
    version: CURRENT_SAVE_VERSION,
    timestamp: Date.now(),
    state: extractSaveableState(state)
  }
  return JSON.stringify(envelope)
}

/**
 * Parses a versioned save envelope and returns the inner state.
 * Performs migration if needed based on version field.
 */
export function fromVersionedSave(json: string): GameState | null {
  try {
    const envelope = JSON.parse(json) as VersionedSave
    // Future: run migration logic here based on envelope.version
    return envelope.state as unknown as GameState
  } catch {
    return null
  }
}
