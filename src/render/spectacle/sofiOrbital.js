import * as THREE from 'three';
import { runtime } from '../../engine/runtime.js';
import { themes } from '../../config/themes.js';

const PALETTE = {
  crimson: 0x8b0a1a,
  white: 0xfff8f0,
  black: 0x050308,
  violet: 0x2a1038,
  gold: 0xffc84d,
};

let sofiGroup, haloRing, haloSegments, crimsonGlobe, globeShell, fogPlane;
let shockwaves = [], fractures = [], rippleRings = [];
let arenaLights = [];
let stadiumSearchlights = [];
let crowdSwarm, auraGlow;
let initDone = false;
let camOrbit = 0;

export function initSofiOrbital(scene, trackDisposable) {
  if (initDone) return sofiGroup;
  sofiGroup = new THREE.Group();
  scene.add(sofiGroup);

  const amb = new THREE.AmbientLight(0x331018, 0.6);
  sofiGroup.add(amb);
  const key = trackDisposable(new THREE.DirectionalLight(0xffeedd, 1.2));
  key.position.set(200, 400, 300);
  sofiGroup.add(key);

  const haloGeo = trackDisposable(new THREE.TorusGeometry(600, 35, 32, 200));
  const haloMat = trackDisposable(new THREE.MeshStandardMaterial({
    color: PALETTE.crimson,
    emissive: 0x440010,
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.2,
  }));
  haloRing = new THREE.Mesh(haloGeo, haloMat);
  haloRing.rotation.x = Math.PI / 2;
  sofiGroup.add(haloRing);

  haloSegments = new THREE.Group();
  for (let i = 0; i < 32; i++) {
    const seg = trackDisposable(new THREE.TorusGeometry(580, 8, 16, 32, Math.PI / 16));
    const sm = trackDisposable(new THREE.MeshBasicMaterial({
      color: i % 4 === 0 ? PALETTE.gold : PALETTE.white,
      transparent: true,
      opacity: 0.9,
    }));
    const m = new THREE.Mesh(seg, sm);
    m.rotation.x = Math.PI / 2;
    m.rotation.z = (i / 32) * Math.PI * 2;
    m.userData.baseAngle = m.rotation.z;
    haloSegments.add(m);
    
    if (i % 2 === 0) {
      const pl = trackDisposable(new THREE.PointLight(PALETTE.gold, 0, 150));
      pl.position.set(Math.cos(m.rotation.z) * 580, 0, Math.sin(m.rotation.z) * 580);
      haloSegments.add(pl);
      arenaLights.push({light: pl, angle: m.rotation.z});
    }
  }
  sofiGroup.add(haloSegments);

  const globeGeo = trackDisposable(new THREE.SphereGeometry(120, 64, 64));
  const globeMat = trackDisposable(new THREE.MeshPhysicalMaterial({
    color: PALETTE.crimson,
    emissive: 0x660018,
    emissiveIntensity: 1.0,
    metalness: 0.3,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 3,
    transparent: true,
    opacity: 0.95,
  }));
  crimsonGlobe = new THREE.Mesh(globeGeo, globeMat);
  crimsonGlobe.position.y = 80;
  sofiGroup.add(crimsonGlobe);

  const shellGeo = trackDisposable(new THREE.IcosahedronGeometry(135, 3));
  const shellMat = trackDisposable(new THREE.MeshBasicMaterial({
    color: PALETTE.gold,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  }));
  globeShell = new THREE.Mesh(shellGeo, shellMat);
  globeShell.position.copy(crimsonGlobe.position);
  sofiGroup.add(globeShell);

  // Pulsating Aura
  const auraGeo = trackDisposable(new THREE.SphereGeometry(150, 32, 32));
  const auraMat = trackDisposable(new THREE.MeshBasicMaterial({
    color: PALETTE.crimson,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  }));
  auraGlow = new THREE.Mesh(auraGeo, auraMat);
  auraGlow.position.copy(crimsonGlobe.position);
  sofiGroup.add(auraGlow);

  const fogGeo = trackDisposable(new THREE.PlaneGeometry(5000, 5000, 32, 32));
  const fogMat = trackDisposable(new THREE.MeshStandardMaterial({
    color: 0x1a0008,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    wireframe: true
  }));
  fogPlane = new THREE.Mesh(fogGeo, fogMat);
  fogPlane.rotation.x = -Math.PI / 2;
  fogPlane.position.y = -150;
  sofiGroup.add(fogPlane);

  // Massive Sweeping Searchlights
  const searchlightGeo = trackDisposable(new THREE.CylinderGeometry(5, 80, 4000, 16, 1, true));
  const searchlightMat = trackDisposable(new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  }));
  
  for (let i = 0; i < 16; i++) {
    const beam = new THREE.Mesh(searchlightGeo, searchlightMat);
    const angle = (i / 16) * Math.PI * 2;
    beam.position.set(Math.cos(angle) * 800, -100, Math.sin(angle) * 800);
    // Beams initially point straight up, we'll rotate in render loop
    beam.geometry.translate(0, 2000, 0); 
    beam.userData = { angle, speed: 0.5 + Math.random(), offset: Math.random() * Math.PI * 2 };
    sofiGroup.add(beam);
    stadiumSearchlights.push(beam);
  }

  // Swirling Crowd Particles
  const crowdGeo = trackDisposable(new THREE.BufferGeometry());
  const crowdPos = new Float32Array(8000 * 3);
  for (let i = 0; i < 8000; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 200 + Math.random() * 800;
    crowdPos[i * 3] = Math.cos(angle) * r;
    crowdPos[i * 3 + 1] = -140 + Math.random() * 40;
    crowdPos[i * 3 + 2] = Math.sin(angle) * r;
  }
  crowdGeo.setAttribute('position', new THREE.BufferAttribute(crowdPos, 3));
  const crowdMat = trackDisposable(new THREE.PointsMaterial({
    color: 0xffffff,
    size: 6,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  crowdSwarm = new THREE.Points(crowdGeo, crowdMat);
  sofiGroup.add(crowdSwarm);

  initDone = true;
  return sofiGroup;
}

function spawnShockwave(themeColor) {
  if (shockwaves.length > 8) return;
  const geo = new THREE.RingGeometry(80, 90, 128);
  const mat = new THREE.MeshBasicMaterial({
    color: themeColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -50 + Math.random()*20;
  ring.userData.life = 1;
  ring.userData.speed = 10 + Math.random() * 5;
  sofiGroup.add(ring);
  shockwaves.push(ring);
}

function spawnFracture(themeColor) {
  if (fractures.length > 12) return;
  const pts = [];
  const a0 = Math.random() * Math.PI * 2;
  const rBase = 550 + Math.random()*100;
  for (let i = 0; i < 8; i++) {
    const a = a0 + (i / 8) * Math.PI * 0.5;
    pts.push(new THREE.Vector3(Math.cos(a) * rBase, Math.sin(a) * 40, Math.sin(a) * rBase));
    pts.push(new THREE.Vector3(Math.cos(a) * (rBase+50), Math.sin(a) * 100, Math.sin(a) * (rBase+50)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: themeColor, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
  const lines = new THREE.LineSegments(geo, mat);
  lines.rotation.x = Math.PI / 2;
  lines.userData.life = 1;
  sofiGroup.add(lines);
  fractures.push(lines);
}

function spawnRipple(themeColor) {
  if (rippleRings.length > 15) return;
  const geo = new THREE.RingGeometry(20, 25, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: themeColor,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const r = new THREE.Mesh(geo, mat);
  r.rotation.x = -Math.PI / 2;
  r.position.y = -140;
  r.userData.life = 1;
  r.userData.speed = 15 + Math.random() * 5;
  sofiGroup.add(r);
  rippleRings.push(r);
}

export function drawSofiOrbital(volume, bassBin, trebleBin, camera, renderer, scene, themeStr) {
  if (!sofiGroup) return;
  const time = performance.now() * 0.001;
  const isDrop = volume > 0.65;
  const beat = runtime.frameBeatDetected || runtime.beatPulse > 0.5;
  
  const theme = themes[themeStr] || themes.retrowave;
  
  // Mix SOFI palette with global theme dynamically
  const tColor = new THREE.Color(`rgb(${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]})`);
  const tSecColor = new THREE.Color(`rgb(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]})`);
  
  scene.fog = scene.fog || new THREE.FogExp2(PALETTE.black, 0.00025);
  scene.fog.color.setRGB(theme.bg[0]*0.1/255, theme.bg[1]*0.1/255, theme.bg[2]*0.1/255);

  // Halo Flexing
  haloRing.rotation.z += 0.002 * (1 + bassBin * 2);
  const haloScale = 1 + bassBin * 0.15;
  haloRing.scale.set(haloScale, haloScale, 1);
  haloRing.material.emissive.copy(tColor);
  haloRing.material.color.copy(tColor);

  // Halo Segments Fracture
  haloSegments.rotation.y += 0.001;
  haloSegments.children.forEach(c => {
    if(c.userData.baseAngle !== undefined) {
      const fractureDist = bassBin > 0.8 ? (Math.random()-0.5)*0.2 : 0;
      c.rotation.z = c.userData.baseAngle + Math.sin(time*5 + c.userData.baseAngle)*0.05 * bassBin + fractureDist;
      c.position.y = Math.sin(time*2 + c.userData.baseAngle) * 30 * bassBin;
    }
  });

  arenaLights.forEach((al, i) => {
    const pulse = 0.5 + bassBin * 3 + Math.sin(time * 5 + i * 0.5) * 0.5;
    al.light.intensity = beat ? pulse * 5 : pulse * 2;
    al.light.color.copy(tSecColor);
  });

  // Center Globe Rupture and Breathe
  const globeScale = 1 + bassBin * 0.5 * runtime.sensitivity + Math.sin(time*4)*0.05;
  crimsonGlobe.scale.setScalar(globeScale);
  globeShell.scale.setScalar(globeScale * (1.1 + bassBin*0.2));
  globeShell.rotation.y -= 0.008;
  globeShell.rotation.x = Math.sin(time * 0.8) * 0.2;
  
  crimsonGlobe.material.emissiveIntensity = 0.8 + bassBin * 2.0;
  crimsonGlobe.material.emissive.copy(tColor);
  crimsonGlobe.material.color.copy(tColor);
  globeShell.material.color.copy(tSecColor);
  
  // Aura logic
  auraGlow.scale.setScalar(globeScale * (1.2 + bassBin * 0.4));
  auraGlow.material.color.copy(tColor);
  auraGlow.material.opacity = 0.1 + bassBin * 0.2;

  // Searchlights
  stadiumSearchlights.forEach((beam) => {
    beam.material.color.copy(tSecColor);
    beam.material.opacity = 0.02 + bassBin * 0.15;
    // Dramatic sweeping
    const sweep = Math.sin(time * beam.userData.speed + beam.userData.offset);
    beam.rotation.z = sweep * 0.5;
    beam.rotation.x = Math.cos(time * beam.userData.speed * 0.8 + beam.userData.offset) * 0.3;
    
    // Intense flashes on heavy beat drops
    if (bassBin > 0.85 && Math.random() > 0.5) {
      beam.material.color.setRGB(1, 1, 1);
      beam.material.opacity = 0.4;
    }
  });

  // Crowd Swarm
  if (crowdSwarm) {
    crowdSwarm.rotation.y += 0.002 * (1 + bassBin);
    crowdSwarm.material.color.copy(tSecColor);
    crowdSwarm.material.opacity = 0.3 + bassBin * 0.5;
    crowdSwarm.position.y = Math.sin(time * 5) * 5 * bassBin;
  }

  // Crowd Energy Waves (Fog Plane Ripple)
  fogPlane.material.opacity = 0.5 + bassBin * 0.4;
  fogPlane.material.color.copy(tColor);
  const pos = fogPlane.geometry.attributes.position;
  for(let i=0; i<pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const dist = Math.sqrt(x*x + y*y);
    const z = Math.sin(dist*0.01 - time*5) * 50 * bassBin;
    pos.setZ(i, z);
  }
  fogPlane.geometry.attributes.position.needsUpdate = true;

  if (beat) spawnRipple(tSecColor);
  if (isDrop) {
    spawnFracture(tColor);
    spawnShockwave(tSecColor);
  }

  shockwaves = shockwaves.filter((s) => {
    s.userData.life -= 0.015;
    s.material.opacity = s.userData.life * 0.8;
    s.scale.addScalar(s.userData.speed * 0.025);
    if (s.userData.life <= 0) {
      sofiGroup.remove(s);
      s.geometry.dispose();
      s.material.dispose();
      return false;
    }
    return true;
  });

  fractures = fractures.filter((f) => {
    f.userData.life -= 0.025;
    f.material.opacity = f.userData.life;
    if (f.userData.life <= 0) {
      sofiGroup.remove(f);
      f.geometry.dispose();
      f.material.dispose();
      return false;
    }
    return true;
  });

  rippleRings = rippleRings.filter((r) => {
    r.userData.life -= 0.01;
    r.material.opacity = r.userData.life * 0.6;
    r.scale.addScalar(r.userData.speed * 0.02);
    if (r.userData.life <= 0) {
      sofiGroup.remove(r);
      r.geometry.dispose();
      r.material.dispose();
      return false;
    }
    return true;
  });

  // Cinematic Reactive Camera
  camOrbit += 0.0002;
  const ascension = beat ? 40 : 0;
  if (runtime.isMouseInteractive) {
    const tx = (runtime.mouseX - window.innerWidth / 2) * 0.5;
    const ty = -(runtime.mouseY - window.innerHeight / 2) * 0.4 + 200 + ascension;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.position.z += (750 - camera.position.z) * 0.05;
  } else {
    camera.position.x = Math.sin(camOrbit) * 750;
    camera.position.z = Math.cos(camOrbit) * 750;
    camera.position.y = 250 + Math.sin(time * 0.4) * 80 + ascension;
  }
  
  // Reactive shake
  if (bassBin > 0.9) {
    camera.position.x += (Math.random() - 0.5) * 15 * bassBin;
    camera.position.y += (Math.random() - 0.5) * 10 * bassBin;
    camera.position.z += (Math.random() - 0.5) * 15 * bassBin;
  }
  
  camera.lookAt(0, 80, 0);
  camera.rotation.z = Math.sin(time*0.5)*0.05 * bassBin; // Dynamic roll

  renderer.render(scene, camera);
}

export function getSofiGroup() {
  return sofiGroup;
}

export function hideSofi() {
  if (sofiGroup) sofiGroup.visible = false;
}

export function showSofi() {
  if (sofiGroup) sofiGroup.visible = true;
}
