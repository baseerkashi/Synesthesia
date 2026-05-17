import { runtime } from '../../engine/runtime.js';

const COL = {
  scarlet: [180, 12, 28],
  uv: [120, 40, 255],
  gold: [255, 200, 60],
  void: [4, 2, 8],
  bone: [220, 210, 200],
};

let glassShards = [];
let wings = [];
let shadowEntities = [];
let collapsePhase = 0;

function spawnGlass(cx, cy, scale, intensity) {
  if (glassShards.length > 40) return;
  for (let i = 0; i < 8; i++) {
    glassShards.push({
      x: cx + (Math.random() - 0.5) * scale * 0.3,
      y: cy + (Math.random() - 0.5) * scale * 0.2,
      vx: (Math.random() - 0.5) * 12 * intensity,
      vy: (Math.random() - 0.8) * 10 * intensity,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      size: scale * (0.02 + Math.random() * 0.04),
      life: 1,
      hue: Math.random() > 0.5 ? 0 : 280,
    });
  }
}

function spawnWing(cx, cy, scale) {
  if (wings.length > 6) return;
  wings.push({
    x: cx,
    y: cy,
    scale: scale * (0.8 + Math.random() * 0.4),
    angle: Math.random() * Math.PI * 2,
    life: 1,
    side: Math.random() > 0.5 ? 1 : -1,
  });
}

function spawnShadow(cx, cy, w, h) {
  if (shadowEntities.length > 4) return;
  shadowEntities.push({
    x: cx + (Math.random() - 0.5) * w * 0.3,
    y: cy + (Math.random() - 0.5) * h * 0.2,
    life: 0.4 + Math.random() * 0.3,
    scale: 0.5 + Math.random(),
  });
}

