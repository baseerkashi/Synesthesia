import { runtime } from './runtime.js';

const frameTimes = [];

export function resetPerformanceState() {
  frameTimes.length = 0;
  runtime.perfScale = 1.0;
  runtime.lastFrameTime = performance.now();
}

export function beginFrame() {
  const now = performance.now();
  let dt = now - runtime.lastFrameTime;
  if (dt <= 0) dt = 16.66;
  runtime.lastFrameTime = now;
  return dt;
}

export function adaptPerformance(dt) {
  if (dt > 20) {
    runtime.perfScale = Math.max(0.3, runtime.perfScale - 0.05);
  } else if (dt < 17 && runtime.perfScale < 1.0) {
    runtime.perfScale = Math.min(1.0, runtime.perfScale + 0.01);
  }
}

export function recordFrameTime(dt) {
  frameTimes.push(dt);
  if (frameTimes.length > 30) frameTimes.shift();
}

export function getFrameStats() {
  if (frameTimes.length === 0) {
    return { fps: 0, avgDt: 0, variance: 0, gpuPressure: 'Low' };
  }
  let sum = 0;
  for (const t of frameTimes) sum += t;
  const avgDt = sum / frameTimes.length;
  let variance = 0;
  for (const t of frameTimes) variance += Math.abs(t - avgDt);
  return {
    fps: Math.round(1000 / avgDt),
    avgDt,
    variance: variance / frameTimes.length,
    gpuPressure: avgDt > 18 ? 'High' : avgDt > 14 ? 'Med' : 'Low',
  };
}

export function clearFrameHistory() {
  frameTimes.length = 0;
}
