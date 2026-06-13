// Physics and Simulation Engine for Aether Resonance

import { haptics } from './haptics.js';
import { audio } from './audio.js';

export class Particle {
  constructor(x, y, vx, vy, color, lifeTime = 3.0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.color = color; // Expect HSL string e.g. "320" (magenta)
    this.life = 1.0;    // 1.0 down to 0.0
    this.lifeTime = lifeTime; // in seconds
    this.history = [];  // trail history
    this.maxHistory = 10;
  }

  update(dt, gravityY, friction) {
    // Record history for motion blur trails
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Apply forces
    this.vy += gravityY * dt;
    this.vx *= Math.pow(friction, dt);
    this.vy *= Math.pow(friction, dt);

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Decay life
    this.life -= (1 / this.lifeTime) * dt;
  }

  draw(ctx) {
    // Dynamically calculate hue based on remaining life (shifts color over time)
    const startHue = parseInt(this.color) || 180;
    const currentHue = (startHue + (1.0 - this.life) * 125) % 360;

    if (this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = `hsla(${currentHue}, 95%, 60%, ${this.life * 0.45})`;
      ctx.lineWidth = this.radius * 1.5;
      ctx.stroke();
    }

    // Draw particle head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${currentHue}, 100%, 75%, ${this.life})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsl(${currentHue}, 100%, 60%)`;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }
}

// Base class for interactive elements placed on screen
export class SimulationElement {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.isDragging = false;
    this.hovered = false;
  }

  isPointInside(px, py) {
    return false;
  }

  update(dt) {}
  draw(ctx) {}
}

// Bouncer Element: circular node that plays a synth note when hit
export class BouncerNode extends SimulationElement {
  constructor(id, x, y, radius = 35) {
    super(id, 'bouncer', x, y);
    this.radius = radius;
    this.baseRadius = radius;
    this.pulse = 0.0; // visual pulse expand when hit
    this.hue = Math.floor(Math.random() * 60) + 310; // magenta/pink hues default
    this.hueShift = Math.floor(Math.random() * 360);
    this.triggerCount = 0;
  }

  isPointInside(px, py) {
    const dist = Math.hypot(px - this.x, py - this.y);
    return dist <= this.radius + 5;
  }

  update(dt) {
    if (this.pulse > 0.0) {
      this.pulse -= dt * 4.0; // returns to normal size quickly
      if (this.pulse < 0) this.pulse = 0;
    }
  }

