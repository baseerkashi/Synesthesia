import * as THREE from 'three';
import { runtime } from '../../engine/runtime.js';
import { activeTheme, themes } from '../../config/themes.js';

let gradGroup;
let bearPoints;
let platformGroup;
let neonRings = [];
let flowerReactors = [];
let cosmicStars = [];
let shockwaves = [];
let debris = [];

let initDone = false;

// Launch State Machine
let phase = 'platform'; // platform, launch, flight, collapse
let altitude = 0;
let flightSpeed = 0;
let bearEnergy = 0;

const COLORS = {
  cyan: new THREE.Color(0x00e5ff),
  yellow: new THREE.Color(0xffe566),
  pink: new THREE.Color(0xff2d95),
  white: new THREE.Color(0xffffff),
  violet: new THREE.Color(0x9b5cff)
};

function makeMurakamiFlowerTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  
  g.translate(128, 128);
  
  // Petals
  const petalColors = ['#ff2d95', '#00e5ff', '#ffe566', '#9b5cff'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.fillStyle = petalColors[i % 4];
    g.beginPath();
    g.ellipse(Math.cos(a) * 70, Math.sin(a) * 70, 30, 20, a, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = '#fff';
    g.stroke();
  }
  
  // Face center
  g.fillStyle = '#ffeb3b';
  g.beginPath();
  g.arc(0, 0, 50, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = '#fff';
  g.stroke();
  
  // Happy Eyes
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(-20, -10, 8, 0, Math.PI * 2);
  g.arc(20, -10, 8, 0, Math.PI * 2);
  g.fill();
  
  // Happy Mouth
  g.strokeStyle = '#000';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(0, 5, 25, 0.2, Math.PI - 0.2);
  g.stroke();
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeStarTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  
  g.translate(64, 64);
  
  // Star path
  g.fillStyle = '#ffe566';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 60 : 30;
    if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  
  // Face
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(-15, 0, 5, 0, Math.PI * 2);
  g.arc(15, 0, 5, 0, Math.PI * 2);
  g.fill();
  
  g.beginPath();
  g.arc(0, 10, 10, 0.2, Math.PI - 0.2);
  g.lineWidth = 4;
  g.strokeStyle = '#000';
  g.stroke();
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initGraduationRebirth(scene, trackDisposable) {
  if (initDone) return gradGroup;
  gradGroup = new THREE.Group();
  scene.add(gradGroup);

  // Lighting
  gradGroup.add(new THREE.AmbientLight(0x222233, 1.5));
  const dirLight = trackDisposable(new THREE.DirectionalLight(0xffffff, 2.5));
  dirLight.position.set(300, 500, 200);
  gradGroup.add(dirLight);

  const fillLight = trackDisposable(new THREE.PointLight(COLORS.pink, 2.0, 2000));
  fillLight.position.set(0, -200, 0);
  gradGroup.add(fillLight);

  // ----------------------------------------------------
  // PHASE 1: LAUNCH PLATFORM
  // ----------------------------------------------------
  platformGroup = new THREE.Group();
  platformGroup.position.y = -150;
  gradGroup.add(platformGroup);

  const platGeo = trackDisposable(new THREE.CylinderGeometry(250, 200, 40, 64));
  const platMat = trackDisposable(new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 2.0
  }));
  const platformMesh = new THREE.Mesh(platGeo, platMat);
  platformGroup.add(platformMesh);

  // Massive Planetary Neon Rings
  for (let i = 0; i < 15; i++) {
    const ringGeo = trackDisposable(new THREE.TorusGeometry(300 + i * 80, 2 + Math.random() * 4, 16, 150));
    const ringMat = trackDisposable(new THREE.MeshBasicMaterial({
      color: [COLORS.cyan, COLORS.pink, COLORS.yellow, COLORS.violet][i % 4],
      transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    }));
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.1;
    ring.rotation.y = (Math.random() - 0.5) * 0.1;
    ring.position.y = -50 + i * 8;
    platformGroup.add(ring);
    neonRings.push(ring);
  }

  // Volumetric Clouds around Platform
  const cloudTex = makeParticleTexture();
  const cloudMat = trackDisposable(new THREE.SpriteMaterial({ map: cloudTex, color: COLORS.violet, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
  for (let i = 0; i < 150; i++) {
    const cloud = new THREE.Sprite(cloudMat.clone ? cloudMat.clone() : cloudMat);
    cloud.position.set((Math.random() - 0.5) * 2000, -200 + Math.random() * 200, (Math.random() - 0.5) * 2000);
    cloud.scale.set(400 + Math.random() * 300, 200 + Math.random() * 200, 1);
    platformGroup.add(cloud);
  }

  // Giant Flower Reactors
  const flowerTex = makeMurakamiFlowerTexture();
  const flowerMat = trackDisposable(new THREE.SpriteMaterial({ map: flowerTex, color: 0xffffff, transparent: true }));
  for (let i = 0; i < 6; i++) {
    const flower = new THREE.Sprite(flowerMat.clone ? flowerMat.clone() : flowerMat);
    const angle = (i / 6) * Math.PI * 2;
    flower.position.set(Math.cos(angle) * 400, 50, Math.sin(angle) * 400);
    flower.scale.set(150, 150, 1);
    flower.userData = { angle, baseScale: 150 };
    platformGroup.add(flower);
    flowerReactors.push(flower);
  }

  // ----------------------------------------------------
  // PHASE 2: BEAR ENERGY FORM (Particle Silhouette)
  // ----------------------------------------------------
  const bearGeo = trackDisposable(new THREE.BufferGeometry());
  const bearPos = [];
  const bearCol = [];
  const bearSizes = [];

  const addSpherePoints = (cx, cy, cz, radius, count) => {
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * radius;
      bearPos.push(cx + r * Math.sin(phi) * Math.cos(theta), cy + r * Math.sin(phi) * Math.sin(theta), cz + r * Math.cos(phi));
      bearCol.push(1, 1, 1);
      bearSizes.push(Math.random());
    }
  };

  addSpherePoints(0, 0, 0, 100, 8000); // Body
  addSpherePoints(0, 120, 0, 70, 5000); // Head
  addSpherePoints(-50, 170, 0, 30, 1500); // L Ear
  addSpherePoints(50, 170, 0, 30, 1500); // R Ear

  bearGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bearPos), 3));
  bearGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bearCol), 3));
  bearGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(bearSizes), 1));
  bearGeo.userData = { originalPos: new Float32Array(bearPos) };

  const particleTex = makeParticleTexture();
  const bearMat = trackDisposable(new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      volume: { value: 0 },
      colorCyan: { value: COLORS.cyan },
      colorPink: { value: COLORS.pink },
      pointTexture: { value: particleTex }
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float time;
      uniform float volume;
      uniform vec3 colorCyan;
      uniform vec3 colorPink;
      void main() {
        vec3 pos = position;
        // High freq shimmer / Bass surge
        float noise = sin(pos.y * 0.1 + time * 5.0) * cos(pos.x * 0.1 + time * 3.0);
        pos += normal * noise * volume * 20.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (20.0 + volume * 40.0) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        // Blend colors based on height
        float h = (pos.y + 100.0) / 300.0;
        vColor = mix(colorCyan, colorPink, h + noise * 0.2);
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  }));

  bearPoints = new THREE.Points(bearGeo, bearMat);
  gradGroup.add(bearPoints);

  // ----------------------------------------------------
  // COSMIC STARS & DEBRIS
  // ----------------------------------------------------
  const starTex = makeStarTexture();
  const starMat = trackDisposable(new THREE.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true }));
  for (let i = 0; i < 800; i++) {
    const star = new THREE.Sprite(starMat.clone ? starMat.clone() : starMat);
    star.position.set((Math.random() - 0.5) * 6000, (Math.random() - 0.5) * 6000, -Math.random() * 6000);
    star.scale.set(40, 40, 1);
    star.userData = { speed: Math.random() * 5 + 2, baseScale: 40 };
    gradGroup.add(star);
    cosmicStars.push(star);
  }

  // Debris (candy-gloss geometries)
  const geoTypes = [
    new THREE.IcosahedronGeometry(30, 0),
    new THREE.OctahedronGeometry(25, 0),
    new THREE.TorusGeometry(20, 8, 8, 16)
  ];
  for (let i = 0; i < 400; i++) {
    const geo = geoTypes[Math.floor(Math.random() * geoTypes.length)];
    const mat = trackDisposable(new THREE.MeshPhysicalMaterial({
      color: [COLORS.cyan, COLORS.pink, COLORS.yellow, COLORS.white][i % 4],
      metalness: 0.1, roughness: 0.1, clearcoat: 1.0
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 5000, (Math.random() - 0.5) * 5000, -Math.random() * 5000);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = { rx: Math.random() * 0.05, ry: Math.random() * 0.05, speed: Math.random() * 10 + 5 };
    gradGroup.add(mesh);
    debris.push(mesh);
  }

  initDone = true;
  return gradGroup;
}

function spawnShockwave() {
  if (shockwaves.length > 5) return;
  const geo = new THREE.RingGeometry(100, 120, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: [COLORS.cyan, COLORS.pink, COLORS.white][Math.floor(Math.random()*3)],
    transparent: true, opacity: 1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.copy(bearPoints.position);
  mesh.userData = { life: 1.0, scale: 1 };
  gradGroup.add(mesh);
  shockwaves.push(mesh);
}

export function drawGraduationRebirth(volume, bassBin, trebleBin, camera, renderer, scene, themeStr) {
  if (!gradGroup) return;
  const time = performance.now() * 0.001;
  const isDrop = volume > 0.8 && bassBin > 0.85;

  scene.fog = scene.fog || new THREE.FogExp2(0x1a0a2a, 0.0005);
  scene.background = new THREE.Color(0x1a0a2a);

  // Map theme colors to the shader if user changes theme, else stick to Graduation luxury
  const theme = themes[themeStr] || themes.graduation;
  bearPoints.material.uniforms.time.value = time;
  bearPoints.material.uniforms.volume.value = volume;
  bearPoints.material.uniforms.colorCyan.value.setRGB(theme.secondary[0]/255, theme.secondary[1]/255, theme.secondary[2]/255);
  bearPoints.material.uniforms.colorPink.value.setRGB(theme.primary[0]/255, theme.primary[1]/255, theme.primary[2]/255);

  // STATE MACHINE LOGIC
  if (phase === 'platform') {
    altitude = 0;
    flightSpeed = 0;
    bearEnergy += bassBin * 0.05;
    
    // Pulse platform
    platformGroup.position.y = -150 + Math.sin(time * 5) * 10 * bassBin;
    platformGroup.scale.setScalar(1 + bassBin * 0.05);
    
    // Bear floats slightly
    bearPoints.position.y = Math.sin(time * 2) * 20;
    
    if (isDrop && bearEnergy > 2.0) {
      phase = 'launch';
      bearEnergy = 0;
      spawnShockwave();
    }
  } else if (phase === 'launch') {
    flightSpeed += 5.0; // Violent acceleration
    altitude += flightSpeed;
    bearPoints.position.y = altitude;
    
    // Platform recedes quickly
    platformGroup.position.y -= flightSpeed * 0.5;
    
    if (flightSpeed > 150) {
      phase = 'flight';
    }
  } else if (phase === 'flight') {
    flightSpeed = 100 + volume * 100;
    altitude += flightSpeed;
    bearPoints.position.y = altitude;
    
    // Shockwaves on beats
    if (isDrop) spawnShockwave();
    
    // If quiet, collapse
    if (volume < 0.2) {
      phase = 'collapse';
    }
  } else if (phase === 'collapse') {
    flightSpeed *= 0.95; // slow down
    altitude += flightSpeed;
    bearPoints.position.y = altitude;
    
    // Dissolve bear (simulate by exploding points)
    const positions = bearPoints.geometry.attributes.position.array;
    const orig = bearPoints.geometry.userData.originalPos;
    for(let i=0; i<positions.length; i+=3) {
      positions[i] += (Math.random()-0.5) * 20;
      positions[i+1] += (Math.random()-0.5) * 20;
      positions[i+2] += (Math.random()-0.5) * 20;
    }
    bearPoints.geometry.attributes.position.needsUpdate = true;
    
    if (flightSpeed < 1) {
      // Rebuild
      phase = 'platform';
      altitude = 0;
      bearPoints.position.y = 0;
      platformGroup.position.y = -150;
      // Reset positions
      for(let i=0; i<positions.length; i++) positions[i] = orig[i];
      bearPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Update Shockwaves
  shockwaves = shockwaves.filter(sw => {
    sw.userData.life -= 0.02;
    sw.userData.scale += 0.5;
    sw.scale.setScalar(sw.userData.scale);
    sw.material.opacity = sw.userData.life;
    sw.position.copy(bearPoints.position); // Follow bear
    if (sw.userData.life <= 0) {
      gradGroup.remove(sw);
      sw.geometry.dispose();
      sw.material.dispose();
      return false;
    }
    return true;
  });

  // Animate Platform elements
  neonRings.forEach((ring, i) => {
    ring.rotation.z += 0.01 + bassBin * 0.05;
    ring.scale.setScalar(1 + bassBin * (0.1 * i));
  });

  flowerReactors.forEach((f, i) => {
    f.rotation.z -= 0.02;
    f.position.y = 50 + Math.sin(time * 3 + i) * 30 + bassBin * 50;
    const s = f.userData.baseScale * (1 + bassBin * 0.3);
    f.scale.set(s, s, 1);
  });

  // Cosmic Flight Environment (Stars & Debris fly downwards relative to altitude)
  const envSpeed = (phase === 'flight' || phase === 'launch') ? flightSpeed : 5 + volume * 10;
  
  cosmicStars.forEach(s => {
    s.position.y -= envSpeed * s.userData.speed * 0.1;
    s.rotation.z += 0.01;
    if (s.position.y < altitude - 1000) {
      s.position.y = altitude + 3000;
      s.position.x = bearPoints.position.x + (Math.random()-0.5)*4000;
      s.position.z = bearPoints.position.z + (Math.random()-0.5)*4000;
    }
    const pulse = 1 + trebleBin * 0.5;
    s.scale.set(s.userData.baseScale * pulse, s.userData.baseScale * pulse, 1);
  });

  debris.forEach(d => {
    d.position.y -= envSpeed * d.userData.speed * 0.1;
    d.rotation.x += d.userData.rx;
    d.rotation.y += d.userData.ry;
    if (d.position.y < altitude - 1000) {
      d.position.y = altitude + 3000;
      d.position.x = bearPoints.position.x + (Math.random()-0.5)*3000;
      d.position.z = bearPoints.position.z + (Math.random()-0.5)*3000;
    }
  });

  // Cinematic Camera Tracking
  const targetCamY = altitude + 200 + Math.sin(time)*50;
  
  if (runtime.isMouseInteractive) {
    const tx = (runtime.mouseX - window.innerWidth / 2) * 1.5;
    const ty = -(runtime.mouseY - window.innerHeight / 2) * 1.0 + targetCamY;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.position.z += (800 - camera.position.z) * 0.05; // Lock distance
  } else {
    // Dynamic orbiting during flight
    const orbitSpeed = phase === 'flight' ? time * 0.5 : time * 0.2;
    const orbitRadius = phase === 'flight' ? 600 + Math.sin(time)*200 : 800;
    
    camera.position.x = Math.sin(orbitSpeed) * orbitRadius;
    camera.position.z = Math.cos(orbitSpeed) * orbitRadius;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
  }

  // Camera Shake on Launch/Drops
  if (phase === 'launch' || isDrop) {
    camera.position.x += (Math.random() - 0.5) * 20 * bassBin;
    camera.position.y += (Math.random() - 0.5) * 20 * bassBin;
  }

  camera.lookAt(bearPoints.position.x, bearPoints.position.y + 100, bearPoints.position.z);
  
  // Euphoric roll
  camera.rotation.z = Math.sin(time * 0.5) * 0.1 * (phase === 'flight' ? 2.0 : 1.0);

  renderer.render(scene, camera);
}

export function getGradGroup() {
  return gradGroup;
}

export function hideGrad() {
  if (gradGroup) gradGroup.visible = false;
}

export function showGrad() {
  if (gradGroup) gradGroup.visible = true;
}
