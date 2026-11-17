// Garments beyond the bra, built from tapered E4-1 tubes (tube.js).
// Every piece gets real rounds with expansions/contractions, and the totals
// can be checked against published calculators (test/garments.test.mjs,
// scripts/compare-garments.mjs, sources.js).
//
// Ease: The Chain Mail Guy's shirt calculator adds 6″ to the chest and 4″ to
// the arm girth. We use the same values as defaults; trouser ease reuses them
// (unsourced).
//
// Shirt construction follows M.A.I.L. "Chainmail Shirt; Construction":
//   – T-style: one weave direction everywhere, sleeves "hang open", tapered with
//     hole-row contractions; no seams
//   – 45° sleeves: the sleeve weave is turned against the body, which needs
//     4 seams (front and back of both shoulders) but allows knot-row
//     contractions
//   – optional gussets at the shoulders and elbows; the back about 4″ wider
//     than the front

import { buildTube } from './tube.js';

export const IN = 25.4;

export const SHIRT_DEFAULTS = {
  // body measurements (mm)
  chest: 1070,          // fullest chest girth
  hem: 1040,            // girth where the shirt ends (waist or hip)
  length: 760,          // top of the shoulder → hem
  armhole: 230,         // top of the shoulder → armpit (straight down)
  sleeve: 610,          // shoulder point → cuff (0 = sleeveless)
  shoulderToElbow: 340,
  upperArm: 330,
  elbow: 290,
  wrist: 180,
  neck: 400,
  // construction
  ease: { body: 6 * IN, arm: 4 * IN },
  sleeveStyle: 't',     // 't' = T-style, '45' = 45° sleeves with 4 seams
  backExtra: 4 * IN,    // back wider than front (M.A.I.L.: about 4″)
  shoulderGusset: { on: false, base: 100, height: 120 },
  elbowGusset: { on: false, size: 80 },
  collar: { on: false, height: 50, ease: 30 },
};

export const TROUSER_DEFAULTS = {
  waist: 860,
  seat: 1020,           // fullest hip/seat girth
  thigh: 600,           // top of the thigh, just below the crotch
  knee: 400,
  ankle: 260,
  outseam: 1050,        // waist → ankle at the side
  inseam: 790,          // crotch → ankle
  crotchToKnee: 360,
  waistToSeat: 200,     // waist → fullest seat, down the side
  legsOnly: false,      // chausses: legs without the seat part
  ease: { body: 6 * IN, limb: 4 * IN },
};

const other = around => (around === 'along' ? 'across' : 'along');
const patch = (area, pitch) => Math.round(area / (pitch.along * pitch.across));

/** Shirt: body tube, yoke, sleeves, optional seams, gussets and collar. */
export function buildShirt(m, pitch, around = 'along') {
  const e = m.ease;
  const pieces = [];
  const notes = [];
  const bodyTube = m.length - m.armhole;
  const chestG = m.chest + e.body;
  const body = buildTube({ stations: [{ at: 0, girth: m.hem + e.body, name: 'hem' }, { at: bodyTube, girth: chestG, name: 'armpit' }], pitch, around });
  // the back is wider than the front: share of every round that belongs to the front
  const frontShare = Math.max(0.3, Math.min(0.5, (chestG - m.backExtra) / (2 * chestG)));
  pieces.push({ key: 'body', name: 'Body (hem → armpits)', count: 1, tube: body, frontShare });

  // yoke: front + back above the armpits, closed over the shoulders, minus the neck hole
  const neckHole = Math.PI * (m.neck / (2 * Math.PI)) ** 2;
  const yokeArea = chestG * m.armhole - neckHole;
  pieces.push({ key: 'yoke', name: 'Yoke (armpits → shoulders)', count: 1, area: yokeArea, rings: patch(yokeArea, pitch), frontShare,
    size: { width: chestG / 2, height: m.armhole } });

  if (m.sleeve > 0) {
    // the sleeve top has to fill the armhole: front + back of the armhole depth
    const top = Math.max(2 * m.armhole, m.upperArm + e.arm);
    const stations = [{ at: 0, girth: top, name: 'shoulder' }];
    if (m.sleeve > m.shoulderToElbow) {
      stations.push({ at: m.shoulderToElbow, girth: m.elbow + e.arm, name: 'elbow' }, { at: m.sleeve, girth: m.wrist + e.arm, name: 'cuff' });
    } else {
      stations.push({ at: m.sleeve, girth: top + (m.elbow + e.arm - top) * (m.sleeve / m.shoulderToElbow), name: 'cuff' });
    }
    // T-style: the arms stick out sideways, so the body's weave meets the sleeve
    // turned by 90°; 45° sleeves turn the weave back so it runs round the arm
    // like it runs round the body.
    const sleeveAround = m.sleeveStyle === '45' ? around : other(around);
    const contraction = m.sleeveStyle === '45' ? 'knot-row contractions' : 'hole-row contractions';
    pieces.push({ key: 'sleeve', name: 'Sleeve (shoulder → cuff)', count: 2, tube: buildTube({ stations, pitch, around: sleeveAround }), contraction });

    if (m.sleeveStyle === '45') {
      // front and back of each shoulder, from the shoulder top down to the armpit
      const perSeam = Math.max(1, Math.round(m.armhole / pitch.along));
      pieces.push({ key: 'seams', name: 'Shoulder seams (45° sleeves)', count: 4, area: 0, rings: perSeam, length: m.armhole });
    }
    if (m.elbowGusset.on && m.sleeve > m.shoulderToElbow) {
      const a = m.elbowGusset.size ** 2 / 2; // diamond with both diagonals = size
      pieces.push({ key: 'elbow', name: 'Elbow gusset', count: 2, area: a, rings: patch(a, pitch), size: { width: m.elbowGusset.size, height: m.elbowGusset.size } });
    }
  }
  if (m.shoulderGusset.on) {
    const a = m.shoulderGusset.base * m.shoulderGusset.height / 2;
    pieces.push({ key: 'shoulder', name: 'Shoulder gusset', count: 2, area: a, rings: patch(a, pitch), size: { width: m.shoulderGusset.base, height: m.shoulderGusset.height } });
  }
  if (m.collar.on) {
    const g = m.neck + m.collar.ease;
    pieces.push({ key: 'collar', name: 'Collar', count: 1, tube: buildTube({ stations: [{ at: 0, girth: g, name: 'neck' }, { at: m.collar.height, girth: g, name: 'top' }], pitch, around }) });
  }
  if (m.length <= m.armhole) notes.push('Length must be longer than the armhole depth.');
  return summarise(pieces, notes);
}

