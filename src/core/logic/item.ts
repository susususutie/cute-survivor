/**
 * Pure item / loot functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

import { ITEM_TYPE, type Vector3, type LogicItemState, type PlayerLogicState, type GameLogicState, type ItemType } from './types'
import { isWithinRange } from './physics'
import type { IRandomSource } from './dependencies'

// ---------------------------------------------------------------------------
// Drop logic
// ---------------------------------------------------------------------------

/**
 * Returns true when an item should drop at the given position.
 * Uses the injected random source so the result is deterministic.
 *
 * @param dropChance  Value in [0, 1]. 1 = always drop, 0 = never.
 * @param random      Injected random source.
 */
export function shouldDropItem(dropChance: number, random: IRandomSource): boolean {
  return random.next() < dropChance
}

// ---------------------------------------------------------------------------
// Item creation
// ---------------------------------------------------------------------------

/** The set of item types that can drop from killed enemies. */
const DROPPABLE_ITEMS: ItemType[] = [
  ITEM_TYPE.Gold,
  ITEM_TYPE.Ammo,
  ITEM_TYPE.Herb,
  ITEM_TYPE.Ore,
  ITEM_TYPE.LightAmmo,
  ITEM_TYPE.HeavyAmmo,
  ITEM_TYPE.HealthPotion
]

/** Default drop values per item type. */
const DEFAULT_VALUES: Record<ItemType, number> = {
  [ITEM_TYPE.Gold]:         10,
  [ITEM_TYPE.Herb]:          5,
  [ITEM_TYPE.Ore]:           8,
  [ITEM_TYPE.Ammo]:         15,
  [ITEM_TYPE.Gunpowder]:     3,
  [ITEM_TYPE.LightAmmo]:    12,
  [ITEM_TYPE.HeavyAmmo]:     6,
  [ITEM_TYPE.HealthPotion]: 25,
  [ITEM_TYPE.SpeedPotion]:   5
}

/**
 * Creates an ItemState for a dropped pick-up.
 *
 * @param position  World position of the drop.
 * @param itemType  Which item to create.
 * @param quality   Quality multiplier applied to the base value (1 = normal).
 * @param id        Unique ID for this item instance.
 * @param random    Injected random source (used for value variance).
 */
export function createDroppedItem(
  position: Vector3,
  itemType: ItemType,
  quality: number,
  id: string,
  random: IRandomSource
): LogicItemState {
  const baseValue = DEFAULT_VALUES[itemType] ?? 1
  // ±20 % variance
  const variance = 1 + (random.next() - 0.5) * 0.4
  const value = Math.max(1, Math.round(baseValue * quality * variance))

  return {
    id,
    type: itemType,
    position: { ...position },
    value,
    quality
  }
}

/**
 * Picks a random droppable item type from the pool.
 */
export function pickRandomItemType(random: IRandomSource): ItemType {
  return random.pick(DROPPABLE_ITEMS)
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

const COLLECT_RADIUS = 1.5

/**
 * Returns true when the player is close enough to collect the item.
 */
export function canCollectItem(player: PlayerLogicState, item: LogicItemState): boolean {
  return isWithinRange(player.position, item.position, COLLECT_RADIUS)
}

/**
 * Applies a collected item's effect to the game state.
 * Returns a new GameLogicState with the item removed and resources updated.
 * Never mutates the input state.
 */
export function collectItem(
  state: GameLogicState,
  itemId: string
): GameLogicState {
  const item = state.items.find((i) => i.id === itemId)
  if (!item) return state

  const newItems = state.items.filter((i) => i.id !== itemId)

  let newResources = { ...state.resources }
  let newCombat = { ...state.combat }
  let newPlayer = { ...state.player }

  switch (item.type) {
    case ITEM_TYPE.Gold:
      newResources = { ...newResources, gold: newResources.gold + item.value }
      break
    case ITEM_TYPE.Herb:
      newResources = { ...newResources, herbs: newResources.herbs + item.value }
      break
    case ITEM_TYPE.Ore:
      newResources = { ...newResources, ores: newResources.ores + item.value }
      break
    case ITEM_TYPE.Gunpowder:
      newResources = { ...newResources, gunpowder: newResources.gunpowder + item.value }
      break
    case ITEM_TYPE.Ammo:
    case ITEM_TYPE.LightAmmo:
      newCombat = {
        ...newCombat,
        ammo: Math.min(newCombat.ammo + item.value, newCombat.maxAmmo)
      }
      if (item.type === ITEM_TYPE.LightAmmo) {
        newResources = { ...newResources, lightAmmo: newResources.lightAmmo + item.value }
      }
      break
    case ITEM_TYPE.HeavyAmmo:
      newResources = { ...newResources, heavyAmmo: newResources.heavyAmmo + item.value }
      break
    case ITEM_TYPE.HealthPotion:
      newPlayer = {
        ...newPlayer,
        hp: Math.min(newPlayer.hp + item.value, newPlayer.maxHp)
      }
      break
    case ITEM_TYPE.SpeedPotion:
      // Speed boost is ephemeral and tracked by the render layer;
      // nothing to update in the pure state.
      break
  }

  return {
    ...state,
    player: newPlayer,
    resources: newResources,
    combat: newCombat,
    items: newItems
  }
}
