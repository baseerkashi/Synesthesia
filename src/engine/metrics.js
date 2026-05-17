import { runtime } from './runtime.js';
import { getFrameStats } from './performanceManager.js';
import { getTimelineLabel } from './timelineEngine.js';
import { getOutputLatencyMs } from './audioEngine.js';
const DRAW_CALL_ESTIMATES = {
  synthwave: 120, particles: 450, starfield: 300, kaleidoscope: 200,
  fractalbloom: 380, neuralbloom: 250, iron_reckoning: 180, phantom_district: 160,
  blackhole: 320, cathedral: 220, matrix_rain: 150, donda_pyramid: 80,
  sofi_orbital: 140, graduation_stardrive: 180,
};

function estimateDrawCalls(shape) {
  return Math.floor((DRAW_CALL_ESTIMATES[shape] || 100) * runtime.perfScale);
}

let render3DInfo = () => ({ calls: 0, triangles: 0, points: 0, lines: 0 });

export function bindRender3DMetrics(fn) {
  render3DInfo = fn;
}

export function resetDrawInstrumentation() {
  runtime.instrumentedDrawCalls = 0;
}

export function incrementDrawCalls(n = 1) {
  runtime.instrumentedDrawCalls += n;
}

export function collectMetrics(processingMs) {
  const frame = getFrameStats();
  const webgl = render3DInfo();
  const estimated2D = estimateDrawCalls(runtime.currentShape);
  const drawCalls = runtime.instrumentedDrawCalls > 0
    ? runtime.instrumentedDrawCalls
    : estimated2D + webgl.calls;

  return {
    fps: frame.fps,
    frameTimeMs: frame.avgDt,
    varianceMs: frame.variance,
    gpuPressure: frame.gpuPressure,
    perfScale: runtime.perfScale,
    timelineLabel: getTimelineLabel(),
    audioOutputLatencyMs: getOutputLatencyMs(),
    processingMs,
    drawCalls,
    webglTriangles: webgl.triangles,
    webglCalls: webgl.calls,
    bpm: Math.round(runtime.estimatedBPM),
    shaderMode: runtime.perfScale < 0.6 ? 'Degraded' : 'Full Precision',
  };
}
