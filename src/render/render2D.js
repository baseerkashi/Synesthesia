import { runtime } from '../engine/runtime.js';
import { themes, activeTheme, lerp } from '../config/themes.js';
import { getStarGlowSprite } from './glowAtlas.js';
import { SpatialHash } from '../engine/spatialHash.js';
import { drawApocalypseCathedral } from './spectacle/apocalypseCathedral.js';

const particleBeamHash = new SpatialHash(120);
const neuralConnHash = new SpatialHash(250);

let lastMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
let lastMouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

function drawSynthwave(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const horizonY = cy + 50; // lower horizon slightly to show more sky
  
  // Draw stars in the background
  runtime.ctx.fillStyle = '#fff';
  for(let i=0; i<50; i++) {
    // pseudo random based on index
    const sx = Math.sin(i * 12.9898) * 10000 % runtime.canvas.width;
    const sy = Math.cos(i * 78.233) * 10000 % horizonY;
    if (sx > 0 && sy > 0) {
      const size = Math.abs(Math.sin(time + i)) * (2 + volume * 3);
      runtime.ctx.fillRect(sx, sy, size, size);
    }
  }

  // Draw glowing sun
  const sunRadius = 150 + volume * 60 * runtime.sensitivity; // Pulse intensely with volume
  runtime.ctx.beginPath();
  runtime.ctx.arc(cx, horizonY, sunRadius, Math.PI, 0);
  const sunGradient = runtime.ctx.createLinearGradient(0, horizonY - sunRadius, 0, horizonY);
  sunGradient.addColorStop(0, `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`);
  sunGradient.addColorStop(1, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
  runtime.ctx.fillStyle = sunGradient;
  runtime.ctx.shadowBlur = 40 + volume * 60;
  runtime.ctx.shadowColor = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  runtime.ctx.fill();
  runtime.ctx.shadowBlur = 0;
  
  // Cut horizontal lines in sun for retro effect using clipping
  runtime.ctx.save();
  runtime.ctx.beginPath();
  runtime.ctx.arc(cx, horizonY, sunRadius, Math.PI, 0);
  runtime.ctx.clip();
  
  runtime.ctx.fillStyle = `rgb(${theme.bg[0]}, ${theme.bg[1]}, ${theme.bg[2]})`;
  for(let i=0; i<10; i++) {
    const yOff = Math.pow(i/10, 2) * sunRadius;
    const h = 3 + (i/10)*5;
    runtime.ctx.fillRect(cx - sunRadius, horizonY - yOff, sunRadius*2, h);
  }
  runtime.ctx.restore();

  // Draw 3D wireframe terrain
  runtime.ctx.strokeStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  runtime.ctx.lineWidth = 1.5 + volume * 1.5;
  
  const numVLines = 50;
  const numHLines = 30;
  const gridSpeed = time * (2 + volume * 8); // Move much faster when loud
  
  // Create vertices
  const points = [];
  for(let i = 0; i < numHLines; i++) {
    let z = (i - (gridSpeed % 1)) / numHLines; // 0 (horizon) to 1 (front)
    if (z < 0) continue;
    
    // Depth scaling
    const depth = Math.pow(z, 2.5);
    const y = horizonY + depth * (runtime.canvas.height - horizonY + 100);
    
    const row = [];
    for(let j = 0; j <= numVLines; j++) {
      const p = j / numVLines;
      
      // Calculate x with perspective spread
      const spread = runtime.canvas.width * 2.5;
      let x = (p - 0.5) * spread * (depth + 0.1) * 3 + cx; 
      
      // Calculate audio bump (terrain)
      // We want edges to have higher mountains, center to be a road
      const distFromCenter = Math.abs(p - 0.5) * 2; // 0 at center, 1 at edges
      let elevation = 0;
      
      if (distFromCenter > 0.15) {
        // Mountain area
        const bin = Math.floor((j / numVLines) * (runtime.analyser.frequencyBinCount / 4));
        const val = runtime.dataArray[bin] / 255;
        // The closer it is (larger depth), the bigger the mountain. Scale with overall volume too.
        elevation = val * 250 * runtime.sensitivity * distFromCenter * depth * (1 + volume * 0.5);
        // Add some noise
        elevation += Math.sin(j * 15 + i * 2 + time * 2) * 30 * depth * distFromCenter;
      }
      
      row.push({ x: x, y: y - elevation });
    }
    points.push(row);
  }
  
  runtime.ctx.beginPath();
  // Draw Horizontal lines
  for(let i = 0; i < points.length; i++) {
    for(let j = 0; j < points[i].length; j++) {
      const pt = points[i][j];
      if (j === 0) runtime.ctx.moveTo(pt.x, pt.y);
      else runtime.ctx.lineTo(pt.x, pt.y);
    }
  }
  
  // Draw Vertical lines
  if (points.length > 0) {
    for(let j = 0; j <= numVLines; j++) {
      for(let i = 0; i < points.length; i++) {
        const pt = points[i][j];
        if (i === 0) runtime.ctx.moveTo(pt.x, pt.y);
        else runtime.ctx.lineTo(pt.x, pt.y);
      }
    }
  }
  
  runtime.ctx.shadowBlur = 10 + volume * 20;
  runtime.ctx.shadowColor = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  
  // Add gradient to stroke so it fades into horizon
  const gridGradient = runtime.ctx.createLinearGradient(0, horizonY, 0, runtime.canvas.height);
  gridGradient.addColorStop(0, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0)`);
  gridGradient.addColorStop(0.3, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.5)`);
  gridGradient.addColorStop(1, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
  
  runtime.ctx.strokeStyle = gridGradient;
  runtime.ctx.stroke();
  runtime.ctx.shadowBlur = 0;
  
  // Draw proper Synthwave Road
  
  // 1. Solid dark road base to cover grid
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(cx, horizonY);
  runtime.ctx.lineTo(cx + runtime.canvas.width * 0.25, runtime.canvas.height);
  runtime.ctx.lineTo(cx - runtime.canvas.width * 0.25, runtime.canvas.height);
  runtime.ctx.closePath();
  runtime.ctx.fillStyle = `rgb(${theme.bg[0]}, ${theme.bg[1]}, ${theme.bg[2]})`;
  runtime.ctx.fill();

  // 2. Road Edges (Neon Glow)
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(cx, horizonY);
  runtime.ctx.lineTo(cx - runtime.canvas.width * 0.25, runtime.canvas.height);
  runtime.ctx.moveTo(cx, horizonY);
  runtime.ctx.lineTo(cx + runtime.canvas.width * 0.25, runtime.canvas.height);
  runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${0.8 + volume * 0.2})`;
  runtime.ctx.lineWidth = 4 + volume * 5;
  runtime.ctx.shadowBlur = 15 + volume * 10;
  runtime.ctx.shadowColor = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
  runtime.ctx.stroke();
  runtime.ctx.shadowBlur = 0;

  // 3. Dashed center lane markings moving towards camera
  runtime.ctx.beginPath();
  runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.9)`;
  runtime.ctx.lineWidth = 4 + volume * 2;
  // Calculate dashed line positions based on gridSpeed to make them "move"
  for (let i = 0; i < 20; i++) {
    let z = (i - (gridSpeed * 1.5 % 2)) / 20; // 0 to 1
    if (z < 0) continue;
    
    // Only draw every other segment to create dashed effect
    if (i % 2 === 0) {
      const depth1 = Math.pow(z, 2.5);
      const depth2 = Math.pow(Math.min(1, z + 0.05), 2.5); // End of the dash
      
      const y1 = horizonY + depth1 * (runtime.canvas.height - horizonY + 100);
      const y2 = horizonY + depth2 * (runtime.canvas.height - horizonY + 100);
      
      if (y1 > runtime.canvas.height) continue;
      
      runtime.ctx.moveTo(cx, y1);
      runtime.ctx.lineTo(cx, Math.min(y2, runtime.canvas.height));
    }
  }
  runtime.ctx.stroke();
}

