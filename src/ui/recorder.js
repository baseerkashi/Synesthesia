// SYNESTRA — Direct Record / Export System (Phase 3)
import { runtime } from '../engine/runtime.js';

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordStartTime = 0;
let recordDuration = 0; // 0 = unlimited
let recordTimerEl = null;

export function initRecorder() {
  // Build record button
  const btn = document.createElement('button');
  btn.id = 'record-btn';
  btn.className = 'settings-btn hidden';
  btn.style.cssText = 'right: 340px; color: #ff4444;';
  btn.textContent = '⏺ Record';
  btn.addEventListener('click', toggleRecording);
  document.getElementById('app').appendChild(btn);
  
  // Timer display
  recordTimerEl = document.createElement('div');
  recordTimerEl.id = 'record-timer';
  recordTimerEl.className = 'hidden';
  document.getElementById('app').appendChild(recordTimerEl);
  
  return btn;
}

export function showRecordBtn() {
  const btn = document.getElementById('record-btn');
  if (btn) btn.classList.remove('hidden');
}

export function hideRecordBtn() {
  const btn = document.getElementById('record-btn');
  if (btn) btn.classList.add('hidden');
  stopRecording();
}

export function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording(duration = 0) {
  const canvas = runtime.canvas;
  if (!canvas) return;
  
  recordDuration = duration;
  recordedChunks = [];
  
  const stream = canvas.captureStream(60);
  
  // Try to capture audio too
  if (runtime.audioCtx && runtime.masterGain) {
    try {
      const dest = runtime.audioCtx.createMediaStreamDestination();
      runtime.masterGain.connect(dest);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch (e) { /* No audio capture available */ }
  }
  
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  
  mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  
  mediaRecorder.onstop = exportRecording;
  
  mediaRecorder.start(100);
  isRecording = true;
  recordStartTime = performance.now();
  
  const btn = document.getElementById('record-btn');
  if (btn) {
    btn.textContent = '⏹ Stop';
    btn.style.color = '#ff0000';
    btn.classList.add('recording-pulse');
  }
  
  recordTimerEl?.classList.remove('hidden');
  updateTimer();
  
  if (recordDuration > 0) {
    setTimeout(() => stopRecording(), recordDuration * 1000);
  }
}

function updateTimer() {
  if (!isRecording) return;
  const elapsed = Math.floor((performance.now() - recordStartTime) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  if (recordTimerEl) recordTimerEl.textContent = `⏺ REC ${mins}:${secs}`;
  requestAnimationFrame(updateTimer);
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  mediaRecorder.stop();
  isRecording = false;
  
  const btn = document.getElementById('record-btn');
  if (btn) {
    btn.textContent = '⏺ Record';
    btn.style.color = '#ff4444';
    btn.classList.remove('recording-pulse');
  }
  recordTimerEl?.classList.add('hidden');
}

function exportRecording() {
  if (recordedChunks.length === 0) return;
  
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const shape = runtime.currentShape || 'synestra';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `synestra_${shape}_${timestamp}.webm`;
  a.href = url;
  a.click();
  
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  recordedChunks = [];
}

export function isCurrentlyRecording() { return isRecording; }
