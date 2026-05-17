import { runtime } from '../engine/runtime.js';
import { resetTimelineState, updateTimeline, TIMELINE_STATE_NAMES } from '../engine/timelineEngine.js';
import { beginFrame, adaptPerformance, resetPerformanceState } from '../engine/performanceManager.js';
import { applyPresetHydration } from '../engine/presetManager.js';
import { getPreset } from '../config/presets.js';
import { updateBeatPulse, clearBeatState } from '../engine/audioEngine.js';
import { resetWebGLCamera, isWebGLShape } from '../engine/cameraEngine.js';

if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
  };
}

const domStub = {
  shapeSelector: { value: '' },
  themeSelector: { value: '' },
  sensitivityInput: { value: 1.5 },
  autoVJToggle: { checked: false },
  presetSelector: { value: 'none' },
};

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

export function runIntegrationStress() {
  const results = [];
  const test = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, error: e.message });
    }
  };

  test('timeline progression and decay', () => {
    resetTimelineState();
    for (let i = 0; i < 8000; i++) updateTimeline(16, 1);
    assert(runtime.timelineState >= 5, 'should climb with loud signal');
    const peakEnergy = runtime.cumulativeEnergy;
    for (let i = 0; i < 8000; i++) updateTimeline(16, 0);
    assert(runtime.cumulativeEnergy < peakEnergy, 'energy decays on silence');
    assert(TIMELINE_STATE_NAMES.length === 9, 'nine timeline states');
  });

  test('adaptive perf degradation/recovery', () => {
    resetPerformanceState();
    runtime.perfScale = 1;
    for (let i = 0; i < 10; i++) {
      beginFrame();
      adaptPerformance(25);
    }
    assert(runtime.perfScale < 1, 'degrades under load');
    for (let i = 0; i < 100; i++) {
      beginFrame();
      adaptPerformance(15);
    }
    assert(runtime.perfScale >= 0.95, 'recovers on good frames');
  });

  test('preset cycling hydration', () => {
    for (const key of ['sofi_ascension', 'yeezus_breach', 'dark_cathedral', 'pablo_duality', 'graduation_warp', 'black_mass', 'divine_collapse']) {
      const p = getPreset(key);
      if (!p) throw new Error(`missing preset ${key}`);
      applyPresetHydration(p, domStub);
      assert(runtime.currentShape === p.shape, `shape ${key}`);
      assert(runtime.smoothTimelineState === 1, `smooth reset ${key}`);
    }
  });

  test('WebGL shape detection', () => {
    assert(isWebGLShape('donda_pyramid'), 'donda is webgl');
    assert(!isWebGLShape('synthwave'), 'synthwave is 2d');
    resetWebGLCamera();
  });

  test('beat pulse without analyser throws safe', () => {
    clearBeatState();
    runtime.analyser = null;
    try {
      updateBeatPulse();
      assert(true, 'skipped');
    } catch {
      assert(false, 'should not throw when no analyser if guarded');
    }
  });

  test('HUD toggle state', () => {
    runtime.isHudVisible = false;
    runtime.isHudVisible = true;
    assert(runtime.isHudVisible === true, 'hud flag');
    runtime.isHudVisible = false;
  });

  const passed = results.filter((r) => r.ok).length;
  console.log(`[Aura Integration Stress] ${passed}/${results.length} passed`);
  results.forEach((r) => console.log(r.ok ? '  ✓' : '  ✗', r.name, r.error || ''));
  return { passed, total: results.length, results };
}

if (typeof process !== 'undefined' && process.argv?.[1]?.includes('integrationStress')) {
  runIntegrationStress();
}
