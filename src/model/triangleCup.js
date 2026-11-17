// Two-triangle cup, as in the reference bra:
//
//              T  cup top at the side (6-in-1 strap starts here)
//             /|
//   neckline / |  side edge
//   (6-in-1)/  |
//          M ▲ |      upper triangle  T-S-M
//          |  ╲|
//   6-in-1 |   S      ← stitch S–M (4-in-1 connectors)
//          |  /       lower triangle  S-C-M
//          C /
//          (centre V at the fold, both cups meet here)
//
// The client marks four points on the body — T, S, C and M (where the stitch
// meets the neckline) — and measures the five lengths between them over the
// skin: T–S, S–C, T–M, M–C and the stitch S–M. Each triangle is then fixed by
// its three edge lengths. Laid flat, the two angles at M add up to less than
// 180°; that missing angle is the "dart": when the stitch joins the triangles
// the cup folds along S–M, and the fold gives the cup its depth.
//
// Both triangles are woven in rows parallel to the stitch, starting at the
// stitch and decreasing towards the far corner (T resp. C).

const DEG = 180 / Math.PI;

/** Angle at vertex between sides b and c, opposite side a (law of cosines). */
function angle(a, b, c) {
  const cos = (b * b + c * c - a * a) / (2 * b * c);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

const validTriangle = (a, b, c) => a > 0 && b > 0 && c > 0 && a < b + c && b < a + c && c < a + b;

/**
 * Flat layout of one cup in local coordinates (mm): C at the origin, S on
 * the +x axis (outwards), y up. Returns the four points and the dart.
 * @param e {{side, fold, neckUpper, neckLower, stitch}} T–S, S–C, T–M, M–C, S–M
 */
export function cupLayout(e) {
  const problems = [];
  if (!validTriangle(e.fold, e.neckLower, e.stitch)) problems.push('lower');
  if (!validTriangle(e.side, e.neckUpper, e.stitch)) problems.push('upper');
  const C = [0, 0], S = [e.fold, 0];
  // M: |CM| = neckLower, |SM| = stitch, above the fold line
  const mx = (e.neckLower ** 2 - e.stitch ** 2 + e.fold ** 2) / (2 * e.fold);
  const M = [mx, Math.sqrt(Math.max(0, e.neckLower ** 2 - mx ** 2))];
  // T: |ST| = side, |MT| = neckUpper, on the far side of S–M from C
  const ux = (M[0] - S[0]) / e.stitch, uy = (M[1] - S[1]) / e.stitch; // S→M unit
  const along = (e.side ** 2 - e.neckUpper ** 2 + e.stitch ** 2) / (2 * e.stitch);
  const off = Math.sqrt(Math.max(0, e.side ** 2 - along ** 2));
  // normal pointing away from C: C lies on the left of S→M, so take the right-hand normal
  const T = [S[0] + ux * along + uy * off, S[1] + uy * along - ux * off];
  const angM = angle(e.side, e.neckUpper, e.stitch) + angle(e.fold, e.neckLower, e.stitch);
  return { C, S, M, T, dart: Math.PI - angM, dartDeg: 180 - angM * DEG, problems };
}

/**
 * Rows of one triangle, parallel to the stitch S–M, from the stitch towards
 * the apex. Each row reports its ring count and where rings are dropped.
 */
function triangleRows(S, M, apex, pitch) {
  const base = Math.hypot(M[0] - S[0], M[1] - S[1]);
  const ux = (M[0] - S[0]) / base, uy = (M[1] - S[1]) / base;
  // perpendicular distance of the apex from the stitch line
  const h = Math.abs((apex[0] - S[0]) * uy - (apex[1] - S[1]) * ux);
  const rows = [];
  let prev = null;
  for (let k = 0; ; k++) {
    const d = (k + 0.5) * pitch.across;
    if (d >= h) break;
    const t = d / h;
    const a = [S[0] + (apex[0] - S[0]) * t, S[1] + (apex[1] - S[1]) * t]; // on the S–apex edge
    const b = [M[0] + (apex[0] - M[0]) * t, M[1] + (apex[1] - M[1]) * t]; // on the M–apex edge
    const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rings = Math.round(width / pitch.along);
    if (rings < 1) break;
    // ring slot of each end, measured along the stitch direction
    const startSlot = Math.round(((a[0] - S[0]) * ux + (a[1] - S[1]) * uy) / pitch.along);
    const row = { index: k + 1, d, a, b, width, rings, startSlot, dropS: 0, dropM: 0 };
    if (prev) {
      row.dropS = Math.max(0, startSlot - prev.startSlot);
      row.dropM = Math.max(0, prev.rings - rings - row.dropS);
    }
    rows.push(row);
    prev = row;
  }
  const area = base * h / 2;
  return { rows, height: h, base, area, rings: rows.reduce((n, r) => n + r.rings, 0) };
}

/**
 * @param {object} p
 * @param p.e      edge lengths (mm), see cupLayout
 * @param p.pitch  {along, across} E4-1 pitch of the panel rings
 * @param p.stitchRows  rows of connector rings along the stitch
 */
export function buildCup({ e, pitch, stitchRows = 1 }) {
  const L = cupLayout(e);
  const upper = triangleRows(L.S, L.M, L.T, pitch);
  const lower = triangleRows(L.S, L.M, L.C, pitch);
  const stitchRings = Math.max(1, Math.round(e.stitch / pitch.along)) * stitchRows;
  const area = upper.area + lower.area;
  return {
    layout: L,
    triangles: [
      { key: 'upper', name: 'Upper triangle', edges: ['side edge', 'neckline'], ...upper },
      { key: 'lower', name: 'Lower triangle', edges: ['bottom edge', 'neckline'], ...lower },
    ],
    rings: upper.rings + lower.rings,
    ringsByArea: area / (pitch.along * pitch.across),
    area,
    stitch: { length: e.stitch, rings: stitchRings },
    neckline: e.neckUpper + e.neckLower,
    free: e.side + e.fold, // edges without 6-in-1
  };
}

/** Plain-language instruction for one row. `edges` names the S-side and M-side edge. */
export function rowHint(row, edges) {
  if (row.index === 1) return `start along the stitch: ${row.rings} rings`;
  const parts = [];
  if (row.dropS) parts.push(`−${row.dropS} at the ${edges[0]}`);
  if (row.dropM) parts.push(`−${row.dropM} at the ${edges[1]}`);
  return parts.length ? parts.join(', ') : 'same';
}
