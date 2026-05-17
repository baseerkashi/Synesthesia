import './style.css';
import { runtime, bindDOM } from './engine/runtime.js';
import { initThemes, updateThemeLerp } from './config/themes.js';
import {
  initAudioCtx, readAudioFrame, updateBeatPulse, teardownAudio,
  disconnectSource, revokeActiveObjectUrl,
} from './engine/audioEngine.js';
import { beginFrame, adaptPerformance, recordFrameTime, resetPerformanceState, clearFrameHistory } from './engine/performanceManager.js';
import { updateTimeline, resetTimelineState } from './engine/timelineEngine.js';
import { switchTheme, switchShape } from './engine/presetManager.js';
import { resetWebGLCamera, clearBodyTransform, bindCameraWebGL } from './engine/cameraEngine.js';
import { resetDrawInstrumentation, bindRender3DMetrics } from './engine/metrics.js';
import { renderFrame, preloadVisualizers, isWebGLShape } from './engine/visualizerRegistry.js';
import { updateVJ } from './engine/vjEngine.js';
import { initDebugHUD, updateDebugHUD } from './ui/debugHUD.js';
import { disposeGlowAtlas } from './render/glowAtlas.js';

const dom = {
  canvas: document.getElementById('visualizer'),
  webglCanvas: document.getElementById('webgl-canvas'),
  fileUpload: document.getElementById('file-upload'),
  micBtn: document.getElementById('mic-btn'),
  tabAudioBtn: document.getElementById('tab-audio-btn'),
  stopBtn: document.getElementById('stop-btn'),
  uiLayer: document.getElementById('ui-layer'),
  controlsPanel: document.getElementById('controls-panel'),
  statusText: document.getElementById('status'),
  sensitivityInput: document.getElementById('sensitivity'),
  themeSelector: document.getElementById('theme-selector'),
  shapeSelector: document.getElementById('shape-selector'),
  toggleSettingsBtn: document.getElementById('toggle-settings-btn'),
  fullscreenBtn: document.getElementById('fullscreen-btn'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  autoVJToggle: document.getElementById('auto-vj-toggle'),
  autoColorToggle: document.getElementById('auto-color-toggle'),
  mouseInteractionToggle: document.getElementById('mouse-interaction-toggle'),
  audioPlayer: document.getElementById('audio-player'),
  crtToggle: document.getElementById('crt-toggle'),
  crtOverlay: document.getElementById('crt-overlay'),
  artBackground: document.getElementById('art-background'),
  nowPlaying: document.getElementById('now-playing'),
  trackName: document.getElementById('track-name'),
  playPauseBtn: document.getElementById('play-pause-btn'),
  diagHud: document.getElementById('diagnostic-hud'),
  hudFps: document.getElementById('hud-fps'),
  hudFrameTime: document.getElementById('hud-frametime'),
  hudVariance: document.getElementById('hud-variance'),
  hudState: document.getElementById('hud-state'),
  hudPerf: document.getElementById('hud-perf'),
  hudDrawCalls: document.getElementById('hud-drawcalls'),
  hudGpu: document.getElementById('hud-gpu'),
  hudLatency: document.getElementById('hud-latency'),
  hudSync: document.getElementById('hud-sync'),
  hudShader: document.getElementById('hud-shader'),
};

bindDOM(dom);
initDebugHUD(dom);

runtime.sensitivity = 1.5;
runtime.currentTheme = initThemes(localStorage.getItem('aura_theme') || 'retrowave');
runtime.currentShape = localStorage.getItem('aura_shape') || 'synthwave';
dom.themeSelector.value = runtime.currentTheme;
dom.shapeSelector.value = runtime.currentShape;

function resetIdleTimer() {
  document.body.classList.remove('ui-hidden');
  dom.uiLayer.classList.remove('ui-hidden');
  dom.nowPlaying.classList.remove('ui-hidden');
  clearTimeout(runtime.idleTimer);
  if (runtime.isVisualizing) {
    runtime.idleTimer = setTimeout(() => {
      document.body.classList.add('ui-hidden');
      dom.uiLayer.classList.add('ui-hidden');
      dom.nowPlaying.classList.add('ui-hidden');
    }, 3000);
  }
}

window.addEventListener('mousemove', (e) => {
  runtime.mouseX = e.clientX;
  runtime.mouseY = e.clientY;
  resetIdleTimer();
});
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    runtime.mouseX = e.touches[0].clientX;
    runtime.mouseY = e.touches[0].clientY;
    resetIdleTimer();
  }
});

