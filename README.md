# Aether Resonance ⚡

An interactive, generative audio-visual physics sandbox built in a **Retro-Cyberpunk** design language. This project explores how interactive vector physics can drive generative ambient synthesizers and multi-layer haptic responses entirely using native browser APIs.

👉 **[Live Demo](http://localhost:5173/)** (with local dev server running)

---

## 🎨 Core Features

### 1. Cyber-HUD Console Dashboard
* **Glassmorphic Layout**: Dark theme panels styled with modern CSS backdrop-filters, glowing drop-shadows, and diagonal corner cuts (clipping paths).
* **Telemetry Monitors**: Live diagnostics tracking real-time frames-per-second (FPS), particle counts, collision triggers, and spatial elements.
* **CRT Screen Emulation**: Vignette screen distortions combined with an animated vertical laser scanline sweep to simulate a phosphor CRT screen.

### 2. Multi-Voice Synthesizer (Web Audio API)
* **Oscillators**: Selection between Triangle (warm pads), Sine (sub bass), Sawtooth (retro lead), and Square (8-bit synth).
* **Harmony Mapping**: Physics collisions map to an always-harmonious **A-Minor Pentatonic scale** (from `A2` to `A6`) based on the Y-coordinate.
* **Dynamics FX Chain**: Real-time ADSR envelopes, resonant lowpass filter sweeps, bandpass feedback delay lines, and a custom synthetic convolution reverb space.

### 3. Vector Physics Simulator (HTML5 Canvas)
* **Synth Nodes**: Circular bumpers that bounce particles back and play synth notes.
* **Gravity Wells**: Black holes or pulsars that pull particles into orbits or repel them outwards.
* **Emitters**: Cyber nozzles shooting continuous streams of vector particles.
* **Deflector Walls**: Drag-and-draw vector lines that reflect particle paths.

### 4. Triple-Layer Haptics
* **Physical Haptics**: Triggers custom rhythmic patterns using the `Navigator.vibrate` API on mobile devices.
* **Visual Haptics**: Chromatic screen-shake and neon horizontal distortion lines on heavy impacts.
* **Auditory Haptics**: Plays a transient sub-bass wave (sliding from `55Hz` down to `30Hz`) to simulate heavy impact thuds.

---

## 🛠️ Tech Stack
* **Build Tool**: Vite
* **Markup**: HTML5
* **Styling**: Vanilla CSS3 (Custom properties, grid layouts, keyframe animations)
* **Code & Logic**: ES6 JavaScript
* **Audio Synthesis**: Native Web Audio API
* **Graphics**: Canvas 2D Context API
* **Tactile Responses**: Device Vibration API

---

## 🚀 Getting Started

To run the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/patro-subrat-dev/aether-resonance.git
   cd aether-resonance
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📝 How to Interact
1. Choose an active tool in the **Simulation Tools** panel.
2. Click and drag on the canvas to place nodes or draw deflector walls.
3. Use the **Select / Drag** tool to move nodes.
4. **Double-click** a node to delete it.
5. **Double-click** a Gravity Well to toggle attract vs. repel modes.
6. Toggle **Presets** on the left to immediately load custom scenarios.

---

## 📄 License
This project is licensed under the MIT License.
