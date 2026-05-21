import * as THREE from 'three';
import { runtime } from '../engine/runtime.js';
import { themes } from '../config/themes.js';
import * as sofiOrbital from './spectacle/sofiOrbital.js';
import * as graduationRebirth from './spectacle/graduationRebirth.js';
import * as dondaPyramid from './spectacle/dondaPyramid.js';
import * as parisFracture from './spectacle/parisFracture.js';

let renderer, scene, camera;
const disposables = [];

function trackDisposable(obj) {
  disposables.push(obj);
  return obj;
}

export function initWebGL(canvas) {
  if (renderer) return getWebGLContext();

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene = new THREE.Scene();
  scene.fog = trackDisposable(new THREE.FogExp2(0x020205, 0.001));

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(0, 150, 600);

  dondaPyramid.initDondaPyramid(scene, trackDisposable);

  sofiOrbital.initSofiOrbital(scene, trackDisposable);
  graduationRebirth.initGraduationRebirth(scene, trackDisposable);
  parisFracture.initParisFracture(scene, trackDisposable);
  sofiOrbital.hideSofi();
  graduationRebirth.hideGrad();
  parisFracture.hideParis();

  return getWebGLContext();
}

function hideAllWebGLGroups() {
  dondaPyramid.hideDonda();
  sofiOrbital.hideSofi();
  graduationRebirth.hideGrad();
  parisFracture.hideParis();
}

export function resizeWebGL(width, height) {
  if (!renderer || !camera) return;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function getWebGLContext() {
  return {
    renderer,
    scene,
    camera,
    dondaGroup: dondaPyramid.getDondaGroup(),
    graduationGroup: graduationRebirth.getGradGroup(),
    sofiGroup: sofiOrbital.getSofiGroup(),
    parisGroup: parisFracture.getParisGroup(),
  };
}

export function getRendererInfo() {
  if (!renderer) return { calls: 0, triangles: 0, points: 0, lines: 0 };
  const info = renderer.info.render;
  return { calls: info.calls, triangles: info.triangles, points: info.points, lines: info.lines };
}

export function drawDondaPyramid(volume, bassBin, trebleBin, themeStr) {
  if (!renderer) return;
  hideAllWebGLGroups();
  dondaPyramid.showDonda();
  dondaPyramid.drawDondaPyramid(volume, bassBin, trebleBin, camera, renderer, scene, themeStr);
}

export function drawSofiOrbital(volume, bassBin, trebleBin, themeStr) {
  if (!renderer) return;
  hideAllWebGLGroups();
  sofiOrbital.showSofi();
  sofiOrbital.drawSofiOrbital(volume, bassBin, trebleBin, camera, renderer, scene, themeStr);
}

export function drawGraduationStardrive(volume, bassBin, trebleBin, themeStr) {
  if (!renderer) return;
  hideAllWebGLGroups();
  graduationRebirth.showGrad();
  graduationRebirth.drawGraduationRebirth(volume, bassBin, trebleBin, camera, renderer, scene, themeStr);
}

export function drawParisFracture(volume, bassBin, trebleBin) {
  if (!renderer) return;
  hideAllWebGLGroups();
  parisFracture.showParis();
  parisFracture.drawParisFracture(volume, bassBin, trebleBin, camera, renderer, scene);
}

export function disposeWebGL() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  for (const obj of disposables) obj?.dispose?.();
  disposables.length = 0;
  renderer = null;
  scene = null;
  camera = null;
}

export { renderer };
