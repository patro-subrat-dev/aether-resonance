// Main Conductor Script for Aether Resonance Cyberpunk Sandbox

import './style.css';
import { audio } from './audio.js';
import { haptics } from './haptics.js';
import { PhysicsEngine, BouncerNode, GravityWellNode, ParticleEmitter, DeflectorWall } from './physics.js';

// Setup elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const physics = new PhysicsEngine();

// UI Elements mapping
const initOverlay = document.getElementById('init-overlay');
const btnBootCore = document.getElementById('btn-boot-core');
const infoTrigger = document.getElementById('info-trigger');
const infoModal = document.getElementById('info-modal');
const btnCloseModal = document.querySelector('.btn-close-modal');
const mobileToggle = document.getElementById('mobile-toggle');
const sidebar = document.getElementById('hud-sidebar');

// Telemetry fields
const telemetryFps = document.getElementById('fps-val');
const telemetryParticles = document.getElementById('particles-val');
const telemetryTriggers = document.getElementById('triggers-val');
const telemetryElements = document.getElementById('elements-val');

// Tool buttons
const tools = {
  select: document.getElementById('tool-select'),
  bouncer: document.getElementById('tool-bouncer'),
  well: document.getElementById('tool-well'),
  emitter: document.getElementById('tool-emitter'),
  wall: document.getElementById('tool-wall')
};

// Parameter controls
const controlWave = document.getElementById('synth-wave');
const controlCutoff = document.getElementById('param-cutoff');
const controlQ = document.getElementById('param-q');
const controlDecay = document.getElementById('param-decay');
const controlFeedback = document.getElementById('param-feedback');
const controlReverb = document.getElementById('param-reverb');
const controlGravity = document.getElementById('param-gravity');
const controlFriction = document.getElementById('param-friction');

const valCutoff = document.getElementById('val-cutoff');
const valQ = document.getElementById('val-q');
const valDecay = document.getElementById('val-decay');
const valFeedback = document.getElementById('val-feedback');
const valReverb = document.getElementById('val-reverb');
const valGravity = document.getElementById('val-gravity');
const valFriction = document.getElementById('val-friction');

// Preset buttons
const presets = {
  rave: document.getElementById('preset-rave'),
  space: document.getElementById('preset-space'),
  trap: document.getElementById('preset-trap'),
  chaos: document.getElementById('preset-chaos')
};

// Toggle inputs
const toggleVibration = document.getElementById('toggle-vibration');
const toggleGlitches = document.getElementById('toggle-glitches');
const toggleThuds = document.getElementById('toggle-thuds');

// Footer controls
const btnClear = document.getElementById('btn-clear');
const btnMute = document.getElementById('btn-mute');

// State
let activeTool = 'select';
let isDrawingWall = false;
let wallStart = { x: 0, y: 0 };
let wallEnd = { x: 0, y: 0 };
let draggedElement = null;
let dragOffset = { x: 0, y: 0 };
let dragStartMidpoint = { x: 0, y: 0 };
let elementCounter = 0;
let isCoreInitialized = false;

// FPS tracking variables
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsTimer = 0;

// Resize Canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initial Boot click
btnBootCore.addEventListener('click', () => {
  audio.init();
  isCoreInitialized = true;

  // Swell audio effect to signal startup
  audio.triggerUIClick();
  setTimeout(() => {
    audio.triggerSubThud();
  }, 150);

  // Fade out screen
  initOverlay.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  initOverlay.style.opacity = 0;
  initOverlay.style.transform = 'scale(1.05)';
  setTimeout(() => {
    initOverlay.style.display = 'none';
  }, 600);

  // Load default preset after startup
  loadPreset('rave');
});

// Sidebar tool selector
Object.keys(tools).forEach(toolName => {
  tools[toolName].addEventListener('click', () => {
    activeTool = toolName;
    haptics.trigger('click');
    
    // Toggle active classes
    Object.keys(tools).forEach(tn => tools[tn].classList.remove('active'));
    tools[toolName].classList.add('active');
  });
});

// Modal Actions
infoTrigger.addEventListener('click', () => {
  infoModal.classList.add('active');
  haptics.trigger('click');
});

btnCloseModal.addEventListener('click', () => {
  infoModal.classList.remove('active');
  haptics.trigger('click');
});

