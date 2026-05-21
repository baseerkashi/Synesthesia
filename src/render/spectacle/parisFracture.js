import * as THREE from 'three';
import { runtime } from '../../engine/runtime.js';

let parisGroup;
let mirrorSectors = [];
let pillarMeshes = [];
let gridLines;
let shockwaves = [];
let mainCamera;
let initDone = false;

// Physics / Tracking
let flightZ = 0;
let flashIntensity = 0;
let flipState = 1;
let lastDropTime = 0;

const COLORS = {
  black: new THREE.Color(0x050508),
  gold: new THREE.Color(0xffb700),
  white: new THREE.Color(0xffffff),
  blue: new THREE.Color(0x0044ff),
  violet: new THREE.Color(0x6600ff),
  crimson: new THREE.Color(0xff0022)
};

export function initParisFracture(scene, trackDisposable) {
  if (initDone) return parisGroup;
  parisGroup = new THREE.Group();
  scene.add(parisGroup);

  // Elite Lighting (Volumetric Darkness + Specular Hits)
  parisGroup.add(new THREE.AmbientLight(0x111111, 1.0));
  
  const directional = trackDisposable(new THREE.DirectionalLight(COLORS.gold, 2.0));
  directional.position.set(0, 0, -1000);
  parisGroup.add(directional);

  const fill = trackDisposable(new THREE.PointLight(COLORS.blue, 1.5, 2000));
  fill.position.set(0, 0, 0);
  parisGroup.add(fill);

  // We will create 8 mirrored sectors for a true kaleidoscopic cathedral reflection
  for (let i = 0; i < 8; i++) {
    const sector = new THREE.Group();
    // 8-way kaleidoscope
    sector.rotation.z = (i * Math.PI) / 4;
    // Alternate mirroring to create seamless folds
    if (i % 2 === 1) {
      sector.scale.x = -1;
    }
    parisGroup.add(sector);
    mirrorSectors.push(sector);

    // Populate sector with architecture
    buildSectorGeometry(sector, trackDisposable);
  }

  // Strobe Collapse Grid (Shared across center)
  const gridGeo = trackDisposable(new THREE.CylinderGeometry(400, 400, 4000, 16, 20, true));
  const gridMat = trackDisposable(new THREE.MeshBasicMaterial({
    color: COLORS.white,
    wireframe: true,
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  }));
  gridLines = new THREE.Mesh(gridGeo, gridMat);
  gridLines.rotation.x = Math.PI / 2;
  parisGroup.add(gridLines);

  initDone = true;
  return parisGroup;
}

function buildSectorGeometry(sector, trackDisposable) {
  // Pillars - Luxury obsidian and gold columns receding into infinity
  const pillarGeo = trackDisposable(new THREE.BoxGeometry(40, 400, 40));
  const pillarMat = trackDisposable(new THREE.MeshPhysicalMaterial({
    color: COLORS.black,
    emissive: 0x000000,
    metalness: 0.9,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0
  }));

  // Create a deep corridor of pillars per sector
  for (let z = 0; z < 20; z++) {
    const mesh = new THREE.Mesh(pillarGeo, pillarMat.clone ? pillarMat.clone() : pillarMat);
    // Positioned out from the center line so when mirrored they form a hallway
    mesh.position.set(150, 0, -z * 200);
    mesh.userData = {
      baseX: 150,
      baseZ: -z * 200,
      phase: Math.random() * Math.PI * 2
    };
    sector.add(mesh);
    pillarMeshes.push(mesh);
  }

  // Diagonal support trusses (Geometric complexity)
  const trussGeo = trackDisposable(new THREE.CylinderGeometry(2, 2, 600, 4));
  const trussMat = trackDisposable(new THREE.MeshStandardMaterial({
    color: COLORS.gold, metalness: 1.0, roughness: 0.2
  }));

  for (let z = 0; z < 10; z++) {
    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.position.set(150, 200, -z * 400);
    truss.rotation.z = Math.PI / 4;
    truss.rotation.x = Math.PI / 4;
    sector.add(truss);
  }
}

