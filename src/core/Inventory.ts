import { ItemType } from '../systems/ItemSystem'

export interface InventorySlot {
  type: ItemType
  quantity: number
}

export interface EquipmentSlot {
  weapon: ItemType | null
  armor: ItemType | null
}

const MAX_CAPACITY = 20

export class Inventory {
  private items: Map<ItemType, number>
  private capacity: number
  private equipment: EquipmentSlot

  constructor(capacity: number = MAX_CAPACITY) {
    this.items = new Map()
    this.capacity = capacity
    this.equipment = { weapon: null, armor: null }
    this.initItems()
  }

  private initItems(): void {
    Object.values(ItemType).forEach((type) => {
      this.items.set(type, 0)
    })
  }

  addItem(type: ItemType, quantity: number): boolean {
    const current = this.items.get(type) ?? 0
    // If adding to a new type (currently 0), check capacity
    if (current === 0 && this.isFull()) {
      return false
    }
    const newTotal = current + quantity
    this.items.set(type, newTotal)
    return true
  }

  removeItem(type: ItemType, quantity: number): boolean {
    const current = this.items.get(type) ?? 0
    if (current < quantity) {
      return false
    }
    this.items.set(type, current - quantity)
    return true
  }

  getItemCount(type: ItemType): number {
    return this.items.get(type) ?? 0
  }

  hasItem(type: ItemType, quantity = 1): boolean {
    return (this.items.get(type) ?? 0) >= quantity
  }

  isFull(): boolean {
    let total = 0
    this.items.forEach((count) => {
      total += count
    })
    return total >= this.capacity
  }

  getTotalItemCount(): number {
    let total = 0
    this.items.forEach((count) => {
      total += count
    })
    return total
  }

  getCapacity(): number {
    return this.capacity
  }

  setEquipment(slot: keyof EquipmentSlot, type: ItemType | null): void {
    this.equipment[slot] = type
  }

  getEquipment(slot: keyof EquipmentSlot): ItemType | null {
    return this.equipment[slot]
  }

  getAllItems(): Map<ItemType, number> {
    return new Map(this.items)
  }

  serialize(): { items: [string, number][]; equipment: EquipmentSlot } {
    const items: [string, number][] = []
    this.items.forEach((value, key) => {
      items.push([key, value])
    })
    return { items, equipment: this.equipment }
  }

  static deserialize(data: { items: [string, number][]; equipment: EquipmentSlot }): Inventory {
    const inv = new Inventory()
    data.items.forEach(([key, value]) => {
      inv.items.set(key as ItemType, value)
    })
    inv.equipment = data.equipment
    return inv
  }
}