// Close modal when clicking outside content
infoModal.addEventListener('click', (e) => {
  if (e.target === infoModal) {
    infoModal.classList.remove('active');
    haptics.trigger('click');
  }
});

// Mobile toggle
mobileToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  haptics.trigger('click');
});

// Param Inputs bindings
controlWave.addEventListener('change', (e) => {
  audio.updateParams('waveform', e.target.value);
  haptics.trigger('click');
});

controlCutoff.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  valCutoff.textContent = `${val}Hz`;
  audio.updateParams('cutoff', val);
});

controlQ.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valQ.textContent = val;
  audio.updateParams('Q', val);
});

controlDecay.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valDecay.textContent = `${val.toFixed(2)}s`;
  audio.updateParams('decay', val);
});

controlFeedback.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  valFeedback.textContent = `${val}%`;
  audio.updateParams('delayFeedback', val / 100);
});

controlReverb.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  valReverb.textContent = `${val}%`;
  audio.updateParams('reverbMix', val / 100);
});

controlGravity.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  valGravity.textContent = `${val} px/s²`;
  physics.gravityY = val;
});

controlFriction.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  valFriction.textContent = `${val.toFixed(1)}%`;
  physics.friction = 1.0 - val / 100;
});

// Toggle control boxes
toggleVibration.addEventListener('change', (e) => {
  haptics.enabled = e.target.checked;
  haptics.trigger('click');
});

toggleGlitches.addEventListener('change', (e) => {
  // handled directly via state check inside main loop
  haptics.trigger('click');
});

toggleThuds.addEventListener('change', (e) => {
  // handled via mute settings inside haptics or main
  haptics.trigger('click');
});

// Footer Actions
btnClear.addEventListener('click', () => {
  physics.clear();
  haptics.trigger('glitch-burst');
});

btnMute.addEventListener('click', () => {
  const isMuted = audio.toggleMute();
  btnMute.textContent = isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND';
  btnMute.classList.toggle('active', isMuted);
  haptics.trigger('click');
});

