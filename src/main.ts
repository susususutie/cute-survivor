import { Game } from './core/Game'

const game = new Game()
// boot() is called automatically in constructor
;(window as unknown as Record<string, unknown>).game = game
