/**
 * Pure physics helper functions.
 *
 * All functions are stateless and free of side-effects.
 * No THREE.js, no DOM, no global state.
 */

import type { Vector3 } from './types'

// ---------------------------------------------------------------------------
// Vector helpers (internal)
// ---------------------------------------------------------------------------

function len(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a new position advanced by `velocity * delta`.
 */
export function updatePosition(pos: Vector3, velocity: Vector3, delta: number): Vector3 {
  return {
    x: pos.x + velocity.x * delta,
    y: pos.y + velocity.y * delta,
    z: pos.z + velocity.z * delta
  }
}

/**
 * Applies a friction coefficient to velocity and returns the damped vector.
 * Uses an exponential-decay model so the result is frame-rate independent:
 *   v' = v * (1 - friction)^delta   ≈   v * exp(-friction * delta)
 *
 * A friction value of 0 means no damping; 1 would stop the object instantly
 * (clamp applied to avoid reversal).
 */
export function applyFriction(velocity: Vector3, friction: number, delta: number): Vector3 {
  const factor = Math.max(0, 1 - Math.min(friction, 1) * delta)
  return {
    x: velocity.x * factor,
    y: velocity.y * factor,
    z: velocity.z * factor
  }
}

/**
 * Returns the normalised direction vector from `from` to `to`.
 * Returns a zero vector if the two positions are identical (avoids NaN).
 */
export function calculateDirection(from: Vector3, to: Vector3): Vector3 {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (magnitude === 0) return { x: 0, y: 0, z: 0 }
  return { x: dx / magnitude, y: dy / magnitude, z: dz / magnitude }
}

/**
 * Returns the Euclidean distance between two 3-D positions.
 */
export function calculateDistance(pos1: Vector3, pos2: Vector3): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  const dz = pos2.z - pos1.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Returns true when the distance between `pos1` and `pos2` is ≤ `range`.
 */
export function isWithinRange(pos1: Vector3, pos2: Vector3, range: number): boolean {
  return calculateDistance(pos1, pos2) <= range
}

/**
 * Normalises a vector. Returns zero-vector if length is 0.
 */
export function normalize(v: Vector3): Vector3 {
  const magnitude = len(v)
  if (magnitude === 0) return { x: 0, y: 0, z: 0 }
  return { x: v.x / magnitude, y: v.y / magnitude, z: v.z / magnitude }
}

/**
 * Scales a vector by a scalar.
 */
export function scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

/**
 * Adds two vectors.
 */
export function addVec(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}
