const PUMPKIN_SCORE_KEY = 'spooky_pumpkin_highscore';
const GRAVEYARD_SCORE_KEY = 'graveyard_dash_highscore';

export class HighScoreStore {
  getPumpkinScore() {
    return this.#read(PUMPKIN_SCORE_KEY);
  }

  getGraveyardDistance() {
    return this.#read(GRAVEYARD_SCORE_KEY);
  }

  recordPumpkinScore(score) {
    const best = Math.max(this.getPumpkinScore(), Math.floor(score));
    this.#write(PUMPKIN_SCORE_KEY, best);
    return best;
  }

  recordGraveyardDistance(distance) {
    const best = Math.max(this.getGraveyardDistance(), Math.floor(distance));
    this.#write(GRAVEYARD_SCORE_KEY, best);
    return best;
  }

  #read(key) {
    try {
      return Number(window.localStorage.getItem(key)) || 0;
    } catch {
      return 0;
    }
  }

  #write(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // The game remains playable when browser storage is disabled.
    }
  }
}
