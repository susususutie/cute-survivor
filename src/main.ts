import { Game } from './core/Game'

const game = new Game()
game.init()

(window as any).game = game