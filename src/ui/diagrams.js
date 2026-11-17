// SVG drawing: the measurement guide and the flat pattern of both cups.
const NS = 'http://www.w3.org/2000/svg';
const f = n => +n.toFixed(2);

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

// ---------------------------------------------------------------------------
// Measurement guide: front view. The dots T, S, C, M are shown on both
// breasts; the cup lengths are numbered on the client's left breast (viewer's
// right). Torso outline is mirrored around x = 200.
const P = { T: [291, 150], S: [293, 222], C: [211, 228], M: [252, 188], nipple: [252, 174], shoulder: [262, 66] };
const mirror = ([x, y]) => [400 - x, y];
const pt = p => `${p[0]} ${p[1]}`;

const GUIDE = [
  { key: 'underbust', n: 1, d: 'M104 244 Q200 256 296 244', label: [86, 250] },
  { key: 'highBust',  n: 2, d: 'M98 138 Q200 128 302 138', label: [80, 142] },
  { key: 'fullBust',  n: 3, d: 'M100 188 Q200 176 300 188', label: [82, 192] },
  { key: 'sideEdge',  n: 4, d: `M${pt(P.T)} Q300 186 ${pt(P.S)}`, label: [306, 190] },
  { key: 'fold',      n: 5, d: `M${pt(P.S)} Q260 238 ${pt(P.C)}`, label: [252, 246] },
  { key: 'neckUpper', n: 6, d: `M${pt(P.T)} Q272 166 ${pt(P.M)}`, label: [280, 160] },
  { key: 'neckLower', n: 7, d: `M${pt(P.M)} Q228 212 ${pt(P.C)}`, label: [226, 204] },
  { key: 'stitch',    n: 8, d: `M${pt(P.S)} Q274 200 ${pt(P.M)}`, label: [272, 216] },
  { key: 'apexToApex', n: 9, d: `M${pt(mirror(P.nipple))} L${pt(P.nipple)}`, label: [200, 169] },
  { key: 'centreGap', n: 10, d: 'M189 238 L211 238 M189 233 L189 243 M211 233 L211 243', label: [200, 254] },
  { key: 'strap',     n: 11, d: `M${pt(P.T)} C284 116 268 92 ${pt(P.shoulder)}`, label: [284, 108] },
];

export function drawGuide(svg) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 400 300');
  // torso (half, mirrored): neck, shoulder slope, armhole, side, waist
  const half = 'M178 4 L177 44 C170 56 130 60 98 70 C84 76 80 96 84 118 C88 134 96 146 100 152 C104 200 110 240 112 272 C112 284 110 292 108 300';
  el('path', { class: 'body', d: half }, svg);
  el('path', { class: 'body', d: half, transform: 'translate(400 0) scale(-1 1)' }, svg);
  el('path', { class: 'body faint', d: 'M160 64 Q200 76 240 64' }, svg); // collarbones
  // breasts: lower curve + a soft upper line
  const breast = 'M110 170 C104 208 128 232 152 232 C176 232 192 214 190 186';
  el('path', { class: 'body', d: breast }, svg);
  el('path', { class: 'body', d: breast, transform: 'translate(400 0) scale(-1 1)' }, svg);
  el('path', { class: 'body faint', d: 'M118 150 Q150 138 184 156' }, svg);
  el('path', { class: 'body faint', d: 'M282 150 Q250 138 216 156' }, svg);
  for (const n of [P.nipple, mirror(P.nipple)]) el('circle', { class: 'nip', cx: n[0], cy: n[1], r: 2.4 }, svg);

  // the design itself, faint: 6-in-1 along strap + neckline, stitch, triangles
  for (const m of [p => p, mirror]) {
    const [T, S, C, M, Sh] = [m(P.T), m(P.S), m(P.C), m(P.M), m(P.shoulder)];
    el('path', { class: 'tri', d: `M${pt(T)} L${pt(S)} L${pt(M)} Z M${pt(S)} L${pt(C)} L${pt(M)} Z` }, svg);
    el('path', { class: 'e61', d: `M${pt(Sh)} C${m([268, 92]).join(' ')} ${m([284, 116]).join(' ')} ${pt(T)} L${pt(M)} L${pt(C)}` }, svg);
  }
  el('path', { class: 'e61', d: `M${pt(mirror(P.C))} L${pt(P.C)}` }, svg); // bridge

  for (const g of GUIDE) {
    el('path', { class: 'm', d: g.d, 'data-guide': g.key }, svg);
    el('path', { class: 'hit', d: g.d, 'data-guide': g.key }, svg); // wider, invisible click target
    const t = el('text', { x: g.label[0], y: g.label[1], 'data-guide': g.key }, svg);
    t.textContent = g.n;
  }
  // the four dots on both breasts
  for (const [id, p] of Object.entries({ T: P.T, S: P.S, M: P.M, C: P.C })) {
    for (const q of [p, mirror(p)]) {
      el('circle', { class: 'dot', cx: q[0], cy: q[1], r: 4.5 }, svg);
      const t = el('text', { class: 'dotlab', x: q[0], y: q[1] + 2.6, 'text-anchor': 'middle' }, svg);
      t.textContent = id;
    }
  }
  const cap = (text, x, y) => { const c = el('text', { x, y, 'text-anchor': 'middle', class: 'cap' }, svg); c.textContent = text; };
  cap("client's right", 140, 290);
  cap("client's left", 260, 290);
}