function drawOscilloscope(cx, cy, volume, theme) {
  // Advanced Oscilloscope
  const width = runtime.canvas.width;
  const sliceWidth = width * 1.0 / runtime.analyser.fftSize;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  for(let layer=0; layer<3; layer++) {
    runtime.ctx.beginPath();
    let x = 0;
    for(let i = 0; i < runtime.analyser.fftSize; i++) {
      const v = runtime.timeDataArray[i] / 128.0; 
      const wave = Math.sin(x*0.01 + layer) * (volume * 20);
      const y = cy + (v - 1) * (runtime.canvas.height / (3 - layer*0.5)) * runtime.sensitivity + wave;
      
      if(i === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
      x += sliceWidth;
    }
    runtime.ctx.strokeStyle = layer === 0 ? `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.9)` : 
                      layer === 1 ? `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.5)` :
                      `rgba(255, 255, 255, 0.3)`;
    runtime.ctx.lineWidth = 3 + volume * 5 - layer;
    runtime.ctx.shadowBlur = 10 + layer*5;
    runtime.ctx.shadowColor = runtime.ctx.strokeStyle;
    runtime.ctx.stroke();
  }
  runtime.ctx.shadowBlur = 0;
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawOrbital(cx, cy, volume, theme) {
  // Stellar Core
  const time = performance.now() * 0.001;
  const baseRadius = 50 + volume * 150 * runtime.sensitivity;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  // Corona Layers
  for(let layer=0; layer<3; layer++) {
    const radius = baseRadius + layer * 30 + volume * 50;
    runtime.ctx.beginPath();
    for(let i=0; i<=100; i++) {
      const angle = (i/100) * Math.PI * 2;
      const bin = Math.floor((i/100) * (runtime.analyser.frequencyBinCount/4));
      const val = runtime.dataArray[bin] / 255;
      
      const noise = Math.sin(angle * (5+layer) + time * (2+layer)) * (val * 40);
      const x = cx + Math.cos(angle) * (radius + noise);
      const y = cy + Math.sin(angle) * (radius + noise);
      if(i===0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    runtime.ctx.closePath();
    runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${0.5 - layer*0.15})`;
    runtime.ctx.lineWidth = 2 + volume*5;
    runtime.ctx.stroke();
    
    runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${0.1 - layer*0.03})`;
    runtime.ctx.fill();
  }
  
  // Inner Dense Core
  runtime.ctx.beginPath();
  runtime.ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI*2);
  const coreGrad = runtime.ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.8);
  coreGrad.addColorStop(0, '#fff');
  coreGrad.addColorStop(0.5, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
  coreGrad.addColorStop(1, 'transparent');
  runtime.ctx.fillStyle = coreGrad;
  runtime.ctx.fill();
  
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawOscillator(cx, cy, volume, theme) {
  // Wave Matrix
  const time = performance.now() * 0.002;
  const lines = 15;
  const width = runtime.canvas.width;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  for(let l=0; l<lines; l++) {
    runtime.ctx.beginPath();
    const sliceWidth = width / (runtime.analyser.frequencyBinCount / 4);
    let x = 0;
    const yOffset = (l - lines/2) * (20 + volume * 50);
    
    for(let i = 0; i < runtime.analyser.frequencyBinCount / 4; i++) {
      const value = runtime.dataArray[i] / 255.0;
      const y = cy + yOffset + Math.sin(x * 0.01 + time + l*0.5) * 150 * value * runtime.sensitivity;
      
      if(i === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
      
      x += sliceWidth;
    }
    
    const depth = 1 - Math.abs(l - lines/2)/(lines/2);
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${depth})`;
    runtime.ctx.lineWidth = depth * 3 + volume * 2;
    runtime.ctx.stroke();
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawSpectrogram(cx, cy, volume, theme) {
  // 3D Block Spectrogram
  const bars = 64;
  const barWidth = (runtime.canvas.width / bars) * 0.7;
  const gap = (runtime.canvas.width / bars) * 0.3;
  const maxBarHeight = runtime.canvas.height * 0.4;
  const step = Math.floor((runtime.analyser.frequencyBinCount / 2) / bars);
  
  for (let i = 0; i < bars; i++) {
    const value = runtime.dataArray[i * step] * runtime.sensitivity;
    const percent = value / 255;
    const barHeight = Math.max(5, percent * maxBarHeight);
    
    const x = (i * (barWidth + gap)) + (runtime.canvas.width - (bars * (barWidth + gap))) / 2;
    
    // Bottom reflection
    const yBot = cy + 10;
    const gradBot = runtime.ctx.createLinearGradient(0, yBot, 0, yBot + barHeight*0.5);
    gradBot.addColorStop(0, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.3)`);
    gradBot.addColorStop(1, 'transparent');
    runtime.ctx.fillStyle = gradBot;
    runtime.ctx.fillRect(x, yBot, barWidth, barHeight*0.5);
    
    // Main Bar
    const yTop = cy - barHeight;
    const gradTop = runtime.ctx.createLinearGradient(0, cy, 0, yTop);
    gradTop.addColorStop(0, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
    gradTop.addColorStop(1, `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`);
    
    runtime.ctx.fillStyle = gradTop;
    runtime.ctx.fillRect(x, yTop, barWidth, barHeight);
    
    // 3D Cap / Floating block
    runtime.ctx.fillStyle = '#fff';
    runtime.ctx.shadowBlur = 10;
    runtime.ctx.shadowColor = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
    
    // Float cap higher based on velocity/volume
    const floatOff = percent * 20 + volume * 10;
    runtime.ctx.fillRect(x, yTop - 5 - floatOff, barWidth, 4);
    runtime.ctx.shadowBlur = 0;
  }
}

// Simple particle system state
const particles = [];
for (let i = 0; i < 200; i++) {
  particles.push({
    x: Math.random() * 2000, // initialized later
    y: Math.random() * 2000,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 3 + 1,
    baseDist: Math.random() * 200 + 50,
    angle: Math.random() * Math.PI * 2
  });
}

function drawParticles(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const ctx = runtime.ctx;
  const beamRadius = 120;

  ctx.globalCompositeOperation = 'lighter';

  const bassRadius = 50 + volume * 100 * runtime.sensitivity;
  ctx.beginPath();
  ctx.arc(cx, cy, bassRadius, 0, Math.PI * 2);
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bassRadius);
  coreGrad.addColorStop(0, '#fff');
  coreGrad.addColorStop(0.5, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.8)`);
  coreGrad.addColorStop(1, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0)`);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  const r1 = theme.primary[0], g1 = theme.primary[1], b1 = theme.primary[2];
  const r2 = theme.secondary[0], g2 = theme.secondary[1], b2 = theme.secondary[2];

  const rendered = [];
  particleBeamHash.clear();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const bin = Math.floor((i / particles.length) * (runtime.analyser.frequencyBinCount / 4));
    const freq = runtime.dataArray[bin] / 255;
    const currentDist = p.baseDist + (freq * 150 * runtime.sensitivity);
    p.angle += 0.005 + (freq * 0.01);

    let renderX = cx + Math.cos(p.angle) * currentDist;
    let renderY = cy + Math.sin(p.angle) * currentDist;

    if (runtime.isMouseInteractive) {
      const dxMouse = renderX - runtime.mouseX;
      const dyMouse = renderY - runtime.mouseY;
      const distMouse = Math.hypot(dxMouse, dyMouse);
      if (distMouse > 0 && distMouse < 250) {
        const push = (250 - distMouse) * 0.5 * (1 + runtime.beatPulse);
        renderX += (dxMouse / distMouse) * push;
        renderY += (dyMouse / distMouse) * push;
      }
    }

    const radius = p.size + (freq * 8);
    const slot = { renderX, renderY, freq, angle: p.angle, radius, index: i };
    rendered.push(slot);
    if (freq > 0.4) {
      particleBeamHash.insert(renderX, renderY, slot);
    }
  }

  for (let i = 0; i < rendered.length; i++) {
    const a = rendered[i];
    if (a.freq <= 0.4) continue;
    particleBeamHash.query(a.renderX, a.renderY, beamRadius, (b) => {
      if (b.index <= a.index) return;
      const colorRatio = Math.sin(time + a.angle) * 0.5 + 0.5;
      const r = r1 * colorRatio + r2 * (1 - colorRatio);
      const g = g1 * colorRatio + g2 * (1 - colorRatio);
      const bl = b1 * colorRatio + b2 * (1 - colorRatio);
      ctx.beginPath();
      ctx.moveTo(a.renderX, a.renderY);
      ctx.lineTo(b.renderX, b.renderY);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${0.3 + a.freq * 0.4})`;
      ctx.lineWidth = 1 + a.freq * 2;
      ctx.stroke();
    });
  }

  for (const slot of rendered) {
    const { renderX, renderY, freq, angle, radius } = slot;
    const colorRatio = Math.sin(time + angle) * 0.5 + 0.5;
    const r = r1 * colorRatio + r2 * (1 - colorRatio);
    const g = g1 * colorRatio + g2 * (1 - colorRatio);
    const b = b1 * colorRatio + b2 * (1 - colorRatio);

    ctx.beginPath();
    ctx.arc(renderX, renderY, radius * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + freq * 0.2})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(renderX, renderY, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + freq})`;
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawVortex(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const numArms = 5;
  const pointsPerArm = Math.floor(runtime.analyser.frequencyBinCount / 4 / numArms);
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  for(let arm = 0; arm < numArms; arm++) {
    runtime.ctx.beginPath();
    const armAngleOff = (Math.PI * 2 / numArms) * arm + (time * (1 + volume));
    
    for(let i = 0; i < pointsPerArm; i++) {
      const idx = arm * pointsPerArm + i;
      const v = runtime.dataArray[idx] / 255.0; // Audio reactivity
      
      // Smooth out the radius: make it grow linearly but throb with the audio
      const r = (i * 12) + 20 + Math.sin(time * 5 + i * 0.5) * (v * 40 * runtime.sensitivity);
      
      // Let the angle curve smoothly out
      const angle = armAngleOff + (i * 0.12) + (v * 0.3);
      
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if(i === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    
    // Gradient stroke for the arm
    const gradient = runtime.ctx.createLinearGradient(cx, cy, cx + Math.cos(armAngleOff)*500, cy + Math.sin(armAngleOff)*500);
    gradient.addColorStop(0, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 1)`);
    gradient.addColorStop(1, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0)`);
    
    runtime.ctx.strokeStyle = gradient;
    runtime.ctx.lineWidth = 4 + (volume * 6);
    runtime.ctx.lineCap = 'round';
    runtime.ctx.lineJoin = 'round';
    
    // Add glow
    runtime.ctx.shadowBlur = 15 + volume * 20;
    runtime.ctx.shadowColor = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
    
    runtime.ctx.stroke();
    runtime.ctx.shadowBlur = 0;
  }
  
  // Draw core glow ONCE outside the loop
  runtime.ctx.beginPath();
  const coreRadius = 40 + (volume * 100 * runtime.sensitivity);
  runtime.ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  const coreGlow = runtime.ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
  coreGlow.addColorStop(0, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.9)`);
  coreGlow.addColorStop(1, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0)`);
  runtime.ctx.fillStyle = coreGlow;
  runtime.ctx.fill();
  
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawKaleidoscope(cx, cy, volume, theme) {
  const time = performance.now() * 0.0002;
  const beat = runtime.frameBeatDetected || runtime.beatPulse > 0.5;
  const isDrop = volume > 0.7;
  const ctx = runtime.ctx;
  
  // Audio-reactive symmetry expansion (Optimized for performance)
  let baseSegments = 6;
  if (volume > 0.5) baseSegments = 8;
  if (isDrop) baseSegments = 10;
  
  // Smoothly interpolate segments to prevent jarring jumps
  runtime.kalSegments = runtime.kalSegments || baseSegments;
  runtime.kalSegments += (baseSegments - runtime.kalSegments) * 0.1;
  const segments = Math.round(runtime.kalSegments);
  
  const angleStep = (Math.PI * 2) / segments;
  const maxRadius = Math.min(cx, cy) * (1.2 + volume * 0.5);
  
  // Pattern inversion on drops
  const invertMode = isDrop && Math.sin(time * 10) > 0;
  
  ctx.globalCompositeOperation = invertMode ? 'difference' : 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Hallucinatory depth illusion / Zoom
  const zoom = 1 + Math.sin(time) * 0.2 + volume * 0.3;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  
  // Controlled psychedelic rotation
  ctx.rotate(time * 0.5 + (isDrop ? Math.sin(time*5)*0.1 : 0));
  
  // Symmetrical Recursive Pattern Logic
  for (let i = 0; i < segments; i++) {
    ctx.save();
    
    // Mirroring: alternating segments are flipped horizontally
    const isMirrored = i % 2 !== 0;
    const rotation = i * angleStep;
    ctx.rotate(rotation);
    if (isMirrored) {
      ctx.scale(1, -1);
    }
    
    // Draw fractal rotational tessellation (Reduced iterations for performance)
    const iterations = 3;
    for (let depth = 0; depth < iterations; depth++) {
      const depthRatio = 1 - (depth / iterations);
      const rScale = maxRadius * depthRatio;
      
      // Color pulse spirals
      const hueShift = (time * 500 + depth * 40 + i * 10) % 360;
      const layerColor = depth % 2 === 0 
        ? `hsla(${hueShift}, 80%, 60%, ${0.5 + volume * 0.5})`
        : `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${0.4 + volume * 0.6})`;
        
      const secColor = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${0.3 + volume * 0.5})`;
      
      // Pre-calculate points to avoid breaking the path
      const points = [];
      for (let b = startBin, stepIdx = 0; b < endBin; b += step, stepIdx++) {
        const val = runtime.dataArray[b] / 255;
        const normalizedR = stepIdx / 10; // 0 to 1 along the segment length
        const x = normalizedR * rScale;
        const yAmplitude = val * (100 + depth * 50) * runtime.sensitivity;
        const y = Math.sin(normalizedR * Math.PI * 4 + time * 5) * yAmplitude;
        points.push({x, y, val, yAmplitude});
      }

      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const pt = points[j];
        if (j === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          if (depth % 2 === 0) {
            ctx.lineTo(pt.x, pt.y);
          } else {
            const prev = points[j-1];
            ctx.quadraticCurveTo(prev.x + (pt.x - prev.x)/2, prev.y - pt.yAmplitude/2, pt.x, pt.y);
          }
        }
      }
      
      // Stroke the main fractal arm
      ctx.lineWidth = 1 + (1 - depthRatio) * 3 + volume * 5;
      const grad = ctx.createLinearGradient(0, 0, rScale, 0);
      grad.addColorStop(0, layerColor);
      grad.addColorStop(1, secColor);
      ctx.strokeStyle = grad;
      ctx.stroke();

      // Draw all floating diamond nodes in one single batch (insanely fast)
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const pt = points[j];
        if (pt.val > 0.6) {
          const ds = 2 + pt.val * 8;
          const rA = time * 2 + pt.val;
          const cosA = Math.cos(rA) * ds;
          const sinA = Math.sin(rA) * ds;
          ctx.moveTo(pt.x - sinA, pt.y + cosA);
          ctx.lineTo(pt.x + cosA, pt.y + sinA);
          ctx.lineTo(pt.x + sinA, pt.y - cosA);
          ctx.lineTo(pt.x - cosA, pt.y - sinA);
          ctx.lineTo(pt.x - sinA, pt.y + cosA);
        }
      }
      ctx.fillStyle = layerColor;
      ctx.fill();
      
      // Hypnotic geometric connectors between arms
      if (depth > 0) {
        ctx.beginPath();
        const cr = rScale * 0.5;
        ctx.arc(0, 0, cr, 0, angleStep, false);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + volume * 0.2})`;
        ctx.lineWidth = 1 + val * 2;
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  // Center Eye / Hexagon Core
  ctx.beginPath();
  const coreSides = 6;
  const coreR = 20 + volume * 150 * runtime.sensitivity;
  for(let i=0; i<=coreSides; i++) {
    const a = (i/coreSides) * Math.PI * 2 + time;
    const x = Math.cos(a) * coreR;
    const y = Math.sin(a) * coreR;
    if(i===0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.5)`;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2 + volume * 5;
  ctx.stroke();

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

// Starfield state
const stars = [];
for(let i=0; i<300; i++) {
  stars.push({
    x: (Math.random() - 0.5) * 2000,
    y: (Math.random() - 0.5) * 2000,
    z: Math.random() * 2000
  });
}

function drawStarfield(cx, cy, volume, theme) {
  const speed = 5 + (volume * 100 * runtime.sensitivity);
  const ctx = runtime.ctx;
  const glowSprite = getStarGlowSprite(ctx);

  stars.forEach((star, i) => {
    const freqBin = Math.floor((i / stars.length) * (runtime.analyser.frequencyBinCount / 4));
    const freqVal = runtime.dataArray[freqBin] / 255;

    star.z -= speed * (1 + freqVal * 3);
    if (star.z <= 0) {
      star.z = 2000;
      star.x = (Math.random() - 0.5) * 2000;
      star.y = (Math.random() - 0.5) * 2000;
    }

    const k = 128.0 / star.z;
    const px = star.x * k + cx;
    const py = star.y * k + cy;

    if (px >= 0 && px <= runtime.canvas.width && py >= 0 && py <= runtime.canvas.height) {
      const size = (1 - star.z / 2000) * (3 + freqVal * 8);
      const alpha = 1 - star.z / 2000;

      const colorRatio = (i % 3) / 2;
      const r = theme.primary[0] * colorRatio + theme.secondary[0] * (1 - colorRatio);
      const g = theme.primary[1] * colorRatio + theme.secondary[1] * (1 - colorRatio);
      const b = theme.primary[2] * colorRatio + theme.secondary[2] * (1 - colorRatio);

      const glowSize = Math.max(size * 2, 4);
      ctx.globalAlpha = alpha * 0.4;
      ctx.drawImage(glowSprite, px - glowSize, py - glowSize, glowSize * 2, glowSize * 2);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}

function drawPlasma(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const numPoints = 120;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  for(let layer = 0; layer < 3; layer++) {
    runtime.ctx.beginPath();
    for(let i=0; i<=numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const bin = Math.floor((i / numPoints) * (runtime.analyser.frequencyBinCount / 4));
      const val = runtime.dataArray[bin] / 255;
      
      const wave1 = Math.sin(angle * (3 + layer) + time * (1 + layer*0.2)) * 40;
      const wave2 = Math.cos(angle * (5 - layer) - time * 0.8) * 30;
      const wave3 = Math.sin(angle * 7 + time * 1.5) * 20;
      
      const r = 50 + (layer * 50) + wave1 + wave2 + wave3 + (val * 200 * runtime.sensitivity);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if(i === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.quadraticCurveTo(cx + Math.cos(angle - 0.05)*(r-10), cy + Math.sin(angle - 0.05)*(r-10), x, y);
    }
    runtime.ctx.closePath();
    
    runtime.ctx.strokeStyle = layer === 0 ? `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.8)` : 
                      layer === 1 ? `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.6)` :
                      `rgba(255, 255, 255, 0.4)`;
                      
    runtime.ctx.lineWidth = 3 + (volume * 5);
    runtime.ctx.shadowBlur = 15;
    runtime.ctx.shadowColor = runtime.ctx.strokeStyle;
    runtime.ctx.stroke();
    
    runtime.ctx.fillStyle = layer === 0 ? `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.1)` : 
                    `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.05)`;
    runtime.ctx.fill();
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
}

const ripples = [];

function drawRipple(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  // Mouse Interaction: Spawn ripples on movement
  if (runtime.isMouseInteractive) {
    const distMoved = Math.hypot(runtime.mouseX - lastMouseX, runtime.mouseY - lastMouseY);
    if (distMoved > 15 && ripples.length < 120) {
      ripples.push({
        x: runtime.mouseX,
        y: runtime.mouseY,
        radius: 5,
        life: 1,
        maxLife: 1,
        isPrimary: Math.random() > 0.5
      });
      lastMouseX = runtime.mouseX;
      lastMouseY = runtime.mouseY;
    }
  }
  
  // Add new ripples based on volume peaks
  if (volume > 0.5 && Math.random() > 0.7 && ripples.length < 120) {
    ripples.push({
      x: cx,
      y: cy,
      radius: 10,
      life: 1,
      maxLife: 1,
      isPrimary: true
    });
  }
  
  // Draw base frequency Wobbly Blob instead of a boring circle
  runtime.ctx.beginPath();
  const basePoints = 64;
  for (let i = 0; i <= basePoints; i++) {
    const angle = (i / basePoints) * Math.PI * 2;
    const bin = Math.floor((i / basePoints) * (runtime.analyser.frequencyBinCount / 4));
    const val = runtime.dataArray[bin] / 255;
    
    // Wobble based on audio and time
    const r = 50 + (volume * 100 * runtime.sensitivity) + (val * 50) + Math.sin(angle * 5 + time * 3) * 10;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    
    if (i === 0) runtime.ctx.moveTo(x, y);
    else runtime.ctx.lineTo(x, y);
  }
  runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.2)`;
  runtime.ctx.fill();
  runtime.ctx.strokeStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  runtime.ctx.lineWidth = 3 + volume * 5;
  runtime.ctx.stroke();
  
  // Draw expanding ripples
  for(let i=ripples.length-1; i>=0; i--) {
    let r = ripples[i];
    r.radius += 8 + (volume * 15);
    r.life -= 0.015;
    
    if(r.life <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    
    const color = r.isPrimary ? theme.primary : theme.secondary;
    
    runtime.ctx.beginPath();
    // Slightly warp the ripple based on its life to make it look like water
    for (let j = 0; j <= 30; j++) {
      const angle = (j / 30) * Math.PI * 2;
      const wobble = Math.sin(angle * 8 + time * 5) * (1 - r.life) * 10;
      const x = r.x + Math.cos(angle) * (r.radius + wobble);
      const y = r.y + Math.sin(angle) * (r.radius + wobble);
      if (j === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    
    runtime.ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${r.life})`;
    runtime.ctx.lineWidth = 2 + r.life * 4;
    runtime.ctx.stroke();
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawSupernova(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const rays = 150;
  
  // Make it HELLA GRAND
  const coreRadius = 80 + (volume * 150 * runtime.sensitivity);
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  // Massive Shockwave Rings
  for(let i=0; i<3; i++) {
    const shockR = coreRadius + (time*500 + i*300) % (runtime.canvas.width);
    const alpha = Math.max(0, 1 - (shockR / runtime.canvas.width));
    runtime.ctx.beginPath();
    runtime.ctx.arc(cx, cy, shockR, 0, Math.PI * 2);
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${alpha * volume})`;
    runtime.ctx.lineWidth = 10 * alpha + volume * 20;
    runtime.ctx.stroke();
  }
  
  // PERFORMANCE FIX: Create ONE giant radial gradient instead of 150 linear gradients
  const rayGradient = runtime.ctx.createRadialGradient(cx, cy, coreRadius, cx, cy, runtime.canvas.width * 0.8);
  rayGradient.addColorStop(0, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.9)`);
  rayGradient.addColorStop(0.3, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.5)`);
  rayGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  
  runtime.ctx.strokeStyle = rayGradient;
  runtime.ctx.lineCap = 'round';
  
  // Massive Rays filling the screen
  for(let i=0; i<rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + (time * 0.1 * (i%2===0?1:-1));
    const bin = Math.floor((i / rays) * (runtime.analyser.frequencyBinCount / 2));
    const val = runtime.dataArray[bin] / 255;
    
    // Rays shoot WAY out
    const length = coreRadius + (val * runtime.canvas.width * 0.8 * runtime.sensitivity);
    
    const x = cx + Math.cos(angle) * length;
    const y = cy + Math.sin(angle) * length;
    
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(cx, cy);
    runtime.ctx.lineTo(x, y);
    runtime.ctx.lineWidth = 2 + val * 10;
    runtime.ctx.stroke();
  }
  
  // Gigantic Core
  const coreGradient = runtime.ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2);
  coreGradient.addColorStop(0, '#fff');
  coreGradient.addColorStop(0.1, `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`);
  coreGradient.addColorStop(0.4, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
  coreGradient.addColorStop(1, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0)`);
  
  runtime.ctx.beginPath();
  runtime.ctx.arc(cx, cy, coreRadius * 2, 0, Math.PI * 2);
  runtime.ctx.fillStyle = coreGradient;
  runtime.ctx.fill();
  
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawGeometric(cx, cy, volume, theme) {
  const time = performance.now() * 0.0005;
  const numShapes = 8;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  for(let i=0; i<numShapes; i++) {
    const bin = Math.floor((i / numShapes) * (runtime.analyser.frequencyBinCount / 4));
    const val = runtime.dataArray[bin] / 255;
    
    // Scale drastically with volume for "LSD" feel
    const size = 20 + Math.pow(i, 2.5) * 5 + (val * 300 * runtime.sensitivity) * (1 + volume);
    const sides = 3 + (i % 5);
    
    runtime.ctx.save();
    runtime.ctx.translate(cx, cy);
    runtime.ctx.rotate(time * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.5) + (volume * Math.PI));
    
    runtime.ctx.beginPath();
    for(let s=0; s<sides; s++) {
      const angle = (s / sides) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if(s === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    runtime.ctx.closePath();
    
    const colorRatio = i / numShapes;
    const r = theme.primary[0] * (1-colorRatio) + theme.secondary[0] * colorRatio;
    const g = theme.primary[1] * (1-colorRatio) + theme.secondary[1] * colorRatio;
    const b = theme.primary[2] * (1-colorRatio) + theme.secondary[2] * colorRatio;
    
    runtime.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.9 - i*0.05})`;
    runtime.ctx.lineWidth = 2 + val * 8 + volume * 5;
    runtime.ctx.stroke();
    
    // Draw interconnecting LSD web
    if (i > 0) {
      runtime.ctx.scale(0.5, 0.5);
      runtime.ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
      runtime.ctx.stroke();
    }
    runtime.ctx.restore();
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawTunnel(cx, cy, volume, theme) {
  const time = performance.now() * 0.002;
  const rings = 25;
  
  for(let i=0; i<rings; i++) {
    let z = ((i - time) % rings);
    if(z < 0) z += rings;
    
    const normalizedZ = z / rings; 
    const bin = Math.floor(normalizedZ * (runtime.analyser.frequencyBinCount / 4));
    const val = runtime.dataArray[bin] / 255;
    
    const depth = Math.pow(normalizedZ, 3);
    // Diameter increases MASSIVELY with intensity
    const radius = 20 + depth * Math.max(runtime.canvas.width, runtime.canvas.height) * (1 + volume * 2) + (val * 150 * runtime.sensitivity);
    
    runtime.ctx.beginPath();
    const segments = 24;
    for(let s=0; s<=segments; s++) {
      const angle = (s / segments) * Math.PI * 2 + (time * 0.2 * (i%2===0?1:-1));
      // Warp the walls
      const wave = Math.sin(angle * 6 + time * 3) * (val * 40 * (1 + volume));
      
      const x = cx + Math.cos(angle) * (radius + wave);
      const y = cy + Math.sin(angle) * (radius + wave);
      
      if(s === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    
    runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${1 - normalizedZ + volume*0.5})`;
    runtime.ctx.lineWidth = (1 - normalizedZ) * 8 + 1 + volume * 5;
    runtime.ctx.stroke();
    
    if (val > 0.5) {
      runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.1)`;
      runtime.ctx.fill();
    }
  }
}

function drawGlitchCore(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const numGlitches = 20 + Math.floor(volume * 40); // Optimized count
  
  runtime.ctx.globalCompositeOperation = 'difference';
  
  for(let i=0; i<numGlitches; i++) {
    const bin = Math.floor(Math.random() * (runtime.analyser.frequencyBinCount / 2));
    const val = runtime.dataArray[bin] / 255;
    
    if (val < 0.2) continue; 
    
    const x = cx + (Math.random() - 0.5) * runtime.canvas.width * val * 2;
    const y = cy + (Math.random() - 0.5) * runtime.canvas.height * val * 2;
    const size = (Math.random() * 200 + 50) * val * runtime.sensitivity;
    
    runtime.ctx.fillStyle = Math.random() > 0.5 ? 
      `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})` : 
      `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
      
    runtime.ctx.save();
    runtime.ctx.translate(x, y);
    runtime.ctx.rotate((Math.random() - 0.5) * Math.PI * 2);
    
    const shapeType = Math.floor(Math.random() * 4);
    runtime.ctx.beginPath();
    if (shapeType === 0) {
      runtime.ctx.fillRect(-size/2, -size/8, size, size/4);
    } else if (shapeType === 1) {
      runtime.ctx.arc(0, 0, size/4, 0, Math.PI * 2);
      runtime.ctx.fill();
    } else if (shapeType === 2) {
      runtime.ctx.moveTo(0, -size/2); runtime.ctx.lineTo(size/2, size/2); runtime.ctx.lineTo(-size/2, size/2);
      runtime.ctx.fill();
    } else {
      runtime.ctx.strokeStyle = runtime.ctx.fillStyle;
      runtime.ctx.lineWidth = Math.random() * 5 + 1;
      runtime.ctx.strokeRect(-size/2, -size/2, size, size);
    }
    runtime.ctx.restore();
  }
  
  runtime.ctx.globalCompositeOperation = 'source-over';
  
  // Fast Data moshing slice using drawImage
  if (volume > 0.6) {
    const maxSlices = volume > 0.85 ? 2 : 1; // Limit slice count for performance
    for(let i=0; i<maxSlices; i++) {
      const splitY = Math.random() * runtime.canvas.height;
      const splitH = Math.random() * 100 + 10;
      const offset = (Math.random() - 0.5) * 150 * volume;
      if (splitY + splitH < runtime.canvas.height) {
        runtime.ctx.drawImage(runtime.canvas, 0, splitY, runtime.canvas.width, splitH, offset, splitY, runtime.canvas.width, splitH);
      }
    }
  }
}

const matrixDrops = Array(150).fill(0).map(()=>({x: (Math.random()-0.5)*3000, y: (Math.random()-0.5)*3000, z: Math.random()*2000}));
function drawMatrixRain(cx, cy, volume, theme) {
  // Rebuilt as "Matrix 3D Data Flow"
  const speed = 10 + volume * 100;
  
  runtime.ctx.font = 'bold 24px monospace';
  runtime.ctx.textAlign = 'center';
  runtime.ctx.textBaseline = 'middle';
  
  matrixDrops.forEach((p, i) => {
    const bin = Math.floor((i / matrixDrops.length) * (runtime.analyser.frequencyBinCount / 4));
    const val = runtime.dataArray[bin] / 255;
    
    p.z -= speed * (1 + val);
    if (p.z <= 0) {
      p.z = 2000;
      p.x = (Math.random() - 0.5) * 3000;
      p.y = (Math.random() - 0.5) * 3000;
    }
    
    const k = 600 / p.z;
    const x = p.x * k + cx;
    const y = p.y * k + cy;
    const size = Math.max(1, 30 * k);
    
    if (x > -50 && x < runtime.canvas.width+50 && y > -50 && y < runtime.canvas.height+50) {
      const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
      runtime.ctx.font = `bold ${size}px monospace`;
      
      const alpha = Math.min(1, Math.max(0.1, 1 - (p.z / 2000)));
      runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${alpha})`;
      
      // Highlight extremely loud data points (optimized threshold)
      if (val > 0.9) {
        runtime.ctx.fillStyle = '#fff';
        runtime.ctx.shadowBlur = 10;
        runtime.ctx.shadowColor = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
      } else {
        runtime.ctx.shadowBlur = 0;
      }
      
      runtime.ctx.fillText(char, x, y);
    }
  });
  runtime.ctx.shadowBlur = 0;
}

function drawDNAHelix(cx, cy, volume, theme) {
  // Rebuilt as "Cybernetic Lattice Structure"
  const time = performance.now() * 0.001;
  const layers = 8;
  
  // Mouse 3D rotation effect
  let skewX = 0, skewY = 0;
  if (runtime.isMouseInteractive) {
    skewX = (runtime.mouseX - runtime.canvas.width / 2) * 0.002;
    skewY = (runtime.mouseY - runtime.canvas.height / 2) * 0.002;
  }
  
  runtime.ctx.save();
  runtime.ctx.translate(cx, cy);
  runtime.ctx.transform(1, skewY, skewX, 1, 0, 0);
  runtime.ctx.translate(-cx, -cy);
  
  runtime.ctx.globalCompositeOperation = 'screen';
  for(let l=0; l<layers; l++) {
    const radius = 50 + Math.pow(l, 1.5) * 30 + volume * 100 * runtime.sensitivity;
    const nodes = 6 + l * 2;
    
    runtime.ctx.beginPath();
    let firstX, firstY;
    for(let n=0; n<nodes; n++) {
      const angle = (n/nodes) * Math.PI * 2 + time * (l%2===0 ? 0.5 : -0.5);
      const val = runtime.dataArray[Math.floor((n/nodes)*(runtime.analyser.frequencyBinCount/4))] / 255;
      
      const bump = val * 80 * runtime.sensitivity;
      const x = cx + Math.cos(angle) * (radius + bump);
      const y = cy + Math.sin(angle) * (radius + bump);
      
      if(n===0) { runtime.ctx.moveTo(x, y); firstX = x; firstY = y; }
      else runtime.ctx.lineTo(x, y);
      
      // Node UI Elements
      runtime.ctx.fillStyle = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
      runtime.ctx.fillRect(x-3, y-3, 6, 6);
      if (val > 0.5) {
        runtime.ctx.beginPath();
        runtime.ctx.arc(x, y, 10 + val*10, 0, Math.PI*2);
        runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.5)`;
        runtime.ctx.stroke();
        runtime.ctx.beginPath(); // reset for lattice
        runtime.ctx.moveTo(x, y);
      }
    }
    runtime.ctx.lineTo(firstX, firstY); // Close shape manually
    
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${1 - l/layers})`;
    runtime.ctx.lineWidth = 2 + volume*4;
    runtime.ctx.stroke();
    
    // Draw interconnecting struts
    if (l > 0) {
      runtime.ctx.beginPath();
      runtime.ctx.arc(cx, cy, radius, 0, Math.PI*2);
      runtime.ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
      runtime.ctx.lineWidth = 1;
      runtime.ctx.stroke();
    }
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
  runtime.ctx.restore();
}

function drawPulseRing(cx, cy, volume, theme) {
  // Rebuilt as "Quantum Tesseract"
  const time = performance.now() * 0.001;
  const size = 100 + volume * 250 * runtime.sensitivity;
  
  runtime.ctx.save();
  
  // Mouse 3D perspective warp
  if (runtime.isMouseInteractive) {
    const dxMouse = (runtime.mouseX - runtime.canvas.width / 2) * 0.1;
    const dyMouse = (runtime.mouseY - runtime.canvas.height / 2) * 0.1;
    runtime.ctx.translate(cx + dxMouse, cy + dyMouse);
    runtime.ctx.transform(1, dyMouse/200, dxMouse/200, 1, 0, 0);
  } else {
    runtime.ctx.translate(cx, cy);
  }
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  for(let layer=0; layer<4; layer++) {
    runtime.ctx.rotate(time * (layer%2===0 ? 0.8 : -0.8));
    runtime.ctx.beginPath();
    
    const sides = 4 + Math.floor(volume * 2); // Morph shape on bass
    for(let i=0; i<sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * (size + layer*40);
      const y = Math.sin(angle) * (size + layer*40);
      if(i===0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    runtime.ctx.closePath();
    
    const val = runtime.dataArray[layer * 10] / 255;
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${0.4 + val})`;
    runtime.ctx.lineWidth = 3 + volume*10;
    runtime.ctx.shadowBlur = 20;
    runtime.ctx.shadowColor = runtime.ctx.strokeStyle;
    runtime.ctx.stroke();
    
    // Cross connections to center
    runtime.ctx.beginPath();
    for(let i=0; i<sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * (size + layer*40);
      const y = Math.sin(angle) * (size + layer*40);
      runtime.ctx.moveTo(0,0);
      runtime.ctx.lineTo(x, y);
    }
    runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.3)`;
    runtime.ctx.lineWidth = 1 + val*3;
    runtime.ctx.stroke();
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
  runtime.ctx.restore();
}

// --- Top 5 Elite Visualizers ---

const bhParticles = Array(300).fill(0).map(()=>({angle: Math.random()*Math.PI*2, dist: Math.random()*1000 + 100, speed: Math.random()*0.02 + 0.005}));
function drawBlackHole(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const isDrop = volume > 0.65; 
  const pull = isDrop ? 15 + runtime.smoothTimelineState * 2 : 2; 
  const coreRadius = (40 + (isDrop ? -10 : volume * 10 * runtime.sensitivity)) * (1 + runtime.smoothTimelineState * 0.05); 
  
  const targetX = runtime.isMouseInteractive ? runtime.mouseX : cx;
  const targetY = runtime.isMouseInteractive ? runtime.mouseY : cy;
  
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  // Accretion disk
  runtime.ctx.beginPath();
  const linePath = [];
  bhParticles.forEach((p, i) => {
    const bin = Math.floor((i/bhParticles.length) * (runtime.analyser.frequencyBinCount/4));
    const val = runtime.dataArray[bin] / 255;
    
    p.angle += p.speed * (1 + val*2);
    p.dist -= pull * (1 + val);
    
    if (p.dist < coreRadius) {
      p.dist = 1000;
      p.angle = Math.random() * Math.PI * 2;
      if (isDrop) {
        p.dist = coreRadius + Math.random() * 50;
        p.speed = -0.5; // Blast outward!
      } else {
        p.speed = Math.random()*0.02 + 0.005;
      }
    }
    
    if (p.speed < 0) p.speed += 0.01; 
    if (p.speed < 0.005 && p.speed >= 0) p.speed = Math.random()*0.02 + 0.005;

    const x = targetX + Math.cos(p.angle) * p.dist;
    const y = targetY + Math.sin(p.angle) * p.dist;
    
    const size = Math.max(1, (1000 - p.dist) / 100) * (1 + val * 3);
    
    // We batch circles together instead of filling 300 individually
    runtime.ctx.moveTo(x, y);
    runtime.ctx.arc(x, y, size, 0, Math.PI*2);
    
    if (p.dist < coreRadius * 4 && i % 3 === 0) {
      linePath.push({x, y});
    }
  });
  runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.5)`;
  runtime.ctx.fill();
  
  // Draw all gravity lines in one stroke
  runtime.ctx.beginPath();
  linePath.forEach(pt => {
    runtime.ctx.moveTo(pt.x, pt.y);
    runtime.ctx.lineTo(targetX, targetY);
  });
  runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.3)`;
  runtime.ctx.lineWidth = 1;
  runtime.ctx.stroke();

  // The Void
  runtime.ctx.globalCompositeOperation = 'source-over';
  runtime.ctx.beginPath();
  runtime.ctx.arc(targetX, targetY, coreRadius, 0, Math.PI * 2);
  runtime.ctx.fillStyle = '#000';
  runtime.ctx.fill();
  runtime.ctx.lineWidth = 5 + volume*10;
  runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.8)`;
  runtime.ctx.stroke();
  
  // Event Horizon Glow
  runtime.ctx.beginPath();
  runtime.ctx.arc(targetX, targetY, coreRadius * 1.5, 0, Math.PI * 2);
  const glow = runtime.ctx.createRadialGradient(targetX, targetY, coreRadius, targetX, targetY, coreRadius * 3);
  glow.addColorStop(0, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.8)`);
  glow.addColorStop(1, 'transparent');
  runtime.ctx.fillStyle = glow;
  runtime.ctx.fill();
  
  // Guarantee clean state for next frame
  runtime.ctx.globalCompositeOperation = 'source-over';
  runtime.ctx.shadowBlur = 0;
}

function drawLiquidPlasma(cx, cy, volume, theme) {
  const time = performance.now() * 0.0005;
  const blobs = 6;
  
  const targetCx = runtime.isMouseInteractive ? cx + (runtime.mouseX - cx) * 0.3 : cx;
  const targetCy = runtime.isMouseInteractive ? cy + (runtime.mouseY - cy) * 0.3 : cy;
  
  runtime.ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < blobs; i++) {
    const bin = Math.floor((i / blobs) * (runtime.analyser.frequencyBinCount / 6));
    const val = runtime.dataArray[bin] / 255;
    
    const xOff = Math.sin(time + i * 1.2) * (200 + val * 100 * runtime.sensitivity);
    const yOff = Math.cos(time * 0.8 + i * 2.1) * (200 + val * 100 * runtime.sensitivity);
    
    const radius = 150 + val * 200 * runtime.sensitivity + volume * 50 * runtime.sensitivity;
    
    const grad = runtime.ctx.createRadialGradient(targetCx + xOff, targetCy + yOff, 0, targetCx + xOff, targetCy + yOff, radius);
    const color = i % 2 === 0 ? theme.primary : theme.secondary;
    grad.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`);
    grad.addColorStop(1, 'transparent');
    
    runtime.ctx.beginPath();
    runtime.ctx.arc(targetCx + xOff, targetCy + yOff, radius, 0, Math.PI * 2);
    runtime.ctx.fillStyle = grad;
    runtime.ctx.fill();
  }
  
  runtime.ctx.beginPath();
  for (let a = 0; a <= Math.PI * 2; a += 0.1) {
    const rBin = Math.floor((a / (Math.PI * 2)) * (runtime.analyser.frequencyBinCount / 2));
    const rVal = runtime.dataArray[rBin] / 255;
    const r = 250 + Math.sin(a * 4 + time * 2) * 50 + rVal * 150 * runtime.sensitivity;
    const x = targetCx + Math.cos(a) * r;
    const y = targetCy + Math.sin(a) * r;
    if (a === 0) runtime.ctx.moveTo(x, y);
    else runtime.ctx.lineTo(x, y);
  }
  runtime.ctx.closePath();
  runtime.ctx.strokeStyle = `rgba(255,255,255,0.2)`;
  runtime.ctx.lineWidth = 3 + volume * 5 * runtime.sensitivity;
  runtime.ctx.stroke();
  runtime.ctx.globalCompositeOperation = 'source-over';
}

function drawCathedral(cx, cy, volume, theme) {
  drawApocalypseCathedral(cx, cy, volume, theme);
}

function drawFractalBloom(cx, cy, volume, theme) {
  const time = performance.now() * 0.0005;
  runtime.ctx.globalCompositeOperation = 'lighter';
  
  // Cap maxDepth strictly to prevent exponential recursion lockups (2^6 * 6 = 384 max paths)
  let maxDepth = Math.floor((3 + volume * 2 * Math.min(runtime.sensitivity, 1.5)) * runtime.perfScale * (1 + runtime.smoothTimelineState * 0.05));
  maxDepth = Math.min(maxDepth, 6);
  const targetCx = runtime.isMouseInteractive ? cx + (runtime.mouseX - cx) * 0.3 : cx;
  const targetCy = runtime.isMouseInteractive ? cy + (runtime.mouseY - cy) * 0.3 : cy;
  
  function drawBranch(x, y, radius, angle, depth, binIndex) {
    if (depth === 0) return;
    const val = runtime.dataArray[binIndex % (runtime.analyser.frequencyBinCount/4)] / 255;
    
    const nx = x + Math.cos(angle) * radius;
    const ny = y + Math.sin(angle) * radius;
    
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(x, y);
    runtime.ctx.lineTo(nx, ny);
    
    const rRatio = depth / maxDepth;
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]*rRatio + theme.secondary[0]*(1-rRatio)}, ${theme.primary[1]*rRatio + theme.secondary[1]*(1-rRatio)}, ${theme.primary[2]*rRatio + theme.secondary[2]*(1-rRatio)}, ${0.5 + val*0.5})`;
    runtime.ctx.lineWidth = depth * 1.5 + val * 5 * runtime.sensitivity;
    runtime.ctx.stroke();
    
    if (depth === 1 || val > 0.8) {
      runtime.ctx.beginPath();
      runtime.ctx.arc(nx, ny, 3 + val*10*runtime.sensitivity, 0, Math.PI*2);
      runtime.ctx.fillStyle = `rgba(255,255,255,${val})`;
      runtime.ctx.fill();
    }
    
    const splitAngle = 0.3 + val * 0.5 + Math.sin(time*2 + depth)*0.2;
    drawBranch(nx, ny, radius * 0.7, angle - splitAngle, depth - 1, binIndex + 5);
    drawBranch(nx, ny, radius * 0.7, angle + splitAngle, depth - 1, binIndex + 5);
  }
  
  const arms = 6;
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2 + time + (runtime.isMouseInteractive ? (runtime.mouseX-cx)*0.001 : 0);
    drawBranch(targetCx, targetCy, 100 + volume * 100 * runtime.sensitivity, angle, maxDepth, i * 10);
  }
  runtime.ctx.globalCompositeOperation = 'source-over';
}

const neuralNodes = [];
for (let i = 0; i < 150; i++) {
  neuralNodes.push({
    x: (Math.random() - 0.5) * 1200,
    y: (Math.random() - 0.5) * 1200,
    z: (Math.random() - 0.5) * 400, // Dimensional folding
    vx: 0, vy: 0,
    pulse: 0,
    energy: Math.random(),
    life: Math.random() * Math.PI * 2
  });
}

const pulseWaves = [];

function drawNeuralBloom(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  const beat = runtime.frameBeatDetected || runtime.beatPulse > 0.5;
  const ctx = runtime.ctx;
  const connRadius = 300 + volume * 100;
  
  if (beat) {
    pulseWaves.push({ radius: 0, speed: 15 + volume * 20, strength: 1.0 });
  }

  // Update pulses
  for(let i=pulseWaves.length-1; i>=0; i--) {
    pulseWaves[i].radius += pulseWaves[i].speed;
    pulseWaves[i].strength -= 0.015;
    if(pulseWaves[i].strength <= 0) pulseWaves.splice(i, 1);
  }

  // Dimensional fold / zoom
  const foldZoom = 1 + Math.sin(time * 0.5) * 0.2 + volume * 0.15;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(foldZoom, foldZoom);

  // Rotate entire structure
  ctx.rotate(time * 0.1);

  const world = [];
  neuralConnHash.clear();

  for (let i = 0; i < neuralNodes.length; i++) {
    const node = neuralNodes[i];
    const bin = Math.floor((i / neuralNodes.length) * (runtime.analyser.frequencyBinCount / 4));
    const val = runtime.dataArray[bin] / 255;
    
    // Living motion
    node.life += 0.02 + val * 0.05;
    const nx = Math.sin(node.life * 1.1 + i) * 2;
    const ny = Math.cos(node.life * 1.3 + i) * 2;
    node.vx += (nx - node.vx) * 0.1;
    node.vy += (ny - node.vy) * 0.1;
    
    // Orbital drift
    node.x += node.vx + Math.cos(time * 0.5 + node.z * 0.01) * 1.5;
    node.y += node.vy + Math.sin(time * 0.5 + node.z * 0.01) * 1.5;
    
    // Wrapping
    if (Math.hypot(node.x, node.y) > 1000) {
      node.x *= -0.9;
      node.y *= -0.9;
    }

    // Interactive dimensional folding
    let wx = node.x;
    let wy = node.y;
    if (runtime.isMouseInteractive) {
      const mx = (runtime.mouseX - cx) / foldZoom;
      const my = (runtime.mouseY - cy) / foldZoom;
      const d = Math.hypot(wx - mx, wy - my);
      if (d < 300) {
        wx += (wx - mx) / d * 20 * (1 + runtime.beatPulse);
        wy += (wy - my) / d * 20 * (1 + runtime.beatPulse);
      }
    }

    // Apply pulse waves to node energy
    let waveEnergy = 0;
    const distFromCenter = Math.hypot(wx, wy);
    for(const p of pulseWaves) {
      if(Math.abs(distFromCenter - p.radius) < 100) {
        waveEnergy += p.strength;
      }
    }

    node.pulse = Math.max(0, node.pulse - 0.05);
    if (val > 0.6 && Math.random() > 0.8) node.pulse = 1.0;
    
    const activeEnergy = Math.max(val, waveEnergy, node.pulse);
    
    // Spectral node birth/collapse logic (scale shift)
    const scale = (0.5 + activeEnergy * 1.5) * (1 + (node.z + 400) / 800);
    
    const slot = { wx, wy, val: activeEnergy, scale, index: i, z: node.z };
    world.push(slot);
    if(activeEnergy > 0.1) neuralConnHash.insert(wx, wy, slot);
  }

  ctx.globalCompositeOperation = 'lighter';

  // Draw Intelligence Webs
  ctx.beginPath();
  const drawnEdges = new Set();
  let maxConn = 3 + Math.floor(volume * 4);

  for (const a of world) {
    if(a.val < 0.1) continue;
    const neighbors = [];
    neuralConnHash.query(a.wx, a.wy, connRadius, (b) => {
      if (b.index === a.index) return;
      // Z-depth awareness for connections
      if (Math.abs(a.z - b.z) > 300) return; 
      const d2 = (b.wx - a.wx) ** 2 + (b.wy - a.wy) ** 2;
      neighbors.push({ b, d2 });
    });
    neighbors.sort((x, y) => x.d2 - y.d2);
    
    for (let n = 0; n < Math.min(maxConn, neighbors.length); n++) {
      const b = neighbors[n].b;
      const edgeKey = a.index < b.index ? `${a.index},${b.index}` : `${b.index},${a.index}`;
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);
      
      const dist = Math.sqrt(neighbors[n].d2);
      const intensity = 1 - (dist / connRadius);
      const combinedVal = (a.val + b.val) * 0.5 * intensity;
      
      if(combinedVal > 0.05) {
        // Curve the web organically
        ctx.moveTo(a.wx, a.wy);
        const midX = (a.wx + b.wx) * 0.5 + Math.sin(time*2 + a.index)*20*combinedVal;
        const midY = (a.wy + b.wy) * 0.5 + Math.cos(time*2 + b.index)*20*combinedVal;
        ctx.quadraticCurveTo(midX, midY, b.wx, b.wy);
      }
    }
  }

  // Multi-gradient stroke for the web
  const webGrad = ctx.createLinearGradient(-500, -500, 500, 500);
  webGrad.addColorStop(0, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.8)`);
  webGrad.addColorStop(1, `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.2)`);
  ctx.strokeStyle = webGrad;
  ctx.lineWidth = 1.5 + volume * 2;
  ctx.stroke();

  // Draw Floating Synaptic Blossoms (Nodes)
  for (const slot of world) {
    if(slot.val < 0.05 && slot.scale < 0.6) continue;
    
    const r = theme.primary[0];
    const g = theme.primary[1];
    const b = theme.primary[2];
    
    // Core
    ctx.beginPath();
    ctx.arc(slot.wx, slot.wy, 3 * slot.scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + slot.val * 0.6})`;
    ctx.fill();
    
    // Blossom flare
    if(slot.val > 0.4) {
      ctx.beginPath();
      ctx.arc(slot.wx, slot.wy, 10 * slot.scale * slot.val, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${slot.val * 0.5})`;
      ctx.fill();
    }
  }

  // Draw Pulse Propagation Waves
  for(const p of pulseWaves) {
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.lineWidth = 4 * p.strength;
    ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${p.strength * 0.5})`;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

let wallCompression = 0;
let coreRotationX = 0;
let coreRotationY = 0;
let lastShockwaveTime = 0;
const shockwaves = [];

function drawIronReckoning(cx, cy, volume, theme) {
  const time = performance.now();
  const isDrop = volume > 0.65;
  const bassBin = runtime.dataArray[2] / 255;
  const trebleBin = runtime.dataArray[Math.floor(runtime.analyser.frequencyBinCount * 0.7)] / 255;
  
  // Flash effect only — difference mode removed to prevent permanent screen inversion
  if (isDrop && Math.random() > 0.92) {
    runtime.ctx.save();
    runtime.ctx.globalCompositeOperation = 'source-over';
    runtime.ctx.fillStyle = `rgba(255,255,255,${0.3 + volume * 0.4})`;
    runtime.ctx.fillRect(0, 0, runtime.canvas.width, runtime.canvas.height);
    runtime.ctx.restore();
  }
  
  runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.1)`;
  runtime.ctx.lineWidth = 1 + trebleBin * 5;
  
  runtime.ctx.beginPath();
  // Adjust grid density based on timeline intensity and performance
  const gridSize = Math.max(20, (50 + trebleBin * 10) * Math.max(0.5, 1.5 - runtime.perfScale) / (1 + runtime.smoothTimelineState * 0.1));
  for(let x = 0; x < runtime.canvas.width; x += gridSize) {
    const glitchX = (trebleBin > 0.5 && Math.random() > 0.8) ? (Math.random() - 0.5) * 50 : 0;
    runtime.ctx.moveTo(x + glitchX, 0);
    runtime.ctx.lineTo(x + glitchX, runtime.canvas.height);
  }
  for(let y = 0; y < runtime.canvas.height; y += gridSize) {
    const glitchY = (trebleBin > 0.5 && Math.random() > 0.8) ? (Math.random() - 0.5) * 50 : 0;
    runtime.ctx.moveTo(0, y + glitchY);
    runtime.ctx.lineTo(runtime.canvas.width, y + glitchY);
  }
  runtime.ctx.stroke();
  
  if (bassBin > 0.9 && time - lastShockwaveTime > 200) {
    shockwaves.push({ radius: 10, life: 1 });
    lastShockwaveTime = time;
  }
  
  for(let i = shockwaves.length - 1; i >= 0; i--) {
    let sw = shockwaves[i];
    sw.radius += 30 + volume * 50;
    sw.life -= 0.05;
    if (sw.life <= 0) {
      shockwaves.splice(i, 1);
      continue;
    }
    runtime.ctx.beginPath();
    runtime.ctx.arc(cx, cy, sw.radius, 0, Math.PI * 2);
    runtime.ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${sw.life})`;
    runtime.ctx.lineWidth = 5 + sw.life * 20;
    runtime.ctx.stroke();
    
    if (sw.life > 0.8) {
       runtime.ctx.beginPath();
       runtime.ctx.arc(cx + 10, cy, sw.radius, 0, Math.PI * 2);
       runtime.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
       runtime.ctx.stroke();
       runtime.ctx.beginPath();
       runtime.ctx.arc(cx - 10, cy, sw.radius, 0, Math.PI * 2);
       runtime.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
       runtime.ctx.stroke();
    }
  }

  const targetCompression = bassBin * (runtime.canvas.width * 0.3) * runtime.sensitivity;
  wallCompression += (targetCompression - wallCompression) * 0.2;
  
  runtime.ctx.fillStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${0.05 + bassBin*0.1})`;
  runtime.ctx.fillRect(0, 0, wallCompression, runtime.canvas.height);
  runtime.ctx.fillRect(runtime.canvas.width - wallCompression, 0, wallCompression, runtime.canvas.height);
  
  runtime.ctx.fillStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  runtime.ctx.fillRect(wallCompression - 10, 0, 10, runtime.canvas.height);
  runtime.ctx.fillRect(runtime.canvas.width - wallCompression, 0, 10, runtime.canvas.height);
  
  const coreSpinVelocity = volume * 0.2 * runtime.sensitivity + (trebleBin * 0.5);
  coreRotationX += coreSpinVelocity;
  coreRotationY += coreSpinVelocity * 0.7;
  
  if (runtime.isMouseInteractive) {
    coreRotationX += (runtime.mouseY - cy) * 0.0001;
    coreRotationY += (runtime.mouseX - cx) * 0.0001;
  }
  
  runtime.ctx.save();
  runtime.ctx.translate(cx, cy);
  if (volume > 0.8) {
    runtime.ctx.translate((Math.random()-0.5)*30*runtime.sensitivity, (Math.random()-0.5)*30*runtime.sensitivity);
  }
  
  const coreSize = 100 + volume * 150 * runtime.sensitivity;
  const nodes = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
    [0,6],[1,7],[2,4],[3,5]
  ];
  
  runtime.ctx.strokeStyle = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
  runtime.ctx.lineWidth = 3 + bassBin * 10;
  runtime.ctx.lineCap = 'square';
  
  edges.forEach(edge => {
    let p1 = [...nodes[edge[0]]];
    let p2 = [...nodes[edge[1]]];
    
    let cosX = Math.cos(coreRotationX), sinX = Math.sin(coreRotationX);
    let y1 = p1[1]*cosX - p1[2]*sinX, z1 = p1[1]*sinX + p1[2]*cosX;
    let y2 = p2[1]*cosX - p2[2]*sinX, z2 = p2[1]*sinX + p2[2]*cosX;
    p1[1] = y1; p1[2] = z1; p2[1] = y2; p2[2] = z2;
    
    let cosY = Math.cos(coreRotationY), sinY = Math.sin(coreRotationY);
    let x1 = p1[0]*cosY + p1[2]*sinY, z1_y = -p1[0]*sinY + p1[2]*cosY;
    let x2 = p2[0]*cosY + p2[2]*sinY, z2_y = -p2[0]*sinY + p2[2]*cosY;
    p1[0] = x1; p2[0] = x2;
    
    const s1 = coreSize / (2 - z1_y/2);
    const s2 = coreSize / (2 - z2_y/2);
    
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(p1[0]*s1, p1[1]*s1);
    runtime.ctx.lineTo(p2[0]*s2, p2[1]*s2);
    
    if (isDrop && Math.random() > 0.5) {
      runtime.ctx.strokeStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
      runtime.ctx.shadowBlur = 20;
      runtime.ctx.shadowColor = 'red';
    } else {
      runtime.ctx.strokeStyle = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
      runtime.ctx.shadowBlur = 0;
    }
    
    runtime.ctx.stroke();
  });
  
  runtime.ctx.beginPath();
  runtime.ctx.arc(0, 0, coreSize * 0.4, 0, Math.PI*2);
  runtime.ctx.fillStyle = `rgba(0,0,0,0.9)`;
  runtime.ctx.fill();
  if (bassBin > 0.8) {
    runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, 0, 0, ${bassBin})`;
    runtime.ctx.fill();
  }
  
  runtime.ctx.restore();
  runtime.ctx.shadowBlur = 0;
  runtime.ctx.globalCompositeOperation = 'source-over';
}

