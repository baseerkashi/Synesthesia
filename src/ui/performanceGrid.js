// SYNESTRA — Performance Grid Overlay (Phase 1)
import { runtime } from '../engine/runtime.js';
import { switchShape } from '../engine/presetManager.js';

let gridVisible = false;
let gridEl = null;

const VISUALIZER_MAP = [
  // ERAS
  { key: '1', id: 'paris_fracture', name: 'Paris Fracture', category: 'ERA', color: '#ffb700' },
  { key: '2', id: 'donda_pyramid', name: 'Donda Pyramid', category: 'ERA', color: '#ffffff' },
  { key: '3', id: 'graduation_stardrive', name: 'Graduation Rebirth', category: 'ERA', color: '#ff2d95' },
  { key: '4', id: 'sofi_orbital', name: 'SOFI Orbital', category: 'ERA', color: '#8b0a1a' },
  { key: '5', id: 'phantom_district', name: 'Pablo Split', category: 'ERA', color: '#ff5a00' },
  { key: '6', id: 'iron_reckoning', name: 'Iron Reckoning', category: 'ERA', color: '#ff0000' },
  // ELITE
  { key: '7', id: 'neuralbloom', name: 'Neural Bloom', category: 'ELITE', color: '#00ffcc' },
  { key: '8', id: 'cathedral', name: 'Apocalypse Cathedral', category: 'ELITE', color: '#6600ff' },
  { key: '9', id: 'blackhole', name: 'Black Hole', category: 'ELITE', color: '#0044ff' },
  { key: '0', id: 'fractalbloom', name: 'Fractal Bloom', category: 'ELITE', color: '#ff00ff' },
  { key: 'Q', id: 'liquidplasma', name: 'Liquid Plasma', category: 'ELITE', color: '#00ff88' },
  // STANDARD
  { key: 'W', id: 'synthwave', name: 'Synthwave', category: 'STD', color: '#ff00ff' },
  { key: 'E', id: 'oscilloscope', name: 'Oscilloscope', category: 'STD', color: '#00ffff' },
  { key: 'R', id: 'vortex', name: 'Hyper Vortex', category: 'STD', color: '#ff0088' },
  { key: 'T', id: 'kaleidoscope', name: 'Kaleidoscope', category: 'STD', color: '#ffff00' },
  { key: 'Y', id: 'bars', name: 'Spectrogram', category: 'STD', color: '#ff6600' },
  { key: 'U', id: 'particles', name: 'Particles', category: 'STD', color: '#00ccff' },
  { key: 'I', id: 'starfield', name: 'Starfield', category: 'STD', color: '#ffffff' },
  { key: 'O', id: 'supernova', name: 'Supernova', category: 'STD', color: '#ff4400' },
  { key: 'P', id: 'currents', name: 'Currents', category: 'STD', color: '#0088ff' },
  { key: 'A', id: 'tunnel', name: 'Infinity Tunnel', category: 'STD', color: '#aa00ff' },
  { key: 'S', id: 'glitch', name: 'Glitch Core', category: 'STD', color: '#ff0044' },
  { key: 'D', id: 'matrix_rain', name: 'Matrix Flow', category: 'STD', color: '#00ff00' },
  { key: 'F', id: 'plasma', name: 'Plasma', category: 'STD', color: '#ff8800' },
  { key: 'G', id: 'geometric', name: 'Geometric', category: 'STD', color: '#8888ff' },
  { key: 'H', id: 'circle', name: 'Orbital', category: 'STD', color: '#00ffaa' },
  { key: 'J', id: 'wave', name: 'Oscillator', category: 'STD', color: '#ff44ff' },
  { key: 'K', id: 'ripple', name: 'Ripple', category: 'STD', color: '#4488ff' },
  { key: 'L', id: 'pulse_ring', name: 'Tesseract', category: 'STD', color: '#ffcc00' },
];

const KEY_TO_VIZ = {};
VISUALIZER_MAP.forEach(v => { KEY_TO_VIZ[v.key.toUpperCase()] = v; });

function buildGrid() {
  gridEl = document.createElement('div');
  gridEl.id = 'perf-grid-overlay';
  gridEl.innerHTML = `
    <div class="perf-grid-header">
      <h1>SYNESTRA</h1>
      <p>PERFORMANCE MODE — Press a key to switch. TAB to close.</p>
    </div>
    <div class="perf-grid-sections">
      ${buildSection('THE ERAS', VISUALIZER_MAP.filter(v => v.category === 'ERA'))}
      ${buildSection('ELITE MODES', VISUALIZER_MAP.filter(v => v.category === 'ELITE'))}
      ${buildSection('STANDARD', VISUALIZER_MAP.filter(v => v.category === 'STD'))}
    </div>
  `;
  document.body.appendChild(gridEl);
}

function buildSection(title, items) {
  return `
    <div class="perf-section">
      <h2>${title}</h2>
      <div class="perf-tiles">
        ${items.map(v => `
          <div class="perf-tile ${runtime.currentShape === v.id ? 'active' : ''}" data-viz="${v.id}" style="--tile-color: ${v.color}">
            <div class="tile-key">${v.key}</div>
            <div class="tile-name">${v.name}</div>
            <div class="tile-category">${v.category}</div>
            <div class="tile-glow"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function refreshActiveState() {
  if (!gridEl) return;
  gridEl.querySelectorAll('.perf-tile').forEach(tile => {
    tile.classList.toggle('active', tile.dataset.viz === runtime.currentShape);
  });
}

export function togglePerformanceGrid(dom) {
  gridVisible = !gridVisible;
  if (!gridEl) buildGrid();
  
  if (gridVisible) {
    refreshActiveState();
    gridEl.classList.add('visible');
  } else {
    gridEl.classList.remove('visible');
  }
}

export function handlePerformanceKey(e, dom) {
  const key = e.key.toUpperCase();
  
  if (key === 'TAB') {
    e.preventDefault();
    togglePerformanceGrid(dom);
    return true;
  }
  
  if (gridVisible || !e.ctrlKey) {
    const viz = KEY_TO_VIZ[key];
    if (viz && runtime.isVisualizing) {
      switchShape(viz.id, dom);
      if (dom.shapeSelector) dom.shapeSelector.value = viz.id;
      refreshActiveState();
      if (gridVisible) {
        setTimeout(() => {
          gridVisible = false;
          gridEl.classList.remove('visible');
        }, 300);
      }
      return true;
    }
  }
  
  return false;
}

export function isGridVisible() { return gridVisible; }
