import { runtime } from './runtime.js';
import { getPreset } from '../config/presets.js';
import { resetTimelineState } from './timelineEngine.js';
import { resetWebGLCamera, isWebGLShape } from './cameraEngine.js';
import { isSpectacleMode, onSpectacleShapeChange } from './spectacleTransitions.js';
import { resetShapeTracking } from './visualizerRegistry.js';
import { clearBeatState } from './audioEngine.js';

export function applyPresetHydration(preset, dom) {
  const prev = runtime.currentShape;
  runtime.currentShape = preset.shape;
  if (dom.shapeSelector) dom.shapeSelector.value = preset.shape;
  runtime.currentTheme = preset.theme;
  if (dom.themeSelector) dom.themeSelector.value = preset.theme;
  runtime.sensitivity = preset.sensitivity;
  if (dom.sensitivityInput) dom.sensitivityInput.value = preset.sensitivity;
  runtime.isAutoVJ = false;
  if (dom.autoVJToggle) dom.autoVJToggle.checked = false;
  runtime.perfScale = 1.0;
  clearBeatState();
  resetTimelineState();
  localStorage.setItem('aura_theme', preset.theme);
  localStorage.setItem('aura_shape', preset.shape);
  if (!isWebGLShape(preset.shape)) resetWebGLCamera();
  if (isSpectacleMode(prev) && isSpectacleMode(preset.shape)) {
    onSpectacleShapeChange(prev, preset.shape);
  }
  resetShapeTracking();
}

export function applyPresetById(id, dom) {
  const preset = getPreset(id);
  if (preset) applyPresetHydration(preset, dom);
  return preset;
}

export function switchTheme(themeId, dom) {
  if (runtime.currentTheme === themeId) return;
  runtime.currentTheme = themeId;
  if (dom.themeSelector) dom.themeSelector.value = themeId;
  localStorage.setItem('aura_theme', themeId);
  if (dom.presetSelector) dom.presetSelector.value = 'none';
}

export function switchShape(shapeId, dom) {
  if (runtime.currentShape === shapeId) return;
  const prev = runtime.currentShape;
  runtime.currentShape = shapeId;
  if (dom.shapeSelector) dom.shapeSelector.value = shapeId;
  localStorage.setItem('aura_shape', shapeId);
  if (dom.presetSelector) dom.presetSelector.value = 'none';
  if (isWebGLShape(prev) && !isWebGLShape(shapeId)) resetWebGLCamera();
  if (isSpectacleMode(prev) && isSpectacleMode(shapeId)) onSpectacleShapeChange(prev, shapeId);
  resetShapeTracking();
}
