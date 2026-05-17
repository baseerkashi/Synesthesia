import { runtime } from './runtime.js';

export const SPECTACLE_MODES = ['sofi_orbital', 'cathedral', 'graduation_stardrive'];

const TRANSITION_MS = 1400;

let transition = {
  active: false,
  from: null,
  to: null,
  start: 0,
  duration: TRANSITION_MS,
};

export function isSpectacleMode(shape) {
  return SPECTACLE_MODES.includes(shape);
}

export function onSpectacleShapeChange(fromShape, toShape) {
  if (!isSpectacleMode(fromShape) || !isSpectacleMode(toShape) || fromShape === toShape) {
    transition.active = false;
    return;
  }
  transition = {
    active: true,
    from: fromShape,
    to: toShape,
    start: performance.now(),
    duration: TRANSITION_MS,
  };
}

export function getTransitionProgress() {
  if (!transition.active) return 0;
  const t = (performance.now() - transition.start) / transition.duration;
  if (t >= 1) {
    transition.active = false;
    return 0;
  }
  return t;
}

export function getTransitionPair() {
  return { ...transition };
}

/** Fullscreen cinematic wipe overlay on 2D canvas */
export function drawSpectacleTransitionOverlay(ctx, w, h) {
  const t = getTransitionProgress();
  if (t <= 0) return;

  const { from, to } = transition;
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  if (from === 'sofi_orbital' && to === 'cathedral') {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * ease);
    g.addColorStop(0, `rgba(255, 255, 255, ${ease * 0.9})`);
    g.addColorStop(0.4, `rgba(80, 0, 20, ${ease * 0.7})`);
    g.addColorStop(1, `rgba(0, 0, 0, ${ease})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (from === 'cathedral' && to === 'graduation_stardrive') {
    for (let i = 0; i < 40; i++) {
      const px = (Math.sin(i * 12.3 + t * 10) * 0.5 + 0.5) * w;
      const py = (i / 40) * h;
      const hue = (i * 40 + t * 200) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${(1 - ease) * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, 20 + ease * 80, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(240, 248, 255, ${ease})`;
    ctx.fillRect(0, 0, w, h);
  } else if (from === 'graduation_stardrive' && to === 'sofi_orbital') {
    const rings = 8;
    for (let i = 0; i < rings; i++) {
      const r = (ease + i / rings) * Math.max(w, h) * 0.6;
      ctx.strokeStyle = `rgba(180, 20, 40, ${1 - i / rings})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(5, 0, 8, ${ease * 0.85})`;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = `rgba(0, 0, 0, ${ease * 0.5})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}