// --- The Pablo Split (TLOP Era) ---
let pabloSplitTarget = 0.5;
let pabloSplitCurrent = 0.5;

function drawPhantomDistrict(cx, cy, volume, theme) {
  const time = performance.now();
  const bassBin = runtime.dataArray[2] / 255;
  const isDrop = volume > 0.65;
  
  // Shift split based on music feel — fast loop instead of .reduce() to avoid frame budget waste
  let energySum = 0;
  for (let i = 0; i < runtime.dataArray.length; i += 4) energySum += runtime.dataArray[i];
  const energy = energySum / (runtime.dataArray.length / 4) / 255;
  if (isDrop && Math.random() > 0.5) {
    pabloSplitTarget = 0.3 + Math.random() * 0.4;
  }
  pabloSplitCurrent += (pabloSplitTarget - pabloSplitCurrent) * 0.05;
  
  if (runtime.isMouseInteractive && Math.abs(runtime.mouseX - (runtime.canvas.width * pabloSplitCurrent)) < 200) {
    pabloSplitTarget = runtime.mouseX / runtime.canvas.width;
  }
  
  const splitX = runtime.canvas.width * pabloSplitCurrent + (isDrop ? (Math.random() - 0.5)*50 : 0);
  
  // --- ECSTASY SIDE (Left) ---
  runtime.ctx.save();
  runtime.ctx.beginPath();
  runtime.ctx.rect(0, 0, splitX, runtime.canvas.height);
  runtime.ctx.clip();
  
  // TLOP Orange BG
  runtime.ctx.fillStyle = `rgb(${theme.bg[0]}, ${theme.bg[1]}, ${theme.bg[2]})`;
  runtime.ctx.fillRect(0, 0, runtime.canvas.width, runtime.canvas.height);
  
  // Chaotic Glitch Text/Blocks
  runtime.ctx.fillStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  const numGlitches = Math.floor(15 * runtime.perfScale * (1 + runtime.smoothTimelineState * 0.1));
  for(let i=0; i<numGlitches; i++) {
    const bin = runtime.dataArray[i * 5] / 255;
    if (bin > 0.5) {
      const w = 50 + Math.random() * 200;
      const h = 20 + Math.random() * 40;
      const x = Math.random() * splitX;
      const y = Math.random() * runtime.canvas.height;
      runtime.ctx.fillRect(x, y, w, h);
      
      if (Math.random() > 0.5) {
        runtime.ctx.fillStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, 0.3)`;
        runtime.ctx.fillRect(x + 10, y + 10, w, h);
        runtime.ctx.fillStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
      }
    }
  }
  
  // Aggressive Waveform
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(0, cy);
  const step = Math.max(2, Math.floor(splitX / 100));
  for(let i=0; i<splitX; i+=step) {
    const dataIdx = Math.floor((i / splitX) * (runtime.analyser.frequencyBinCount / 2));
    const v = runtime.dataArray[dataIdx] / 128.0;
    const y = cy + (v - 1) * 300 * runtime.sensitivity;
    runtime.ctx.lineTo(i, y + (Math.random() - 0.5) * 20 * bassBin); 
  }
  runtime.ctx.strokeStyle = `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`;
  runtime.ctx.lineWidth = 5 + bassBin * 15 * runtime.sensitivity;
  runtime.ctx.stroke();
  
  runtime.ctx.restore();
  
  // --- FINDING GOD SIDE (Right) ---
  runtime.ctx.save();
  runtime.ctx.beginPath();
  runtime.ctx.rect(splitX, 0, runtime.canvas.width - splitX, runtime.canvas.height);
  runtime.ctx.clip();
  
  // Holy Light BG
  const grad = runtime.ctx.createRadialGradient(cx, cy, 0, cx, cy, runtime.canvas.width);
  grad.addColorStop(0, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${0.8 + energy * 0.2})`);
  grad.addColorStop(1, `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.05)`);
  runtime.ctx.fillStyle = '#050505'; 
  runtime.ctx.fillRect(splitX, 0, runtime.canvas.width, runtime.canvas.height);
  runtime.ctx.fillStyle = grad;
  runtime.ctx.fillRect(splitX, 0, runtime.canvas.width, runtime.canvas.height);
  
  // Majestic Halo
  const haloRadius = 150 + energy * 200 * runtime.sensitivity;
  runtime.ctx.beginPath();
  runtime.ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
  runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, 0.8)`;
  runtime.ctx.lineWidth = 10 + bassBin * 20;
  runtime.ctx.shadowBlur = 50;
  runtime.ctx.shadowColor = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
  runtime.ctx.stroke();
  
  // Radial Beams
  const numBeams = 16;
  runtime.ctx.shadowBlur = 0;
  for(let i=0; i<numBeams; i++) {
    const angle = (i / numBeams) * Math.PI * 2 + time * 0.0002;
    const bin = runtime.dataArray[i * 4] / 255;
    const length = haloRadius + bin * 400 * runtime.sensitivity;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(cx + Math.cos(angle)*haloRadius, cy + Math.sin(angle)*haloRadius);
    runtime.ctx.lineTo(cx + Math.cos(angle)*length, cy + Math.sin(angle)*length);
    runtime.ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${bin})`;
    runtime.ctx.lineWidth = 2 + bin * 10;
    runtime.ctx.stroke();
  }
  
  runtime.ctx.restore();
  
  // --- THE SPLIT LINE ---
  runtime.ctx.beginPath();
  runtime.ctx.moveTo(splitX, 0);
  runtime.ctx.lineTo(splitX + (Math.random() - 0.5) * 30 * bassBin, runtime.canvas.height); 
  runtime.ctx.strokeStyle = `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`;
  runtime.ctx.lineWidth = 8;
  runtime.ctx.shadowBlur = 20;
  runtime.ctx.shadowColor = '#000';
  runtime.ctx.stroke();
  runtime.ctx.shadowBlur = 0;
  runtime.ctx.globalCompositeOperation = 'source-over';
}
function drawCurrents(cx, cy, volume, theme) {
  const time = performance.now() * 0.001;
  
  // Smoothly follow mouse or sit in center
  const ballX = runtime.isMouseInteractive ? runtime.mouseX : runtime.canvas.width * 0.3;
  const ballY = runtime.isMouseInteractive ? runtime.mouseY : cy;
  
  const ballRadius = 60 + volume * 40 * runtime.sensitivity; // Ball pulses with bass
  
  // Background lines
  const numLines = 50;
  const spacing = runtime.canvas.height / numLines;
  
  runtime.ctx.lineWidth = 2 + volume * 3;
  runtime.ctx.lineCap = 'round';
  runtime.ctx.lineJoin = 'round';
  
  for(let i = 0; i <= numLines; i++) {
    const yLineBase = i * spacing;
    
    runtime.ctx.beginPath();
    for(let x = 0; x <= runtime.canvas.width; x += 15) {
      let y = yLineBase;
      const dx = x - ballX;
      const dy = yLineBase - ballY;
      const dist = Math.hypot(dx, dy);
      
      // Flow over sphere
      if (dist < ballRadius * 2.5) {
        // Push lines vertically away from center
        const push = Math.pow(1 - dist / (ballRadius * 2.5), 2) * ballRadius * 1.5;
        y += dy > 0 ? push : -push;
      }
      
      // Wake behind the sphere
      if (x > ballX) {
        const distFromCenter = Math.abs(yLineBase - ballY);
        if (distFromCenter < ballRadius * 3) {
          const wakeFactor = Math.pow(1 - distFromCenter / (ballRadius * 3), 2);
          const distBehind = x - ballX;
          
          // Audio reactive frequency mapping based on x position
          const bin = Math.floor((distBehind / runtime.canvas.width) * (runtime.analyser.frequencyBinCount / 4));
          const freq = runtime.dataArray[Math.min(bin, runtime.analyser.frequencyBinCount - 1)] / 255;
          
          const wave = Math.sin(distBehind * 0.015 - time * 3 + (yLineBase * 0.02)) * (30 + freq * 100 * runtime.sensitivity);
          y += wave * wakeFactor;
        }
      }
      
      if (x === 0) runtime.ctx.moveTo(x, y);
      else runtime.ctx.lineTo(x, y);
    }
    
    // Gradient stroke for lines
    const lineGrad = runtime.ctx.createLinearGradient(0, 0, runtime.canvas.width, 0);
    lineGrad.addColorStop(0, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
    lineGrad.addColorStop(1, `rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`);
    
    runtime.ctx.strokeStyle = lineGrad;
    runtime.ctx.stroke();
  }
  
  // Draw the silver ball
  runtime.ctx.beginPath();
  runtime.ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  
  // Chrome sphere gradient
  const ballGrad = runtime.ctx.createLinearGradient(ballX, ballY - ballRadius, ballX, ballY + ballRadius);
  ballGrad.addColorStop(0, '#e0e0e0');    // Sky reflection
  ballGrad.addColorStop(0.45, '#808080'); // Horizon top
  ballGrad.addColorStop(0.5, '#101010');  // Horizon line dark
  ballGrad.addColorStop(0.55, `rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`); // Ground reflection
  ballGrad.addColorStop(1, '#202020');    // Bottom dark
  
  runtime.ctx.fillStyle = ballGrad;
  runtime.ctx.fill();
  
  // Edge glow for ball
  runtime.ctx.lineWidth = 3;
  runtime.ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
  runtime.ctx.stroke();
  
  // Curved Reflection on ball
  runtime.ctx.beginPath();
  runtime.ctx.ellipse(ballX - ballRadius*0.2, ballY - ballRadius*0.3, ballRadius*0.4, ballRadius*0.15, -Math.PI/8, 0, Math.PI*2);
  runtime.ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + volume*0.4})`;
  runtime.ctx.fill();
}
export function initRender2DState() {
  const w = runtime.canvas?.width || 2000;
  const h = runtime.canvas?.height || 2000;
  particles.forEach(p => {
    p.x = Math.random() * w;
    p.y = Math.random() * h;
  });
  ripples.length = 0;
  lastMouseX = w / 2;
  lastMouseY = h / 2;
}

export { particles, stars, ripples, neuralNodes, bhParticles, matrixDrops };

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
  blackhole: 320, cathedral: 220, matrix_rain: 150, donda_pyramid: 80,
  sofi_orbital: 140, graduation_stardrive: 180,
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
