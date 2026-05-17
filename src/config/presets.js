export const elitePresets = {
  sofi_ascension: { shape: 'sofi_orbital', theme: 'bloodmoon', sensitivity: 1.8 },
  yeezus_breach: { shape: 'iron_reckoning', theme: 'yeezus', sensitivity: 2.2 },
  dark_cathedral: { shape: 'cathedral', theme: 'bloodmoon', sensitivity: 1.5 },
  pablo_duality: { shape: 'phantom_district', theme: 'tlop', sensitivity: 1.6 },
  graduation_warp: { shape: 'graduation_stardrive', theme: 'synthgold', sensitivity: 2.0 },
  black_mass: { shape: 'blackhole', theme: 'void', sensitivity: 1.8 },
  divine_collapse: { shape: 'fractalbloom', theme: 'ocean', sensitivity: 1.4 },
};

export function getPreset(id) {
  return elitePresets[id] ?? null;
}
