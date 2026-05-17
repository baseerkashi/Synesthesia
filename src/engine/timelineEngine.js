import { runtime } from './runtime.js';

export const TIMELINE_STATE_NAMES = [
  'DORMANCY', 'AWAKENING', 'TENSION', 'ASCENSION', 'COLLAPSE',
  'EXPANSION', 'CONVERGENCE', 'BURST', 'RESOLUTION',
];

const THRESHOLDS = [10, 30, 60, 100, 150, 220, 300, 400];

export function resetTimelineState() {
  runtime.timelineState = 1;
  runtime.smoothTimelineState = 1.0;
  runtime.cumulativeEnergy = 0;
  runtime.stateStartTime = performance.now();
}

export function updateTimeline(dt, normalizedVolume) {
  runtime.cumulativeEnergy += normalizedVolume * dt * 0.001;
  runtime.cumulativeEnergy = Math.max(
    0,
    runtime.cumulativeEnergy - dt * 0.0004 * (1 - normalizedVolume),
  );

  const e = runtime.cumulativeEnergy;
  let state = 9;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (e < THRESHOLDS[i]) {
      state = i + 1;
      break;
    }
  }
  runtime.timelineState = state;
  runtime.smoothTimelineState += (runtime.timelineState - runtime.smoothTimelineState) * 0.02;
}

export function getTimelineLabel() {
  return `${runtime.timelineState} (${TIMELINE_STATE_NAMES[runtime.timelineState - 1]})`;
}
