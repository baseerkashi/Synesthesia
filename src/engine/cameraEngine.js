import { runtime } from './runtime.js';

let webglApi = null;

export function bindCameraWebGL(api) {
  webglApi = api;
}

export function resetWebGLCamera() {
  if (!webglApi?.camera) return;
  const { camera, dondaGroup, graduationGroup } = webglApi;
  camera.position.set(0, 150, 600);
  camera.rotation.set(0, 0, 0);
  camera.lookAt(0, 150, 0);
  if (dondaGroup) dondaGroup.visible = false;
  if (graduationGroup) graduationGroup.visible = false;
}

export function applyBeatShake(intensity) {
  if (intensity <= 0) return;
  document.body.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
  setTimeout(() => {
    document.body.style.transform = 'none';
  }, 50);
}

export function clearBodyTransform() {
  document.body.style.transform = 'none';
}

export function isWebGLShape(shape) {
  return shape === 'donda_pyramid' || shape === 'sofi_orbital' || shape === 'graduation_stardrive';
}

export function onShapeTransition(prevShape, nextShape) {
  if (isWebGLShape(prevShape) && !isWebGLShape(nextShape)) {
    resetWebGLCamera();
  }
}
