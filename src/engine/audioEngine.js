import { runtime } from './runtime.js';

const FLUX_HISTORY_SIZE = 40;

export function initAudioCtx() {
  if (!runtime.audioCtx) {
    runtime.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    runtime.masterGain = runtime.audioCtx.createGain();
    runtime.masterGain.gain.value = 1.0;
    runtime.analyser = runtime.audioCtx.createAnalyser();
    runtime.analyser.fftSize = 1024;
    const bufferLength = runtime.analyser.frequencyBinCount;
    runtime.dataArray = new Uint8Array(bufferLength);
    runtime.timeDataArray = new Uint8Array(runtime.analyser.fftSize);
  }
  if (runtime.audioCtx.state === 'suspended') {
    runtime.audioCtx.resume();
  }
}

export function getOutputLatencyMs() {
  if (!runtime.audioCtx) return 0;
  const base = runtime.audioCtx.baseLatency ?? 0;
  const output = runtime.audioCtx.outputLatency ?? 0;
  return (base + output) * 1000;
}

export function readAudioFrame() {
  runtime.analyser.getByteFrequencyData(runtime.dataArray);
  runtime.analyser.getByteTimeDomainData(runtime.timeDataArray);

  let sum = 0;
  for (let i = 0; i < 100; i++) sum += runtime.dataArray[i];
  const averageVolume = sum / 100;
  const normalizedVolume = Math.min(1, averageVolume / 255);
  return { averageVolume, normalizedVolume };
}

export function updateBeatPulse() {
  runtime.frameBeatDetected = false;
  if (!runtime.analyser || !runtime.dataArray) return 0;
  if (!runtime.previousSpectrum) {
    runtime.previousSpectrum = new Float32Array(runtime.analyser.frequencyBinCount);
  }

  let flux = 0;
  for (let i = 0; i < runtime.dataArray.length; i++) {
    const diff = runtime.dataArray[i] - runtime.previousSpectrum[i];
    if (diff > 0) flux += diff;
  }
  runtime.previousSpectrum.set(runtime.dataArray);

  runtime.spectralFluxHistory.push(flux);
  if (runtime.spectralFluxHistory.length > FLUX_HISTORY_SIZE) {
    runtime.spectralFluxHistory.shift();
  }

  let fluxSum = 0;
  for (let i = 0; i < runtime.spectralFluxHistory.length; i++) {
    fluxSum += runtime.spectralFluxHistory[i];
  }
  const fluxAvg = fluxSum / runtime.spectralFluxHistory.length;
  const fluxThreshold = fluxAvg * 1.5;
  const isBeat = flux > fluxThreshold && flux > 1000;
  const now = performance.now();

  if (isBeat && now - runtime.lastBeatTime > 120) {
    runtime.lastBeatIntervalMs = now - runtime.lastBeatTime;
    runtime.lastBeatTime = now;
    runtime.beatPulse = 1.0;
    runtime.frameBeatDetected = true;
  }
  runtime.beatPulse = Math.max(0, runtime.beatPulse - 0.05);
  return flux;
}

export function clearBeatState() {
  runtime.beatPulse = 0;
  runtime.spectralFluxHistory.length = 0;
  runtime.previousSpectrum = null;
  runtime.previousDataArray = null;
}

export function disconnectSource() {
  if (runtime.source) {
    try { runtime.source.disconnect(); } catch { /* noop */ }
    runtime.source = null;
  }
}

export function stopAllStreams() {
  if (runtime.stream) {
    runtime.stream.getTracks().forEach((t) => t.stop());
    runtime.stream = null;
  }
}

export function revokeActiveObjectUrl() {
  if (runtime.activeObjectUrl) {
    URL.revokeObjectURL(runtime.activeObjectUrl);
    runtime.activeObjectUrl = null;
  }
}

export function teardownAudio() {
  disconnectSource();
  stopAllStreams();
  revokeActiveObjectUrl();
  clearBeatState();
}
