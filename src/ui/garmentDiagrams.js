// Measurement guides for the shirt and trousers, and the flat pattern of the
// pieces. Guides use the same classes as the bra guide (.body, .m, data-guide)
// so highlighting works the same way.
const NS = 'http://www.w3.org/2000/svg';
const f = n => +n.toFixed(1);

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
const mirrored = (svg, d, cls = 'body') => {
  el('path', { class: cls, d }, svg);
  el('path', { class: cls, d, transform: 'translate(400 0) scale(-1 1)' }, svg);
};
function lines(svg, guide) {
  for (const g of guide) {
    el('path', { class: 'm', d: g.d, 'data-guide': g.key }, svg);
    el('path', { class: 'hit', d: g.d, 'data-guide': g.key }, svg); // wider, invisible click target
    const t = el('text', { x: g.label[0], y: g.label[1], 'data-guide': g.key, 'text-anchor': 'middle' }, svg);
    t.textContent = g.n;
  }
}

// ------------------------------------------------------------------ shirt ----
const SHIRT_GUIDE = [
  { key: 'chest', d: 'M153 118 Q200 129 247 118', label: [200, 113] },
  { key: 'hem', d: 'M150 238 Q200 249 250 238', label: [200, 233] },
  { key: 'length', d: 'M226 42 L226 238', label: [233, 180] },
  { key: 'armhole', d: 'M150 46 L150 100', label: [142, 76] },
  { key: 'sleeve', d: 'M273 42 C291 56 298 90 303 126 L330 204', label: [338, 160] },
  { key: 'shoulderToElbow', d: 'M267 47 C283 58 289 90 293 127', label: [298, 82] },
  { key: 'upperArm', d: 'M282 95 L252 111', label: [244, 118] },
  { key: 'elbow', d: 'M286 131 L268 151', label: [262, 158] },
  { key: 'wrist', d: 'M310 205 L296 211', label: [292, 222] },
  { key: 'neck', d: 'M187 35 Q200 44 213 35', label: [200, 56] },
];

export function drawShirtGuide(svg, numberOf) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 400 300');
  // neck, shoulder, outer arm, hand, inner arm, side of the body
  mirrored(svg, 'M213 4 L214 34 C222 44 246 46 262 52 C276 62 282 90 286 130 L312 210 Q314 230 302 232 Q292 230 297 215 L268 150 C262 140 255 120 247 100 C243 140 238 160 240 178 C242 205 250 222 250 240 L249 296');
  el('path', { class: 'body faint', d: 'M176 70 Q200 80 224 70' }, svg);
  el('path', { class: 'body faint', d: 'M200 120 L200 236', 'stroke-dasharray': '2 4' }, svg);
  lines(svg, SHIRT_GUIDE.map(g => ({ ...g, n: numberOf(g.key) })));
}

// --------------------------------------------------------------- trousers ----
const TROUSER_GUIDE = [
  { key: 'waist', d: 'M160 30 Q200 39 240 30', label: [200, 25] },
  { key: 'seat', d: 'M138 95 Q200 109 262 95', label: [200, 90] },
  { key: 'thigh', d: 'M206 168 Q234 177 262 166', label: [234, 162] },
  { key: 'knee', d: 'M223 222 Q238 228 253 220', label: [238, 214] },
  { key: 'ankle', d: 'M216 294 Q227 299 238 294', label: [227, 288] },
  { key: 'outseam', d: 'M252 30 C276 92 278 150 268 216 L252 300', label: [282, 170] },
  { key: 'inseam', d: 'M207 158 C213 182 220 202 225 224 L220 300', label: [213, 262] },
  { key: 'crotchToKnee', d: 'M193 158 C187 182 180 202 175 224', label: [178, 196] },
  { key: 'waistToSeat', d: 'M147 30 C138 60 135 80 134 95', label: [128, 64] },
];

