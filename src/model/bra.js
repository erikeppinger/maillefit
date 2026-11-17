// Bra project, after the user's reference bra:
//   – each cup: two flat E4-1 triangles joined by a 4-in-1 stitch; the stitch
//     is where the cup folds and gets its curve (see triangleCup.js)
//   – 2 rows of E6-1 along the neckline of each cup (T → M → C), a 6-in-1
//     bridge across the gap between the two C corners (none when the cups
//     touch), and straps from T over the shoulders
//   – optional E6-1 side bands from S to the back, optional E6-1 edging on the
//     free cup edges, O-rings + ribbon ties at the ends
// All lengths in mm.

import { ringStats, arVerdict, MATERIALS } from './rings.js';
import { WEAVES, resolvePitch } from './weaves.js';
import { buildCup } from './triangleCup.js';
import { SHIRT_DEFAULTS, TROUSER_DEFAULTS } from './garments.js';

export const SIDES = ['left', 'right'];
export const SIDE_NAMES = { left: 'Left', right: 'Right' };

// M sits straight below the nipple: C → M across is how far the cup reaches inwards
const DEFAULT_CUP = { side: 130, fold: 170, neckUpper: 120, neckLower: 130, stitch: 130 };

export const DEFAULT_PROJECT = {
  version: 3,
  name: 'New project',
  units: 'metric',
  garment: 'bra',                       // 'bra' | 'shirt' | 'trousers'
  shirt: structuredClone(SHIRT_DEFAULTS),
  trousers: structuredClone(TROUSER_DEFAULTS),
  client: {
    underbust: 760,
    highBust: 840,
    fullBust: 900,
    strapLength: 450,
    apexToApex: 190,           // nipple to nipple, straight across
    gapFrom: 'nipples',        // bridge width from 'nipples' (calculated) or 'measured' (centreGap)
    centreGap: 20,             // measured between the two C dots; 0 = the cups touch in one V
    cup: { ...DEFAULT_CUP },   // client's LEFT cup (and both, unless separateSides)
    separateSides: false,
    right: { ...DEFAULT_CUP }, // client's right cup when measured separately
  },
  rings: {
    main:    { material: 'aluminum', wd: 1.291, id: 6.35 },
    seam:    { same: true, material: 'aluminum', wd: 1.291, id: 6.35 },
    support: { same: false, material: 'aluminum', wd: 1.024, id: 6.35 },
  },
  calibration: {
    main:    { enabled: false, alongCount: 11, alongLength: 0, acrossCount: 11, acrossLength: 0 },
    support: { enabled: false, alongCount: 11, alongLength: 0 },
  },
  construction: {
    cupEase: 0,
    stitchRows: 1,
    supportRows: 2,     // E6-1 rows along the neckline and straps
    straps: true,       // E6-1 shoulder straps from T
    sideBand: true,     // E6-1 from S around to the back
    frame: false,       // E6-1 edging along the side and bottom edges
    frameRows: 1,
    bridgeStyle: 'auto',  // 'auto' | 'ring' | 'rows' — bridge between the cups
    backGap: 80,        // left open at the back, bridged by ribbon
    oRingId: 30,
    bowAllowance: 250,  // ribbon per tie
    spare: 10,
  },
};

const SET_NAMES = { main: 'Panel rings (E4-1)', seam: 'Stitch connectors', support: 'E6-1 rings' };

function ringSet(project, key) {
  const r = project.rings[key];
  const spec = r.same ? project.rings.main : r;
  return { key, spec, material: MATERIALS[spec.material], same: !!r.same };
}

function strip(lengthMm, rows, pitch) {
  if (!(lengthMm > 0)) return { length: 0, perRow: 0, rows, rings: 0 };
  const perRow = Math.max(1, Math.round(lengthMm / pitch.along));
  return { length: lengthMm, perRow, rows, rings: perRow * rows };
}

