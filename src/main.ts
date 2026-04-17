import { Game } from './core/Game'

const game = new Game()
game.boot()
;(window as unknown as Record<string, unknown>).game = game
