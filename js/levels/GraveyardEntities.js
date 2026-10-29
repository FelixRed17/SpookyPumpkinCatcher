export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 450;
export const GROUND_Y = 370;

export function intersects(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

export class RunnerPlayer {
  constructor({ sound, emitDust, emitFlames }) {
    this.sound = sound;
    this.emitDust = emitDust;
    this.emitFlames = emitFlames;
    this.width = 32;
    this.height = 52;
    this.reset();
  }

  reset() {
    this.x = 100;
    this.y = GROUND_Y - this.height;
    this.velocityY = 0;
    this.isGrounded = true;
    this.canDoubleJump = true;
    this.hasShield = false;
    this.jumpHoldFrames = 0;
    this.isJumpPressed = false;
    this.runFrame = 0;
    this.animationTimer = 0;
  }

  setJumpPressed(pressed) {
    this.isJumpPressed = pressed;
  }

  jump() {
    if (this.isGrounded) {
      this.velocityY = -8.5;
      this.isGrounded = false;
      this.canDoubleJump = true;
      this.jumpHoldFrames = 0;
      this.sound.playJump();
      this.emitDust(this.x + this.width / 2, this.y + this.height, 8);
    } else if (this.canDoubleJump) {
      this.velocityY = -12.8 * 0.88;
      this.canDoubleJump = false;
      this.sound.playDoubleJump();
      this.emitFlames(this.x + this.width / 2, this.y + this.height, 16);
    }
  }

  update(frameScale, gameSpeed) {
    if (this.isJumpPressed && !this.isGrounded && this.velocityY < 0 && this.jumpHoldFrames < 12) {
      this.velocityY -= 0.35 * frameScale;
      this.jumpHoldFrames += frameScale;
    }

    this.velocityY += 0.62 * frameScale;
    this.y += this.velocityY * frameScale;
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
    }

    this.animationTimer += gameSpeed * 0.05 * frameScale;
    if (this.animationTimer >= 1) {
      this.runFrame = (this.runFrame + 1) % 4;
      this.animationTimer = 0;
    }
    if (this.isGrounded && Math.random() < 0.35 * frameScale) {
      this.emitDust(this.x, this.y + this.height, 1);
    }
  }

  draw(context) {
    context.save();
    context.translate(this.x + this.width / 2, this.y + this.height / 2);

    if (this.hasShield) {
      context.beginPath();
      context.arc(0, 0, 34, 0, Math.PI * 2);
      context.fillStyle = 'rgba(6, 182, 212, 0.22)';
      context.fill();
      context.strokeStyle = '#38bdf8';
      context.lineWidth = 2.5;
      context.setLineDash([8, 4]);
      context.stroke();
      context.setLineDash([]);
    }

    context.fillStyle = '#f8fafc';
    context.strokeStyle = '#f8fafc';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, -18, 11, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#090514';
    context.beginPath();
    context.arc(3, -20, 2.5, 0, Math.PI * 2);
    context.arc(9, -20, 2.5, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = '#e2e8f0';
    context.beginPath();
    context.moveTo(0, -7);
    context.lineTo(0, 10);
    context.stroke();

    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-5, -4); context.lineTo(5, -4);
    context.moveTo(-6, -1); context.lineTo(6, -1);
    context.moveTo(-4, 3); context.lineTo(4, 3);
    context.stroke();

    const limbAngles = this.#getLimbAngles();
    this.#drawLimb(context, 0, 10, limbAngles.leg1, true, -2);
    this.#drawLimb(context, 0, 10, limbAngles.leg2, true, 2);
    this.#drawLimb(context, 0, -5, limbAngles.arm1, false);
    this.#drawLimb(context, 0, -5, limbAngles.arm2, false);
    context.restore();
  }

  #getLimbAngles() {
    if (!this.isGrounded) return { leg1: -0.6, leg2: 0.6, arm1: 0.8, arm2: -0.8 };
    const cycles = [
      { leg1: -0.5, leg2: 0.5, arm1: 0.6, arm2: -0.6 },
      { leg1: -0.1, leg2: 0.1, arm1: 0.2, arm2: -0.2 },
      { leg1: 0.5, leg2: -0.5, arm1: -0.6, arm2: 0.6 },
      { leg1: 0.1, leg2: -0.1, arm1: -0.2, arm2: 0.2 },
    ];
    return cycles[this.runFrame];
  }

  #drawLimb(context, originX, originY, angle, isLeg, footOffset = 0) {
    const reach = isLeg ? 12 : 10;
    context.beginPath();
    context.moveTo(originX, originY);
    context.lineTo(Math.sin(angle) * reach, originY + Math.cos(angle) * reach);
    if (isLeg) context.lineTo(Math.sin(angle) * reach + footOffset, 24);
    context.stroke();
  }
}

export class GraveyardObstacle {
  constructor(type, x) {
    this.type = type;
    this.x = x;
    this.markedForDeletion = false;
    this.animationFrame = 0;

    const sizes = {
      GRAVESTONE_SHORT: [28, 36],
      GRAVESTONE_TALL: [32, 50],
      TOMB_PIT: [68, 20],
      VINE: [38, 56],
      BAT: [34, 24],
    };
    [this.width, this.height] = sizes[type];
    this.y = type === 'BAT' ? GROUND_Y - Math.random() * 80 - 65 : GROUND_Y - this.height;
  }