  trigger(normalizedCollisionIntensity) {
    this.pulse = 1.0;
    this.triggerCount++;
    this.hueShift = (this.hueShift + 35) % 360;

    // Trigger haptics depending on intensity
    if (normalizedCollisionIntensity > 0.7) {
      haptics.trigger('node-hit-heavy');
    } else if (normalizedCollisionIntensity > 0.3) {
      haptics.trigger('node-hit-medium');
    } else {
      haptics.trigger('node-hit-light');
    }

    // Play Synth Note: map node Y height to scale frequency
    // Height is normalized by coordinate (mapped to 0.0 - 1.0 range)
    // Panning is based on X coordinate
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const dynamicRadius = this.baseRadius + this.pulse * 12;
    const finalHue = (this.hue + this.hueShift) % 360;

    // Neon Cyber Grid reflection ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, dynamicRadius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${finalHue}, 100%, 50%, ${this.isDragging ? 0.9 : 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Solid core
    ctx.beginPath();
    ctx.arc(this.x, this.y, dynamicRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.hovered ? `rgba(20, 20, 30, 0.95)` : `rgba(10, 10, 15, 0.85)`;
    ctx.strokeStyle = this.hovered 
      ? `rgba(0, 255, 255, 0.9)` 
      : `hsla(${finalHue}, 100%, 60%, ${0.5 + this.pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10 + this.pulse * 20;
    ctx.shadowColor = `hsl(${finalHue}, 100%, 50%)`;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw tech crosshairs inside
    ctx.beginPath();
    ctx.moveTo(this.x - 6, this.y);
    ctx.lineTo(this.x + 6, this.y);
    ctx.moveTo(this.x, this.y - 6);
    ctx.lineTo(this.x, this.y + 6);
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + this.pulse * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Trigger HUD label
    if (this.triggerCount > 0) {
      ctx.font = '9px "Orbitron", monospace';
      ctx.fillStyle = `rgba(0, 255, 255, 0.8)`;
      ctx.fillText(`HIT_${this.triggerCount.toString().padStart(3, '0')}`, this.x - 18, this.y - 12);
    }
  }
}

// Gravity Well Node: pulls/repels particles
export class GravityWellNode extends SimulationElement {
  constructor(id, x, y, attract = true) {
    super(id, 'well', x, y);
    this.radius = 28;
    this.attract = attract; // true = pull, false = push
    this.mass = attract ? 18000 : -14000;
    this.rotation = 0;
    this.hue = attract ? 185 : 30; // 185 is cyan (blackhole), 30 is orange (pulsar)
  }

  isPointInside(px, py) {
    const dist = Math.hypot(px - this.x, py - this.y);
    return dist <= this.radius + 5;
  }

  update(dt) {
    this.rotation += (this.attract ? 2.5 : -4.0) * dt;
    this.mass = this.attract ? 18000 : -14000;
    this.hue = this.attract ? 185 : 30;
  }

  toggleMode() {
    this.attract = !this.attract;
    haptics.trigger('click');
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glowing core
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
    if (this.attract) {
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.3, '#0f0521');
      gradient.addColorStop(0.7, '#00ffff');
      gradient.addColorStop(1.0, 'transparent');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#ffaa00');
      gradient.addColorStop(0.7, '#ff3300');
      gradient.addColorStop(1.0, 'transparent');
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Drawing spiral arms
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(this.radius * 0.5, this.radius * 0.3, this.radius * 0.9, 0);
    }
    ctx.strokeStyle = this.attract ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 85, 0, 0.7)';
    ctx.stroke();

    ctx.restore();

    // Outer HUD Label
    ctx.font = '8px "Orbitron", monospace';
    ctx.fillStyle = this.attract ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 85, 0, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.attract ? 'GRAV_WELL' : 'PULSE_FLD',
      this.x,
      this.y + this.radius + 12
    );
  }
}

// Deflector Wall: line segment drawn by user
export class DeflectorWall extends SimulationElement {
  constructor(id, x1, y1, x2, y2) {
    // Coordinate x, y represents the midpoint for drag calculations
    super(id, 'wall', (x1 + x2) / 2, (y1 + y2) / 2);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.glowTimer = 0.0;
  }

  isPointInside(px, py) {
    // Check distance to segment
    const d = this.distToSegment(px, py);
    return d <= 12; // 12px tolerance for clicks
  }

  distToSegment(px, py) {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - this.x1, py - this.y1);

    let t = ((px - this.x1) * dx + (py - this.y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    return Math.hypot(px - (this.x1 + t * dx), py - (this.y1 + t * dy));
  }

  updateDrag(dx, dy) {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
    this.x = (this.x1 + this.x2) / 2;
    this.y = (this.y1 + this.y2) / 2;
  }

  update(dt) {
    if (this.glowTimer > 0.0) {
      this.glowTimer -= dt * 5.0;
      if (this.glowTimer < 0) this.glowTimer = 0;
    }
  }

  trigger() {
    this.glowTimer = 1.0;
    haptics.trigger('node-hit-light');
  }

  draw(ctx) {
    // Base dashed connection
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = this.hovered ? 'rgba(0, 255, 255, 0.9)' : `rgba(255, 255, 0, ${0.4 + this.glowTimer * 0.6})`;
    ctx.lineWidth = this.hovered ? 4 : 2;
    ctx.shadowBlur = this.glowTimer * 15;
    ctx.shadowColor = '#ffff00';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // End points caps
    ctx.beginPath();
    ctx.arc(this.x1, this.y1, 4, 0, Math.PI * 2);
    ctx.arc(this.x2, this.y2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.fill();
  }
}

// Particle Emitter: spawns particles at intervals
export class ParticleEmitter extends SimulationElement {
  constructor(id, x, y, angle = 0, rate = 0.08) {
    super(id, 'emitter', x, y);
    this.radius = 20;
    this.angle = angle; // target shoot direction
    this.rate = rate; // delay in seconds between spawns
    this.timer = 0;
    this.hue = Math.floor(Math.random() * 60) + 180; // cyan/blue emitter
  }

  isPointInside(px, py) {
    const dist = Math.hypot(px - this.x, py - this.y);
    return dist <= this.radius + 5;
  }

  update(dt, onSpawn) {
    this.timer += dt;
    if (this.timer >= this.rate) {
      this.timer = 0;
      // Calculate velocity based on angle
      const speed = 150 + Math.random() * 60;
      const spread = (Math.random() * 0.15 - 0.075) * Math.PI; // tiny spray spread
      const vx = Math.cos(this.angle + spread) * speed;
      const vy = Math.sin(this.angle + spread) * speed;
      onSpawn(this.x, this.y, vx, vy, this.hue);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Draw emitter shape (cyber polygon nozzle)
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.5, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.8, 0);
    ctx.lineTo(-this.radius * 0.5, -this.radius * 0.7);
    ctx.closePath();

    ctx.fillStyle = this.hovered ? 'rgba(0, 255, 255, 0.4)' : 'rgba(20, 20, 30, 0.9)';
    ctx.strokeStyle = this.hovered ? 'rgba(0, 255, 255, 1.0)' : `hsl(${this.hue}, 100%, 60%)`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;

    // Outer range indicators
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]); // reset
  }
}

// Central Physics Engine
export class PhysicsEngine {
  constructor() {
    this.particles = [];
    this.elements = [];
    this.gravityY = 120; // pixels / s^2
    this.friction = 0.99; // air resistance
    this.maxParticles = 300;
  }

  addParticle(x, y, vx, vy, color) {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particle
      this.particles.shift();
    }
    this.particles.push(new Particle(x, y, vx, vy, color));
  }

  addElement(element) {
    this.elements.push(element);
  }

  removeElement(id) {
    this.elements = this.elements.filter(el => el.id !== id);
  }

  clear() {
    this.particles = [];
    this.elements = [];
  }

  update(width, height, dt) {
    // Avoid giant physics jumps if tab goes inactive
    if (dt > 0.1) dt = 0.1;

    // Update emitters first to spawn particles
    this.elements.forEach(el => {
      el.update(dt);
      if (el.type === 'emitter') {
        el.update(dt, (px, py, pvx, pvy, phue) => {
          this.addParticle(px, py, pvx, pvy, phue);
        });
      }
    });

    // Update particles and handle collisions
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt, this.gravityY, this.friction);

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Check wall/boundary collisions (canvas edges)
      const elasticity = 0.85;
      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx = -p.vx * elasticity;
        haptics.trigger('node-hit-light');
      } else if (p.x > width - p.radius) {
        p.x = width - p.radius;
        p.vx = -p.vx * elasticity;
        haptics.trigger('node-hit-light');
      }

      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy = -p.vy * elasticity;
        haptics.trigger('node-hit-light');
      } else if (p.y > height - p.radius) {
        // Floor contact: bounce or dissolve
        p.y = height - p.radius;
        p.vy = -p.vy * elasticity;
        // If speed is very low, dissolve faster
        if (Math.hypot(p.vx, p.vy) < 20) {
          p.life -= 0.1;
        }
      }

      // Apply interactions from Gravity Wells
      this.elements.forEach(el => {
        if (el.type === 'well') {
          const dx = el.x - p.x;
          const dy = el.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < el.radius) {
            // Evaporate particle inside core
            p.life = 0; // dies
            // Trigger heavy sound/haptic
            haptics.trigger('node-hit-heavy');
          } else if (dist < 320) {
            // Force formula: Mass / dist^1.5 (softened gravity)
            const force = el.mass / (Math.pow(dist, 1.5) + 50);
            p.vx += (dx / dist) * force * dt;
            p.vy += (dy / dist) * force * dt;
          }
        }
      });

      // Check obstacle collisions (Bouncers)
      this.elements.forEach(el => {
        if (el.type === 'bouncer') {
          const dx = p.x - el.x;
          const dy = p.y - el.y;
          const dist = Math.hypot(dx, dy);

          if (dist < el.radius + p.radius) {
            // Collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            // Move particle out of collision
            p.x = el.x + nx * (el.radius + p.radius + 0.1);
            p.y = el.y + ny * (el.radius + p.radius + 0.1);

            // Reflect velocity: V_new = V - (1+e) * (V dot N) * N
            const dot = p.vx * nx + p.vy * ny;
            const bounceElasticity = 1.05; // slightly bouncy, adds energy!
            p.vx = p.vx - (1 + bounceElasticity) * dot * nx;
            p.vy = p.vy - (1 + bounceElasticity) * dot * ny;

            // Add raw energy speed cap
            const currentSpeed = Math.hypot(p.vx, p.vy);
            if (currentSpeed > 600) {
              p.vx = (p.vx / currentSpeed) * 600;
              p.vy = (p.vy / currentSpeed) * 600;
            }

            // Trigger node interaction
            const speedRatio = Math.min(1.0, currentSpeed / 400);
            el.trigger(speedRatio);

            // Play synth note
            // Normalised height on canvas: Y coordinate
            const normalizedY = el.y / height;
            // Panning: X coordinate
            const normalizedPan = (el.x / width) * 2 - 1; // -1.0 to 1.0
            audio.triggerNote(normalizedY, normalizedPan);
          }
        }
      });

      // Check Deflector Wall collisions (Line-Segment)
      this.elements.forEach(el => {
        if (el.type === 'wall') {
          // Check vector projection distance
          const dx = el.x2 - el.x1;
          const dy = el.y2 - el.y1;
          const segmentLengthSquared = dx * dx + dy * dy;
          if (segmentLengthSquared === 0) return;

          const t = Math.max(0, Math.min(1, ((p.x - el.x1) * dx + (p.y - el.y1) * dy) / segmentLengthSquared));
          const cx = el.x1 + t * dx;
          const cy = el.y1 + t * dy;
          const dist = Math.hypot(p.x - cx, p.y - cy);

          if (dist < p.radius + 3) {
            // Collision normal vector
            let nx = p.x - cx;
            let ny = p.y - cy;
            const len = Math.hypot(nx, ny);
            if (len === 0) {
              // Edge case: directly on line
              nx = -dy;
              ny = dx;
            } else {
              nx /= len;
              ny /= len;
            }

            // Move particle out
            p.x = cx + nx * (p.radius + 3.1);
            p.y = cy + ny * (p.radius + 3.1);

            // Reflect
            const dot = p.vx * nx + p.vy * ny;
            const wallElasticity = 0.9;
            p.vx = p.vx - (1 + wallElasticity) * dot * nx;
            p.vy = p.vy - (1 + wallElasticity) * dot * ny;

            el.trigger();
          }
        }
      });
    }
  }
}
