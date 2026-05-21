import * as THREE from 'three';
import { runtime } from '../../engine/runtime.js';
import { activeTheme, themes } from '../../config/themes.js';

let dondaGroup;
let dondaPyramid, pyramidWireframe;
let dondaLight, eclipseGlow;
let dondaCross;
let starField1, starField2;
let cloudParticles = [];
let lightShafts = [];
let floatingCubes = [];
let crowdParticles;
let stadiumLights = [];
let initDone = false;

function makeCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeStarTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initDondaPyramid(scene, trackDisposable) {
  if (initDone) return dondaGroup;
  dondaGroup = new THREE.Group();
  scene.add(dondaGroup);

  // Core Pyramid
  const pyramidGeo = trackDisposable(new THREE.ConeGeometry(300, 400, 4));
  const pyramidMat = trackDisposable(new THREE.MeshStandardMaterial({
    color: 0x050505, roughness: 0.2, metalness: 0.9,
  }));
  dondaPyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
  dondaPyramid.position.y = 200; // Base is at y=0 since height is 400 and center is at 200
  dondaPyramid.rotation.y = Math.PI / 4;
  
  const wireGeo = trackDisposable(new THREE.WireframeGeometry(pyramidGeo));
  const wireMat = trackDisposable(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
  pyramidWireframe = new THREE.LineSegments(wireGeo, wireMat);
  dondaPyramid.add(pyramidWireframe);
  dondaGroup.add(dondaPyramid);

  // Holy Cross
  const crossGeoH = trackDisposable(new THREE.BoxGeometry(120, 15, 15));
  const crossGeoV = trackDisposable(new THREE.BoxGeometry(15, 200, 15));
  const crossMat = trackDisposable(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dondaCross = new THREE.Group();
  dondaCross.add(new THREE.Mesh(crossGeoH, crossMat));
  const meshV = new THREE.Mesh(crossGeoV, crossMat);
  meshV.position.y = 30;
  dondaCross.add(meshV);
  dondaCross.position.set(0, 600, 0);
  dondaGroup.add(dondaCross);

  // Lights
  dondaGroup.add(new THREE.AmbientLight(0x111122, 1.0));
  dondaLight = trackDisposable(new THREE.PointLight(0xffffff, 0, 2500));
  dondaLight.position.set(0, 450, 0);
  dondaGroup.add(dondaLight);

  eclipseGlow = trackDisposable(new THREE.PointLight(0xffffff, 0, 3000));
  eclipseGlow.position.set(0, 100, -800);
  dondaGroup.add(eclipseGlow);

  // Infinite Floor
  const floorGeo = trackDisposable(new THREE.PlaneGeometry(8000, 8000));
  const floorMat = trackDisposable(new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.05, metalness: 0.98 }));
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  dondaGroup.add(floor);

  // Stars (Layer 1 - Dense far)
  const starTex = makeStarTexture();
  const st1Geo = trackDisposable(new THREE.BufferGeometry());
  const st1Pos = new Float32Array(2000 * 3);
  for(let i=0; i<2000*3; i++) st1Pos[i] = (Math.random()-0.5) * 6000;
  st1Geo.setAttribute('position', new THREE.BufferAttribute(st1Pos, 3));
  const st1Mat = trackDisposable(new THREE.PointsMaterial({ map: starTex, size: 20, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  starField1 = new THREE.Points(st1Geo, st1Mat);
  dondaGroup.add(starField1);

  // Stars (Layer 2 - Large glowing close)
  const st2Geo = trackDisposable(new THREE.BufferGeometry());
  const st2Pos = new Float32Array(500 * 3);
  for(let i=0; i<500*3; i++) st2Pos[i] = (Math.random()-0.5) * 4000;
  st2Geo.setAttribute('position', new THREE.BufferAttribute(st2Pos, 3));
  const st2Mat = trackDisposable(new THREE.PointsMaterial({ map: starTex, size: 50, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  starField2 = new THREE.Points(st2Geo, st2Mat);
  dondaGroup.add(starField2);

  // Volumetric Clouds
  const cloudTex = makeCloudTexture();
  const cloudMat = trackDisposable(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending }));
  for(let i=0; i<100; i++) {
    const cloud = new THREE.Sprite(cloudMat.clone ? cloudMat.clone() : cloudMat);
    cloud.position.set((Math.random()-0.5)*3000, Math.random()*200, (Math.random()-0.5)*3000);
    cloud.scale.set(300 + Math.random()*300, 200 + Math.random()*200, 1);
    cloud.userData = { speedX: (Math.random()-0.5)*2, speedZ: (Math.random()-0.5)*2 };
    dondaGroup.add(cloud);
    cloudParticles.push(cloud);
  }

  // Divine Light Shafts
  const shaftGeo = trackDisposable(new THREE.CylinderGeometry(5, 80, 1500, 16, 1, true));
  const shaftMat = trackDisposable(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  for(let i=0; i<8; i++) {
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set((Math.random()-0.5)*800, 750, (Math.random()-0.5)*800);
    shaft.rotation.x = (Math.random()-0.5)*0.2;
    shaft.rotation.z = (Math.random()-0.5)*0.2;
    dondaGroup.add(shaft);
    lightShafts.push(shaft);
  }

  // Floating Obelisks / Debris
  const cubeGeo = trackDisposable(new THREE.BoxGeometry(20, 40, 20));
  const cubeMat = trackDisposable(new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 }));
  for (let i = 0; i < 40; i++) {
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set((Math.random() - 0.5) * 2000, Math.random() * 800, (Math.random() - 0.5) * 2000);
    cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    cube.userData = { speed: Math.random() * 0.02, axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize() };
    dondaGroup.add(cube);
    floatingCubes.push(cube);
  }

  // Massive Crowd (Particles at ground level)
  const crowdGeo = trackDisposable(new THREE.BufferGeometry());
  const crowdPos = new Float32Array(5000 * 3);
  for (let i = 0; i < 5000; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 400 + Math.random() * 2000; // Crowd surrounds pyramid
    crowdPos[i * 3] = Math.cos(angle) * r;
    crowdPos[i * 3 + 1] = 5 + Math.random() * 20; // Slight height variation
    crowdPos[i * 3 + 2] = Math.sin(angle) * r;
  }
  crowdGeo.setAttribute('position', new THREE.BufferAttribute(crowdPos, 3));
  const crowdMat = trackDisposable(new THREE.PointsMaterial({ color: 0xffffff, size: 8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
  crowdParticles = new THREE.Points(crowdGeo, crowdMat);
  dondaGroup.add(crowdParticles);

  // Stadium Lights (Rings of light beams)
  const stadiumGeo = trackDisposable(new THREE.CylinderGeometry(2, 40, 2000, 16, 1, true));
  const stadiumMat = trackDisposable(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  for (let i = 0; i < 12; i++) {
    const beam = new THREE.Mesh(stadiumGeo, stadiumMat);
    const angle = (i / 12) * Math.PI * 2;
    beam.position.set(Math.cos(angle) * 1200, 1000, Math.sin(angle) * 1200);
    beam.lookAt(0, 200, 0); // Point at pyramid
    dondaGroup.add(beam);
    stadiumLights.push(beam);
  }

  initDone = true;
  return dondaGroup;
}

export function drawDondaPyramid(volume, bassBin, trebleBin, camera, renderer, scene, themeStr) {
  if (!dondaGroup) return;
  const time = performance.now();
  
  // Dynamic theme mixing - prioritize Donda theme if set
  const theme = themes[themeStr === 'donda' ? 'donda' : themeStr] || themes.donda;

  scene.fog = scene.fog || new THREE.FogExp2(0x020205, 0.001);
  scene.fog.color.setRGB(theme.bg[0]/255, theme.bg[1]/255, theme.bg[2]/255);
  scene.background = null;

  // Stable pyramid rotation (no snapping or flipping)
  dondaPyramid.rotation.y += 0.002 * (1 + runtime.smoothTimelineState * 0.05);

  // Lights
  dondaLight.intensity = bassBin * 800 * runtime.sensitivity;
  dondaLight.color.setRGB(theme.primary[0] / 255, theme.primary[1] / 255, theme.primary[2] / 255);
  
  eclipseGlow.intensity = 500 + volume * 1000 * runtime.sensitivity;
  eclipseGlow.color.setRGB(theme.secondary[0] / 255, theme.secondary[1] / 255, theme.secondary[2] / 255);

  // Cross pulse
  dondaCross.children.forEach((mesh) => {
    mesh.material.color.setRGB(1, 1, 1);
    const scale = 1 + bassBin * 0.3;
    mesh.scale.set(scale, scale, scale);
  });

  // Wireframe pulse
  pyramidWireframe.material.opacity = 0.1 + trebleBin * 0.4;
  pyramidWireframe.material.color.setRGB(theme.secondary[0] / 255, theme.secondary[1] / 255, theme.secondary[2] / 255);

  // Stars parallax and twinkle
  starField1.rotation.y = time * 0.00005;
  starField2.rotation.y = time * 0.0001;
  starField2.material.opacity = 0.5 + Math.sin(time*0.002)*0.3 + bassBin*0.2;

  // Clouds drift and react to bass
  cloudParticles.forEach((c, i) => {
    c.position.x += c.userData.speedX;
    c.position.z += c.userData.speedZ;
    c.position.y = 100 + Math.sin(time*0.001 + i)*50 + bassBin*50;
    if (c.position.x > 1500) c.position.x = -1500;
    if (c.position.x < -1500) c.position.x = 1500;
    if (c.position.z > 1500) c.position.z = -1500;
    if (c.position.z < -1500) c.position.z = 1500;
    c.material.color.setRGB(theme.primary[0]/255, theme.primary[1]/255, theme.primary[2]/255);
    c.material.opacity = 0.1 + bassBin * 0.15;
  });

  // Light shafts
  lightShafts.forEach((shaft, i) => {
    shaft.rotation.y += 0.001;
    shaft.material.opacity = 0.02 + bassBin * 0.05 + Math.sin(time*0.003 + i)*0.02;
    shaft.material.color.setRGB(theme.secondary[0]/255, theme.secondary[1]/255, theme.secondary[2]/255);
  });

  // Floating cubes
  floatingCubes.forEach((cube) => {
    cube.position.y += Math.sin(time * 0.002) * 2;
    cube.rotateOnAxis(cube.userData.axis, cube.userData.speed + bassBin * 0.05);
    cube.material.emissive.setRGB(theme.primary[0]/255 * bassBin * 0.5, theme.primary[1]/255 * bassBin * 0.5, theme.primary[2]/255 * bassBin * 0.5);
  });

  // Crowd wave
  if (crowdParticles) {
    crowdParticles.position.y = Math.sin(time * 0.005) * 10 * bassBin;
    crowdParticles.material.opacity = 0.2 + bassBin * 0.4;
    crowdParticles.material.color.setRGB(theme.secondary[0]/255, theme.secondary[1]/255, theme.secondary[2]/255);
  }

  // Stadium Lights
  stadiumLights.forEach((beam, i) => {
    beam.material.opacity = 0.05 + bassBin * 0.15;
    beam.material.color.setRGB(theme.primary[0]/255, theme.primary[1]/255, theme.primary[2]/255);
    if (bassBin > 0.8 && i % 2 === 0) {
      beam.material.color.setRGB(1, 1, 1);
      beam.material.opacity = 0.3;
    }
  });

  // Reactive shake on the pyramid itself
  if (bassBin > 0.8) {
    const shake = (bassBin - 0.8) * 100;
    dondaPyramid.position.x = (Math.random() - 0.5) * shake;
    dondaPyramid.position.z = (Math.random() - 0.5) * shake;
    dondaCross.position.x = (Math.random() - 0.5) * shake;
    dondaCross.position.z = (Math.random() - 0.5) * shake;
  } else {
    dondaPyramid.position.x = 0;
    dondaPyramid.position.z = 0;
    dondaCross.position.x = 0;
    dondaCross.position.z = 0;
  }

  // Camera logic - STRICTLY CLAMPED TO PREVENT FLIPPING
  if (runtime.isMouseInteractive) {
    const targetX = (runtime.mouseX - window.innerWidth / 2) * 0.8;
    const targetY = -(runtime.mouseY - window.innerHeight / 2) * 0.5 + 250;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (800 - camera.position.z) * 0.05;
  } else {
    camera.position.x = Math.sin(time * 0.0001) * 800;
    camera.position.z = Math.cos(time * 0.0001) * 800;
    camera.position.y = 250 + Math.sin(time * 0.0002) * 100;
  }
  
  // CLAMP CAMERA Y to prevent going perfectly overhead (which causes lookAt to flip up vector)
  camera.position.y = Math.max(10, Math.min(camera.position.y, 800));
  
  // Safe distance clamp
  const dist = Math.hypot(camera.position.x, camera.position.z);
  if (dist < 200) {
    const angle = Math.atan2(camera.position.z, camera.position.x);
    camera.position.x = Math.cos(angle) * 200;
    camera.position.z = Math.sin(angle) * 200;
  }

  if (bassBin > 0.9) {
    camera.position.x += (Math.random() - 0.5) * 8 * bassBin * runtime.sensitivity;
    camera.position.y += (Math.random() - 0.5) * 8 * bassBin * runtime.sensitivity;
  }

  // Force up vector to be strictly vertical
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 200, 0);
  camera.rotation.z = 0; // Absolute zero roll

  renderer.render(scene, camera);
}

export function getDondaGroup() {
  return dondaGroup;
}

export function hideDonda() {
  if (dondaGroup) dondaGroup.visible = false;
}

export function showDonda() {
  if (dondaGroup) dondaGroup.visible = true;
}
