import type { ITimeSource, IRandomSource, IInputSource, IChunkLoader } from './dependencies/interfaces'
import type { GameState } from './GameState'

/**
 * GameRunner interface - defines the contract for game execution.
 * Implementations should handle rendering while game logic is decoupled.
 */
export interface GameRunner {
  setTimeSource(source: ITimeSource): void
  setRandomSource(source: IRandomSource): void
  setInputSource(source: IInputSource): void
  setChunkLoader(loader: IChunkLoader): void
  start(): void
  stop(): void
  pause(): void
  resume(): void
  getState(): GameState
}
