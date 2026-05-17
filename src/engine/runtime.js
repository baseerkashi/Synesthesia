/** Central mutable runtime state shared across Aura Era Engine modules. */
export const runtime = {
  canvas: null,
  ctx: null,
  webglCanvas: null,

  audioCtx: null,
  analyser: null,
  masterGain: null,
  dataArray: null,
  timeDataArray: null,
  source: null,
  stream: null,
  activeObjectUrl: null,

  animationId: null,
  isVisualizing: false,

  sensitivity: 1.5,
  currentTheme: 'retrowave',
  currentShape: 'synthwave',

  isAutoVJ: false,
  isAutoColor: false,
  isMouseInteractive: true,
  isYesMode: false,
  isHudVisible: false,

  mouseX: 0,
  mouseY: 0,
  idleTimer: null,

  lastFrameTime: performance.now(),
  drawFrameCounter: 0,

  perfScale: 1.0,
  estimatedDrawCalls: 0,
  instrumentedDrawCalls: 0,

  timelineState: 1,
  smoothTimelineState: 1.0,
  cumulativeEnergy: 0,
  stateStartTime: performance.now(),

  lastBeatTime: performance.now(),
  lastBeatIntervalMs: 500,
  frameBeatDetected: false,
  beatPulse: 0,
  beatHistory: [],
  estimatedBPM: 120,

  sceneChangeCooldown: performance.now(),
  previousDataArray: null,
  previousSpectrum: null,
  spectralFluxHistory: [],

  dom: {},
};

export function bindDOM(elements) {
  runtime.dom = elements;
  runtime.canvas = elements.canvas;
  runtime.ctx = elements.canvas?.getContext('2d') ?? null;
  runtime.webglCanvas = elements.webglCanvas;
  runtime.mouseX = window.innerWidth / 2;
  runtime.mouseY = window.innerHeight / 2;
}