function spawnGoldShockwave() {
  if (shockwaves.length > 4) return;
  const geo = new THREE.RingGeometry(10, 50, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: COLORS.gold,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = flightZ - 1000;
  mesh.userData = { life: 1.0, scale: 1.0 };
  parisGroup.add(mesh);
  shockwaves.push(mesh);
}

export function drawParisFracture(volume, bassBin, trebleBin, camera, renderer, scene) {
  if (!parisGroup) return;
  const time = performance.now() * 0.001;
  const isDrop = volume > 0.8 && bassBin > 0.85;

  // Dark reflective fog
  scene.fog = scene.fog || new THREE.FogExp2(COLORS.black, 0.0008);
  scene.fog.color.copy(COLORS.black);
  scene.background = COLORS.black;

  // Violent Forward Surges
  let speed = 10 + volume * 40;
  if (isDrop) {
    speed += 80;
    if (time - lastDropTime > 1.0) {
      spawnGoldShockwave();
      flashIntensity = 1.0;
      flipState = Math.random() > 0.5 ? -1 : 1; // Mirror axis flip
      lastDropTime = time;
    }
  }
  flightZ -= speed;

  // Update Shockwaves
  shockwaves = shockwaves.filter(sw => {
    sw.userData.life -= 0.02;
    sw.userData.scale += 0.8 + bassBin * 0.5;
    sw.scale.setScalar(sw.userData.scale);
    sw.material.opacity = sw.userData.life;
    if (sw.userData.life <= 0) {
      parisGroup.remove(sw);
      sw.geometry.dispose();
      sw.material.dispose();
      return false;
    }
    return true;
  });

  // Strobe Collapse Grid
  gridLines.position.z = flightZ;
  gridLines.rotation.y = time * 0.2;
  // Shatter effect on drops
  if (isDrop) {
    gridLines.scale.set(1 + bassBin * 0.2, 1, 1 + bassBin * 0.2);
    gridLines.material.opacity = 0.3 + trebleBin * 0.5;
    gridLines.material.color = Math.random() > 0.8 ? COLORS.crimson : COLORS.white;
  } else {
    gridLines.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    gridLines.material.opacity = 0.05 + trebleBin * 0.1;
    gridLines.material.color = COLORS.white;
  }

  // Pillar Mirror Deformation
  pillarMeshes.forEach((mesh, i) => {
    // Infinite looping
    let localZ = mesh.userData.baseZ - flightZ;
    localZ = localZ % 4000;
    if (localZ > 500) localZ -= 4000;
    mesh.position.z = flightZ + localZ;

    // Architectural Pulse
    const pulse = 1 + bassBin * 0.4 * Math.sin(mesh.userData.phase + time * 5);
    mesh.scale.set(pulse, 1, pulse);

    // Material flash
    if (flashIntensity > 0.1 && Math.random() > 0.5) {
      mesh.material.emissive.copy(COLORS.gold).multiplyScalar(flashIntensity * 0.5);
    } else {
      mesh.material.emissive.setHex(0x000000);
    }
    
    // Rare crimson flashes
    if (isDrop && Math.random() > 0.95) {
      mesh.material.emissive.copy(COLORS.crimson);
    }
  });

  flashIntensity *= 0.85;

  // Camera System: Smooth aggressive motion, controlled instability
  const targetCamZ = flightZ + 200;
  
  if (runtime.isMouseInteractive) {
    const tx = (runtime.mouseX - window.innerWidth / 2) * 0.5;
    const ty = -(runtime.mouseY - window.innerHeight / 2) * 0.5;
    camera.position.x += (tx - camera.position.x) * 0.1;
    camera.position.y += (ty - camera.position.y) * 0.1;
  } else {
    // Slow rotational drift around the center
    camera.position.x = Math.sin(time * 0.3) * 50;
    camera.position.y = Math.cos(time * 0.2) * 50;
  }
  
  camera.position.z = targetCamZ;
  
  // Mirror-axis flips and strict symmetry alignment
  camera.up.set(0, flipState, 0);
  camera.lookAt(camera.position.x * 0.2, camera.position.y * 0.2, flightZ - 1000);
  
  // Controlled instability on drops (roll)
  camera.rotation.z += Math.sin(time * 2.0) * 0.05 + (bassBin > 0.8 ? (Math.random()-0.5)*0.1 : 0);

  renderer.render(scene, camera);
}

export function getParisGroup() {
  return parisGroup;
}

export function hideParis() {
  if (parisGroup) parisGroup.visible = false;
}

export function showParis() {
  if (parisGroup) parisGroup.visible = true;
}
