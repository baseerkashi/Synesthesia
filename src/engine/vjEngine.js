import { runtime } from './runtime.js';
import { switchTheme, switchShape } from './presetManager.js';
import { applyBeatShake } from './cameraEngine.js';

export function updateVJ(averageVolume, dom) {
  if (!runtime.isAutoVJ || !runtime.dataArray) return;
  const time = performance.now();
  const len = runtime.dataArray.length;

  let bass = 0;
  for (let i = 0; i < len * 0.1; i++) bass += runtime.dataArray[i];
  bass /= len * 0.1;

  const bassNormalized = bass / 255;
  const energy = averageVolume / 255;

  let flux = 0;
  if (runtime.previousDataArray) {
    for (let i = 0; i < len; i++) {
      flux += Math.max(0, runtime.dataArray[i] - runtime.previousDataArray[i]);
    }
  } else {
    runtime.previousDataArray = new Uint8Array(len);
  }
  runtime.previousDataArray.set(runtime.dataArray);

  const isDrop = flux > 6000 && energy > 0.65;
  const isBeat = runtime.frameBeatDetected;

  if (runtime.frameBeatDetected && runtime.lastBeatIntervalMs > 300 && runtime.lastBeatIntervalMs < 2000) {
    runtime.beatHistory.push(runtime.lastBeatIntervalMs);
    if (runtime.beatHistory.length > 5) runtime.beatHistory.shift();
    const avgInterval = runtime.beatHistory.reduce((a, b) => a + b, 0) / runtime.beatHistory.length;
    runtime.estimatedBPM = 60000 / avgInterval;
  }

  if (time - runtime.sceneChangeCooldown > 5000) {
    let sumSquare = 0;
    for (let i = 0; i < runtime.timeDataArray.length; i++) {
      const normalized = runtime.timeDataArray[i] / 128 - 1.0;
      sumSquare += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquare / runtime.timeDataArray.length);

    let centroidNum = 0;
    let centroidDen = 0;
    for (let i = 0; i < len; i++) {
      centroidNum += runtime.dataArray[i] * i;
      centroidDen += runtime.dataArray[i];
    }
    const centroid = centroidDen === 0 ? 0 : centroidNum / centroidDen;

    const pick = (shapes, themes) => {
      switchTheme(themes[Math.floor(Math.random() * themes.length)], dom);
      switchShape(shapes[Math.floor(Math.random() * shapes.length)], dom);
      runtime.sceneChangeCooldown = time;
    };

    if (isDrop || (rms > 0.4 && centroid > 150)) {
      pick(
        ['supernova', 'glitch', 'vortex', 'tunnel', 'blackhole', 'iron_reckoning'],
        ['neon', 'fire', 'flow', 'cyberpunk', 'tokyo', 'yeezus'],
      );
    } else if (rms > 0.35 && centroid <= 100) {
      pick(
        ['supernova', 'geometric', 'matrix_rain', 'vortex', 'cathedral'],
        ['bloodmoon', 'matrix', 'void', 'midnight', 'outrun'],
      );
    } else if (rms > 0.2 && centroid > 100) {
      pick(
        ['kaleidoscope', 'synthwave', 'plasma', 'dna_helix', 'currents', 'neuralbloom', 'fractalbloom'],
        ['aurora', 'galaxy', 'acid', 'vaporwave', 'sunset'],
      );
    } else if (rms < 0.15) {
      pick(
        ['particles', 'circle', 'wave', 'starfield', 'ripple', 'pulse_ring', 'liquidplasma'],
        ['ocean', 'emerald', 'hologram', 'cosmic'],
      );
    } else if (isBeat) {
      pick(
        ['oscilloscope', 'bars', 'synthwave', 'kaleidoscope', 'vortex', 'starfield', 'geometric', 'liquidplasma', 'fractalbloom'],
        ['cyberpunk', 'aurora', 'matrix', 'retrowave', 'synthgold'],
      );
    }
  }

  if (isBeat) {
    let shakeIntensity = bassNormalized > 0.8 ? 20 : energy > 0.8 ? 10 : 0;
    if (runtime.currentShape === 'iron_reckoning') shakeIntensity *= 2.5;
    applyBeatShake(shakeIntensity);
  }

  if (isDrop && time - runtime.sceneChangeCooldown > 500) {
    runtime.canvas?.classList.add('chromatic-aberration');
    setTimeout(
      () => runtime.canvas?.classList.remove('chromatic-aberration'),
      runtime.currentShape === 'iron_reckoning' ? 300 : 150,
    );
  }
}