export function drawTrousersGuide(svg, numberOf) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 400 310');
  // waist, hip, outer leg, foot, inner leg up to the crotch
  mirrored(svg, 'M238 6 L240 30 C252 54 262 74 262 95 C266 140 258 190 252 216 L238 296 Q244 306 230 306 L214 306 Q212 300 216 296 L222 220 C218 200 210 180 203 150 Q200 146 200 146');
  el('path', { class: 'body faint', d: 'M200 40 L200 140', 'stroke-dasharray': '2 4' }, svg);
  lines(svg, TROUSER_GUIDE.map(g => ({ ...g, n: numberOf(g.key) })));
}

// ---------------------------------------------------------------- pattern ----
// Pieces laid flat, in mm. A tube laid flat is half its girth wide; its
// outline follows every measured point (elbow, knee…). Inside: a ring texture
// at true scale (rings drawn in rows the way the rounds run), dashed lines at
// the measured points with their ring counts, and a dot on the edge at every
// round where rings are added (teal) or removed (orange).

const piece = (r, key) => r.pieces.find(p => p.key === key);

/**
 * Geometry of one tube: `origin` is where round 1 starts, `dir` the unit
 * direction along the tube, `side` the unit direction across it. With
 * align 'center' the tube is centred on the axis, with 'edge' it grows to `side`.
 */
function tubeGeom(tube, origin, dir, side, align = 'center') {
  const st = tube.stations, a0 = st[0].at;
  const w = g => g / 2; // flat width of a tube
  const P = (u, v) => [origin[0] + dir[0] * u + side[0] * v, origin[1] + dir[1] * u + side[1] * v];
  const lo = s => (align === 'center' ? -w(s.girth) / 2 : 0);
  const hi = s => (align === 'center' ? w(s.girth) / 2 : w(s.girth));
  const outline = [...st.map(s => P(s.at - a0, lo(s))), ...[...st].reverse().map(s => P(s.at - a0, hi(s)))];
  const widthAt = u => {
    for (let i = 1; i < st.length; i++) if (u <= st[i].at - a0 || i === st.length - 1) {
      const t = (u - (st[i - 1].at - a0)) / ((st[i].at - st[i - 1].at) || 1);
      return w(st[i - 1].girth + (st[i].girth - st[i - 1].girth) * Math.max(0, Math.min(1, t)));
    }
    return w(st[0].girth);
  };
  const across = u => (align === 'center' ? [-widthAt(u) / 2, widthAt(u) / 2] : [0, widthAt(u)]);
  return { tube, P, outline, across, a0, dir, side };
}

function shirtLayout(r, m) {
  const tubes = [], flats = [];
  const body = piece(r, 'body'), yoke = piece(r, 'yoke');
  const chestW = body.tube.stations.at(-1).girth / 2;
  const yokeH = yoke.size.height, bodyH = body.tube.length;
  // y grows downwards, shoulders at y = 0; round 1 of the body is at the hem
  flats.push({ key: 'yoke', name: 'yoke', pts: [[-chestW / 2, 0], [chestW / 2, 0], [chestW / 2, yokeH], [-chestW / 2, yokeH]], label: [0, yokeH * 0.62] });
  tubes.push({ key: 'body', name: 'body', labelLeft: true, g: tubeGeom(body.tube, [0, yokeH + bodyH], [0, -1], [1, 0]) });
  const neckW = m.neck / Math.PI;
  flats.push({ key: 'neck', hole: true, pts: [[-neckW / 2, 0], [neckW / 2, 0], [neckW / 3, neckW * 0.35], [-neckW / 3, neckW * 0.35]] });
  const sleeve = piece(r, 'sleeve');
  if (sleeve) for (const s of [1, -1]) {
    tubes.push({ key: 'sleeve', name: 'sleeve', mirror: s < 0, g: tubeGeom(sleeve.tube, [s * chestW / 2, 0], [s, 0], [0, 1], 'edge') });
    const eg = piece(r, 'elbow');
    if (eg) {
      const ex = s * (chestW / 2 + m.shoulderToElbow), h = eg.size.width / 2, y = sleeve.tube.stations[1].girth / 2;
      flats.push({ key: 'elbow', gusset: true, pts: [[ex - h, y], [ex, y - h], [ex + h, y], [ex, y + h]] });
    }
  }
  const sg = piece(r, 'shoulder');
  if (sg) for (const s of [1, -1]) {
    const x = s * (chestW / 2 - sg.size.width * 0.7);
    flats.push({ key: 'shoulder', gusset: true, pts: [[x - sg.size.width / 2, 0], [x + sg.size.width / 2, 0], [x, sg.size.height * 0.6]] });
  }
  const collar = piece(r, 'collar');
  if (collar) tubes.push({ key: 'collar', name: 'collar', g: tubeGeom(collar.tube, [0, 0], [0, -1], [1, 0]) });
  return { tubes, flats };
}