// Presets Configurator
function loadPreset(presetName) {
  physics.clear();
  haptics.trigger('glitch-burst');

  const width = canvas.width;
  const height = canvas.height;

  switch (presetName) {
    case 'rave':
      // Rave setup: High arpeggiator, lots of synth bouncers, emitters shooting down
      controlWave.value = 'triangle';
      audio.updateParams('waveform', 'triangle');
      
      controlCutoff.value = '2500';
      valCutoff.textContent = '2500Hz';
      audio.updateParams('cutoff', 2500);

      controlQ.value = '6';
      valQ.textContent = '6';
      audio.updateParams('Q', 6);

      controlDecay.value = '0.12';
      valDecay.textContent = '0.12s';
      audio.updateParams('decay', 0.12);

      controlFeedback.value = '55';
      valFeedback.textContent = '55%';
      audio.updateParams('delayFeedback', 0.55);

      controlReverb.value = '25';
      valReverb.textContent = '25%';
      audio.updateParams('reverbMix', 0.25);

      controlGravity.value = '150';
      valGravity.textContent = '150 px/s²';
      physics.gravityY = 150;

      controlFriction.value = '0.8';
      valFriction.textContent = '0.8%';
      physics.friction = 0.992;

      // Add a couple of bouncers, an emitter, and a deflector
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.2, height * 0.2, 0.2, 0.08));
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.8, height * 0.2, Math.PI - 0.2, 0.08));

      physics.addElement(new BouncerNode(++elementCounter, width * 0.35, height * 0.45, 30));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.65, height * 0.45, 30));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.5, height * 0.65, 45));

      physics.addElement(new DeflectorWall(++elementCounter, width * 0.1, height * 0.7, width * 0.4, height * 0.8));
      physics.addElement(new DeflectorWall(++elementCounter, width * 0.9, height * 0.7, width * 0.6, height * 0.8));
      break;

    case 'space':
      // Space Drift: Slow floating ambient, negative gravity, big black hole in center
      controlWave.value = 'sine';
      audio.updateParams('waveform', 'sine');

      controlCutoff.value = '1000';
      valCutoff.textContent = '1000Hz';
      audio.updateParams('cutoff', 1000);

      controlQ.value = '2';
      valQ.textContent = '2';
      audio.updateParams('Q', 2);

      controlDecay.value = '0.45';
      valDecay.textContent = '0.45s';
      audio.updateParams('decay', 0.45);

      controlFeedback.value = '20';
      valFeedback.textContent = '20%';
      audio.updateParams('delayFeedback', 0.2);

      controlReverb.value = '70';
      valReverb.textContent = '70%';
      audio.updateParams('reverbMix', 0.7);

      controlGravity.value = '-20';
      valGravity.textContent = '-20 px/s²';
      physics.gravityY = -20;

      controlFriction.value = '2.5';
      valFriction.textContent = '2.5%';
      physics.friction = 0.975;

      // Gravity well in the center
      physics.addElement(new GravityWellNode(++elementCounter, width / 2, height / 2, true));
      
      // Emitters shooting up from bottom corners
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.1, height * 0.8, -Math.PI / 4, 0.15));
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.9, height * 0.8, -3 * Math.PI / 4, 0.15));

      // Mellow node surrounding it
      physics.addElement(new BouncerNode(++elementCounter, width * 0.3, height * 0.35, 40));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.7, height * 0.35, 40));
      break;

    case 'trap':
      // Gravity Trap: Strong positive gravity, particles get captured in circular orbits
      controlWave.value = 'square';
      audio.updateParams('waveform', 'square');

      controlCutoff.value = '900';
      valCutoff.textContent = '900Hz';
      audio.updateParams('cutoff', 900);

      controlQ.value = '8';
      valQ.textContent = '8';
      audio.updateParams('Q', 8);

      controlDecay.value = '0.08';
      valDecay.textContent = '0.08s';
      audio.updateParams('decay', 0.08);

      controlFeedback.value = '60';
      valFeedback.textContent = '60%';
      audio.updateParams('delayFeedback', 0.6);

      controlReverb.value = '15';
      valReverb.textContent = '15%';
      audio.updateParams('reverbMix', 0.15);

      controlGravity.value = '240';
      valGravity.textContent = '240 px/s²';
      physics.gravityY = 240;

      controlFriction.value = '0.3';
      valFriction.textContent = '0.3%';
      physics.friction = 0.997;

      // Gravity Well at center pulls down, emitters on top, deflector sliding into bouncer
      physics.addElement(new GravityWellNode(++elementCounter, width / 2, height * 0.6, true));
      
      physics.addElement(new ParticleEmitter(++elementCounter, width / 2, height * 0.15, Math.PI / 2, 0.05));
      
      physics.addElement(new BouncerNode(++elementCounter, width * 0.35, height * 0.75, 25));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.65, height * 0.75, 25));

      physics.addElement(new DeflectorWall(++elementCounter, width * 0.2, height * 0.3, width * 0.45, height * 0.45));
      physics.addElement(new DeflectorWall(++elementCounter, width * 0.8, height * 0.3, width * 0.55, height * 0.45));
      break;

    case 'chaos':
      // Chaos Gate: Sawtooth lead, zero gravity, massive crossfire
      controlWave.value = 'sawtooth';
      audio.updateParams('waveform', 'sawtooth');

      controlCutoff.value = '3500';
      valCutoff.textContent = '3500Hz';
      audio.updateParams('cutoff', 3500);

      controlQ.value = '5';
      valQ.textContent = '5';
      audio.updateParams('Q', 5);

      controlDecay.value = '0.14';
      valDecay.textContent = '0.14s';
      audio.updateParams('decay', 0.14);

      controlFeedback.value = '45';
      valFeedback.textContent = '45%';
      audio.updateParams('delayFeedback', 0.45);

      controlReverb.value = '40';
      valReverb.textContent = '40%';
      audio.updateParams('reverbMix', 0.4);

      controlGravity.value = '0';
      valGravity.textContent = '0 px/s²';
      physics.gravityY = 0;

      controlFriction.value = '0.1';
      valFriction.textContent = '0.1%';
      physics.friction = 0.999;

      // 4 emitters cross-firing
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.15, height * 0.15, Math.PI / 4, 0.12));
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.85, height * 0.15, 3 * Math.PI / 4, 0.12));
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.15, height * 0.85, -Math.PI / 4, 0.12));
      physics.addElement(new ParticleEmitter(++elementCounter, width * 0.85, height * 0.85, -3 * Math.PI / 4, 0.12));

      // Bouncers scattered
      physics.addElement(new BouncerNode(++elementCounter, width * 0.5, height * 0.25, 30));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.35, height * 0.5, 30));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.65, height * 0.5, 30));
      physics.addElement(new BouncerNode(++elementCounter, width * 0.5, height * 0.75, 30));

      // Gravity repeller in the middle
      physics.addElement(new GravityWellNode(++elementCounter, width / 2, height / 2, false)); // repeller!
      break;
  }
}

