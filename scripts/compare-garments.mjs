// Compare our E4-1 model with published numbers: ring density per ring size,
// shirt area/ring counts (The Chain Mail Guy calculator) and garment totals
// (Ironskin). Run: node scripts/compare-garments.mjs
import { WEAVES, defaultPitch } from '../src/model/weaves.js';
import { ringStats, MATERIALS } from '../src/model/rings.js';
import { buildShirt, buildTrousers, chainMailGuyShirt, SHIRT_DEFAULTS, TROUSER_DEFAULTS } from '../src/model/garments.js';

const SQFT = 92903.04; // mm²
const pct = (a, b) => `${a >= b ? '+' : ''}${Math.round((a / b - 1) * 100)}%`;
const ours = (id) => { const p = defaultPitch(WEAVES.e41, { id }); return SQFT / (p.along * p.across); };

console.log('\n1) Rings per square foot, E4-1 — published vs our default spacing');
const density = [
  ['Chain Mail Guy', '1/16″ × 1/4″', 1.5875, 6.35, 2400],
  ['Chain Mail Guy', '1/16″ × 3/8″', 1.5875, 9.525, 1200],
  ['Chain Mail Guy', '14 AWG × 1/2″', 1.628, 12.7, 750],
  ['Chain Mail Guy', '.035″ × 3/16″', 0.889, 4.7625, 4800],
  ['Chain Mail Guy', '.035″ × 1/8″ (table)', 0.889, 3.175, 12000],
  ['Chain Mail Guy', '.035″ × 1/8″ (calculator code)', 0.889, 3.175, 9600],
  ['Metal Designz', '16 ga × 1/4″, AR 4.2', 6.35 / 4.2, 6.35, 3050],
  ['M.A.I.L. art. 647', '.063″ × .346″ swatch', 1.6, 8.79, 9.25 * 144],
];
for (const [src, size, wd, id, pub] of density) {
  const o = ours(id);
  console.log(`  ${src.padEnd(18)} ${size.padEnd(30)} AR ${(id / wd).toFixed(1).padStart(4)}  published ${String(pub).padStart(6)}  ours ${String(Math.round(o)).padStart(6)}  ${pct(o, pub)}`);
}

console.log('\n2) Shirt area — our tube model vs The Chain Mail Guy formula (same measurements)');
const shirts = [
  ['long sleeves, hip length', { ...SHIRT_DEFAULTS }],
  ['short sleeves (25 cm), hip length', { ...SHIRT_DEFAULTS, sleeve: 250 }],
  ['long sleeves, mid-thigh (hauberk)', { ...SHIRT_DEFAULTS, length: 950, hem: 1100 }],
];
const p6 = defaultPitch(WEAVES.e41, { id: 6.35 });
for (const [name, m] of shirts) {
  const s = buildShirt(m, p6);
  const cmg = chainMailGuyShirt({ chest: m.chest, length: m.length, arm: m.upperArm, sleeve: m.sleeve }, 2400);
  console.log(`  ${name.padEnd(36)} area ours ${(s.area / SQFT).toFixed(1)} ft²  CMG ${(cmg.areaMm2 / SQFT).toFixed(1)} ft²  ${pct(s.area, cmg.areaMm2)}`);
  console.log(`  ${''.padEnd(36)} rings (1/16″×1/4″): ours ${s.rings}, CMG ${cmg.rings}`);
}

console.log('\n3) Ironskin: "30,000 rings" for a long-sleeved shirt in 8 mm rings; hauberk 12 kg, short-sleeved 8 kg');
const p8 = defaultPitch(WEAVES.e41, { id: 8 });
const steel = MATERIALS.steel.density;
for (const [name, m] of [['long sleeves, hip length', shirts[0][1]], ['long sleeves, mid-thigh', shirts[2][1]], ['short sleeves, hip length', shirts[1][1]]]) {
  const s = buildShirt(m, p8);
  const masses = [1.2, 1.6, 2.0].map(wd => `${wd} mm wire ${(s.rings * ringStats({ wd, id: 8, density: steel }).mass / 1000).toFixed(1)} kg`);
  console.log(`  ${name.padEnd(28)} ${s.rings} rings · ${masses.join(' · ')}`);
}

console.log('\n4) Trousers / chausses with the defaults, 8 mm rings (no published counts found)');
for (const [name, m] of [['full trousers', TROUSER_DEFAULTS], ['chausses (legs only)', { ...TROUSER_DEFAULTS, legsOnly: true }]]) {
  const t = buildTrousers(m, p8);
  console.log(`  ${name.padEnd(22)} ${t.rings} rings, ${(t.area / SQFT).toFixed(1)} ft² — ` + t.pieces.map(p => `${p.name} ${p.count > 1 ? p.count + '× ' : ''}${p.rings}`).join(', '));
  console.log(`  ${''.padEnd(22)} weight in 1.6 mm steel: ${(t.rings * ringStats({ wd: 1.6, id: 8, density: steel }).mass / 1000).toFixed(1)} kg`);
}
console.log('');
