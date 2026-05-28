// Tactile and Visual Haptic Coordinator for Aether Resonance

import { audio } from './audio.js';

class HapticCoordinator {
  constructor() {
    this.enabled = true;
    this.visualGlitchLevel = 0; // 0 to 1, decays over time
    this.screenShakeLevel = 0;  // Pixels of screen shake
  }

  // Trigger tactile response based on type
  trigger(type) {
    if (!this.enabled) return;

    // Check navigator vibration support
    const canVibrate = 'vibrate' in navigator;

    switch (type) {
      case 'click':
        // Extremely subtle UI click
        if (canVibrate) navigator.vibrate(10);
        audio.triggerUIClick();
        break;

      case 'node-hit-light':
        // Lightweight collision
        if (canVibrate) navigator.vibrate(15);
        this.visualGlitchLevel = Math.max(this.visualGlitchLevel, 0.15);
        break;

      case 'node-hit-medium':
        // Medium collision
        if (canVibrate) navigator.vibrate(25);
        this.visualGlitchLevel = Math.max(this.visualGlitchLevel, 0.3);
        this.screenShakeLevel = Math.max(this.screenShakeLevel, 3);
        break;

      case 'node-hit-heavy':
        // Heavy collision, e.g. wall bounce or blackhole crossing
        if (canVibrate) {
          navigator.vibrate([35, 15, 20]);
        }
        this.visualGlitchLevel = Math.max(this.visualGlitchLevel, 0.65);
        this.screenShakeLevel = Math.max(this.screenShakeLevel, 8);
        audio.triggerSubThud(); // Produce a deep sub-bass vibration wave
        break;

      case 'glitch-burst':
        // Cyberpunk style glitch burst
        if (canVibrate) {
          navigator.vibrate([10, 5, 20, 10, 5]);
        }
        this.visualGlitchLevel = Math.max(this.visualGlitchLevel, 0.8);
        this.screenShakeLevel = Math.max(this.screenShakeLevel, 12);
        audio.triggerSubThud();
        break;
        
      default:
        if (canVibrate) navigator.vibrate(15);
        break;
    }
  }

  // Decay visual filters in the render loop
  update(deltaTime) {
    // Decay visual glitch level
    if (this.visualGlitchLevel > 0) {
      this.visualGlitchLevel -= deltaTime * 2.5; // decays quickly
      if (this.visualGlitchLevel < 0) this.visualGlitchLevel = 0;
    }

    // Decay screen shake
    if (this.screenShakeLevel > 0) {
      this.screenShakeLevel -= deltaTime * 35; // decays quickly
      if (this.screenShakeLevel < 0) this.screenShakeLevel = 0;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const haptics = new HapticCoordinator();