function trouserLayout(r) {
  const tubes = [], flats = [];
  const seat = piece(r, 'seat'), leg = piece(r, 'leg');
  let top = 0;
  if (seat) {
    tubes.push({ key: 'seat', name: 'seat', labelLeft: true, g: tubeGeom(seat.tube, [0, 0], [0, 1], [1, 0]) });
    top = seat.tube.length;
  }
  const tW = leg.tube.stations[0].girth / 2;
  const gus = piece(r, 'gusset');
  const gap = gus ? gus.size.width : 20;
  for (const s of [-1, 1]) tubes.push({ key: 'leg', name: 'leg', mirror: s < 0, g: tubeGeom(leg.tube, [s * (gap / 2 + tW / 2), top], [0, 1], [1, 0]) });
  if (gus) {
    const h = gus.size.width / 2;
    flats.push({ key: 'gusset', gusset: true, pts: [[-h, top], [0, top - h], [h, top], [0, top + h]] });
  }
  return { tubes, flats };
}

/** Ring texture: rows of tilted rings, alternating lean, at the real pitch. */
function ringTexture(defs, id, pAround, pLength, wd, vertical, k = 1) {
  pAround *= k; pLength *= k; wd *= k;
  const w = vertical ? 2 * pLength : pAround, h = vertical ? pAround : 2 * pLength;
  const pat = el('pattern', { id, patternUnits: 'userSpaceOnUse', width: f(w), height: f(h) }, defs);
  const rx = pAround * 0.52, ry = pLength * 0.95, sw = Math.max(0.35, wd * 0.55);
  const ring = (cx, cy, rot) => el('ellipse', { class: 'tex', cx: f(cx), cy: f(cy), rx: f(vertical ? ry : rx), ry: f(vertical ? rx : ry), transform: `rotate(${rot} ${f(cx)} ${f(cy)})`, 'stroke-width': f(sw) }, pat);
  if (vertical) {
    for (const dy of [-pAround, 0, pAround]) { ring(pLength / 2, pAround / 2 + dy, 25); ring(1.5 * pLength, dy, -25); ring(1.5 * pLength, pAround + dy, -25); }
  } else {
    for (const dx of [-pAround, 0, pAround]) { ring(pAround / 2 + dx, pLength / 2, 25); ring(dx, 1.5 * pLength, -25); ring(pAround + dx, 1.5 * pLength, -25); }
  }
  return `url(#${id})`;
}

const LABEL_PX = 12.5;

