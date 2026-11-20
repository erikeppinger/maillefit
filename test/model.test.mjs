import test from 'node:test';
import assert from 'node:assert/strict';
import { cupLayout, buildCup, rowHint } from '../src/model/triangleCup.js';
import { ringStats } from '../src/model/rings.js';
import { resolvePitch, WEAVES } from '../src/model/weaves.js';
import { DEFAULT_PROJECT, computeBra } from '../src/model/bra.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const e = { side: 130, fold: 160, neckUpper: 120, neckLower: 90, stitch: 150 };
const pitch = { along: 7.7, across: 4.7 };

test('layout reproduces all five measured lengths', () => {
  const L = cupLayout(e);
  close(dist(L.T, L.S), e.side, 1e-9);
  close(dist(L.S, L.C), e.fold, 1e-9);
  close(dist(L.T, L.M), e.neckUpper, 1e-9);
  close(dist(L.M, L.C), e.neckLower, 1e-9);
  close(dist(L.S, L.M), e.stitch, 1e-9);
  assert.deepEqual(L.problems, []);
});

test('the upper triangle lies on the far side of the stitch from C', () => {
  const L = cupLayout(e);
  const side = q => (L.M[0] - L.S[0]) * (q[1] - L.S[1]) - (L.M[1] - L.S[1]) * (q[0] - L.S[0]);
  assert.ok(Math.sign(side(L.T)) !== Math.sign(side(L.C)));
});

test('dart: missing angle at M; zero when the neckline is straight', () => {
  close(cupLayout(e).dartDeg, 44.4, 0.1);
  // a flat triangle T, S, C with M on the line T–C gives no fold
  const T = [150, 130], S = [160, 0], C = [0, 0], M = [T[0] * 0.4, T[1] * 0.4];
  const flat = { side: dist(T, S), fold: dist(S, C), neckUpper: dist(T, M), neckLower: dist(M, C), stitch: dist(S, M) };
  close(cupLayout(flat).dartDeg, 0, 1e-6);
});

test('impossible triangles are reported', () => {
  assert.deepEqual(cupLayout({ ...e, stitch: 300 }).problems, ['lower', 'upper']);
});

test('row counts agree with the triangle areas', () => {
  const cup = buildCup({ e, pitch });
  close(cup.rings / cup.ringsByArea, 1, 0.04);
  for (const t of cup.triangles) {
    assert.ok(t.rows.every((r, i) => i === 0 || r.rings <= t.rows[i - 1].rings), `${t.key} decreases`);
    close(t.rows[0].rings, e.stitch / pitch.along, 1.5);
  }
  assert.equal(cup.stitch.rings, Math.round(e.stitch / pitch.along));
});

test('rowHint wording', () => {
  assert.equal(rowHint({ index: 1, rings: 19 }, ['side edge', 'neckline']), 'start along the stitch: 19 rings');
  assert.equal(rowHint({ index: 2, rings: 18, dropS: 1, dropM: 0 }, ['side edge', 'neckline']), '−1 at the side edge');
  assert.equal(rowHint({ index: 3, rings: 18, dropS: 0, dropM: 0 }, ['side edge', 'neckline']), 'same');
});

test('calibration overrides the default pitch', () => {
  const p = resolvePitch(WEAVES.e41, { id: 6.35 }, { enabled: true, alongCount: 11, alongLength: 80, acrossCount: 11, acrossLength: 50 });
  assert.deepEqual([p.along, p.across, p.source], [8, 5, 'swatch calibration']);
});

test('ring stats: 16 AWG 1/4" aluminium', () => {
  const s = ringStats({ wd: 1.291, id: 6.35, density: 2.7 });
  close(s.ar, 4.92, 0.01);
  close(s.mass, 0.085, 0.002);
});

test('default project is consistent and orders two ring sizes', () => {
  const r = computeBra(structuredClone(DEFAULT_PROJECT));
  assert.deepEqual(r.warnings, []);
  assert.equal(r.order.length, 2);
  assert.equal(r.pieces[0].rings, 2 * r.cups.left.cup.rings);
});

test('"same as panels" merges ring sets; E6-1 below AR 4.25 is flagged', () => {
  const p = structuredClone(DEFAULT_PROJECT);
  p.rings.support.same = true;
  p.rings.main.id = 5.0; // AR 3.9: fine for E4-1 per M.A.I.L., below the E6-1 minimum
  const r = computeBra(p);
  assert.equal(r.order.length, 1);
  assert.ok(r.warnings.some(w => w.includes('6-in-1')));
});

test('left and right cups measured separately', () => {
  const p = structuredClone(DEFAULT_PROJECT);
  p.client.separateSides = true;
  p.client.right = { side: 140, fold: 170, neckUpper: 130, neckLower: 95, stitch: 160 };
  const r = computeBra(p);
  assert.ok(r.cups.right.cup.rings > r.cups.left.cup.rings);
  assert.equal(r.pieces[0].rings, r.cups.left.cup.rings + r.cups.right.cup.rings);
  p.client.separateSides = false;
  const s = computeBra(p);
  assert.equal(s.cups.right.cup.rings, s.cups.left.cup.rings);
});

test('measured gap: a 6-in-1 bridge, odd ring count, shorter side bands', () => {
  const p = structuredClone(DEFAULT_PROJECT);
  p.client.gapFrom = 'measured';
  p.client.centreGap = 0;
  const touching = computeBra(p);
  assert.equal(touching.pieces.find(x => x.key === 'bridge').rings, 0);
  p.client.centreGap = 40;
  const gap = computeBra(p);
  assert.equal(gap.bridge.perRow % 2, 1, 'odd number of rings across');
  assert.equal(gap.bridge.rings, gap.bridge.perRow * p.construction.supportRows);
  assert.ok(gap.sides.length < touching.sides.length);
  assert.equal(gap.cups.left.cup.rings, touching.cups.left.cup.rings, 'cups unchanged');
});

test('gap from nipple to nipple: nipple distance minus each cup reaching C → M', () => {
  const p = structuredClone(DEFAULT_PROJECT);
  const r = computeBra(p);
  const reach = r.cups.left.cup.layout.M[0];
  close(r.bridge.wanted, p.client.apexToApex - 2 * reach, 1e-9);
  assert.equal(r.bridge.perRow % 2, 1);
  assert.ok(Math.abs(r.bridge.gap - r.bridge.wanted) <= r.supportPitch.along, 'odd rounding moves the gap by at most one ring');
  p.client.apexToApex = 100; // narrower than the cups → they touch, with a warning
  const t2 = computeBra(p);
  assert.equal(t2.bridge.rings, 0);
  assert.ok(t2.warnings.some(w => w.includes('Nipple to nipple')));
});

test('bridge styles: auto picks one ring for a tiny gap, odd vertical rows otherwise', () => {
  const p = structuredClone(DEFAULT_PROJECT);
  p.client.gapFrom = 'measured';
  p.client.centreGap = 3; // less than one vertical row
  assert.equal(computeBra(p).bridge.style, 'ring');
  assert.equal(computeBra(p).bridge.rings, 1);
  p.client.centreGap = 22; // about three vertical rows
  const r = computeBra(p);
  assert.equal(r.bridge.style, 'rows');
  assert.equal(r.bridge.vertical, 3);
  assert.equal(r.bridge.rings, 3 * p.construction.supportRows);
  p.construction.bridgeStyle = 'ring'; // forced
  assert.equal(computeBra(p).bridge.rings, 1);
});
