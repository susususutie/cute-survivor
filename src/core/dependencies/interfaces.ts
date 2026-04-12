// Core dependency interfaces for dependency injection
// These interfaces allow game logic to be tested independently of external dependencies

export interface ITimeSource {
  now(): number // Returns current timestamp in milliseconds
  deltaTime: number // Delta time from last frame
}

export interface IRandomSource {
  next(): number // Returns [0, 1) random number
  range(min: number, max: number): number // Returns [min, max) random number
  int(min: number, max: number): number // Returns [min, max] random integer
  boolean(probability: number): boolean // Returns true with given probability
  pick<T>(array: T[]): T // Randomly picks an element from array
  seed(value: number): IRandomSource // Re-initialize with seed, returns self
}

export interface InputState {
  keys: Set<string>
  mouse: { x: number; y: number; down: boolean; dx: number; dy: number }
  movement: { forward: boolean; backward: boolean; left: boolean; right: boolean }
  actions: { attack: boolean; defend: boolean; interact: boolean; inventory: boolean }
}

export interface IInputSource {
  getState(): InputState
  isKeyDown(key: string): boolean
  isMouseDown(): boolean
  getMovementDirection(): { x: number; z: number }
  clearMovementDeltas(): void
}

export interface ChunkData {
  rocks: { x: number; z: number; radius: number; height: number }[]
  vegetation: { x: number; z: number; type: 'tree' | 'grass' | 'flower' | 'bush'; scale: number }[]
  resources: { x: number; z: number; type: 'herb' | 'ore' }[]
}

export interface IChunkLoader {
  getChunkKey(x: number, z: number): string
  loadChunk(x: number, z: number): ChunkData | null
  saveChunk(x: number, z: number, data: ChunkData): void
}
