// Ring geometry, wire gauges and materials. All lengths in mm, masses in g.

// American Wire Gauge (used for anodised aluminium, copper, niobium).
export const AWG = {
  10: 2.588, 12: 2.053, 13: 1.828, 14: 1.628, 16: 1.291, 18: 1.024,
  19: 0.912, 20: 0.812, 22: 0.644,
};

// Standard Wire Gauge (used for steel / stainless / titanium by most suppliers).
export const SWG = {
  10: 3.251, 12: 2.642, 13: 2.337, 14: 2.032, 16: 1.626, 18: 1.219,
  19: 1.016, 20: 0.914, 22: 0.711,
};

export const MATERIALS = {
  aluminum:  { name: 'Aluminium (bright / anodised)', density: 2.70, gauge: 'AWG' },
  stainless: { name: 'Stainless steel', density: 7.93, gauge: 'SWG' },
  steel:     { name: 'Galvanised / mild steel', density: 7.85, gauge: 'SWG' },
  titanium:  { name: 'Titanium', density: 4.51, gauge: 'SWG' },
  bronze:    { name: 'Bronze', density: 8.80, gauge: 'AWG' },
  brass:     { name: 'Brass', density: 8.50, gauge: 'AWG' },
  copper:    { name: 'Copper', density: 8.96, gauge: 'AWG' },
  niobium:   { name: 'Niobium', density: 8.57, gauge: 'AWG' },
  silver:    { name: 'Sterling silver', density: 10.36, gauge: 'AWG' },
};

/**
 * Basic ring statistics.
 * @param {{wd:number, id:number, density:number}} r wire diameter, inner diameter (mm), density (g/cm³)
 */
export function ringStats({ wd, id, density }) {
  const ar = id / wd;
  const od = id + 2 * wd;
  const wireLength = Math.PI * (id + wd); // along the wire centreline
  const volumeMm3 = (Math.PI * wd * wd / 4) * wireLength;
  const mass = (volumeMm3 / 1000) * density;
  return { ar, od, wireLength, mass };
}

/** Classify an aspect ratio against a weave's sourced AR bands (see weaves.js / sources.js). */
export function arVerdict(ar, weave) {
  return weave.arBands.find(b => ar < b.below);
}

// Built-in ring presets: common supplier sizes (gauge + fractional-inch ID).
// Wire diameters come from the gauge tables above; nothing else is claimed.
const inch = n => +(n * 25.4).toFixed(2);
export const RING_PRESETS = [
  { name: '16 AWG ¼″ aluminium', material: 'aluminum', wd: AWG[16], id: inch(1 / 4) },
  { name: '16 AWG 5/16″ aluminium', material: 'aluminum', wd: AWG[16], id: inch(5 / 16) },
  { name: '18 AWG ¼″ aluminium', material: 'aluminum', wd: AWG[18], id: inch(1 / 4) },
  { name: '18 AWG 3/16″ aluminium', material: 'aluminum', wd: AWG[18], id: inch(3 / 16) },
  { name: '14 AWG 5/16″ aluminium', material: 'aluminum', wd: AWG[14], id: inch(5 / 16) },
  { name: '16 SWG ¼″ stainless', material: 'stainless', wd: SWG[16], id: inch(1 / 4) },
  { name: '16 SWG 5/16″ stainless', material: 'stainless', wd: SWG[16], id: inch(5 / 16) },
  { name: '18 SWG 3/16″ stainless', material: 'stainless', wd: SWG[18], id: inch(3 / 16) },
  { name: '18 SWG ¼″ stainless', material: 'stainless', wd: SWG[18], id: inch(1 / 4) },
  { name: '18 SWG ¼″ titanium', material: 'titanium', wd: SWG[18], id: inch(1 / 4) },
  { name: '18 AWG ¼″ bronze', material: 'bronze', wd: AWG[18], id: inch(1 / 4) },
  { name: '18 AWG ¼″ niobium', material: 'niobium', wd: AWG[18], id: inch(1 / 4) },
];
export const RING_PRESET_FILE_TYPE = 'chainmail-ring-presets';
