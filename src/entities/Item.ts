import type { Vector3 } from './Player'

export type ItemType =
  | 'gold'
  | 'herb'
  | 'ore'
  | 'ammo'
  | 'gunpowder'
  | 'light_ammo'
  | 'heavy_ammo'
  | 'health_potion'
  | 'speed_potion'

export interface ItemState {
  id: string
  type: ItemType
  position: Vector3
  rotation: number
  stackCount: number
  quality: number
  price: number
  isCollected: boolean
  value: number
}

const ITEM_VALUES: Record<ItemType, number> = {
  gold: 10,
  herb: 5,
  ore: 8,
  ammo: 15,
  gunpowder: 3,
  light_ammo: 2,
  heavy_ammo: 5,
  health_potion: 25,
  speed_potion: 5
}

const ITEM_PRICES: Record<ItemType, number> = {
  gold: 10,
  herb: 5,
  ore: 8,
  ammo: 15,
  gunpowder: 3,
  light_ammo: 2,
  heavy_ammo: 5,
  health_potion: 25,
  speed_potion: 5
}

const ITEM_QUALITY_RANGES: Record<ItemType, [number, number]> = {
  gold: [0.8, 1.0],
  herb: [0.5, 1.0],
  ore: [0.6, 1.0],
  ammo: [1.0, 1.0],
  gunpowder: [0.7, 1.0],
  light_ammo: [1.0, 1.0],
  heavy_ammo: [1.0, 1.0],
  health_potion: [0.8, 1.0],
  speed_potion: [0.8, 1.0]
}

export function createItem(id: string, type: ItemType, position: Vector3, quality?: number): ItemState {
  const [minQuality, maxQuality] = ITEM_QUALITY_RANGES[type]
  const itemQuality = quality ?? minQuality + Math.random() * (maxQuality - minQuality)

  return {
    id,
    type,
    position: { ...position },
    rotation: Math.random() * Math.PI * 2,
    stackCount: 1,
    quality: itemQuality,
    price: ITEM_PRICES[type],
    isCollected: false,
    value: ITEM_VALUES[type]
  }
}

export function collectItem(state: ItemState): ItemState {
  return {
    ...state,
    isCollected: true
  }
}

export function updateItem(state: ItemState, delta: number): ItemState {
  if (state.isCollected) {
    return state
  }
  return {
    ...state,
    rotation: state.rotation + delta * (1 + Math.random())
  }
}

export function isItemCollected(state: ItemState): boolean {
  return state.isCollected
}

export function getItemValue(state: ItemState): number {
  return Math.floor(state.value * state.quality)
}

export function createItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function getItemsByType(items: ItemState[], type: ItemType): ItemState[] {
  return items.filter((item) => item.type === type && !item.isCollected)
}

export function getItemsInRange(items: ItemState[], position: Vector3, range: number): ItemState[] {
  return items.filter((item) => {
    if (item.isCollected) return false
    const dx = item.position.x - position.x
    const dz = item.position.z - position.z
    return Math.sqrt(dx * dx + dz * dz) < range
  })
}
