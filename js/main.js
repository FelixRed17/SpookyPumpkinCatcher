import { GameController } from './core/GameController.js';
import { SoundManager } from './core/SoundManager.js';
import { GameUI } from './ui/GameUI.js';
import { GraveyardLevel } from './levels/GraveyardLevel.js';
import { PumpkinLevel } from './levels/PumpkinLevel.js';

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

if (!context) {
  throw new Error('This browser does not support the canvas needed to run the game.');
}

new GameController({
  canvas,
  context,
  ui: new GameUI(),
  sound: new SoundManager(),
  levelFactories: {
    1: (dependencies) => new PumpkinLevel(dependencies),
    2: (dependencies) => new GraveyardLevel(dependencies),
  },
});
