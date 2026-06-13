// Web Audio Engine for Aether Resonance (Cyberpunk Synth Sandbox)

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.dryGain = null;

    // Synth Parameters
    this.params = {
      waveform: 'triangle',
      cutoff: 1200, // Hz
      Q: 4,         // Resonance
      attack: 0.02, // Seconds
      decay: 0.15,  // Seconds
      sustain: 0.2, // Level (0-1)
      release: 0.4, // Seconds
      delayTime: 0.35, // Seconds
      delayFeedback: 0.4, // 0-0.9
      reverbMix: 0.3,    // 0-1
      muted: false
    };

    // Pentatonic scale frequencies (A minor pentatonic)
    this.scale = [
      110.00, // A2
      130.81, // C3
      146.83, // D3
      164.81, // E3
      196.00, // G3
      220.00, // A3
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
      1760.00  // A6
    ];

    this.scaleNames = [
      'A2', 'C3', 'D3', 'E3', 'G3',
      'A3', 'C4', 'D4', 'E4', 'G4',
      'A4', 'C5', 'D5', 'E5', 'G5',
      'A5', 'C6', 'D6', 'E6', 'G6',
      'A6'
    ];
  }

  // Initialize Web Audio context (must be called from a user interaction)
  init() {
    if (this.ctx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Volume Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Setup FX Chain
    this.setupFX();
  }

  setupFX() {
    const ctx = this.ctx;

    // Delay Node
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(this.params.delayTime, ctx.currentTime);
    
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(this.params.delayFeedback, ctx.currentTime);

    // Reverb Convolver Node
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulseResponse(2.5, 2.0); // 2.5s decay, 2s pre-delay simulation

    // Dry & Wet Gains
    this.dryGain = ctx.createGain();
    this.reverbGain = ctx.createGain();
    
    this.dryGain.gain.setValueAtTime(1.0 - this.params.reverbMix, ctx.currentTime);
    this.reverbGain.gain.setValueAtTime(this.params.reverbMix, ctx.currentTime);

    // Connections:
    // Synth output will connect to delayNode and dryGain
    // delayNode -> delayFeedback -> delayNode (feedback loop)
    // delayNode -> dryGain & reverbNode
    // dryGain -> masterGain
    // reverbNode -> reverbGain -> masterGain
    
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.dryGain);
    this.delayNode.connect(this.reverbNode);

    this.dryGain.connect(this.masterGain);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  // Generate synthetic impulse response for reverb
  createReverbImpulseResponse(duration, decay) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      // Exponential decay of random noise
      const decayEnvelope = Math.exp(-i / (sampleRate * decay));
      const percent = i / length;
      // Add a bit of comb-filtering or pre-delay feel
      const comb = percent > 0.02 ? 1 : 0;
      
      left[i] = (Math.random() * 2 - 1) * decayEnvelope * comb;
      right[i] = (Math.random() * 2 - 1) * decayEnvelope * comb;
    }

    return impulse;
  }

  // Play a synth note
  triggerNote(normalizedValue, pan = 0.0) {
    if (!this.ctx || this.params.muted) return;

    // Update active note HUD readout
    const noteVal = 1.0 - normalizedValue;
    const noteIndex = Math.floor(noteVal * this.scale.length);
    const clampedNoteIndex = Math.max(0, Math.min(this.scale.length - 1, noteIndex));
    const noteName = this.scaleNames[clampedNoteIndex];

    const noteEl = document.getElementById('note-val');
    if (noteEl) {
      noteEl.textContent = noteName;
      noteEl.style.transition = 'none';
      noteEl.style.color = 'var(--neon-magenta)';
      noteEl.style.textShadow = '0 0 10px var(--neon-magenta)';
      setTimeout(() => {
        noteEl.style.transition = 'color 0.4s ease, text-shadow 0.4s ease';
        noteEl.style.color = 'var(--neon-yellow)';
        noteEl.style.textShadow = 'none';
      }, 40);
    }
    
    // Resume audio context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Get quantized frequency
    const freq = this.getQuantizedFrequency(normalizedValue);

    // Create synth components
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    osc.type = this.params.waveform;
    osc.frequency.setValueAtTime(freq, now);

    // Apply filter envelope
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(this.params.Q, now);
    
    // Sweep cutoff frequency based on note trigger
    filter.frequency.setValueAtTime(freq, now); // start at note frequency
    filter.frequency.exponentialRampToValueAtTime(this.params.cutoff, now + this.params.attack + 0.05);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + this.params.attack + this.params.decay + 0.1);

    // Apply volume envelope (ADSR)
    gainNode.gain.setValueAtTime(0, now);
    // Attack
    gainNode.gain.linearRampToValueAtTime(0.8, now + this.params.attack);
    // Decay to Sustain
    gainNode.gain.exponentialRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);
    // Release (schedule after trigger length, which is short for particles)
    const duration = 0.1; // active hold time
    const releaseStart = now + this.params.attack + this.params.decay + duration;
    gainNode.gain.setValueAtTime(this.params.sustain, releaseStart);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + this.params.release);

    // Stereo Panning
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);

    // Connections: Osc -> Filter -> Panner -> Gain -> Master / Delay
    osc.connect(filter);
    filter.connect(panner);
    panner.connect(gainNode);

    // Route to Dry & Delay
    gainNode.connect(this.dryGain);
    gainNode.connect(this.delayNode);

    // Start & Stop
    osc.start(now);
    osc.stop(releaseStart + this.params.release + 0.1);
  }

  // Play a deep bass hit (visual/audio haptics)
  triggerSubThud() {
    if (!this.ctx || this.params.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55.0, now); // A1 bass thump
    osc.frequency.exponentialRampToValueAtTime(30.0, now + 0.18); // slide down

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(1.0, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Play a UI click sound
  triggerUIClick() {
    if (!this.ctx || this.params.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Map 0-1 scale to the pentatonic array (high Y values = lower frequencies)
  getQuantizedFrequency(normalizedValue) {
    // Invert normalized value so top of screen (0.0 Y) is high notes, bottom (1.0 Y) is low notes
    const value = 1.0 - normalizedValue;
    const index = Math.floor(value * this.scale.length);
    const clampedIndex = Math.max(0, Math.min(this.scale.length - 1, index));
    return this.scale[clampedIndex];
  }

  // Parameter Updaters
  updateParams(key, val) {
    this.params[key] = val;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (key === 'delayTime' && this.delayNode) {
      this.delayNode.delayTime.setTargetAtTime(val, now, 0.1);
    }
    if (key === 'delayFeedback' && this.delayFeedback) {
      this.delayFeedback.gain.setTargetAtTime(val, now, 0.1);
    }
    if (key === 'reverbMix') {
      if (this.dryGain) this.dryGain.gain.setValueAtTime(1.0 - val, now);
      if (this.reverbGain) this.reverbGain.gain.setValueAtTime(val, now);
    }
  }

  toggleMute() {
    this.params.muted = !this.params.muted;
    return this.params.muted;
  }
}

export const audio = new AudioEngine();
