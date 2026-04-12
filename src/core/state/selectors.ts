/**
 * selectors.ts
 * Pure functions that read derived data from GameState.
 * None of these functions modify the state.
 */

import type { GameState } from './game'
import type { PlayerState } from './player'
import type { EnemyState } from './enemy'
import type { BulletState } from './bullet'
import type { ItemState } from './item'
import type { CombatState } from './combat'
import type { WorldState } from './world'
import type { ResourcesState } from './resources'
import type { Vector3 } from './player'

// -----------------------------------------------------------------------------
// Player selectors
// -----------------------------------------------------------------------------

export function getPlayerPosition(state: GameState): Vector3 {
  return state.player.position
}

export function getPlayerRotation(state: GameState): number {
  return state.player.rotation
}

export function getPlayerVelocity(state: GameState): Vector3 {
  return state.player.velocity
}

export function getPlayerHp(state: GameState): number {
  return state.player.hp
}

export function getPlayerMaxHp(state: GameState): number {
  return state.player.maxHp
}

export function getPlayerSpeed(state: GameState): number {
  return state.player.speed
}

export function getPlayerAttackPower(state: GameState): number {
  return state.player.attackPower
}

export function getPlayerDefense(state: GameState): number {
  return state.player.defense
}

export function getPlayerInventory(state: GameState): PlayerState['inventory'] {
  return state.player.inventory
}

export function getPlayerCurrentWeapon(state: GameState): GameState['player']['currentWeaponType'] {
  return state.player.currentWeaponType
}

export function getPlayerIsDefending(state: GameState): boolean {
  return state.player.isDefending
}

export function getPlayerIsSpeedBoosted(state: GameState): boolean {
  return state.player.isSpeedBoosted
}

// -----------------------------------------------------------------------------
// Enemy selectors
// -----------------------------------------------------------------------------

export function getEnemies(state: GameState): EnemyState[] {
  return state.enemies
}

export function getAliveEnemies(state: GameState): EnemyState[] {
  return state.enemies.filter(e => e.state !== 'dead' && e.hp > 0)
}

export function getDeadEnemies(state: GameState): EnemyState[] {
  return state.enemies.filter(e => e.state === 'dead' || e.hp <= 0)
}

export function getEnemyById(state: GameState, id: string): EnemyState | undefined {
  return state.enemies.find(e => e.id === id)
}

export function getEnemiesInRange(state: GameState, position: Vector3, range: number): EnemyState[] {
  return state.enemies.filter(e => {
    if (e.state === 'dead' || e.hp <= 0) return false
    const dx = e.position.x - position.x
    const dy = e.position.y - position.y
    const dz = e.position.z - position.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < range
  })
}

export function getChasingEnemies(state: GameState): EnemyState[] {
  return state.enemies.filter(e => e.state === 'chase' && e.hp > 0)
}

export function getAttackingEnemies(state: GameState): EnemyState[] {
  return state.enemies.filter(e => e.state === 'attack' && e.hp > 0)
}

// -----------------------------------------------------------------------------
// Bullet selectors
// -----------------------------------------------------------------------------

export function getBullets(state: GameState): BulletState[] {
  return state.bullets
}

export function getActiveBullets(state: GameState): BulletState[] {
  return state.bullets.filter(b => b.isActive)
}

export function getEnemyBullets(state: GameState): BulletState[] {
  return state.enemyBullets
}

export function getActiveEnemyBullets(state: GameState): BulletState[] {
  return state.enemyBullets.filter(b => b.isActive)
}

export function getBulletById(state: GameState, id: string): BulletState | undefined {
  return state.bullets.find(b => b.id === id) ?? state.enemyBullets.find(b => b.id === id)
}

export function getBulletsInRange(state: GameState, position: Vector3, range: number): BulletState[] {
  return state.bullets.filter(b => {
    if (!b.isActive) return false
    const dx = b.position.x - position.x
    const dy = b.position.y - position.y
    const dz = b.position.z - position.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < range
  })
}

// -----------------------------------------------------------------------------
// Item selectors
// -----------------------------------------------------------------------------

export function getItems(state: GameState): ItemState[] {
  return state.items
}

export function getActiveItems(state: GameState): ItemState[] {
  return state.items.filter(i => !i.isCollected)
}

export function getCollectedItems(state: GameState): ItemState[] {
  return state.items.filter(i => i.isCollected)
}

export function getItemById(state: GameState, id: string): ItemState | undefined {
  return state.items.find(i => i.id === id)
}

