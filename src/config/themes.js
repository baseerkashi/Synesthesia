export const themes = {
  retrowave: { bg: [10, 5, 20], primary: [255, 0, 255], secondary: [0, 255, 255] },
  matrix: { bg: [0, 10, 0], primary: [0, 255, 0], secondary: [150, 255, 150] },
  cyberpunk: { bg: [5, 5, 8], primary: [255, 0, 123], secondary: [0, 240, 255] },
  aurora: { bg: [2, 10, 20], primary: [0, 255, 128], secondary: [128, 0, 255] },
  fire: { bg: [15, 2, 2], primary: [255, 50, 0], secondary: [255, 200, 0] },
  ocean: { bg: [2, 10, 30], primary: [0, 150, 255], secondary: [0, 255, 200] },
  neon: { bg: [10, 10, 10], primary: [57, 255, 20], secondary: [255, 20, 147] },
  galaxy: { bg: [5, 0, 15], primary: [138, 43, 226], secondary: [255, 215, 0] },
  synthgold: { bg: [15, 10, 5], primary: [255, 215, 0], secondary: [255, 100, 0] },
  bloodmoon: { bg: [15, 0, 0], primary: [255, 0, 0], secondary: [150, 0, 50] },
  flow: { bg: [0, 0, 0], primary: [255, 0, 0], secondary: [0, 255, 0] },
  void: { bg: [2, 2, 2], primary: [150, 150, 150], secondary: [50, 50, 50] },
  hologram: { bg: [5, 10, 20], primary: [0, 255, 255], secondary: [255, 0, 255] },
  sunset: { bg: [20, 5, 5], primary: [255, 100, 0], secondary: [255, 0, 150] },
  emerald: { bg: [0, 15, 5], primary: [0, 255, 100], secondary: [0, 150, 255] },
  acid: { bg: [15, 15, 5], primary: [255, 255, 0], secondary: [255, 0, 255] },
  vaporwave: { bg: [5, 10, 25], primary: [0, 255, 255], secondary: [255, 0, 255] },
  midnight: { bg: [0, 5, 10], primary: [0, 100, 255], secondary: [150, 0, 255] },
  tokyo: { bg: [5, 5, 15], primary: [255, 0, 150], secondary: [0, 200, 255] },
  outrun: { bg: [15, 0, 15], primary: [255, 100, 0], secondary: [200, 0, 255] },
  cosmic: { bg: [5, 0, 20], primary: [100, 0, 255], secondary: [0, 255, 200] },
  yeezus: { bg: [0, 0, 0], primary: [255, 0, 0], secondary: [255, 255, 255] },
  tlop: { bg: [20, 8, 2], primary: [255, 90, 0], secondary: [200, 170, 120] },
  donda: { bg: [5, 0, 5], primary: [200, 10, 20], secondary: [255, 180, 0] },
  graduation: { bg: [240, 248, 255], primary: [255, 45, 149], secondary: [0, 229, 255] },
};

export const activeTheme = {
  bg: [...themes.retrowave.bg],
  primary: [...themes.retrowave.primary],
  secondary: [...themes.retrowave.secondary],
};

export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

export function initThemes(savedThemeId) {
  const id = themes[savedThemeId] ? savedThemeId : 'retrowave';
  const t = themes[id];
  activeTheme.bg = [...t.bg];
  activeTheme.primary = [...t.primary];
  activeTheme.secondary = [...t.secondary];
  return id;
}

export function updateThemeLerp(currentThemeId) {
  const target = themes[currentThemeId];
  if (!target) return;
  for (let i = 0; i < 3; i++) {
    activeTheme.bg[i] = lerp(activeTheme.bg[i], target.bg[i], 0.05);
    activeTheme.primary[i] = lerp(activeTheme.primary[i], target.primary[i], 0.05);
    activeTheme.secondary[i] = lerp(activeTheme.secondary[i], target.secondary[i], 0.05);
  }
}

export function animateFlowTheme() {
  const time = performance.now() * 0.0005;
  themes.flow.primary = [
    Math.floor((Math.sin(time) + 1) * 127.5),
    Math.floor((Math.sin(time + 2) + 1) * 127.5),
    Math.floor((Math.sin(time + 4) + 1) * 127.5),
  ];
  themes.flow.secondary = [
    Math.floor((Math.sin(time + Math.PI) + 1) * 127.5),
    Math.floor((Math.sin(time + Math.PI + 2) + 1) * 127.5),
    Math.floor((Math.sin(time + Math.PI + 4) + 1) * 127.5),
  ];
}

export function applyAutoColorToTheme(t) {
  const colorTime = performance.now() * 0.0005;
  t.primary = [
    Math.floor((Math.sin(colorTime) + 1) * 127.5),
    Math.floor((Math.sin(colorTime + 2) + 1) * 127.5),
    Math.floor((Math.sin(colorTime + 4) + 1) * 127.5),
  ];
  t.secondary = [
    Math.floor((Math.sin(colorTime + Math.PI) + 1) * 127.5),
    Math.floor((Math.sin(colorTime + Math.PI + 2) + 1) * 127.5),
    Math.floor((Math.sin(colorTime + Math.PI + 4) + 1) * 127.5),
  ];
}
