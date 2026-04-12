/**
 * Resources state - pure data, no methods.
 */

/** All in-game resource currencies and consumables */
export interface ResourcesState {
  gold: number
  herbs: number
  ores: number
  gunpowder: number
  lightAmmo: number
  heavyAmmo: number
}
