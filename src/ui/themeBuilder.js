// SYNESTRA — Custom Theme Builder (Phase 6)
import { themes, activeTheme } from '../config/themes.js';
import { runtime } from '../engine/runtime.js';

let builderEl = null;
let builderVisible = false;

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function buildUI() {
  builderEl = document.createElement('div');
  builderEl.id = 'theme-builder';
  builderEl.innerHTML = `
    <div class="tb-header">
      <h2>🎨 Theme Builder</h2>
      <button id="tb-close">✖</button>
    </div>
    <div class="tb-body">
      <div class="tb-row">
        <label>Background</label>
        <input type="color" id="tb-bg" value="#0a0514">
      </div>
      <div class="tb-row">
        <label>Primary</label>
        <input type="color" id="tb-primary" value="#ff00ff">
      </div>
      <div class="tb-row">
        <label>Secondary</label>
        <input type="color" id="tb-secondary" value="#00ffff">
      </div>
      <div class="tb-row">
        <label>Theme Name</label>
        <input type="text" id="tb-name" placeholder="my_theme" maxlength="20">
      </div>
      <div class="tb-actions">
        <button id="tb-preview">Preview</button>
        <button id="tb-save">Save Theme</button>
      </div>
      <div id="tb-saved-list"></div>
    </div>
  `;
  document.body.appendChild(builderEl);
  
  builderEl.querySelector('#tb-close').addEventListener('click', () => toggleThemeBuilder());
  builderEl.querySelector('#tb-preview').addEventListener('click', previewTheme);
  builderEl.querySelector('#tb-save').addEventListener('click', saveTheme);
  
  // Live preview on color change
  ['tb-bg', 'tb-primary', 'tb-secondary'].forEach(id => {
    builderEl.querySelector('#' + id).addEventListener('input', previewTheme);
  });
  
  loadSavedThemes();
}

function previewTheme() {
  if (!builderEl) return;
  const bg = hexToRgb(builderEl.querySelector('#tb-bg').value);
  const primary = hexToRgb(builderEl.querySelector('#tb-primary').value);
  const secondary = hexToRgb(builderEl.querySelector('#tb-secondary').value);
  
  activeTheme.bg = bg;
  activeTheme.primary = primary;
  activeTheme.secondary = secondary;
}

function saveTheme() {
  if (!builderEl) return;
  const name = builderEl.querySelector('#tb-name').value.trim().toLowerCase().replace(/\s+/g, '_') || 'custom_' + Date.now();
  const bg = hexToRgb(builderEl.querySelector('#tb-bg').value);
  const primary = hexToRgb(builderEl.querySelector('#tb-primary').value);
  const secondary = hexToRgb(builderEl.querySelector('#tb-secondary').value);
  
  themes[name] = { bg, primary, secondary };
  runtime.currentTheme = name;
  
  // Persist to localStorage
  const saved = JSON.parse(localStorage.getItem('synestra_custom_themes') || '{}');
  saved[name] = { bg, primary, secondary };
  localStorage.setItem('synestra_custom_themes', JSON.stringify(saved));
  
  // Add to theme selector dropdown
  const sel = document.getElementById('theme-selector');
  if (sel && !sel.querySelector(`option[value="${name}"]`)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' ★';
    sel.appendChild(opt);
    sel.value = name;
  }
  
  loadSavedThemes();
}

function loadSavedThemes() {
  const saved = JSON.parse(localStorage.getItem('synestra_custom_themes') || '{}');
  Object.entries(saved).forEach(([name, t]) => {
    if (!themes[name]) {
      themes[name] = t;
      const sel = document.getElementById('theme-selector');
      if (sel && !sel.querySelector(`option[value="${name}"]`)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' ★';
        sel.appendChild(opt);
      }
    }
  });
  
  if (builderEl) {
    const list = builderEl.querySelector('#tb-saved-list');
    if (list) {
      const names = Object.keys(saved);
      list.innerHTML = names.length ? `<p style="color:#888;margin-top:10px;">Saved: ${names.join(', ')}</p>` : '';
    }
  }
}

export function toggleThemeBuilder() {
  builderVisible = !builderVisible;
  if (!builderEl) buildUI();
  builderEl.classList.toggle('visible', builderVisible);
}

export function initThemeBuilder() {
  loadSavedThemes();
}