function resizeCanvas() {
  runtime.canvas.width = window.innerWidth;
  runtime.canvas.height = window.innerHeight;
  import('./render/render3D.js').then((m) => m.resizeWebGL(window.innerWidth, window.innerHeight)).catch(() => {});
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if (dom.playPauseBtn) {
  dom.playPauseBtn.addEventListener('click', () => {
    if (runtime.audioCtx?.state === 'running') {
      if (dom.audioPlayer && !dom.audioPlayer.paused) {
        dom.audioPlayer.pause();
        dom.playPauseBtn.textContent = '▶';
      } else {
        runtime.audioCtx.suspend();
        dom.playPauseBtn.textContent = '▶';
      }
    } else if (runtime.audioCtx?.state === 'suspended') {
      runtime.audioCtx.resume();
      if (dom.audioPlayer?.paused && dom.audioPlayer.src) dom.audioPlayer.play();
      dom.playPauseBtn.textContent = '⏸';
    } else if (dom.audioPlayer?.paused && dom.audioPlayer.src) {
      dom.audioPlayer.play();
      dom.playPauseBtn.textContent = '⏸';
    }
  });
}

dom.fileUpload.addEventListener('change', handleFileUpload);
dom.micBtn.addEventListener('click', startMicCapture);
dom.tabAudioBtn.addEventListener('click', startTabCapture);
dom.stopBtn.addEventListener('click', stopAudio);
dom.sensitivityInput.addEventListener('input', (e) => { runtime.sensitivity = parseFloat(e.target.value); });
dom.themeSelector.addEventListener('change', (e) => {
  runtime.currentTheme = e.target.value;
});
dom.shapeSelector.addEventListener('change', (e) => {
  switchShape(e.target.value, dom);
});
dom.crtToggle.addEventListener('change', (e) => {
  dom.crtOverlay.classList.toggle('hidden', !e.target.checked);
});
dom.toggleSettingsBtn.addEventListener('click', () => {
  dom.controlsPanel.classList.remove('hidden');
  dom.toggleSettingsBtn.classList.add('hidden');
});
dom.fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
});
dom.closeSettingsBtn.addEventListener('click', () => {
  dom.controlsPanel.classList.add('hidden');
  dom.toggleSettingsBtn.classList.remove('hidden');
});
dom.autoVJToggle.addEventListener('change', (e) => {
  runtime.isAutoVJ = e.target.checked;
  dom.themeSelector.disabled = runtime.isAutoVJ;
  dom.shapeSelector.disabled = runtime.isAutoVJ;
});
dom.autoColorToggle.addEventListener('change', (e) => { runtime.isAutoColor = e.target.checked; });
dom.mouseInteractionToggle.addEventListener('change', (e) => { runtime.isMouseInteractive = e.target.checked; });

async function ensureWebGL() {
  const m = await import('./render/render3D.js');
  const ctx = m.initWebGL(dom.webglCanvas);
  bindCameraWebGL(ctx);
  bindRender3DMetrics(m.getRendererInfo);
  return m;
}

