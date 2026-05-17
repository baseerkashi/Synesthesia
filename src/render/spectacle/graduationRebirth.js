import * as THREE from 'three';
import { runtime } from '../../engine/runtime.js';
import { activeTheme, themes } from '../../config/themes.js';

const POP = {
  cyan: 0x00e5ff,
  pink: 0xff2d95,
  yellow: 0xffe566,
  purple: 0x9b5cff,
  white: 0xffffff,
};

let gradGroup, flowers = [], streams = [], planets = [], stars = [];
let bearGroup;
let initDone = false;
let camZ = 0;

function makeFlowerTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  
  // Center face
  g.fillStyle = '#ffeb3b';
  g.beginPath();
  g.arc(64, 64, 28, 0, Math.PI * 2);
  g.fill();
  
  // Petals
  const petalColors = ['#ff2d95', '#00e5ff', '#ffe566', '#9b5cff'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.fillStyle = petalColors[i % 4];
    g.beginPath();
    g.ellipse(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, 20, 12, a, 0, Math.PI * 2);
    g.fill();
  }
  
  // Face details (Smiling)
  g.fillStyle = '#000';
  g.beginPath();
  g.arc(54, 58, 6, 0, Math.PI * 2);
  g.arc(74, 58, 6, 0, Math.PI * 2);
  g.fill();
  
  g.strokeStyle = '#000';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(64, 64, 18, 0.2, Math.PI - 0.2);
  g.stroke();
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initGraduationRebirth(scene, trackDisposable) {
  if (initDone) return gradGroup;
  gradGroup = new THREE.Group();
  scene.add(gradGroup);

  // Lighting for Hyper Gloss
  gradGroup.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = trackDisposable(new THREE.DirectionalLight(0xffffff, 2.5));
  sun.position.set(200, 500, 300);
  gradGroup.add(sun);
  
  const fillLight = trackDisposable(new THREE.DirectionalLight(POP.pink, 1.5));
  fillLight.position.set(-200, 100, -300);
  gradGroup.add(fillLight);

  // Murakami Flowers
  const flowerTex = makeFlowerTexture();
  const flowerMat = trackDisposable(new THREE.SpriteMaterial({
    map: flowerTex,
    transparent: true,
    color: 0xffffff,
  }));

  for (let i = 0; i < 80; i++) {
    const sp = new THREE.Sprite(flowerMat.clone ? flowerMat.clone() : flowerMat);
    const scale = 100 + Math.random() * 150;
    sp.scale.set(scale, scale, 1);
    sp.position.set(
      (Math.random() - 0.5) * 4000,
      (Math.random() - 0.5) * 3000,
      -Math.random() * 6000 - 500,
    );
    sp.userData = {
      orbitY: Math.random() * Math.PI * 2,
      orbitX: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.8,
      baseScale: scale
    };
    gradGroup.add(sp);
    flowers.push(sp);
  }

  // Hyper Gloss Planets
  const planetColors = [POP.cyan, POP.pink, POP.yellow, POP.purple];
  for (let i = 0; i < 25; i++) {
    const size = 50 + Math.random() * 150;
    const geo = trackDisposable(new THREE.SphereGeometry(size, 32, 32));
    const mat = trackDisposable(new THREE.MeshPhysicalMaterial({
      color: planetColors[i % 4],
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
    }));
    const p = new THREE.Mesh(geo, mat);
    p.position.set(
      (Math.random() - 0.5) * 5000,
      (Math.random() - 0.5) * 4000,
      -Math.random() * 8000 - 1000,
    );
    p.userData = { 
      speed: 10 + Math.random() * 20,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 0.5 + Math.random() * 2
    };
    
    // Add rings to some planets
    if (Math.random() > 0.5) {
      const ringGeo = trackDisposable(new THREE.RingGeometry(size * 1.5, size * 2.2, 64));
      const ringMat = trackDisposable(new THREE.MeshBasicMaterial({
        color: planetColors[(i + 1) % 4],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      }));
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (Math.random()-0.5)*0.5;
      ring.rotation.y = (Math.random()-0.5)*0.5;
      p.add(ring);
    }
    
    gradGroup.add(p);
    planets.push(p);
  }

  // Rainbow Stream Architecture (Color Highways)
  for (let i = 0; i < 15; i++) {
    const pts = [];
    for(let j=0; j<20; j++) {
      pts.push(new THREE.Vector3(
        (Math.random()-0.5)*1000 + Math.sin(j*0.5 + i)*500,
        (Math.random()-0.5)*1000 + Math.cos(j*0.5 + i)*500,
        -j * 400
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = trackDisposable(new THREE.TubeGeometry(curve, 100, 30 + Math.random()*40, 16, false));
    const tubeMat = trackDisposable(new THREE.MeshPhysicalMaterial({
      color: planetColors[i % 4],
      transparent: true,
      opacity: 0.7,
      metalness: 0.5,
      roughness: 0.1,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    }));
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.userData = { speed: 30 + Math.random() * 20 };
    gradGroup.add(tube);
    streams.push(tube);
  }

  // Superflat Stars
  const starGeo = trackDisposable(new THREE.BufferGeometry());
  const starPos = new Float32Array(1500 * 3);
  for(let i=0; i<1500*3; i++) {
    starPos[i] = (Math.random()-0.5) * 8000;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = trackDisposable(new THREE.PointsMaterial({
    color: 0xffffff,
    size: 15,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  }));
  const starSys = new THREE.Points(starGeo, starMat);
  gradGroup.add(starSys);
  stars.push(starSys);

  // Bear Avatar (Center)
  bearGroup = new THREE.Group();
  const bodyGeo = trackDisposable(new THREE.CapsuleGeometry(35, 60, 16, 32));
  const bodyMat = trackDisposable(new THREE.MeshPhysicalMaterial({ color: 0x221111, clearcoat: 0.5 }));
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 40;
  bearGroup.add(body);
  
  const headGeo = trackDisposable(new THREE.SphereGeometry(30, 32, 32));
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 100;
  bearGroup.add(head);
  
  const earGeo = trackDisposable(new THREE.SphereGeometry(12, 16, 16));
  const earL = new THREE.Mesh(earGeo, bodyMat); earL.position.set(-25, 120, 0); bearGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, bodyMat); earR.position.set(25, 120, 0); bearGroup.add(earR);
  
  bearGroup.position.set(0, -100, -600);
  gradGroup.add(bearGroup);

  initDone = true;
  return gradGroup;
}

export function drawGraduationRebirth(volume, bassBin, trebleBin, camera, renderer, scene, themeStr) {
  if (!gradGroup) return;
  const time = performance.now() * 0.001;
  const beat = runtime.frameBeatDetected || runtime.beatPulse > 0.5;
  
  // Prioritize Graduation theme
  const theme = themes[themeStr === 'graduation' ? 'graduation' : themeStr] || themes.graduation;

  // Superflat clean background
  scene.fog = scene.fog || new THREE.FogExp2(0xf0f8ff, 0.0001);
  scene.fog.color.setRGB(theme.bg[0]/255, theme.bg[1]/255, theme.bg[2]/255);
  scene.background = scene.fog.color;

  const warpSpeed = (8 + volume * 15 * runtime.sensitivity) * (1 + runtime.smoothTimelineState * 0.1);

  // Animate Flowers
  flowers.forEach((f, i) => {
    f.userData.orbitY += 0.01;
    f.position.x += Math.sin(f.userData.orbitY + time) * 3;
    f.position.y += Math.cos(f.userData.orbitX + time * 1.5) * 3;
    f.position.z += warpSpeed;
    
    if (f.position.z > 200) {
      f.position.z = -6000 - Math.random() * 2000;
      f.position.x = (Math.random() - 0.5) * 4000;
      f.position.y = (Math.random() - 0.5) * 3000;
    }
    
    const pulse = 1 + bassBin * 0.4 + Math.sin(time * 3 + i) * 0.1;
    f.scale.set(f.userData.baseScale * pulse, f.userData.baseScale * pulse, 1);
    f.material.rotation = time * f.userData.speed;
  });

  // Animate Planets
  planets.forEach((p, i) => {
    p.position.z += warpSpeed + p.userData.speed * (volume + 0.2);
    p.position.y += Math.sin(time * p.userData.bobSpeed + p.userData.bobOffset) * 2;
    p.rotation.y += 0.01;
    p.rotation.x += 0.005;
    
    if (p.position.z > 500) {
      p.position.set(
        (Math.random() - 0.5) * 5000,
        (Math.random() - 0.5) * 4000,
        -8000 - Math.random() * 2000
      );
    }
    
    const sc = 1 + bassBin * 0.15;
    p.scale.setScalar(sc);
    
    // Pulse rings
    if(p.children.length > 0) {
      p.children[0].scale.setScalar(1 + bassBin * 0.3);
      p.children[0].rotation.z -= 0.02;
    }
  });

  // Animate Streams
  streams.forEach((s) => {
    s.position.z += warpSpeed * 2;
    if (s.position.z > 4000) s.position.z = -4000;
  });

  // Animate Stars
  stars[0].position.z += warpSpeed * 3;
  if (stars[0].position.z > 4000) stars[0].position.z = 0;

  // Animate Bear
  bearGroup.position.y = -100 + bassBin * 120 + Math.sin(time * 3) * 30;
  bearGroup.position.z = -600 + volume * 150;
  bearGroup.rotation.y = Math.sin(time) * 0.2;
  bearGroup.rotation.z = Math.cos(time * 1.5) * 0.1;
  
  const bearScale = 1 + bassBin * 0.2;
  bearGroup.scale.setScalar(bearScale);

  // Joyful Cosmic Motion (Camera)
  camZ += warpSpeed * 0.1;
  if (runtime.isMouseInteractive) {
    camera.position.x += ((runtime.mouseX - window.innerWidth / 2) * 0.4 - camera.position.x) * 0.05;
    camera.position.y += ((-(runtime.mouseY - window.innerHeight / 2) * 0.4) - camera.position.y) * 0.05;
  } else {
    camera.position.x = Math.sin(time * 0.5) * 300;
    camera.position.y = Math.cos(time * 0.4) * 200;
  }
  
  // Forward euphoric movement
  camera.position.z = camZ;
  
  // Add some roll on drops
  camera.rotation.z = Math.sin(time * 0.3) * 0.1 + (bassBin > 0.8 ? Math.sin(time*20)*0.05 : 0);
  
  // Keep camera looking forward along the path
  const lookTarget = new THREE.Vector3(
    camera.position.x * 0.5,
    camera.position.y * 0.5,
    camera.position.z - 1500
  );
  camera.lookAt(lookTarget);

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
