# Aura Cinematic Engine (VJ Platform)

Aura has been overhauled from a simple audio-reactive canvas into an **elite, performance-resilient digital stage organism**. Leveraging a custom hybrid graphics engine (WebGL/Three.js + Canvas2D API) and a deterministic cinematic timeline, Aura acts as an autonomous visual jockey (Auto VJ) capable of driving production-grade visual sets.

## 🚀 Engine Architecture & Spectacles

The system relies on a modular `Spectacle` architecture, where distinct, highly-detailed 3D and 2D environments (Spectacles) interpolate seamlessly based on a unified Timeline Engine and global audio-reactive states.

### Flagship Visualizers (The Core Spectacles)
- **Donda Pyramid Spectacle**: A towering, stable monolithic pyramid wrapped in cinematic volumetric fog, divine light shafts, and reactive obsidian textures.
- **Graduation Rebirth**: A hyper-pop Superflat dimension featuring Murakami-inspired procedural flower systems, hyper-gloss planets, and rainbow stream architecture.
- **SOFI Orbital Mass**: A colossal anti-gravity arena featuring a massive flexing halo, a pulsing crimson globe that ruptures on drops, and crowd energy ripples.
- **Neural Bloom**: A living, cosmic intelligence web featuring dynamic spatial hashing, audio-reactive pulse-propagation waves, and floating synaptic blossoms.
- **Kaleidoscope**: A mathematically pure recursive fractal symmetry engine, drawing deep rotating geometric structures with hallucinatory depth illusion and pattern inversion.

### 🧠 Performance & Engine Systems
- **Timeline Engine & VJ Intelligence**: A 9-stage deterministic choreographic timeline that drives the overall progression of the visualizers.
- **Adaptive Performance Manager (60FPS Lock)**: Built to prevent rendering stutter during heavy bass drops via aggressive object pooling (`trackDisposable`) and dynamic LOD adjustments.
- **Beat Intelligence Layer**: Real-time spectral flux tracking and adaptive transient thresholds accurately detect kicks, snares, and drops.

## 🎛️ Audio Pipeline & Reactivity
Aura reads the physical intensity of sound and maps it into visual physics:
- **Audio Routing**: Utilizes Web Audio API (`AnalyserNode`) directly from MP3s, System Capture, or Microphone.
- **Low/Mid/High Binning**: Translates bass drops to camera shake/scale transforms, and treble to particle velocity and lighting intensity.

## 🛠️ Setup & Execution

### One-Click Start (Windows)
Simply double-click the included `Run_Visualizer.bat` file. It will automatically initialize the environment, start the local server, and open your web browser.

### Manual Setup
1. **Prerequisites**: Ensure you have Node.js installed.
2. **Install**: Run `npm install` in the project root.
3. **Run**: Run `npm run dev` to start the Vite development server.
4. Open the provided `localhost` link in your browser.
5. In VS Code, you can also use the **Run and Debug** tab ("Launch Music Visualizer").

## Tech Stack
- **Framework**: Vite
- **Graphics Pipeline**: Three.js (WebGL 3D Spectacles) + HTML5 Canvas (2D Spectacles)
- **Audio Processing**: Web Audio API
- **Styling**: Vanilla CSS (Glassmorphism & Thematic Overlays)
