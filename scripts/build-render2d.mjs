import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mainPath = path.join(root, 'src/main.js');
const outPath = path.join(root, 'src/render/render2D.js');

const src = fs.readFileSync(mainPath, 'utf8');
const lines = src.split(/\r?\n/);
// drawSynthwave..drawPhantomDistrict, then drawCurrents (skip Auto VJ / switchTheme / WebGL)
let body = lines.slice(989, 2802).join('\n') + '\n' + lines.slice(2937, 3026).join('\n');

const replacements = [
  [/\bcanvas\b/g, 'runtime.canvas'],
  [/\bctx\b/g, 'runtime.ctx'],
  [/\banalyser\b/g, 'runtime.analyser'],
  [/\bdataArray\b/g, 'runtime.dataArray'],
  [/\btimeDataArray\b/g, 'runtime.timeDataArray'],
  [/\bsensitivity\b/g, 'runtime.sensitivity'],
  [/\bbeatPulse\b/g, 'runtime.beatPulse'],
  [/\bisMouseInteractive\b/g, 'runtime.isMouseInteractive'],
  [/\bmouseX\b/g, 'runtime.mouseX'],
  [/\bmouseY\b/g, 'runtime.mouseY'],
  [/\bperfScale\b/g, 'runtime.perfScale'],
  [/\bsmoothTimelineState\b/g, 'runtime.smoothTimelineState'],
  [/\bdrawFrameCounter\b/g, 'runtime.drawFrameCounter'],
];
for (const [re, rep] of replacements) {
  body = body.replace(re, rep);
}

const header = `import { runtime } from '../engine/runtime.js';
import { themes, activeTheme, lerp } from '../config/themes.js';
import { getStarGlowSprite } from './glowAtlas.js';
import { SpatialHash } from '../engine/spatialHash.js';

const particleBeamHash = new SpatialHash(120);
const neuralConnHash = new SpatialHash(250);

let lastMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
let lastMouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

`;

const footer = `
export function initRender2DState() {
  const w = runtime.canvas?.width || 2000;
  const h = runtime.canvas?.height || 2000;
  particles.forEach(p => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
  });
  lastMouseX = w / 2;
  lastMouseY = h / 2;
}

const DRAW_FN = {
  synthwave: drawSynthwave,
  oscilloscope: drawOscilloscope,
  vortex: drawVortex,
  kaleidoscope: drawKaleidoscope,
  circle: drawOrbital,
  wave: drawOscillator,
  bars: drawSpectrogram,
  particles: drawParticles,
  starfield: drawStarfield,
  plasma: drawPlasma,
  ripple: drawRipple,
  supernova: drawSupernova,
  geometric: drawGeometric,
  tunnel: drawTunnel,
  glitch: drawGlitchCore,
  matrix_rain: drawMatrixRain,
  dna_helix: drawDNAHelix,
  pulse_ring: drawPulseRing,
  currents: drawCurrents,
  blackhole: drawBlackHole,
  liquidplasma: drawLiquidPlasma,
  cathedral: drawCathedral,
  fractalbloom: drawFractalBloom,
  neuralbloom: drawNeuralBloom,
  iron_reckoning: drawIronReckoning,
  phantom_district: drawPhantomDistrict,
};

export function drawShape2D(shape, cx, cy, volume, theme) {
  const fn = DRAW_FN[shape];
  if (fn) fn(cx, cy, volume, theme);
}

const DRAW_CALL_ESTIMATES = {
  synthwave: 120, particles: 450, starfield: 300, kaleidoscope: 200,
  fractalbloom: 380, neuralbloom: 250, iron_reckoning: 180, phantom_district: 160,
  blackhole: 320, cathedral: 90, matrix_rain: 150, donda_pyramid: 80, graduation_stardrive: 70
};

export function getDrawCallCount(shape) {
  return Math.floor((DRAW_CALL_ESTIMATES[shape] || 100) * runtime.perfScale);
}

export {
  drawSynthwave,
  drawOscilloscope,
  drawOrbital,
  drawOscillator,
  drawSpectrogram,
  drawParticles,
  drawVortex,
  drawKaleidoscope,
  drawStarfield,
  drawPlasma,
  drawRipple,
  drawSupernova,
  drawGeometric,
  drawTunnel,
  drawGlitchCore,
  drawMatrixRain,
  drawDNAHelix,
  drawPulseRing,
  drawBlackHole,
  drawLiquidPlasma,
  drawCathedral,
  drawFractalBloom,
  drawNeuralBloom,
  drawIronReckoning,
  drawPhantomDistrict,
  drawCurrents,
};
`;

fs.writeFileSync(outPath, header + body + footer);
console.log('Wrote', outPath, 'bytes', fs.statSync(outPath).size);
