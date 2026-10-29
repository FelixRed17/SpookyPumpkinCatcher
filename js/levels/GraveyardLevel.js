import { GraveyardBackground } from './GraveyardBackground.js';
import {
  BoneCollectible,
  GROUND_Y,
  GraveyardObstacle,
  intersects,
  Particle,
  RunnerPlayer,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './GraveyardEntities.js';

const OBSTACLE_TYPES = Object.freeze([
  'GRAVESTONE_SHORT',
  'GRAVESTONE_TALL',
  'TOMB_PIT',
  'VINE',
  'BAT',
]);

export class GraveyardLevel {
  constructor({ canvas, context, sound, onGameOver }) {
    this.canvas = canvas;
    this.context = context;
    this.sound = sound;
    this.onGameOver = onGameOver;
    this.background = new GraveyardBackground();
    this.particles = [];
    this.obstacles = [];
    this.collectibles = [];
    this.player = null;
    this.gameSpeed = 5;
    this.distanceProgress = 0;
    this.bonesCollected = 0;
    this.totalBones = 0;
    this.spawnElapsedFrames = 0;
    this.nextSpawnFrames = 60;
    this.isFinished = false;
  }

  start() {
    this.particles = [];
    this.obstacles = [];
    this.collectibles = [];
    this.gameSpeed = 5;
    this.distanceProgress = 0;
    this.bonesCollected = 0;
    this.totalBones = 0;
    this.spawnElapsedFrames = 0;
    this.nextSpawnFrames = 60;
    this.isFinished = false;
    this.player = new RunnerPlayer({
      sound: this.sound,
      emitDust: (x, y, count) => this.#createDust(x, y, count),
      emitFlames: (x, y, count) => this.#createFlames(x, y, count),
    });
  }

  handleAction(action, pressed) {
    if (action !== 'jump' || !this.player) return;
    this.player.setJumpPressed(pressed);
    if (pressed) this.player.jump();
  }

  update(deltaMs) {
    if (this.isFinished) return;
    const frameScale = Math.min(deltaMs / (1000 / 60), 6);
    this.distanceProgress += this.gameSpeed * 0.05 * frameScale;
    this.gameSpeed += 0.0009 * frameScale;

    this.background.update(this.gameSpeed, frameScale);
    this.player.update(frameScale, this.gameSpeed);
    this.#handleSpawning(frameScale);
    this.#updateCollectibles(frameScale);
    if (this.isFinished) return;
    this.#updateObstacles(frameScale);
    if (this.isFinished) return;
    this.#updateParticles(frameScale);
  }

  render(context = this.context) {
    const width = this.canvas.clientWidth || WORLD_WIDTH;
    const height = this.canvas.clientHeight || WORLD_HEIGHT;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    const offsetX = (width - WORLD_WIDTH * scale) / 2;
    const offsetY = (height - WORLD_HEIGHT * scale) / 2;
    context.save();
    context.translate(offsetX, offsetY);
    context.scale(scale, scale);
    this.background.render(context);

    if (this.player) this.player.draw(context);
    for (const bone of this.collectibles) bone.draw(context);
    for (const obstacle of this.obstacles) obstacle.draw(context);
    for (const particle of this.particles) particle.draw(context);
    context.restore();
  }

  getHudState() {
    return {
      distance: Math.floor(this.distanceProgress),
      bones: this.bonesCollected,
      totalBones: this.totalBones,
      hasShield: Boolean(this.player && this.player.hasShield),
    };
  }

  getResult() {
    return {
      distance: Math.floor(this.distanceProgress),
      bones: this.totalBones,
    };
  }

  #handleSpawning(frameScale) {
    this.spawnElapsedFrames += frameScale;
    if (this.spawnElapsedFrames < this.nextSpawnFrames) return;

    this.spawnElapsedFrames = 0;
    this.nextSpawnFrames = Math.floor(Math.random() * 45 + 55);
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    this.obstacles.push(new GraveyardObstacle(type, WORLD_WIDTH + 50));

    if (Math.random() < 0.65) {
      const boneY = GROUND_Y - Math.random() * 110 - 40;
      const boneCount = Math.floor(Math.random() * 3) + 1;
      for (let index = 0; index < boneCount; index += 1) {
        this.collectibles.push(new BoneCollectible(WORLD_WIDTH + 130 + index * 35, boneY));
      }
    }
  }

  #updateCollectibles(frameScale) {
    for (let index = this.collectibles.length - 1; index >= 0; index -= 1) {
      const bone = this.collectibles[index];
      bone.update(this.gameSpeed, frameScale);
      if (intersects(this.player, bone)) {
        bone.markedForDeletion = true;
        this.bonesCollected += 1;
        this.totalBones += 1;
        this.sound.playBonePickup();
        this.#createFlames(bone.x, bone.y, 6);

        if (this.bonesCollected >= 5) {
          this.bonesCollected = 0;
          if (!this.player.hasShield) {
            this.player.hasShield = true;
            this.sound.playShieldUp();
          }
        }
      }
      if (bone.markedForDeletion) this.collectibles.splice(index, 1);
    }
  }

  #updateObstacles(frameScale) {
    for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = this.obstacles[index];
      obstacle.update(this.gameSpeed, frameScale);

      const overlapsHorizontally = this.player.x < obstacle.x + obstacle.width
        && this.player.x + this.player.width > obstacle.x;
      const collision = obstacle.type === 'TOMB_PIT'
        ? this.player.isGrounded && overlapsHorizontally
        : intersects(this.player, obstacle);

      if (collision) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          obstacle.markedForDeletion = true;
          this.sound.playHit();
          this.#createExplosion(this.player.x, this.player.y, '#38bdf8', 25);
        } else {
          this.isFinished = true;
          this.sound.playHit();
          this.#createExplosion(this.player.x + 16, this.player.y + 26, '#f8fafc', 35);
          this.onGameOver(this.getResult());
          return;
        }
      }

      if (obstacle.markedForDeletion) this.obstacles.splice(index, 1);
    }
  }

  #updateParticles(frameScale) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.update(frameScale);
      if (particle.markedForDeletion) this.particles.splice(index, 1);
    }
  }

  #createDust(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push(new Particle(
        x,
        y,
        (Math.random() - 0.5) * 2 - 1,
        -Math.random() * 1.5,
        '#64748b',
        Math.random() * 3 + 2,
        20,
      ));
    }
  }

  #createFlames(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push(new Particle(
        x,
        y,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        '#10b981',
        Math.random() * 4 + 2,
        25,
      ));
    }
  }

  #createExplosion(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      this.particles.push(new Particle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        Math.random() * 5 + 2,
        35,
      ));
    }
  }
}