async function startMicCapture() {
  try {
    dom.statusText.textContent = 'Requesting microphone access...';
    dom.statusText.classList.remove('status-hidden');
    runtime.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    dom.nowPlaying.classList.remove('hidden');
    dom.trackName.textContent = 'Live Audio / Microphone';
    initAudioCtx();
    disconnectSource();
    runtime.source = runtime.audioCtx.createMediaStreamSource(runtime.stream);
    runtime.source.connect(runtime.analyser);
    startVisualization();
  } catch (err) {
    console.error('Mic error:', err);
    showError('Could not access microphone.');
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  dom.nowPlaying.classList.remove('hidden');
  dom.trackName.textContent = file.name.replace(/\.[^/.]+$/, '');
  revokeActiveObjectUrl();
  runtime.activeObjectUrl = URL.createObjectURL(file);
  playAudioElement(runtime.activeObjectUrl);
}

function playAudioElement(url) {
  dom.statusText.textContent = 'Loading audio...';
  dom.statusText.classList.remove('status-hidden');
  if (dom.playPauseBtn) dom.playPauseBtn.textContent = '⏸';
  initAudioCtx();
  disconnectSource();
  dom.audioPlayer.src = url;
  dom.audioPlayer.crossOrigin = 'anonymous';
  dom.audioPlayer.play().then(() => {
    if (!dom.audioPlayer.hasSource) {
      runtime.source = runtime.audioCtx.createMediaElementSource(dom.audioPlayer);
      dom.audioPlayer.hasSource = true;
    }
    try { runtime.analyser.disconnect(); } catch { /* noop */ }
    try { runtime.masterGain.disconnect(); } catch { /* noop */ }
    runtime.source.connect(runtime.analyser);
    runtime.analyser.connect(runtime.masterGain);
    runtime.masterGain.connect(runtime.audioCtx.destination);
    runtime.masterGain.gain.value = 1.0;
    startVisualization();
  }).catch((err) => {
    console.error('Playback failed:', err);
    showError('Failed to play audio.');
  });
}

async function startTabCapture() {
  try {
    dom.statusText.textContent = 'Please select a tab (Ensure "Share tab audio" is ON!)';
    dom.statusText.classList.remove('status-hidden');
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (displayStream.getAudioTracks().length === 0) {
      displayStream.getTracks().forEach((t) => t.stop());
      throw new Error("No audio track shared. Did you check 'Share audio'?");
    }
    displayStream.getVideoTracks().forEach((t) => t.stop());
    dom.nowPlaying.classList.remove('hidden');
    dom.trackName.textContent = 'System / Tab Audio';
    initAudioCtx();
    disconnectSource();
    runtime.stream = displayStream;
    runtime.source = runtime.audioCtx.createMediaStreamSource(runtime.stream);
    runtime.source.connect(runtime.analyser);
    startVisualization();
  } catch (err) {
    console.error('Tab capture error:', err);
    dom.statusText.textContent = `Error: ${err.message}`;
    dom.statusText.classList.remove('status-hidden');
  }
}

function startVisualization() {
  dom.statusText.classList.add('status-hidden');
  dom.uiLayer.classList.add('minimized');
  dom.toggleSettingsBtn.classList.remove('hidden');
  dom.fullscreenBtn.classList.remove('hidden');
  dom.artBackground.classList.add('hidden');
  runtime.isVisualizing = true;
  preloadVisualizers();
  if (isWebGLShape(runtime.currentShape)) {
    ensureWebGL();
  }
  draw();
}

function showError(msg) {
  dom.statusText.textContent = msg;
  setTimeout(() => dom.statusText.classList.add('status-hidden'), 3000);
}

async function stopAudio() {
  runtime.isVisualizing = false;
  if (runtime.animationId) cancelAnimationFrame(runtime.animationId);
  runtime.animationId = null;
  teardownAudio();
  dom.audioPlayer.pause();
  dom.audioPlayer.currentTime = 0;
  clearTimeout(runtime.idleTimer);
  document.body.classList.remove('ui-hidden');
  clearBodyTransform();
  dom.nowPlaying.classList.add('hidden');
  resetWebGLCamera();
  resetTimelineState();
  resetPerformanceState();
  dom.canvas.classList.remove('chromatic-aberration');
  const r3d = await import('./render/render3D.js').catch(() => null);
  if (r3d?.renderer) r3d.renderer.clear();
  disposeGlowAtlas(runtime.ctx);
  dom.uiLayer.classList.remove('minimized');
  dom.controlsPanel.classList.add('hidden');
  dom.toggleSettingsBtn.classList.add('hidden');
  dom.fullscreenBtn.classList.add('hidden');
  dom.artBackground.classList.remove('hidden');
  runtime.ctx.clearRect(0, 0, runtime.canvas.width, runtime.canvas.height);
}

async function draw() {
  if (!runtime.isVisualizing) return;
  if (!runtime.analyser || !runtime.dataArray) return;

  runtime.animationId = requestAnimationFrame(draw);
  runtime.drawFrameCounter++;
  const dt = beginFrame();
  adaptPerformance(dt);
  if (runtime.isHudVisible) recordFrameTime(dt);

  const processStart = performance.now();
  const { averageVolume, normalizedVolume } = readAudioFrame();
  updateTimeline(dt, normalizedVolume);
  updateBeatPulse();
  updateThemeLerp(runtime.currentTheme);
  updateVJ(averageVolume, dom);

  resetDrawInstrumentation();
  const trebleBin = runtime.dataArray[Math.floor(runtime.analyser.frequencyBinCount * 0.7)] / 255;

  if (isWebGLShape(runtime.currentShape)) {
    await ensureWebGL();
  }
  await renderFrame(normalizedVolume, trebleBin);

  const processingMs = performance.now() - processStart;
  updateDebugHUD(processingMs);
}

if (import.meta.env.DEV && new URLSearchParams(location.search).has('test')) {
  import('./tests/integrationStress.js').then((m) => m.runIntegrationStress());
}
