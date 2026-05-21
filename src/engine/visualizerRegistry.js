import { runtime } from './runtime.js';
import { activeTheme, animateFlowTheme, applyAutoColorToTheme } from '../config/themes.js';
import { incrementDrawCalls } from './metrics.js';
import {
  isSpectacleMode,
  onSpectacleShapeChange,
  drawSpectacleTransitionOverlay,
  getTransitionProgress,
} from './spectacleTransitions.js';

const HEAVY_SHAPES = new Set([
  'cathedral', 'fractalbloom', 'neuralbloom', 'iron_reckoning', 'phantom_district',
  'blackhole', 'supernova', 'kaleidoscope', 'sofi_orbital', 'paris_fracture'
]);

const WEBGL_SHAPES = new Set(['donda_pyramid', 'sofi_orbital', 'graduation_stardrive']);

let render3DModule = null;
let render2DModule = null;
let lastRenderedShape = null;

export async function ensureRender3D() {
  if (!render3DModule) {
    render3DModule = await import('../render/render3D.js');
  }
  return render3DModule;
}

async function ensureRender2D() {
  if (!render2DModule) {
    render2DModule = await import('../render/render2D.js');
  }
  return render2DModule;
}

export function isHeavyShape(shape) {
  return HEAVY_SHAPES.has(shape);
}

export function isWebGLShape(shape) {
  return WEBGL_SHAPES.has(shape);
}

export async function renderFrame(normalizedVolume, trebleBin) {
  const shape = runtime.currentShape;
  const ctx = runtime.ctx;
  const canvas = runtime.canvas;

  if (lastRenderedShape && lastRenderedShape !== shape) {
    onSpectacleShapeChange(lastRenderedShape, shape);
  }
  lastRenderedShape = shape;

  if (WEBGL_SHAPES.has(shape)) {
    const r3d = await ensureRender3D();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bassBin = runtime.dataArray[2] / 255;

    if (shape === 'sofi_orbital') {
      r3d.drawSofiOrbital(normalizedVolume, bassBin, trebleBin, runtime.currentTheme);
    } else if (shape === 'graduation_stardrive') {
      r3d.drawGraduationStardrive(normalizedVolume, bassBin, trebleBin, runtime.currentTheme);
    } else {
      r3d.drawDondaPyramid(normalizedVolume, bassBin, trebleBin, runtime.currentTheme);
    }

    const t = getTransitionProgress();
    if (t > 0) drawSpectacleTransitionOverlay(ctx, canvas.width, canvas.height);
    return { mode: 'webgl' };
  }

  const r3d = render3DModule;
  if (r3d?.renderer) r3d.renderer.clear();

  if (runtime.currentTheme === 'flow') animateFlowTheme();

  const t = activeTheme;
  if (runtime.isAutoColor) applyAutoColorToTheme(t);

  const needsHardClear = [
    'blackhole', 'iron_reckoning', 'phantom_district', 'neuralbloom', 'fractalbloom', 'cathedral',
  ].includes(shape);

  if (needsHardClear) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = shape === 'cathedral'
      ? '#050208'
      : `rgb(${t.bg[0]}, ${t.bg[1]}, ${t.bg[2]})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    incrementDrawCalls(1);
  } else {
    ctx.fillStyle = `rgba(${t.bg[0]}, ${t.bg[1]}, ${t.bg[2]}, 0.2)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    incrementDrawCalls(1);
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r2d = await ensureRender2D();
  r2d.drawShape2D(shape, cx, cy, normalizedVolume, t);

  const tr = getTransitionProgress();
  if (tr > 0) drawSpectacleTransitionOverlay(ctx, canvas.width, canvas.height);

  return { mode: '2d' };
}

export function preloadVisualizers() {
  ensureRender2D();
  if (WEBGL_SHAPES.has(runtime.currentShape)) ensureRender3D();
}

export function resetShapeTracking() {
  lastRenderedShape = null;
}