/** Trousers: seat tube (waist → crotch), two tapered legs, crotch gusset. legsOnly = chausses. */
export function buildTrousers(m, pitch, around = 'along') {
  const e = m.ease;
  const pieces = [];
  const notes = [];
  const rise = m.outseam - m.inseam;
  if (rise <= 0 && !m.legsOnly) notes.push('Outseam must be longer than the inseam (waist → crotch is the difference).');
  if (!m.legsOnly && rise > 0) {
    const seat = buildTube({
      stations: [{ at: 0, girth: m.waist + e.body, name: 'waist' }, { at: Math.min(m.waistToSeat, rise), girth: m.seat + e.body, name: 'seat' }, { at: rise, girth: m.seat + e.body, name: 'crotch' }],
      pitch, around,
    });
    pieces.push({ key: 'seat', name: 'Seat (waist → crotch)', count: 1, tube: seat });
    // two legs together are wider than the seat at the crotch; the difference
    // is filled by a diamond gusset (our estimate, no published rule found)
    const excess = Math.max(0, 2 * (m.thigh + e.limb) - (m.seat + e.body));
    const gussetArea = (excess / 2) ** 2;
    if (gussetArea > 0) pieces.push({ key: 'gusset', name: 'Crotch gusset', count: 1, area: gussetArea, rings: patch(gussetArea, pitch), size: { width: excess / 2, height: excess / 2 } });
  }
  const leg = buildTube({
    stations: [{ at: 0, girth: m.thigh + e.limb, name: 'thigh' }, { at: m.crotchToKnee, girth: m.knee + e.limb, name: 'knee' }, { at: m.inseam, girth: m.ankle + e.limb, name: 'ankle' }],
    pitch, around,
  });
  pieces.push({ key: 'leg', name: 'Leg (crotch → ankle)', count: 2, tube: leg });
  return summarise(pieces, notes);
}

function summarise(pieces, notes = []) {
  for (const p of pieces) if (p.tube) { p.rings = p.tube.rings; p.area = p.tube.area; }
  const rings = pieces.reduce((n, p) => n + p.rings * p.count, 0);
  const area = pieces.reduce((n, p) => n + p.area * p.count, 0);
  return { pieces, rings, area, notes };
}

/**
 * The Chain Mail Guy's shirt calculator, for comparison (from the page's own
 * JavaScript): area in² = (chest + 6) × length + (arm + 4) × sleeve × 2, all
 * in inches, times their rings per square foot.
 */
export function chainMailGuyShirt({ chest, length, arm, sleeve }, ringsPerSqFt) {
  const sqIn = (chest / IN + 6) * (length / IN) + (arm / IN + 4) * (sleeve / IN) * 2;
  return { areaMm2: sqIn * IN * IN, rings: Math.round(sqIn / 144 * ringsPerSqFt) };
}
