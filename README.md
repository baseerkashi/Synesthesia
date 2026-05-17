# Aura - Music Visualizer (Elite Edition)

Aura is a high-performance, browser-based music visualization web application. It leverages the HTML5 Canvas API and the Web Audio API to analyze audio frequencies and time-domain waveforms in real-time, translating them into stunning, hardware-accelerated visual art.

## What's New: Phase 1 Elite Update
Aura has been heavily upgraded to transform from a simple audio-reactive canvas into an intelligent, musical experience:

### 🧠 1. Beat Intelligence Layer
- **Spectral Flux Tracking**: Aura no longer just looks at raw volume. It calculates the difference in frequency energy between frames to track sudden musical changes.
- **Adaptive Transient Thresholds**: By keeping a rolling history of the spectral flux, Aura calculates dynamic thresholds to pinpoint kicks, snares, and heavy synth drops with mathematical precision.
- **Estimated True BPM**: Analyzes intervals between transient spikes to calculate a rolling average of the track's tempo.

### 🎭 2. Mood Classification Engine & Scene Composer
- **RMS Energy & Spectral Centroid**: The engine analyzes the perceived loudness (RMS) and the brightness (Centroid) of the audio in real-time.
- **Procedural Scene Composition**: Based on the mood, Aura's `PRO Auto VJ` mode dynamically composes scenes by pairing one of 19 base geometries with one of 21 color palettes:
  - **Aggressive (Loud + Bright)**: Triggers Neon/Fire colors with Glitch/Supernova shapes.
  - **Heavy (Loud + Dark)**: Triggers Bloodmoon/Matrix colors with Geometric/Matrix shapes.
  - **Euphoric (Medium + Bright)**: Triggers Aurora/Galaxy colors with Kaleidoscope/Currents shapes.
  - **Chill (Quiet)**: Triggers Ocean/Hologram colors with Particles/Ripple shapes.
- **Intelligent Cooldowns**: Scene changes are throttled to only happen on major drops or every 5+ seconds, preventing jarring visual flicker.

### ✨ 3. YES Mode (Affirmation Overlay Engine)
- A highly memorable, viral feature that flashes subliminal, cinematic text (`"YES"`, `"PUSH HARDER"`, `"ASCEND"`, `"NO HESITATION"`) exactly on heavy transient beat drops.

### 🎛️ 4. Master Volume Control & Web Audio Routing
- Built a dedicated `GainNode` into the Web Audio API pipeline (`Source ➡️ Analyser ➡️ Master Gain ➡️ Speakers`).
- Volume slider in the UI now accurately controls the visualizer's global audio output with `setTargetAtTime` for smooth, click-free fading.

## Features

- **Multiple Audio Sources**: 
  - 📁 **File Upload**: Select any local MP3/WAV file.
  - 🌐 **Browser Capture**: Capture system or tab audio directly.
  - 🎤 **Microphone**: Reacts instantly to your voice or ambient room audio.
  - ⏯️ **Playback Controls**: Play, pause, and volume adjustment built directly into the Now Playing UI.

- **Dynamic Visual Shapes (19 Total)**:
  - `Retro Grid (Synthwave)`, `Analog Oscilloscope`, `Hyper Vortex`, `Kaleidoscope`, `Orbital`, `Digital Oscillator`, `Spectrogram`, `Quantum Particles`, `Starfield`, `Glitch Core`, `Supernova Burst`, `Matrix 3D Flow`, `Currents`, and more.

- **Premium Aesthetics & Themes (21 Total)**:
  - Features a glassmorphism UI overlay and smooth micro-animations.
  - Includes heavily curated color palettes: `Retrowave`, `The Matrix`, `Cyberpunk`, `Aurora`, `Hellfire`, `Deep Ocean`, `Neon`, `Vaporwave`, `Tokyo Drift`, and more.
  - **Interactive Physics**: Visual geometries bend, repel, and warp based on your mouse movements.
  - **CRT Scanline Filter**: A toggleable post-processing effect simulating an authentic retro arcade monitor.
  - **Chromatic Aberration**: Camera shaking and RGB splitting on heavy beat drops.

## Tech Stack
- **Framework**: Vite
- **Core**: Vanilla JavaScript (ES6+), HTML5
- **Graphics**: HTML5 `<canvas>` (2D Context)
- **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`, `GainNode`)
- **Styling**: Pure Vanilla CSS with CSS Variables

## How to Run Locally
1. Ensure you have Node.js installed.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the local development server.
4. Open the provided `localhost` link in your browser.
