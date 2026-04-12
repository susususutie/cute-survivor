import { ItemType } from '../systems/ItemSystem'

export interface InventorySlot {
  type: ItemType
  quantity: number
}

export interface EquipmentSlot {
  weapon: ItemType | null
  armor: ItemType | null
}

export interface InventoryState {
  items: Map<ItemType, number>
  capacity: number
  equipment: EquipmentSlot
}

const MAX_CAPACITY = 20

export function createEmptyInventory(): InventoryState {
  const items = new Map<ItemType, number>()
  Object.values(ItemType).forEach((type) => {
    items.set(type, 0)
  })
  return {
    items,
    capacity: MAX_CAPACITY,
    equipment: { weapon: null, armor: null }
  }
}

export class Inventory {
  public state: InventoryState

  constructor(capacity: number = MAX_CAPACITY) {
    this.state = createEmptyInventory()
    this.state.capacity = capacity
  }

  addItem(type: ItemType, quantity: number): boolean {
    const current = this.state.items.get(type) ?? 0
    // If adding to a new type (currently 0), check capacity
    if (current === 0 && this.isFull()) {
      return false
    }
    const newTotal = current + quantity
    this.state.items.set(type, newTotal)
    return true
  }

  removeItem(type: ItemType, quantity: number): boolean {
    const current = this.state.items.get(type) ?? 0
    if (current < quantity) {
      return false
    }
    this.state.items.set(type, current - quantity)
    return true
  }

  getItemCount(type: ItemType): number {
    return this.state.items.get(type) ?? 0
  }

  hasItem(type: ItemType, quantity = 1): boolean {
    return (this.state.items.get(type) ?? 0) >= quantity
  }

  isFull(): boolean {
    let total = 0
    this.state.items.forEach((count) => {
      total += count
    })
    return total >= this.state.capacity
  }

  getTotalItemCount(): number {
    let total = 0
    this.state.items.forEach((count) => {
      total += count
    })
    return total
  }

  getCapacity(): number {
    return this.state.capacity
  }

  setEquipment(slot: keyof EquipmentSlot, type: ItemType | null): void {
    this.state.equipment[slot] = type
  }

  getEquipment(slot: keyof EquipmentSlot): ItemType | null {
    return this.state.equipment[slot]
  }

  getAllItems(): Map<ItemType, number> {
    return new Map(this.state.items)
  }

  serialize(): { items: [string, number][]; equipment: EquipmentSlot } {
    const items: [string, number][] = []
    this.state.items.forEach((value, key) => {
      items.push([key, value])
    })
    return { items, equipment: this.state.equipment }
  }

  static deserialize(data: { items: [string, number][]; equipment: EquipmentSlot }): Inventory {
    const inv = new Inventory()
    data.items.forEach(([key, value]) => {
      inv.state.items.set(key as ItemType, value)
    })
    inv.state.equipment = data.equipment
    return inv
  }
}
