export class GameUI {
  constructor(documentRef = document) {
    this.hintTimeout = null;
    this.elements = {
      gameShell: documentRef.getElementById('game-shell'),
      hud: documentRef.getElementById('game-hud'),
      levelIndicator: documentRef.getElementById('level-indicator'),
      pumpkinHud: documentRef.getElementById('pumpkin-hud'),
      pumpkinScore: documentRef.getElementById('pumpkin-score'),
      pumpkinLives: documentRef.getElementById('pumpkin-lives'),
      pumpkinTime: documentRef.getElementById('pumpkin-time'),
      graveyardHud: documentRef.getElementById('graveyard-hud'),
      graveyardDistance: documentRef.getElementById('graveyard-distance'),
      graveyardBones: documentRef.getElementById('graveyard-bones'),
      graveyardShield: documentRef.getElementById('graveyard-shield'),
      shieldStat: documentRef.getElementById('shield-stat'),
      level1Hint: documentRef.getElementById('level1-hint'),
      jumpButton: documentRef.getElementById('jump-button'),
      pauseButton: documentRef.getElementById('pause-button'),
      muteButton: documentRef.getElementById('mute-button'),
      level1FinalScore: documentRef.getElementById('level1-final-score'),
      resultEyebrow: documentRef.getElementById('game-over-eyebrow'),
      resultTitle: documentRef.getElementById('game-over-title'),
      resultPumpkinScore: documentRef.getElementById('result-pumpkin-score'),
      resultDistance: documentRef.getElementById('result-distance'),
      resultBones: documentRef.getElementById('result-bones'),
      resultBestPumpkin: documentRef.getElementById('result-best-pumpkin'),
      resultBestDistance: documentRef.getElementById('result-best-distance'),
      startBestPumpkin: documentRef.getElementById('start-best-pumpkin'),
      startBestDistance: documentRef.getElementById('start-best-distance'),
    };

    this.screens = [
      documentRef.getElementById('start-screen'),
      documentRef.getElementById('level-complete-screen'),
      documentRef.getElementById('pause-screen'),
      documentRef.getElementById('game-over-screen'),
    ];
  }

  showStart() {
    this.#hideScreens();
    this.elements.gameShell.classList.remove('runner-level');
    this.screens[0].hidden = false;
    this.elements.hud.hidden = true;
    this.#hideLevelControls();
  }

  showLevel(levelNumber) {
    this.#hideScreens();
    this.elements.gameShell.classList.toggle('runner-level', levelNumber === 2);
    this.elements.hud.hidden = false;
    this.elements.levelIndicator.textContent = `LEVEL ${levelNumber}`;
    this.elements.pumpkinHud.hidden = levelNumber !== 1;
    this.elements.graveyardHud.hidden = levelNumber !== 2;
    this.elements.level1Hint.hidden = levelNumber !== 1;
    this.elements.level1Hint.classList.remove('is-hidden');
    this.elements.jumpButton.hidden = levelNumber !== 2;
    this.elements.pauseButton.hidden = false;
    this.elements.muteButton.hidden = false;
    window.clearTimeout(this.hintTimeout);
    if (levelNumber === 1) {
      this.hintTimeout = window.setTimeout(() => {
        this.elements.level1Hint.classList.add('is-hidden');
      }, 4000);
    }
  }

  showPaused() {
    this.#hideScreens();
    this.screens[2].hidden = false;
  }

  showLevelComplete(score) {
    this.#hideScreens();
    this.elements.gameShell.classList.remove('runner-level');
    this.screens[1].hidden = false;
    this.elements.level1FinalScore.textContent = String(score);
    this.elements.hud.hidden = true;
    this.#hideLevelControls();
  }

  showGameOver(result) {
    this.#hideScreens();
    this.screens[3].hidden = false;
    this.elements.hud.hidden = true;
    this.#hideLevelControls();
    this.elements.resultEyebrow.textContent = result.level === 1
      ? 'The cauldron is overwhelmed'
      : 'The graveyard claims another soul';
    this.elements.resultTitle.textContent = result.level === 1 ? 'Game Over' : 'Run Complete';
    this.elements.resultPumpkinScore.textContent = String(result.pumpkinScore);
    this.elements.resultDistance.textContent = `${result.distance} m`;
    this.elements.resultBones.textContent = String(result.bones);
    this.elements.resultBestPumpkin.textContent = String(result.bestPumpkinScore);
    this.elements.resultBestDistance.textContent = `${result.bestDistance} m`;
  }

  updatePumpkinHud({ score, lives, timeLeft }) {
    this.elements.pumpkinScore.textContent = String(score);
    this.elements.pumpkinLives.textContent = `${'🎃 '.repeat(lives)}${'♡ '.repeat(Math.max(0, 3 - lives))}`.trim();
    this.elements.pumpkinTime.textContent = `${Math.ceil(timeLeft)}s`;
  }

  updateGraveyardHud({ distance, bones, hasShield }) {
    this.elements.graveyardDistance.textContent = `${distance} m`;
    this.elements.graveyardBones.textContent = `${bones} / 5`;
    this.elements.graveyardShield.textContent = hasShield ? 'Active' : '5 bones';
    this.elements.shieldStat.classList.toggle('shield-active', hasShield);
  }

  setMuted(muted) {
    this.elements.muteButton.textContent = muted ? '🔇' : '🔊';
    this.elements.muteButton.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    this.elements.muteButton.title = muted ? 'Unmute sound' : 'Mute sound';
  }

  setHighScores({ pumpkin, distance }) {
    this.elements.startBestPumpkin.textContent = String(pumpkin);
    this.elements.startBestDistance.textContent = `${distance} m`;
  }

  #hideScreens() {
    this.screens.forEach((screen) => { screen.hidden = true; });
  }

  #hideLevelControls() {
    window.clearTimeout(this.hintTimeout);
    this.elements.level1Hint.hidden = true;
    this.elements.jumpButton.hidden = true;
    this.elements.pauseButton.hidden = true;
    this.elements.muteButton.hidden = true;
  }
}
