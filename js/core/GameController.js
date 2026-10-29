import { GameState } from './GameState.js';
import { GameInput } from './GameInput.js';
import { HighScoreStore } from './HighScoreStore.js';

export class GameController {
  constructor({ canvas, context, ui, sound, levelFactories, store = new HighScoreStore() }) {
    this.canvas = canvas;
    this.context = context;
    this.ui = ui;
    this.sound = sound;
    this.levelFactories = levelFactories;
    this.store = store;
    this.state = GameState.MENU;
    this.levelNumber = 0;
    this.currentLevel = null;
    this.run = this.#createRunResult();
    this.lastFrameTime = 0;
    this.pixelRatio = 1;

    this.#bindUiEvents();
    new GameInput({
      canvas: this.canvas,
      jumpButton: document.getElementById('jump-button'),
      onKeyDown: (event) => this.#handleKeyDown(event),
      onKeyUp: (event) => this.#handleKeyUp(event),
      onPointerMove: (x) => this.#handlePointerMove(x),
      onCanvasPointerDown: (event) => this.#handleCanvasPointerDown(event),
      onJumpPointerDown: (event) => this.#handleJumpPointerDown(event),
      onPointerRelease: () => this.currentLevel?.handleAction('jump', false),
    });
    this.resizeCanvas();
    this.ui.setHighScores({
      pumpkin: this.store.getPumpkinScore(),
      distance: this.store.getGraveyardDistance(),
    });
    this.ui.showStart();
    requestAnimationFrame((time) => this.#gameLoop(time));
  }

  resizeCanvas() {
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.pixelRatio);
    this.canvas.height = Math.round(height * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    if (this.currentLevel && typeof this.currentLevel.resize === 'function') {
      this.currentLevel.resize();
    }
  }

  startRun() {
    this.run = this.#createRunResult();
    void this.sound.initialize();
    this.sound.playStart();
    this.#startLevel(1);
  }

  continueToGraveyard() {
    if (this.state !== GameState.LEVEL_COMPLETE) return;
    this.#startLevel(2);
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.sound.setBackgroundMusic(false);
      this.ui.showPaused();
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.sound.setBackgroundMusic(this.levelNumber === 2);
      this.ui.showLevel(this.levelNumber);
    }
  }

  toggleMute() {
    const muted = !this.sound.muted;
    this.sound.setMuted(muted);
    this.ui.setMuted(muted);
  }

  #startLevel(levelNumber) {
    this.levelNumber = levelNumber;
    this.state = GameState.PLAYING;
    this.lastFrameTime = 0;
    this.sound.setBackgroundMusic(levelNumber === 2);
    const levelCallbacks = levelNumber === 1
      ? {
        onComplete: (result) => this.#completePumpkinLevel(result),
        onGameOver: (result) => this.#endRun(1, result),
      }
      : { onGameOver: (result) => this.#endRun(2, result) };
    this.currentLevel = this.levelFactories[levelNumber]({
      canvas: this.canvas,
      context: this.context,
      sound: this.sound,
      ...levelCallbacks,
    });

    this.currentLevel.start();
    if (typeof this.currentLevel.resize === 'function') this.currentLevel.resize();
    this.ui.showLevel(levelNumber);
    this.resizeCanvas();
  }

  #completePumpkinLevel(result) {
    this.run.pumpkinScore = result.score;
    this.store.recordPumpkinScore(result.score);
    this.state = GameState.LEVEL_COMPLETE;
    this.sound.setBackgroundMusic(false);
    this.ui.showLevelComplete(result.score);
  }

  #endRun(level, result) {
    if (this.state === GameState.GAME_OVER) return;
    this.state = GameState.GAME_OVER;
    if (level === 1) {
      this.run.pumpkinScore = result.score;
      this.store.recordPumpkinScore(result.score);
    } else {
      this.run.distance = result.distance;
      this.run.bones = result.bones;
      this.store.recordGraveyardDistance(result.distance);
    }

    this.sound.setBackgroundMusic(false);
    this.ui.showGameOver({
      level,
      pumpkinScore: this.run.pumpkinScore,
      distance: this.run.distance,
      bones: this.run.bones,
      bestPumpkinScore: this.store.getPumpkinScore(),
      bestDistance: this.store.getGraveyardDistance(),
    });
  }

  #gameLoop(timestamp) {
    const rawDelta = this.lastFrameTime ? timestamp - this.lastFrameTime : 1000 / 60;
    const deltaMs = Math.min(rawDelta, 100);
    this.lastFrameTime = timestamp;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.context.clearRect(0, 0, width, height);

    if (this.currentLevel) {
      if (this.state === GameState.PLAYING) {
        this.currentLevel.update(deltaMs);
        this.#updateHud();
      }
      this.currentLevel.render(this.context);
    }

    requestAnimationFrame((time) => this.#gameLoop(time));
  }

  #updateHud() {
    if (!this.currentLevel) return;
    const state = this.currentLevel.getHudState();
    if (this.levelNumber === 1) this.ui.updatePumpkinHud(state);
    else this.ui.updateGraveyardHud(state);
  }

  #bindUiEvents() {
    document.getElementById('start-button').addEventListener('click', () => this.startRun());
    document.getElementById('continue-button').addEventListener('click', () => this.continueToGraveyard());
    document.getElementById('restart-button').addEventListener('click', () => this.startRun());
    document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
    document.getElementById('resume-button').addEventListener('click', () => this.togglePause());
    document.getElementById('mute-button').addEventListener('click', () => this.toggleMute());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  #handlePointerMove(x) {
    if (this.state === GameState.PLAYING && this.levelNumber === 1) {
      this.currentLevel.handlePointerMove(x);
    }
  }

  #handleCanvasPointerDown(event) {
    if (this.state !== GameState.PLAYING || this.levelNumber !== 2) return;
    event.preventDefault();
    this.currentLevel.handleAction('jump', true);
  }

  #handleJumpPointerDown(event) {
    event.preventDefault();
    if (this.state === GameState.PLAYING && this.levelNumber === 2) {
      this.currentLevel.handleAction('jump', true);
    }
  }

  #handleKeyDown(event) {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault();
      if (event.repeat) return;
      this.togglePause();
      return;
    }

    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
    event.preventDefault();
    if (this.state === GameState.MENU && !event.repeat) {
      this.startRun();
    } else if (this.state === GameState.LEVEL_COMPLETE && !event.repeat) {
      this.continueToGraveyard();
    } else if (this.state === GameState.PLAYING && this.levelNumber === 2 && !event.repeat) {
      this.currentLevel.handleAction('jump', true);
    }
  }

  #handleKeyUp(event) {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      this.currentLevel?.handleAction('jump', false);
    }
  }

  #createRunResult() {
    return { pumpkinScore: 0, distance: 0, bones: 0 };
  }
}