export function drawGarmentPattern(svg, kind, r, m, pitch, wd = 1.3) {
  svg.innerHTML = '';
  const { tubes, flats } = kind === 'shirt' ? shirtLayout(r, m) : trouserLayout(r);
  const pts = [...tubes.flatMap(t => t.g.outline), ...flats.flatMap(fl => fl.pts)];
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const pad = 70;
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  svg.setAttribute('viewBox', [x0, y0, x1 - x0, y1 - y0].map(f).join(' '));
  // Text size in drawing units so that it shows at about LABEL_PX on screen,
  // whatever the window size: units per pixel = drawing width / shown width.
  const shown = Math.min(svg.getBoundingClientRect().width || 600, ((x1 - x0) / (y1 - y0)) * (window.innerHeight * 0.8));
  const fs = f(Math.max(LABEL_PX * (x1 - x0) / Math.max(200, shown), (x1 - x0) / 110));
  // at true scale a ring is a pixel or two; enlarge the texture so it reads
  const k = Math.max(1, Math.round((x1 - x0) / 110 / pitch.along));
  const defs = el('defs', {}, svg);
  const poly = (p, attrs, parent) => {
    const a = { d: 'M' + p.map(q => `${f(q[0])} ${f(q[1])}`).join(' L') + 'Z', ...attrs };
    // inline style, so the ring texture wins over the generic .piece fill in the CSS
    if (a.fill != null) a.style = `fill: ${a.fill}`;
    delete a.fill;
    return el('path', a, parent);
  };
  const text = (s, x, y, attrs = {}, parent = svg) => { const t = el('text', { x: f(x), y: f(y), 'font-size': fs, ...attrs }, parent); t.textContent = s; return t; };

  // flat pieces get a texture with rows running across
  const flatTex = ringTexture(defs, 'tex-flat', pitch.along, pitch.across, wd, false, k);
  for (const fl of flats) {
    poly(fl.pts, { class: fl.hole ? 'piece hole' : fl.gusset ? 'piece gusset' : 'piece flat', fill: fl.hole ? null : flatTex }, svg);
    if (fl.label) text(fl.name, fl.label[0], fl.label[1], { 'text-anchor': 'middle', class: 'name' });
  }

  const labels = [], topLabels = [];
  tubes.forEach((t, ti) => {
    const { g } = t, rows = g.tube.rows;
    const g2 = el('g', { 'data-piece': t.key }, svg);
    // the rounds run across the tube, so the ring rows run across too
    const pLength = rows.length > 1 ? rows[1].at - rows[0].at : pitch.across;
    const pAround = rows.length ? g.tube.stations[0].girth / rows[0].rings : pitch.along;
    const vertical = Math.abs(g.dir[0]) > 0.5; // tube runs sideways → rounds are vertical lines
    poly(g.outline, { class: 'piece', fill: ringTexture(defs, `tex-${ti}`, pAround, pLength, wd, vertical, k) }, g2);

    // measured points: dashed line across, name and ring count outside the edge
    const nearest = at => rows.reduce((b, x) => (Math.abs(x.at - at) < Math.abs(b.at - at) ? x : b), rows[0]);
    for (const s of g.tube.stations) {
      const u = s.at - g.a0, [lo, hi] = g.across(u);
      const a = g.P(u, lo), b = g.P(u, hi);
      el('line', { class: 'station', x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) }, g2);
      if (!rows.length || t.mirror || t.key === 'collar') continue; // the collar gets one label above it
      const label = `${s.name} · ${nearest(s.at).rings}`;
      if (vertical) {
        // sleeves: above the straight top edge, where nothing else is drawn
        topLabels.push({ anchor: a, y: a[1] - fs * 0.5, text: label, group: g2 });
      } else {
        labels.push({ side: t.labelLeft ? 'left' : 'right', anchor: t.labelLeft ? a : b, text: label, group: g2 });
      }
    }
    // where rings are added or removed: dots on the outer edge
    for (const row of rows) {
      if (!row.delta) continue;
      const u = row.at - g.a0, [, hi] = g.across(u);
      const p = g.P(u, hi);
      el('circle', { class: row.delta > 0 ? 'chg exp' : 'chg con', cx: f(p[0]), cy: f(p[1]), r: f(fs * 0.22) }, g2);
    }
    // the collar is too small for text inside: one label above it
    if (t.key === 'collar' && rows.length) {
      const top = g.P(g.tube.length, 0);
      topLabels.push({ anchor: top, y: top[1] - fs * 0.5, text: `collar · ${rows[0].rings} rings · ${rows.length} rounds`, group: g2 });
      return;
    }
    // name + number of rounds in the middle of the piece
    if (!t.mirror && rows.length) {
      const mid = g.tube.length / 2, [lo, hi] = g.across(mid), c = g.P(mid, (lo + hi) / 2);
      text(t.name, c[0], c[1] - fs * 0.2, { 'text-anchor': 'middle', class: 'name' }, g2);
      text(`${rows.length} rounds`, c[0], c[1] + fs, { 'text-anchor': 'middle', class: 'sub' }, g2);
    }
  });

  placeTopLabels(topLabels, fs, text);
  placeSideLabels(svg, labels, [...tubes.map(t => t.g.outline), ...flats.filter(fl => !fl.hole).map(fl => fl.pts)], fs, text);

  // frame the drawing around everything actually drawn, labels included
  try {
    const bb = svg.getBBox();
    if (bb.width > 0) { const p = fs; svg.setAttribute('viewBox', [bb.x - p, bb.y - p, bb.width + 2 * p, bb.height + 2 * p].map(f).join(' ')); }
  } catch { /* not rendered (hidden) — keep the computed frame */ }
  return { textureScale: k };
}