export function getItemsInRange(state: GameState, position: Vector3, range: number): ItemState[] {
  return state.items.filter(i => {
    if (i.isCollected) return false
    const dx = i.position.x - position.x
    const dy = i.position.y - position.y
    const dz = i.position.z - position.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < range
  })
}

// -----------------------------------------------------------------------------
// Combat selectors
// -----------------------------------------------------------------------------

export function getCombat(state: GameState): CombatState {
  return state.combat
}

export function getAmmo(state: GameState): number {
  return state.combat.ammo
}

export function getMaxAmmo(state: GameState): number {
  return state.combat.maxAmmo
}

export function getCurrentWeaponType(state: GameState): GameState['combat']['currentWeaponType'] {
  return state.combat.currentWeaponType
}

export function getIsReloading(state: GameState): boolean {
  return state.combat.isReloading
}

export function getReloadProgress(state: GameState): number {
  return state.combat.reloadProgress
}

export function getDefenseModeActive(state: GameState): boolean {
  return state.combat.defenseModeActive
}

export function getDefenseCurrentWave(state: GameState): number {
  return state.combat.defenseCurrentWave
}

export function getDefenseTotalWaves(state: GameState): number {
  return state.combat.defenseTotalWaves
}

export function getDefenseEnemiesRemaining(state: GameState): number {
  return state.combat.defenseEnemiesRemaining
}

// -----------------------------------------------------------------------------
// World selectors
// -----------------------------------------------------------------------------

export function getWorld(state: GameState): WorldState {
  return state.world
}

export function getCurrentChunk(state: GameState): { x: number; z: number } {
  return { x: state.world.currentChunkX, z: state.world.currentChunkZ }
}

export function getLoadedChunkIds(state: GameState): string[] {
  return state.world.loadedChunkIds
}

export function getChunkData(state: GameState, chunkX: number, chunkZ: number): WorldState['chunks'][string] | undefined {
  return state.world.chunks[`${chunkX},${chunkZ}`]
}

// -----------------------------------------------------------------------------
// Resources selectors
// -----------------------------------------------------------------------------

export function getResources(state: GameState): ResourcesState {
  return state.resources
}

export function getGold(state: GameState): number {
  return state.resources.gold
}

export function getHerbs(state: GameState): number {
  return state.resources.herbs
}

export function getOres(state: GameState): number {
  return state.resources.ores
}

export function getGunpowder(state: GameState): number {
  return state.resources.gunpowder
}

export function getLightAmmo(state: GameState): number {
  return state.resources.lightAmmo
}

export function getHeavyAmmo(state: GameState): number {
  return state.resources.heavyAmmo
}

// -----------------------------------------------------------------------------
// Game-level selectors
// -----------------------------------------------------------------------------

export function getIsPaused(state: GameState): boolean {
  return state.isPaused
}

export function getIsGameOver(state: GameState): boolean {
  return state.isGameOver
}

export function getIsInMenu(state: GameState): boolean {
  return state.isInMenu
}

export function getIsDefending(state: GameState): boolean {
  return state.isDefending
}

export function getGameTime(state: GameState): number {
  return state.gameTime
}

export function getDifficulty(state: GameState): GameState['difficulty'] {
  return state.difficulty
}

export function getEnemySpawnTimer(state: GameState): number {
  return state.enemySpawnTimer
}

export function getSaveTimer(state: GameState): number {
  return state.saveTimer
}

// -----------------------------------------------------------------------------
// Derived / computed selectors
// -----------------------------------------------------------------------------

export function getAliveEnemyCount(state: GameState): number {
  return state.enemies.filter(e => e.state !== 'dead' && e.hp > 0).length
}

export function getActiveBulletCount(state: GameState): number {
  return state.bullets.filter(b => b.isActive).length
}

export function getActiveItemCount(state: GameState): number {
  return state.items.filter(i => !i.isCollected).length
}

export function getAmmoPercent(state: GameState): number {
  if (state.combat.maxAmmo === 0) return 0
  return state.combat.ammo / state.combat.maxAmmo
}

export function getPlayerHpPercent(state: GameState): number {
  if (state.player.maxHp === 0) return 0
  return state.player.hp / state.player.maxHp
}

export function isChunkLoaded(state: GameState, chunkX: number, chunkZ: number): boolean {
  return state.world.loadedChunkIds.includes(`${chunkX},${chunkZ}`)
}
