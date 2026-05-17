import { runtime } from '../engine/runtime.js';
import { collectMetrics } from '../engine/metrics.js';

const els = {};

export function initDebugHUD(dom) {
  els.root = dom.diagHud;
  els.fps = dom.hudFps;
  els.frameTime = dom.hudFrameTime;
  els.variance = dom.hudVariance;
  els.state = dom.hudState;
  els.perf = dom.hudPerf;
  els.drawCalls = dom.hudDrawCalls;
  els.gpu = dom.hudGpu;
  els.latency = dom.hudLatency;
  els.sync = dom.hudSync;
  els.shader = dom.hudShader;

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      runtime.isHudVisible = !runtime.isHudVisible;
      els.root?.classList.toggle('hidden', !runtime.isHudVisible);
    }
  });
}

export function updateDebugHUD(processingMs) {
  if (!runtime.isHudVisible) return;
  const m = collectMetrics(processingMs);
  if (els.fps) els.fps.textContent = String(m.fps);
  if (els.frameTime) els.frameTime.textContent = m.frameTimeMs.toFixed(2);
  if (els.variance) els.variance.textContent = m.varianceMs.toFixed(2);
  if (els.gpu) els.gpu.textContent = m.gpuPressure;
  if (els.perf) els.perf.textContent = m.perfScale.toFixed(2);
  if (els.state) els.state.textContent = m.timelineLabel;
  if (els.latency) els.latency.textContent = m.audioOutputLatencyMs.toFixed(1);
  if (els.sync) els.sync.textContent = `${m.bpm} BPM`;
  if (els.shader) els.shader.textContent = m.shaderMode;
  if (els.drawCalls) els.drawCalls.textContent = String(m.drawCalls);
}
