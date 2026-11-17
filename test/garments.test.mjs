import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTube, tubeSteps, girthAt } from '../src/model/tube.js';
import { buildShirt, buildTrousers, chainMailGuyShirt, SHIRT_DEFAULTS, TROUSER_DEFAULTS } from '../src/model/garments.js';
import { WEAVES, defaultPitch } from '../src/model/weaves.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const SQFT = 92903.04;
const p = defaultPitch(WEAVES.e41, { id: 8 });

test('girth interpolates between stations', () => {
  const st = [{ at: 0, girth: 400 }, { at: 100, girth: 300 }, { at: 300, girth: 200 }];
  assert.equal(girthAt(st, 50), 350);
  assert.equal(girthAt(st, 200), 250);
  assert.equal(girthAt(st, 999), 200);
});

test('tube ring count matches its surface', () => {
  const tube = buildTube({ stations: [{ at: 0, girth: 450 }, { at: 600, girth: 250 }], pitch: p });
  close(tube.rings / tube.ringsByArea, 1, 0.03);
  assert.ok(tube.contractions > 0 && tube.expansions === 0);
});

test('tube steps follow the stations and add up', () => {
  const tube = buildTube({ stations: [{ at: 0, girth: 450 }, { at: 300, girth: 450 }, { at: 600, girth: 250 }], pitch: p });
  const steps = tubeSteps(tube);
  assert.equal(steps.length, 2);
  assert.equal(steps[0].change, 0);
  assert.equal(steps[1].endRings, tube.rows.at(-1).rings);
});

// The Chain Mail Guy shirt formula is a plain-tube estimate with the same ease;
// our tapered model should land close to it (published coverage areas).
test('shirt area within 10% of The Chain Mail Guy formula', () => {
  for (const m of [SHIRT_DEFAULTS, { ...SHIRT_DEFAULTS, sleeve: 250 }, { ...SHIRT_DEFAULTS, length: 950, hem: 1100 }]) {
    const ours = buildShirt(m, p);
    const cmg = chainMailGuyShirt({ chest: m.chest, length: m.length, arm: m.upperArm, sleeve: m.sleeve }, 2400);
    close(ours.area / cmg.areaMm2, 1, 0.1);
  }
});

// Ironskin quotes ~30,000 rings for a long-sleeved shirt in 8 mm rings.
test('long-sleeved shirt in 8 mm rings lands in the published range', () => {
  const n = buildShirt({ ...SHIRT_DEFAULTS, length: 950, hem: 1100 }, p).rings;
  assert.ok(n > 24000 && n < 36000, `rings ${n}`);
});

test('trousers: legs only drops the seat and gusset', () => {
  const full = buildTrousers(TROUSER_DEFAULTS, p);
  const legs = buildTrousers({ ...TROUSER_DEFAULTS, legsOnly: true }, p);
  assert.equal(legs.pieces.length, 1);
  assert.ok(full.rings > legs.rings);
  close(full.area / SQFT, 11.9, 0.5);
});

test('45° sleeves add four shoulder seams and turn the sleeve weave', () => {
  const t = buildShirt(SHIRT_DEFAULTS, p);
  const d = buildShirt({ ...SHIRT_DEFAULTS, sleeveStyle: '45' }, p);
  const seams = d.pieces.find(x => x.key === 'seams');
  assert.equal(seams.count, 4);
  assert.equal(d.pieces.find(x => x.key === 'sleeve').contraction, 'knot-row contractions');
  // turning the weave changes rings per round, not the sleeve surface
  const ts = t.pieces.find(x => x.key === 'sleeve').tube, ds = d.pieces.find(x => x.key === 'sleeve').tube;
  assert.notEqual(ts.rows[0].rings, ds.rows[0].rings);
  close(ts.rings / ds.rings, 1, 0.05);
});

test('gussets and collar add pieces; back is wider than front', () => {
  const s = buildShirt({ ...SHIRT_DEFAULTS, shoulderGusset: { on: true, base: 100, height: 120 }, elbowGusset: { on: true, size: 80 }, collar: { on: true, height: 50, ease: 30 } }, p);
  for (const k of ['shoulder', 'elbow', 'collar']) assert.ok(s.pieces.some(x => x.key === k), k);
  const body = s.pieces.find(x => x.key === 'body');
  assert.ok(body.frontShare < 0.5);
  close(body.frontShare, (SHIRT_DEFAULTS.chest + 6 * 25.4 - 4 * 25.4) / (2 * (SHIRT_DEFAULTS.chest + 6 * 25.4)), 1e-9);
});
