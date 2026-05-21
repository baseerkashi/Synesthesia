// SYNESTRA — 2D Canvas Post-Processing Pipeline (Phase 2)
import { runtime } from './runtime.js';

let grainCanvas = null;
let grainCtx = null;
let lastGrainUpdate = 0;

function ensureGrainBuffer(w, h) {
  if (!grainCanvas || grainCanvas.width !== w || grainCanvas.height !== h) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = w;
    grainCanvas.height = h;
    grainCtx = grainCanvas.getContext('2d', { willReadFrequently: true });
  }
}

function renderGrain(ctx, w, h, intensity) {
  ensureGrainBuffer(w, h);
  const now = performance.now();
  // Only update grain every 50ms for perf
  if (now - lastGrainUpdate > 50) {
    const imageData = grainCtx.createImageData(w, h);
    const data = imageData.data;
    // Use a coarser grain (every 4th pixel) for performance
    for (let i = 0; i < data.length; i += 16) {
      const v = (Math.random() * 255) | 0;
      data[i] = data[i+4] = data[i+8] = data[i+12] = v;
      data[i+1] = data[i+5] = data[i+9] = data[i+13] = v;
      data[i+2] = data[i+6] = data[i+10] = data[i+14] = v;
      data[i+3] = data[i+7] = data[i+11] = data[i+15] = 255;
    }
    grainCtx.putImageData(imageData, 0, 0);
    lastGrainUpdate = now;
  }
  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();
}

function renderBloom(ctx, w, h, intensity) {
  // Lightweight glow simulation using shadow blur on a bright center point
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = intensity * 0.15;
  ctx.filter = `blur(${20 + intensity * 30}px)`;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.restore();
  ctx.filter = 'none';
}

function renderVignette(ctx, w, h, intensity) {
  const grad = ctx.createRadialGradient(w/2, h/2, w * 0.3, w/2, h/2, w * 0.75);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, `rgba(0, 0, 0, ${0.4 + intensity * 0.3})`);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function apply2DPostProcessing(ctx, w, h, volume) {
  const intensity = Math.min(volume * 1.5, 1.0);
  
  // Bloom (lightweight)
  renderBloom(ctx, w, h, intensity);
  
  // Film grain (subtle)
  renderGrain(ctx, w, h, 0.03 + intensity * 0.02);
  
  // Vignette (always on, subtle)
  renderVignette(ctx, w, h, 0.3);
}