  update(gameSpeed, frameScale) {
    this.x -= gameSpeed * frameScale;
    this.animationFrame += 0.15 * frameScale;
    if (this.x + this.width < -60) this.markedForDeletion = true;
  }

  draw(context) {
    if (this.type === 'GRAVESTONE_SHORT' || this.type === 'GRAVESTONE_TALL') {
      this.#drawGravestone(context);
    } else if (this.type === 'TOMB_PIT') {
      this.#drawPit(context);
    } else if (this.type === 'VINE') {
      this.#drawVine(context);
    } else {
      this.#drawBat(context);
    }
  }

  #drawGravestone(context) {
    context.fillStyle = '#64748b';
    context.beginPath();
    context.moveTo(this.x, this.y + this.height);
    context.lineTo(this.x, this.y + 15);
    context.quadraticCurveTo(this.x + this.width / 2, this.y - 5, this.x + this.width, this.y + 15);
    context.lineTo(this.x + this.width, this.y + this.height);
    context.fill();
    context.strokeStyle = '#334155';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.x + 8, this.y + 15);
    context.lineTo(this.x + 14, this.y + 24);
    context.stroke();
    context.fillStyle = '#1e293b';
    context.font = 'bold 10px sans-serif';
    context.textAlign = 'center';
    context.fillText('R.I.P', this.x + this.width / 2, this.y + 24);
  }

  #drawPit(context) {
    context.fillStyle = '#020617';
    context.fillRect(this.x, this.y, this.width, this.height);
    context.fillStyle = '#94a3b8';
    const spikeWidth = this.width / 4;
    for (let index = 0; index < 4; index += 1) {
      context.beginPath();
      context.moveTo(this.x + index * spikeWidth, this.y + this.height);
      context.lineTo(this.x + index * spikeWidth + spikeWidth / 2, this.y + 3);
      context.lineTo(this.x + (index + 1) * spikeWidth, this.y + this.height);
      context.fill();
    }
  }

  #drawVine(context) {
    context.fillStyle = '#15803d';
    context.strokeStyle = '#166534';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(this.x, this.y + this.height);
    context.quadraticCurveTo(this.x + 20, this.y + 10, this.x + 10, this.y);
    context.quadraticCurveTo(this.x + 30, this.y + 20, this.x + this.width, this.y + this.height);
    context.fill();
    context.stroke();
    context.fillStyle = '#a855f7';
    context.beginPath();
    context.arc(this.x + 10, this.y + 12, 3, 0, Math.PI * 2);
    context.arc(this.x + 22, this.y + 28, 4, 0, Math.PI * 2);
    context.fill();
  }

  #drawBat(context) {
    const wingOffset = Math.sin(this.animationFrame) * 8;
    context.fillStyle = '#3b0764';
    context.beginPath();
    context.arc(this.x + 17, this.y + 12, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ef4444';
    context.fillRect(this.x + 14, this.y + 10, 2, 2);
    context.fillRect(this.x + 18, this.y + 10, 2, 2);
    context.fillStyle = '#2e1065';
    context.strokeStyle = '#c084fc';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(this.x + 17, this.y + 12);
    context.quadraticCurveTo(this.x + 5, this.y - 6 + wingOffset, this.x - 2, this.y + 10);
    context.quadraticCurveTo(this.x + 8, this.y + 14, this.x + 17, this.y + 12);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(this.x + 17, this.y + 12);
    context.quadraticCurveTo(this.x + 29, this.y - 6 + wingOffset, this.x + 36, this.y + 10);
    context.quadraticCurveTo(this.x + 26, this.y + 14, this.x + 17, this.y + 12);
    context.fill();
    context.stroke();
  }
}

export class BoneCollectible {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 20;
    this.markedForDeletion = false;
    this.bobbleOffset = Math.random() * Math.PI * 2;
  }

  update(gameSpeed, frameScale) {
    this.x -= gameSpeed * frameScale;
    this.bobbleOffset += 0.08 * frameScale;
    if (this.x + this.width < -20) this.markedForDeletion = true;
  }

  draw(context) {
    const renderY = this.y + Math.sin(this.bobbleOffset) * 5;
    context.save();
    context.translate(this.x + 12, renderY + 10);
    context.rotate(0.2);
    context.shadowColor = '#fef08a';
    context.shadowBlur = 10;
    context.fillStyle = '#fef08a';
    context.fillRect(-8, -3, 16, 6);
    context.beginPath();
    context.arc(-8, -4, 4, 0, Math.PI * 2);
    context.arc(-8, 4, 4, 0, Math.PI * 2);
    context.arc(8, -4, 4, 0, Math.PI * 2);
    context.arc(8, 4, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

export class Particle {
  constructor(x, y, velocityX, velocityY, color, size, life) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.markedForDeletion = false;
  }

  update(frameScale) {
    this.x += this.velocityX * frameScale;
    this.y += this.velocityY * frameScale;
    this.life -= frameScale;
    if (this.life <= 0) this.markedForDeletion = true;
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.life / this.maxLife;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