presets.rave.addEventListener('click', () => loadPreset('rave'));
presets.space.addEventListener('click', () => loadPreset('space'));
presets.trap.addEventListener('click', () => loadPreset('trap'));
presets.chaos.addEventListener('click', () => loadPreset('chaos'));


// Find element under coordinate
function getElementAt(x, y) {
  // Search in reverse so top drawn elements get selected first
  for (let i = physics.elements.length - 1; i >= 0; i--) {
    const el = physics.elements[i];
    if (el.isPointInside(x, y)) {
      return el;
    }
  }
  return null;
}

// Mouse/Touch Interaction Coordinates Helper
function getMouseCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// Canvas Pointer events
canvas.addEventListener('pointerdown', (e) => {
  if (!isCoreInitialized) return;
  const coords = getMouseCoords(e);
  
  if (activeTool === 'select') {
    const el = getElementAt(coords.x, coords.y);
    if (el) {
      draggedElement = el;
      draggedElement.isDragging = true;
      
      if (el.type === 'wall') {
        // Record current endpoints and drag offset relative to midpoint
        dragOffset.x = coords.x - el.x;
        dragOffset.y = coords.y - el.y;
      } else {
        dragOffset.x = coords.x - el.x;
        dragOffset.y = coords.y - el.y;
      }
      haptics.trigger('click');
    }
  } 
  else if (activeTool === 'bouncer') {
    // Add synth bouncer node
    physics.addElement(new BouncerNode(++elementCounter, coords.x, coords.y));
    haptics.trigger('node-hit-light');
  } 
  else if (activeTool === 'well') {
    // Add black hole well
    physics.addElement(new GravityWellNode(++elementCounter, coords.x, coords.y, true));
    haptics.trigger('node-hit-medium');
  } 
  else if (activeTool === 'emitter') {
    // Add particle emitter
    // Determine default angle (points towards center of screen)
    const angleToCenter = Math.atan2(canvas.height / 2 - coords.y, canvas.width / 2 - coords.x);
    physics.addElement(new ParticleEmitter(++elementCounter, coords.x, coords.y, angleToCenter));
    haptics.trigger('node-hit-light');
  } 
  else if (activeTool === 'wall') {
    isDrawingWall = true;
    wallStart = { x: coords.x, y: coords.y };
    wallEnd = { x: coords.x, y: coords.y };
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!isCoreInitialized) return;
  const coords = getMouseCoords(e);

  // Handle hovered styling
  if (activeTool === 'select') {
    canvas.style.cursor = 'default';
    physics.elements.forEach(el => el.hovered = false);
    const hoverEl = getElementAt(coords.x, coords.y);
    if (hoverEl) {
      hoverEl.hovered = true;
      canvas.style.cursor = 'grab';
    }

    if (draggedElement) {
      canvas.style.cursor = 'grabbing';
      const dx = coords.x - dragOffset.x - draggedElement.x;
      const dy = coords.y - dragOffset.y - draggedElement.y;

      if (draggedElement.type === 'wall') {
        draggedElement.updateDrag(dx, dy);
      } else {
        draggedElement.x = coords.x - dragOffset.x;
        draggedElement.y = coords.y - dragOffset.y;
      }
    }
  } else if (activeTool === 'wall' && isDrawingWall) {
    wallEnd = { x: coords.x, y: coords.y };
  } else {
    canvas.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('pointerup', () => {
  if (draggedElement) {
    draggedElement.isDragging = false;
    draggedElement = null;
  }

  if (activeTool === 'wall' && isDrawingWall) {
    isDrawingWall = false;
    const len = Math.hypot(wallEnd.x - wallStart.x, wallEnd.y - wallStart.y);
    if (len > 15) {
      physics.addElement(new DeflectorWall(++elementCounter, wallStart.x, wallStart.y, wallEnd.x, wallEnd.y));
      haptics.trigger('click');
    }
  }
});

// Double click to delete / toggle wells
canvas.addEventListener('dblclick', (e) => {
  if (!isCoreInitialized) return;
  const coords = getMouseCoords(e);
  const el = getElementAt(coords.x, coords.y);

  if (el) {
    if (el.type === 'well') {
      // Toggle attract vs repel mode
      el.toggleMode();
    } else {
      // Delete element
      physics.removeElement(el.id);
      haptics.trigger('click');
    }
  }
});


// Core render loop
function animate(timestamp) {
  requestAnimationFrame(animate);

  const dt = (timestamp - lastTime) / 1000.0;
  lastTime = timestamp;

  // Telemetry FPS counter updates every 0.5s
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    fps = Math.round(frameCount / fpsTimer);
    frameCount = 0;
    fpsTimer = 0;
    telemetryFps.textContent = fps;
  }

  // Clear Canvas with alpha fade for neon particle trails
  ctx.fillStyle = `rgba(5, 5, 8, ${isDrawingWall ? 0.35 : 0.25})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update physical simulations
  physics.update(canvas.width, canvas.height, dt);
  haptics.update(dt);

  // Dynamic canvas styling: glitches and screen shake
  ctx.save();
  if (toggleGlitches.checked && haptics.screenShakeLevel > 0) {
    const shakeX = (Math.random() * 2 - 1) * haptics.screenShakeLevel;
    const shakeY = (Math.random() * 2 - 1) * haptics.screenShakeLevel;
    ctx.translate(shakeX, shakeY);
  }

  // Draw cyber grid
  drawGrid();

  // Draw active simulator elements
  physics.elements.forEach(el => {
    el.draw(ctx, canvas.width, canvas.height);
  });

  // Draw particles
  physics.particles.forEach(p => {
    p.draw(ctx);
  });

  // Draw current wall vector guide line
  if (activeTool === 'wall' && isDrawingWall) {
    ctx.beginPath();
    ctx.moveTo(wallStart.x, wallStart.y);
    ctx.lineTo(wallEnd.x, wallEnd.y);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // Update Telemetry Panel UI
  telemetryParticles.textContent = `${physics.particles.length} / ${physics.maxParticles}`;
  
  // Total triggers calculated by adding up hits on Bouncers
  let totalTriggers = 0;
  physics.elements.forEach(el => {
    if (el.type === 'bouncer') totalTriggers += el.triggerCount;
  });
  telemetryTriggers.textContent = totalTriggers;
  telemetryElements.textContent = physics.elements.length;
}

// Tech Grid Render
function drawGrid() {
  const gridSize = 60;
  const w = canvas.width;
  const h = canvas.height;

  // Determine grid color (neon cyan overlay)
  let gridOpacity = 0.04;
  let gridColor = 'rgba(0, 240, 255, ';

  // Apply glitch distortion in styling
  const glitchActive = toggleGlitches.checked && haptics.visualGlitchLevel > 0;
  if (glitchActive) {
    gridOpacity = 0.05 + Math.random() * 0.08;
    // Flick between magenta and cyan on heavy hits
    if (Math.random() > 0.5) {
      gridColor = 'rgba(255, 0, 127, ';
    }
  }

  ctx.strokeStyle = gridColor + gridOpacity + ')';
  ctx.lineWidth = 0.8;

  // Draw coordinates vertical lines
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Draw coordinates horizontal lines
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw circular sub grids (crosshairs on center intersections)
  ctx.strokeStyle = gridColor + (gridOpacity * 0.4) + ')';
  for (let x = gridSize; x < w; x += gridSize * 3) {
    for (let y = gridSize; y < h; y += gridSize * 3) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Glitch Scanlines draw
  if (glitchActive && haptics.visualGlitchLevel > 0.3) {
    const glitchLines = Math.floor(haptics.visualGlitchLevel * 4);
    for (let i = 0; i < glitchLines; i++) {
      ctx.beginPath();
      const lineY = Math.random() * h;
      const thickness = Math.random() * 3 + 1;
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY + (Math.random() * 4 - 2));
      ctx.strokeStyle = `rgba(255, 0, 127, ${haptics.visualGlitchLevel * 0.35})`;
      ctx.lineWidth = thickness;
      ctx.stroke();
    }
  }
}

// Start frame animations
requestAnimationFrame(animate);