/**
 * Labels above the top edge (sleeves, collar): centred over their point. Each
 * label is measured as drawn and moved up a step while it overlaps a label
 * placed before it; a leader line then joins it to its point.
 */
function placeTopLabels(labels, fs, text) {
  const placed = [];
  const hit = (p, q) => p.x < q.x + q.width + fs * 0.3 && q.x < p.x + p.width + fs * 0.3 && p.y < q.y + q.height && q.y < p.y + p.height;
  for (const l of [...labels].sort((p, q) => p.anchor[0] - q.anchor[0])) {
    const node = text(l.text, l.anchor[0], l.y, { 'text-anchor': 'middle', class: 'count' }, l.group);
    let y = l.y, box;
    for (let step = 0; step < 12; step++) {
      try { box = node.getBBox(); } catch { box = null; }
      if (!box || box.width === 0 || !placed.some(p => hit(box, p))) break;
      y -= fs * 1.25;
      node.setAttribute('y', f(y));
    }
    if (box) placed.push(box);
    if (l.y - y > fs * 0.5) el('line', { class: 'leader', x1: f(l.anchor[0]), y1: f(l.anchor[1]), x2: f(l.anchor[0]), y2: f(y + fs * 0.25) }, l.group);
  }
}

/** Horizontal extent of all shapes within a band around height y. */
function extentAt(polys, y, band) {
  let lo = Infinity, hi = -Infinity;
  for (const p of polys) for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const ylo = Math.min(a[1], b[1]), yhi = Math.max(a[1], b[1]);
    if (yhi < y - band || ylo > y + band) continue;
    if (yhi - ylo < 1e-9) { lo = Math.min(lo, a[0], b[0]); hi = Math.max(hi, a[0], b[0]); continue; }
    for (const yy of [Math.max(ylo, y - band), Math.min(yhi, y + band)]) {
      const x = a[0] + (b[0] - a[0]) * (yy - a[1]) / (b[1] - a[1]);
      lo = Math.min(lo, x); hi = Math.max(hi, x);
    }
  }
  return [lo, hi];
}

/**
 * Labels beside upright pieces: each goes just outside whatever is drawn at its
 * height, labels on one side push each other apart, and a thin leader line
 * joins a label to its point when it had to move away from it.
 */
function placeSideLabels(svg, labels, polys, fs, text) {
  const gap = fs * 1.35, band = fs * 0.75;
  for (const side of ['left', 'right']) {
    const list = labels.filter(l => l.side === side).sort((a, b) => a.anchor[1] - b.anchor[1]);
    let last = -Infinity;
    for (const l of list) {
      const y = Math.max(l.anchor[1], last + gap);
      last = y;
      const [lo, hi] = extentAt(polys, y, band);
      const x = side === 'right' ? Math.max(hi, l.anchor[0]) + fs * 0.7 : Math.min(lo, l.anchor[0]) - fs * 0.7;
      if (Math.hypot(x - l.anchor[0], y - l.anchor[1]) > fs * 1.2) {
        el('line', { class: 'leader', x1: f(l.anchor[0]), y1: f(l.anchor[1]), x2: f(x + (side === 'right' ? -fs * 0.2 : fs * 0.2)), y2: f(y) }, l.group);
      }
      text(l.text, x, y + fs * 0.35, { 'text-anchor': side === 'right' ? 'start' : 'end', class: 'count' }, l.group);
    }
  }
}