export function computeBra(project) {
  const { client, construction: c } = project;
  const warnings = [];

  // --- rings --------------------------------------------------------------
  const sets = {};
  for (const key of ['main', 'seam', 'support']) {
    const s = ringSet(project, key);
    s.stats = ringStats({ wd: s.spec.wd, id: s.spec.id, density: s.material.density });
    s.weave = key === 'support' ? WEAVES.e61 : WEAVES.e41;
    s.verdict = arVerdict(s.stats.ar, s.weave);
    if (s.verdict.level === 'bad' && !(key === 'seam' && s.same)) {
      warnings.push(`${SET_NAMES[key]}: AR ${s.stats.ar.toFixed(2)} for ${s.weave.name}: ${s.verdict.text}.`);
    }
    sets[key] = s;
  }
  const mainPitch = resolvePitch(WEAVES.e41, sets.main.spec, project.calibration.main);
  const supportPitch = resolvePitch(WEAVES.e61, sets.support.spec, project.calibration.support);

  // --- cups -----------------------------------------------------------------
  const f = 1 + c.cupEase / 100;
  const cups = {};
  for (const side of client.separateSides ? SIDES : ['left']) {
    const src = side === 'right' && client.separateSides ? client.right : client.cup;
    const e = Object.fromEntries(Object.entries(src).map(([k, v]) => [k, v * f]));
    const cup = buildCup({ e, pitch: mainPitch, stitchRows: c.stitchRows });
    cups[side] = { side, name: SIDE_NAMES[side], e, cup };
  }
  if (!client.separateSides) cups.right = { ...cups.left, side: 'right', name: SIDE_NAMES.right };

  for (const side of client.separateSides ? SIDES : ['left']) {
    const { cup } = cups[side];
    const who = client.separateSides ? `${SIDE_NAMES[side]} cup: ` : '';
    const L = cup.layout;
    if (L.problems.includes('lower')) warnings.push(`${who}the lower triangle can't close — fold S→C, neckline M→C and stitch S→M don't form a triangle (one is longer than the other two together). Re-measure.`);
    if (L.problems.includes('upper')) warnings.push(`${who}the upper triangle can't close — side T→S, neckline T→M and stitch S→M don't form a triangle. Re-measure.`);
    if (!L.problems.length && L.dartDeg <= 2) warnings.push(`${who}the triangles lie flat (no angle left at M), so the cup gets no curve. Usually the neckline lengths T→M / M→C are measured too long or the stitch too short.`);
    if (L.dartDeg > 75) warnings.push(`${who}very deep fold at M (${Math.round(L.dartDeg)}°) — check the neckline lengths; the stitch may bunch up.`);
    const dev = (cup.rings - cup.ringsByArea) / cup.ringsByArea;
    if (Math.abs(dev) > 0.12) warnings.push(`${who}row-by-row count differs ${Math.round(dev * 100)}% from the area estimate — the rings are coarse for this cup size.`);
  }
  const both = fn => SIDES.reduce((n, s) => n + fn(cups[s]), 0);
  const perCup = fn => (client.separateSides ? `L ${fn(cups.left)} / R ${fn(cups.right)}` : `${fn(cups.left)} each`);

  // --- E6-1 -----------------------------------------------------------------
  const neckline = strip(both(x => x.cup.neckline), c.supportRows, supportPitch);
  const strapOne = c.straps ? strip(client.strapLength, c.supportRows, supportPitch) : strip(0, c.supportRows, supportPitch);
  const straps = { ...strapOne, rings: strapOne.rings * 2 };
  // Bridge between the cups at the bottom: 6-in-1 across the gap between the
  // two C corners. Either measured directly, or from nipple to nipple: each
  // cup takes up the horizontal distance from its C corner to M (the stitch
  // end, just inside and below the nipple) — what is left is the gap.
  const reach = x => Math.max(0, x.cup.layout.M[0]);
  const gapFromNipples = (client.apexToApex || 0) - reach(cups.left) - reach(cups.right);
  const wanted = client.gapFrom === 'measured' ? Math.max(0, client.centreGap || 0) : gapFromNipples;
  if (client.gapFrom !== 'measured' && gapFromNipples < 0) {
    warnings.push(`Nipple to nipple (${(client.apexToApex / 10).toFixed(1)} cm) is narrower than the two cups reach from M to C — the cups touch and there is no bridge. Check nipple to nipple and neckline M → C.`);
  }
  // The bridge (as in the reference bra, the neckline bands run on into each
  // other at the bottom) is either one connecting ring, or vertical rows of
  // 6-in-1 side by side across the gap, each as tall as the neckline band is
  // wide. An odd number of vertical rows leaves one in the middle, so both
  // halves mirror each other. 'auto' takes the ring when the gap is narrower
  // than one vertical row.
  const want = Math.max(0, wanted), pitchX = supportPitch.along;
  let style = c.bridgeStyle || 'auto';
  if (style === 'auto') style = want <= 0 ? 'none' : want < pitchX * 0.75 ? 'ring' : 'rows';
  let bridge;
  if (style === 'ring') {
    // one ring spans about its own inner diameter between the two band ends
    bridge = { style, length: sets.support.spec.id, perRow: 1, rows: 1, rings: 1, vertical: 0 };
  } else if (style === 'rows') {
    let n = Math.max(1, Math.round(want / pitchX));
    if (n % 2 === 0) n += want / pitchX >= n ? 1 : -1;
    bridge = { style, length: n * pitchX, perRow: n, rows: c.supportRows, rings: n * c.supportRows, vertical: n };
  } else {
    bridge = { style: 'none', length: 0, perRow: 0, rows: 0, rings: 0, vertical: 0 };
  }
  const gap = bridge.length;
  const bases = both(x => x.e.fold);
  const sideLength = (client.underbust - c.backGap - bases - gap) / 2;
  if (c.sideBand && sideLength <= 0) warnings.push('The two cup bottoms plus the back gap already exceed the underbust — no room for side bands. Re-check fold S→C and the underbust.');
  const sideOne = c.sideBand ? strip(Math.max(0, sideLength), c.supportRows, supportPitch) : strip(0, c.supportRows, supportPitch);
  const sidesBand = { ...sideOne, rings: sideOne.rings * 2 };
  const frame = c.frame ? strip(both(x => x.cup.free), c.frameRows, supportPitch) : strip(0, c.frameRows, supportPitch);

  // --- hardware -------------------------------------------------------------
  const oRings = (c.sideBand ? 2 : 0) + (c.straps ? 2 : 0);
  const backRibbon = c.sideBand ? c.backGap + c.bowAllowance : 0;
  const strapRibbon = c.straps ? 2 * c.bowAllowance : 0;

  const bustMinusUnder = client.fullBust - client.underbust;
  const letters = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  const cupLetter = letters[Math.min(letters.length - 1, Math.max(0, Math.floor((bustMinusUnder / 10 - 10) / 2)))];
  if (client.highBust > client.fullBust) warnings.push('Chest girth above the breasts is larger than the bust girth — please re-check both.');

  // --- pieces and order list -------------------------------------------------
  const pieces = [
    { key: 'panels', label: 'Cup triangles (2 per cup)', set: 'main', rings: both(x => x.cup.rings), layout: perCup(x => x.cup.triangles.map(t => t.rows.length).join(' + ') + ' rows') },
    { key: 'stitch', label: 'Stitch connectors', set: 'seam', rings: both(x => x.cup.stitch.rings), layout: perCup(x => x.cup.stitch.rings) },
    { key: 'neckline', label: 'E6-1 neckline, both cups', set: 'support', rings: neckline.rings, layout: `${neckline.rows} rows × ${neckline.perRow}` },
    { key: 'bridge', label: 'E6-1 bridge between the cups', set: 'support', rings: bridge.rings, layout: bridge.style === 'rows' ? `${bridge.vertical} vertical rows × ${bridge.rows} rings` : bridge.style === 'ring' ? 'one connecting ring' : 'cups touch' },
    { key: 'straps', label: 'E6-1 shoulder straps (×2)', set: 'support', rings: straps.rings, layout: straps.rings ? `${straps.rows} rows × ${straps.perRow} each` : 'off' },
    { key: 'sides', label: 'E6-1 side bands (×2)', set: 'support', rings: sidesBand.rings, layout: sidesBand.rings ? `${sidesBand.rows} rows × ${sidesBand.perRow} each` : 'off' },
    { key: 'frame', label: 'E6-1 edging (side + bottom)', set: 'support', rings: frame.rings, layout: frame.rings ? `${frame.rows} row × ${frame.perRow}` : 'off' },
  ];

  const order = [];
  for (const key of ['main', 'seam', 'support']) {
    const s = sets[key];
    const target = s.same ? order.find(o => o.key === 'main') : null;
    const net = pieces.filter(p => p.set === key).reduce((n, p) => n + p.rings, 0);
    if (target) { target.net += net; target.uses.push(SET_NAMES[key]); continue; }
    order.push({ key, name: SET_NAMES[key], uses: [SET_NAMES[key]], spec: s.spec, material: s.material, stats: s.stats, net });
  }
  for (const o of order) {
    o.order = Math.ceil(o.net * (1 + c.spare / 100));
    o.mass = o.net * o.stats.mass;
    o.wire = o.order * o.stats.wireLength;
  }
  const net = order.reduce((n, o) => n + o.net, 0);

  return {
    cups, separate: !!client.separateSides,
    sets, mainPitch, supportPitch, neckline, straps, sides: sidesBand, frame,
    bridge: { ...bridge, gap, wanted: Math.max(0, wanted), fromNipples: client.gapFrom !== 'measured' },
    hardware: { oRings, oRingId: c.oRingId, ribbon: backRibbon + strapRibbon, backRibbon, strapRibbon },
    body: { bustMinusUnder, bustMinusHigh: client.fullBust - client.highBust, cupLetter },
    pieces, order, net,
    totalOrder: order.reduce((n, o) => n + o.order, 0),
    mass: order.reduce((n, o) => n + o.mass, 0),
    warnings,
  };
}