export function drawApocalypseCathedral(cx, cy, volume, theme) {
  const ctx = runtime.ctx;
  const canvas = runtime.canvas;
  const time = performance.now() * 0.001;
  const w = canvas.width;
  const h = canvas.height;
  const depth = Math.max(6, Math.floor(18 * runtime.perfScale));
  const bassBin = runtime.dataArray[2] / 255;
  const isDrop = volume > 0.65;
  const beat = runtime.frameBeatDetected || runtime.beatPulse > 0.4;

  const targetCx = runtime.isMouseInteractive ? cx - (runtime.mouseX - cx) * 0.35 : cx;
  const targetCy = runtime.isMouseInteractive ? cy - (runtime.mouseY - cy) * 0.35 : cy;

  const bgGrad = ctx.createRadialGradient(targetCx, targetCy, 0, targetCx, targetCy, Math.max(w, h) * 0.8);
  bgGrad.addColorStop(0, `rgb(${COL.void[0] + 20}, ${COL.void[1]}, ${COL.void[2] + 30})`);
  bgGrad.addColorStop(0.5, `rgb(12, 4, 18)`);
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  collapsePhase += (beat ? 0.08 : 0.02) * (isDrop ? 2 : 1);
  const collapseWarp = Math.sin(collapsePhase) * 0.15 * volume;

  const speed = time * 1.5 * (1 + volume * runtime.sensitivity) * (1 + runtime.smoothTimelineState * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let z = depth; z > 0; z--) {
    let zPos = z - (speed % 1);
    if (zPos < 0.08) continue;

    const scale = 900 / zPos;
    const alpha = Math.min(1, zPos / 4) * (0.35 + volume * 0.4);
    const breathe = 1 + Math.sin(time * 2 + z) * 0.04 * bassBin;
    const warpX = targetCx + collapseWarp * scale * 0.1 * Math.sin(z + time);
    const archY = targetCy + scale * 0.15 * breathe;

    const pillars = 10 + Math.floor(z / 3);
    const vaultH = scale * 0.55;

    ctx.beginPath();
    for (let a = 0; a <= 32; a++) {
      const ang = Math.PI + (a / 32) * Math.PI;
      const rx = warpX + Math.cos(ang) * scale * 0.48 * breathe;
      const ry = archY - Math.sin(ang) * vaultH * 0.35;
      if (a === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.strokeStyle = `rgba(${COL.bone[0]}, ${COL.bone[1]}, ${COL.bone[2]}, ${alpha * 0.25})`;
    ctx.lineWidth = 1 + volume * 2;
    ctx.stroke();

    for (let p = 0; p < pillars; p++) {
      const px = warpX + (p - pillars / 2 + 0.5) * scale * 0.22;
      const bin = Math.floor(Math.abs(p - pillars / 2) * 8) % 32;
      const val = runtime.dataArray[bin] / 255;
      const pyTop = archY - vaultH * (0.35 + val * 0.15 * runtime.sensitivity);
      const pyBot = targetCy + scale * 0.75;

      const wallBreath = 1 + bassBin * 0.08 * Math.sin(time * 3 + p);
      const pxW = px * wallBreath + (px - warpX) * 0.02 * Math.sin(time + z);

      if (p < pillars - 1) {
        const npx = warpX + (p + 1 - pillars / 2 + 0.5) * scale * 0.22;
        const nval = runtime.dataArray[(bin + 1) % 32] / 255;
        const npyTop = archY - vaultH * (0.35 + nval * 0.15 * runtime.sensitivity);

        ctx.beginPath();
        ctx.moveTo(pxW, pyTop);
        ctx.lineTo(npx, npyTop);
        ctx.lineTo(npx, pyBot);
        ctx.lineTo(pxW, pyBot);
        ctx.closePath();

        const stained = p % 2 === 0 ? COL.scarlet : COL.uv;
        ctx.fillStyle = `rgba(${stained[0]}, ${stained[1]}, ${stained[2]}, ${alpha * val * 0.35})`;
        ctx.fill();

        if (val > 0.7 && z < depth * 0.4) {
          const roseR = scale * 0.04 * (1 + val);
          ctx.beginPath();
          ctx.arc((pxW + npx) / 2, (pyTop + npyTop) / 2, roseR * (1 + bassBin * 0.5), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${COL.gold[0]}, ${COL.gold[1]}, ${COL.gold[2]}, ${alpha * val})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.moveTo(pxW, pyTop);
      ctx.lineTo(pxW, pyBot);
      ctx.strokeStyle = `rgba(${COL.gold[0]}, ${COL.gold[1]}, ${COL.gold[2]}, ${alpha * (0.2 + val * 0.6)})`;
      ctx.lineWidth = (scale * 0.012 + val * 4) * wallBreath;
      ctx.stroke();

      if (val > 0.5) {
        const vein = Math.sin(time * 4 + p + z) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(${COL.gold[0]}, ${COL.gold[1]}, ${COL.gold[2]}, ${vein * val * alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pxW, pyTop);
        ctx.lineTo(pxW + Math.sin(time + p) * 8, (pyTop + pyBot) / 2);
        ctx.lineTo(pxW, pyBot);
        ctx.stroke();
      }
    }

    if (z === Math.floor(depth / 2) && volume > 0.4) {
      const flameH = scale * 0.15 * volume;
      const fg = ctx.createLinearGradient(warpX, archY, warpX, archY - flameH);
      fg.addColorStop(0, `rgba(${COL.uv[0]}, ${COL.uv[1]}, ${COL.uv[2]}, 0)`);
      fg.addColorStop(0.3, `rgba(${COL.uv[0]}, ${COL.uv[1]}, ${COL.uv[2]}, ${alpha * 0.5})`);
      fg.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.2})`);
      ctx.fillStyle = fg;
      ctx.fillRect(warpX - scale * 0.2, archY - flameH, scale * 0.4, flameH);
    }
  }

  if (isDrop) spawnGlass(targetCx, targetCy, 400, volume);
  if (beat && Math.random() > 0.7) spawnWing(targetCx, targetCy - 100, 300);
  if (volume > 0.5 && Math.random() > 0.92) spawnShadow(targetCx, targetCy, w, h);

  glassShards = glassShards.filter((g) => {
    g.x += g.vx;
    g.y += g.vy;
    g.vy += 0.15;
    g.rot += g.vr;
    g.life -= 0.015;
    if (g.life <= 0) return false;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    ctx.fillStyle = `hsla(${g.hue}, 90%, 55%, ${g.life * 0.8})`;
    ctx.fillRect(-g.size / 2, -g.size / 2, g.size, g.size * 1.6);
    ctx.restore();
    return true;
  });

  wings = wings.filter((wg) => {
    wg.life -= 0.006;
    if (wg.life <= 0) return false;
    const span = wg.scale * wg.life;
    ctx.save();
    ctx.translate(wg.x, wg.y);
    ctx.rotate(wg.angle);
    ctx.globalAlpha = wg.life * 0.35;
    ctx.fillStyle = `rgba(${COL.bone[0]}, ${COL.bone[1]}, ${COL.bone[2]}, 0.4)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(span * wg.side, -span * 0.5, span * 1.2 * wg.side, 0);
    ctx.quadraticCurveTo(span * wg.side, span * 0.5, 0, 0);
    ctx.fill();
    ctx.restore();
    return true;
  });

  shadowEntities = shadowEntities.filter((s) => {
    s.life -= 0.008;
    if (s.life <= 0) return false;
    ctx.fillStyle = `rgba(0, 0, 0, ${s.life * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 80 * s.scale, 200 * s.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    return true;
  });

  if (isDrop || beat) {
    const shaft = ctx.createLinearGradient(targetCx, 0, targetCx, h);
    shaft.addColorStop(0, `rgba(255, 255, 255, ${0.15 * volume})`);
    shaft.addColorStop(0.5, `rgba(${COL.gold[0]}, ${COL.gold[1]}, ${COL.gold[2]}, 0.08)`);
    shaft.addColorStop(1, 'transparent');
    ctx.fillStyle = shaft;
    ctx.fillRect(targetCx - 40, 0, 80, h);
  }

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