export function guideNumber(key) {
  return GUIDE.find(g => g.key === key)?.n;
}

export function highlightGuide(svg, key) {
  svg.querySelectorAll('[data-guide]').forEach(e => e.classList.toggle('on', e.dataset.guide === key));
}

// ---------------------------------------------------------------------------
// Flat pattern of both cups in mm, seen from the front: every row of both
// triangles, the stitch connectors, the 6-in-1 along the neckline (with the
// start of the strap at T) and the optional edging. The two C corners sit
// either side of x = 0, joined by the 6-in-1 bridge when there is a gap;
// the client's left cup is on the viewer's right.
export function drawPattern(svg, r, construction) {
  svg.innerHTML = '';
  const { mainPitch: p, supportPitch: sp } = r;
  const half = (r.bridge?.gap || 0) / 2;
  const X = { left: x => half + x, right: x => -half - x };
  const Y = y => -y;
  const lay = r.cups.left.cup.layout, layR = r.cups.right.cup.layout;
  const xs = [lay.S, lay.T, lay.M].map(q => X.left(q[0])).concat([layR.S, layR.T, layR.M].map(q => X.right(q[0])));
  const ys = [lay.T, layR.T].map(q => q[1]);
  const strapStub = construction.straps ? 30 : 0;
  const pad = 14;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const top = Math.max(...ys) + strapStub + pad;
  svg.setAttribute('viewBox', [minX, -top, maxX - minX, top + pad + 18].map(f).join(' '));

  const ringR = p.along * 0.44, sw = Math.max(0.3, r.sets.main.spec.wd * 0.6);
  const e6r = sp.along * 0.44, e6w = Math.max(0.3, r.sets.support.spec.wd * 0.6);
  const ring = (q, cls, g, rad = ringR, w = sw) => el('circle', { class: 'r ' + cls, cx: f(q[0]), cy: f(Y(q[1])), r: f(rad), 'stroke-width': f(w) }, g);
  const along = (a, b, n, fn) => { for (let i = 0; i < n; i++) fn([a[0] + (b[0] - a[0]) * (i + 0.5) / n, a[1] + (b[1] - a[1]) * (i + 0.5) / n]); };
  const lineRings = (a, b, pitch, fn) => along(a, b, Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / pitch)), fn);

  for (const side of ['right', 'left']) {
    const { cup } = r.cups[side];
    const L = cup.layout;
    const g2 = q => [X[side](q[0]), q[1]];
    const [T, S, C, M] = [L.T, L.S, L.C, L.M].map(g2);
    el('path', { class: 'edge', d: `M${[T, S, M].map(q => `${f(q[0])} ${f(Y(q[1]))}`).join(' L')}Z M${[S, C, M].map(q => `${f(q[0])} ${f(Y(q[1]))}`).join(' L')}Z` }, svg);

    for (const tri of cup.triangles) {
      for (const row of tri.rows) {
        const g = el('g', { 'data-row': `${side}-${tri.key}-${row.index}` }, svg);
        along(g2(row.a), g2(row.b), row.rings, q => ring(q, tri.key === 'upper' ? 'pa' : 'pb', g));
      }
    }
    lineRings(S, M, p.along, q => ring(q, 'seam', svg, ringR * 0.7, sw * 0.9));
    // 6-in-1: neckline T → M → C, plus the strap start above T
    for (const [a, b] of [[T, M], [M, C]]) lineRings(a, b, sp.along, q => ring(q, 'e6', svg, e6r, e6w));
    if (construction.straps) {
      // strap heads up towards the shoulder
      lineRings(T, [T[0], T[1] + strapStub], sp.along, q => ring(q, 'e6', svg, e6r, e6w));
    }
    if (construction.frame) for (const [a, b] of [[T, S], [S, C]]) lineRings(a, b, sp.along, q => ring(q, 'e6', svg, e6r, e6w));
  }

  // bridge between the two C corners
  const br = r.bridge;
  if (br?.style === 'ring') ring([0, e6r * 0.6], 'e6', svg, Math.max(e6r * 1.4, half), e6w);
  if (br?.style === 'rows') for (let c = 0; c < br.vertical; c++) for (let k = 0; k < br.rows; k++) {
    ring([-half + (c + 0.5) * (2 * half / br.vertical), (k + 0.5) * sp.across * 1.6], 'e6', svg, e6r, e6w);
  }

  const fs = f(Math.max(5, (maxX - minX) / 60));
  const lab = (text, x, y, anchor = 'middle') => { const t = el('text', { x: f(x), y: f(y), 'text-anchor': anchor, 'font-size': fs }, svg); t.textContent = text; };
  lab("client's right", X.right(lay.S[0] / 2), pad + 6);
  lab("client's left", X.left(lay.S[0] / 2), pad + 6);
  lab(half > 0 ? 'bridge' : 'C', 0, pad + 6);
}

/** Highlight one row by id 'left-upper-3'; side 'both' matches either cup. */
export function highlightRow(svg, id) {
  const [side, tri, index] = String(id ?? '').split('-');
  svg.querySelectorAll('g[data-row]').forEach(g => {
    const [s, t, i] = g.dataset.row.split('-');
    const on = t === tri && i === index && (side === 'both' || side === s);
    g.querySelectorAll('circle').forEach(c => c.classList.toggle('hl', on));
  });
}
