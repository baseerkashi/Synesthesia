// SYNESTRA — Landing Page Cinematic Background Engine

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height, cx, cy;
let time = 0;
let scrollY = 0;
let maxScroll = 1;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  cx = width / 2;
  cy = height / 2;
  maxScroll = document.body.scrollHeight - height;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Watch demo click handler
document.getElementById('btn-watch')?.addEventListener('click', () => {
  window.scrollTo({
    top: document.querySelector('.era-section').offsetTop,
    behavior: 'smooth'
  });
});

// Particles
const particles = Array.from({ length: 150 }, () => ({
  x: (Math.random() - 0.5) * 2000,
  y: (Math.random() - 0.5) * 2000,
  z: Math.random() * 1000 + 100,
  speed: Math.random() * 2 + 0.5,
  size: Math.random() * 2 + 0.5
}));

function draw() {
  time += 0.01;
  
  // Calculate current world phase based on scroll progress
  const scrollPhase = Math.max(0, Math.min(1, scrollY / (maxScroll || 1)));
  
  // Color shifting logic
  let bgR = 2, bgG = 2, bgB = 4;
  let fgR = 255, fgG = 183, fgB = 0; // Paris (Gold)
  let glowR = 0, glowG = 240, glowB = 255; // Cyan
  
  if (scrollPhase > 0.25 && scrollPhase <= 0.5) {
    // Donda (Monochrome/White)
    const t = (scrollPhase - 0.25) * 4;
    fgR = 255; fgG = 255; fgB = 255;
    glowR = 100; glowG = 100; glowB = 100;
  } else if (scrollPhase > 0.5 && scrollPhase <= 0.75) {
    // Graduation (Pink/Magenta)
    const t = (scrollPhase - 0.5) * 4;
    fgR = 255; fgG = 45; fgB = 149;
    glowR = 150; glowG = 0; glowB = 200;
  } else if (scrollPhase > 0.75) {
    // Neural Bloom (Neon Green)
    const t = (scrollPhase - 0.75) * 4;
    fgR = 0; fgG = 255; fgB = 204;
    glowR = 0; glowG = 255; glowB = 100;
  }

  // Draw background
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.3)`;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);

  // Parallax rotation
  ctx.rotate(time * 0.1);

  ctx.globalCompositeOperation = 'lighter';

  // Draw World Geometry
  if (scrollPhase < 0.4) {
    // PARIS FRACTURE GEOMETRY
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      ctx.rotate((Math.PI * 2) / segments);
      ctx.beginPath();
      for (let g = 0; g < 4; g++) {
        let r = 50 + g * 150 + Math.sin(time * 2 + g) * 20;
        ctx.moveTo(0, r);
        ctx.lineTo(r * Math.sin(Math.PI/segments), r * Math.cos(Math.PI/segments));
        ctx.lineTo(r, 0);
      }
      ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${0.1 + (0.4 - scrollPhase)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (scrollPhase < 0.7) {
    // DONDA PYRAMID GEOMETRY
    ctx.rotate(time * 0.2);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const r = 200 + i * 50 + Math.sin(time) * 30;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, 0.2)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else {
    // NEURAL BLOOM / GRADUATION
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      const r = 50 + i * 20;
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${0.05 + Math.sin(time * 3 + i) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw Particles (Stars/Dust)
  particles.forEach(p => {
    p.z -= p.speed + (scrollPhase * 5); // Speed up as we scroll
    if (p.z <= 0) {
      p.z = 1000;
      p.x = (Math.random() - 0.5) * 2000;
      p.y = (Math.random() - 0.5) * 2000;
    }
    
    const scale = 1000 / p.z;
    const px = p.x * scale;
    const py = p.y * scale;
    
    ctx.beginPath();
    ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${glowR}, ${glowG}, ${glowB}, ${Math.min(1, scale * 0.5)})`;
    ctx.fill();
  });

  ctx.restore();
  
  // Post-processing bloom
  if (time % 0.1 < 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${fgR}, ${fgG}, ${fgB}, 0.01)`;
    ctx.fillRect(0, 0, width, height);
  }

  requestAnimationFrame(draw);
}

// Start simulation
draw();

// Fake HUD values update for extra cinematic feel
const hudEl = document.getElementById('hud-core');
if (hudEl) {
  setInterval(() => {
    const p = Math.random();
    if (p > 0.95) hudEl.innerText = "CALIBRATING...";
    else if (p > 0.90) hudEl.innerText = "MATRIX REBUILD";
    else hudEl.innerText = "PARIS FRACTURE X";
  }, 1000);
}
