# Aether Resonance 🌌🎛️

**Aether Resonance** is an interactive, generative audio-visual physics sandbox built for the web. It features a retro-cyberpunk aesthetic, a custom Web Audio synthesizer, and high-performance HTML5 Canvas physics simulations. 

👉 **[Live Demo](https://patro-subrat-dev.github.io/aether-resonance/)**

It explores the intersection of kinetic movement, real-time sound design, and haptic feedback to create a truly mesmerizing digital instrument and visualizer.

## 🚀 Features
- **High-Performance Physics Engine**: Eulerian particle updates, custom collision detection (circle-circle, vector projection for lines), and gravity/repulsion wells.
- **Web Audio API Synth Engine**: Real-time sound synthesis tied directly to physical collisions on the canvas. Features custom oscillators, dynamic filter sweeps, feedback delay lines, and a synthetic reverb impulse response.
- **Sensory Haptic Feedback**: Integrates the Navigator Vibration API and visual screen-shake/glitches to provide physical feedback to the user on mobile devices.
- **Interactive Cyberpunk HUD**: A glassmorphic, neon-drenched user interface to control physics parameters, synth waveforms, and simulation elements in real-time.
- **Built-in Presets**: Quickly jump between distinct experiences like 'Rave', 'Space Drift', 'Gravity Trap', and 'Chaos Gate'.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5 Canvas 2D, CSS3 (CSS Variables, Flexbox, Glassmorphism).
- **APIs**: Web Audio API, Navigator Vibration API.
- **Build Tool**: Vite (Lightning fast HMR and optimized build).

## 🎮 How to Play

1. **Boot Core**: Initialize the audio engine and start the simulation.
2. **Select Tools**: Use the sidebar to spawn Bouncer Nodes, Gravity Wells, Particle Emitters, and Deflector Walls.
3. **Tweak Parameters**: Modify audio parameters (Cutoff, Q, Decay, Delay, Reverb) and physics parameters (Gravity, Friction) in real-time.
4. **Interact**: Drag and drop elements, draw deflector walls, and watch the particles react and generate music!

## ⚙️ Installation & Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` link in your browser.

## 🧠 Recent Optimizations

- **O(1) Memory Management**: Particle lifecycle management uses O(1) swap-and-pop arrays to prevent garbage collection stuttering during heavy loads.
- **Pre-allocated Buffers**: Motion blur trails use pre-allocated buffers rather than dynamic array manipulation.
- **Fast Math**: Utilizing squared distance comparisons for collision bound checks to avoid expensive square root calculations in the hot loop.

---
*Built with ❤️ for a Hackathon.*
