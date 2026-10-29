import { GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from './GraveyardEntities.js';

export class GraveyardBackground {
  constructor() {
    this.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * (WORLD_HEIGHT * 0.6),
      size: Math.random() * 2 + 0.5,
      alpha: Math.random(),
    }));
    this.clouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * 120 + 20,
      width: Math.random() * 100 + 80,
      speed: Math.random() * 0.3 + 0.1,
    }));
    this.trees = Array.from({ length: 15 }, (_, index) => ({
      x: index * 70,
      height: Math.random() * 65 + 45,
    }));
    this.fog = Array.from({ length: 12 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: GROUND_Y - Math.random() * 80,
      radius: Math.random() * 40 + 30,
      alpha: Math.random() * 0.15 + 0.05,
      speed: Math.random() * 0.4 + 0.2,
    }));
  }

  update(gameSpeed, frameScale) {
    for (const star of this.stars) {
      star.alpha = Math.max(0.2, Math.min(1, star.alpha + (Math.random() - 0.5) * 0.05 * frameScale));
    }
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * frameScale;
      if (cloud.x + cloud.width < -50) cloud.x = WORLD_WIDTH + 50;
    }
    for (const tree of this.trees) {
      tree.x -= gameSpeed * 0.2 * frameScale;
      if (tree.x < -100) tree.x = WORLD_WIDTH + 50;
    }
    for (const particle of this.fog) {
      particle.x -= particle.speed * (gameSpeed * 0.2) * frameScale;
      if (particle.x + particle.radius < -50) particle.x = WORLD_WIDTH + 50;
    }
  }

  render(context) {
    const sky = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    sky.addColorStop(0, '#090514');
    sky.addColorStop(0.6, '#1e112a');
    sky.addColorStop(1, '#020617');
    context.fillStyle = sky;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.#drawStars(context);
    this.#drawMoon(context);
    this.#drawClouds(context);
    this.#drawTrees(context);
    this.#drawGround(context);
    this.#drawFog(context);
    this.#drawVignette(context);
  }

  #drawStars(context) {
    context.fillStyle = '#fff';
    for (const star of this.stars) {
      context.globalAlpha = star.alpha;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  #drawMoon(context) {
    const moonX = WORLD_WIDTH - 120;
    const moonY = 80;
    context.save();
    context.shadowColor = '#fbbf24';
    context.shadowBlur = 35;
    context.fillStyle = '#fef3c7';
    context.beginPath();
    context.arc(moonX, moonY, 45, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.fillStyle = '#fde68a';
    context.beginPath();
    context.arc(moonX - 12, moonY - 10, 8, 0, Math.PI * 2);
    context.arc(moonX + 15, moonY + 8, 12, 0, Math.PI * 2);
    context.arc(moonX - 5, moonY + 18, 6, 0, Math.PI * 2);
    context.fill();
  }

  #drawClouds(context) {
    context.fillStyle = 'rgba(30, 27, 75, 0.4)';
    for (const cloud of this.clouds) {
      context.beginPath();
      context.arc(cloud.x, cloud.y, 25, 0, Math.PI * 2);
      context.arc(cloud.x + 25, cloud.y - 10, 30, 0, Math.PI * 2);
      context.arc(cloud.x + 55, cloud.y, 25, 0, Math.PI * 2);
      context.fill();
    }
  }

  #drawTrees(context) {
    context.fillStyle = '#0f0a1e';
    for (const tree of this.trees) {
      context.beginPath();
      context.moveTo(tree.x, GROUND_Y);
      context.lineTo(tree.x + 35, GROUND_Y - tree.height);
      context.lineTo(tree.x + 70, GROUND_Y);
      context.fill();
    }
  }

  #drawGround(context) {
    context.fillStyle = '#020617';
    context.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
    context.strokeStyle = '#4c1d95';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, GROUND_Y);
    context.lineTo(WORLD_WIDTH, GROUND_Y);
    context.stroke();
  }

  #drawFog(context) {
    for (const particle of this.fog) {
      context.save();
      context.globalAlpha = particle.alpha;
      context.fillStyle = '#a855f7';
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  #drawVignette(context) {
    const vignette = context.createRadialGradient(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH * 0.3,
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH * 0.7,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
}
