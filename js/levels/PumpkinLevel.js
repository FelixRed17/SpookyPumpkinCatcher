const LEVEL_DURATION_SECONDS = 60;
const ITEM_SPAWN_INTERVAL_MS = 650;
const ITEM_TYPES = Object.freeze([
  { type: 'pumpkin', symbol: '🎃', points: 10, weight: 45, color: '#f97316' },
  { type: 'candy', symbol: '🍬', points: 5, weight: 30, color: '#ec4899' },
  { type: 'skull', symbol: '💀', lifeCost: 1, weight: 15, color: '#ef4444' },
  { type: 'ghost', symbol: '👻', lifeCost: 1, weight: 10, color: '#38bdf8' },
]);

function roundedRectangle(context, x, y, width, height, radii) {
  const [topLeft, topRight, bottomRight, bottomLeft] = radii;
  context.beginPath();
  context.moveTo(x + topLeft, y);
  context.lineTo(x + width - topRight, y);
  context.quadraticCurveTo(x + width, y, x + width, y + topRight);
  context.lineTo(x + width, y + height - bottomRight);
  context.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
  context.lineTo(x + bottomLeft, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
  context.lineTo(x, y + topLeft);
  context.quadraticCurveTo(x, y, x + topLeft, y);
  context.closePath();
}

export class PumpkinLevel {
  constructor({ canvas, context, sound, onComplete, onGameOver }) {
    this.canvas = canvas;
    this.context = context;
    this.sound = sound;
    this.onComplete = onComplete;
    this.onGameOver = onGameOver;
    this.width = 0;
    this.height = 0;
    this.elapsedMs = 0;
    this.spawnElapsedMs = 0;
    this.score = 0;
    this.lives = 3;
    this.isFinished = false;
    this.items = [];
    this.particles = [];
    this.player = { x: 0, y: 0, width: 90, height: 70, targetX: 0 };
  }

  start() {
    this.elapsedMs = 0;
    this.spawnElapsedMs = 0;
    this.score = 0;
    this.lives = 3;
    this.isFinished = false;
    this.items = [];
    this.particles = [];
    this.resize();
    this.player.x = (this.width - this.player.width) / 2;
    this.player.targetX = this.player.x;
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.player.y = Math.max(0, this.height - this.player.height - 25);
    this.#clampPlayer();
  }

  handlePointerMove(x) {
    this.player.targetX = x - this.player.width / 2;
    this.#clampPlayer();
  }

  update(deltaMs) {
    if (this.isFinished) return;

    const frameScale = Math.min(deltaMs / (1000 / 60), 6);
    this.elapsedMs += deltaMs;
    if (this.elapsedMs >= LEVEL_DURATION_SECONDS * 1000) {
      this.isFinished = true;
      this.onComplete({ score: this.score });
      return;
    }

    this.spawnElapsedMs += deltaMs;
    while (this.spawnElapsedMs >= ITEM_SPAWN_INTERVAL_MS) {
      this.spawnElapsedMs -= ITEM_SPAWN_INTERVAL_MS;
      this.#spawnItem();
    }

    const movementBlend = 1 - Math.pow(0.7, frameScale);
    this.player.x += (this.player.targetX - this.player.x) * movementBlend;
    const speedMultiplier = 1 + (this.elapsedMs / 1000) / 45;

    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      const item = this.items[index];
      item.y += item.speed * speedMultiplier * frameScale;
      item.rotation += item.rotationSpeed * frameScale;

      if (this.#hitsPlayer(item)) {
        if (item.config.points) {
          this.score += item.config.points;
          this.sound.playCatch();
          this.#createParticles(item.x, item.y, item.config.color);
        } else {
          this.lives = Math.max(0, this.lives - item.config.lifeCost);
          this.sound.playHit();
          this.#createParticles(item.x, item.y, '#ef4444');
          if (this.lives === 0) {
            this.isFinished = true;
            this.onGameOver({ score: this.score });
            return;
          }
        }
        this.items.splice(index, 1);
      } else if (item.y > this.height + 50) {
        this.items.splice(index, 1);
      }
    }

    this.#updateParticles(frameScale);
  }

  render(context = this.context) {
    for (const item of this.items) this.#drawItem(context, item);
    this.#drawParticles(context);
    this.#drawCauldron(context);
  }

  getHudState() {
    return {
      score: this.score,
      lives: this.lives,
      timeLeft: Math.max(0, LEVEL_DURATION_SECONDS - this.elapsedMs / 1000),
    };
  }

  #spawnItem() {
    const totalWeight = ITEM_TYPES.reduce((total, type) => total + type.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let config = ITEM_TYPES[0];
    for (const candidate of ITEM_TYPES) {
      if (randomWeight < candidate.weight) {
        config = candidate;
        break;
      }
      randomWeight -= candidate.weight;
    }

    this.items.push({
      x: Math.random() * Math.max(1, this.width - 60) + 30,
      y: -40,
      speed: Math.random() * 1.5 + 2.2,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      config,
    });
  }

  #hitsPlayer(item) {
    const padding = 10;
    return item.x >= this.player.x - padding
      && item.x <= this.player.x + this.player.width + padding
      && item.y >= this.player.y - 10
      && item.y <= this.player.y + this.player.height / 2;
  }

  #clampPlayer() {
    const maxX = Math.max(10, this.width - this.player.width - 10);
    this.player.targetX = Math.max(10, Math.min(maxX, this.player.targetX));
    this.player.x = Math.max(10, Math.min(maxX, this.player.x));
  }

  #createParticles(x, y, color) {
    for (let index = 0; index < 8; index += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        alpha: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  #updateParticles(frameScale) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.x += particle.vx * frameScale;
      particle.y += particle.vy * frameScale;
      particle.alpha -= 0.03 * frameScale;
      if (particle.alpha <= 0) this.particles.splice(index, 1);
    }
  }

  #drawItem(context, item) {
    context.save();
    context.translate(item.x, item.y);
    context.rotate(item.rotation);
    context.font = '28px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(item.config.symbol, 0, 0);
    context.restore();
  }

  #drawParticles(context) {
    for (const particle of this.particles) {
      context.save();
      context.globalAlpha = particle.alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  #drawCauldron(context) {
    const { x, y, width, height } = this.player;
    context.save();
    context.fillStyle = '#1e1b4b';
    context.strokeStyle = '#9333ea';
    context.lineWidth = 3;
    roundedRectangle(context, x, y + 20, width, height - 20, [0, 0, 20, 20]);
    context.fill();
    context.stroke();

    context.fillStyle = '#312e81';
    roundedRectangle(context, x - 6, y + 10, width + 12, 12, [6, 6, 6, 6]);
    context.fill();
    context.stroke();

    const brew = context.createRadialGradient(x + width / 2, y + 25, 5, x + width / 2, y + 25, width / 2);
    brew.addColorStop(0, '#f97316');
    brew.addColorStop(1, '#9a3412');
    context.fillStyle = brew;
    context.beginPath();
    context.ellipse(x + width / 2, y + 16, width / 2 - 4, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.font = '32px sans-serif';
    context.textAlign = 'center';
    context.fillText('🧙‍♀️', x + width / 2, y - 10);
    context.restore();
  }
}
