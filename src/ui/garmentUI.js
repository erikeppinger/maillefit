// Shirt and trousers: form fields, measurement guide and results. Uses the
// panel ring set (4-in-1) and its calibration from the shared Rings section.
import { buildShirt, buildTrousers } from '../model/garments.js';
import { tubeSteps, stepText } from '../model/tube.js';
import { GARMENT_FIELDS } from './garmentDefs.js';
import { SECTION_HELP } from './help.js';
import { term } from './glossary.js';
import { drawShirtGuide, drawTrousersGuide, drawGarmentPattern } from './garmentDiagrams.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// The pattern labels are sized in screen pixels, so the drawing is laid out
// again whenever its width changes (window resized, panel reflowed).
let lastPattern = null, lastWidth = 0, resizeQueued = false;
function drawPatternNow() {
  if (!lastPattern) return;
  const svg = $('#gPattern');
  const { kind, r, m, pitch, wd } = lastPattern;
  const { textureScale } = drawGarmentPattern(svg, kind, r, m, pitch, wd);
  lastWidth = svg.getBoundingClientRect().width;
  $('#gTexLabel').textContent = textureScale > 1 ? `4-in-1 pattern, rings drawn ${textureScale}× larger than real` : '4-in-1 at true scale';
}
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      const w = $('#gPattern')?.getBoundingClientRect().width || 0;
      if (w > 0 && Math.abs(w - lastWidth) > 4) drawPatternNow();
    });
  }).observe(document.querySelector('#gPattern') ?? document.body);
}

export const isGarment = g => g === 'shirt' || g === 'trousers';
const numberOf = kind => key => GARMENT_FIELDS[kind].measurements.findIndex(m => m.key === key) + 1;

/** (Re)build the measurement and construction fields for the chosen garment. */
export function buildGarmentForm(kind) {
  const defs = GARMENT_FIELDS[kind];
  $('#gTitle').textContent = `1 · ${defs.title}: body measurements`;
  $('#gConsTitle').textContent = `4 · ${defs.title}: construction`;
  $('[data-help-box="garment"]').innerHTML = SECTION_HELP.garmentMeasure;
  $('[data-help-box="garmentConstruction"]').innerHTML = SECTION_HELP.garmentConstruction[kind];
  $('#gMeasureList').innerHTML = defs.measurements.map((m, i) =>
    `<label data-guide="${m.key}"><span>${i + 1}. ${m.label} <span class="unit" data-unit="body"></span></span>` +
    `<input data-path="${kind}.${m.key}" data-kind="body" inputmode="decimal"></label>`).join('');
  $('#gConstruction').innerHTML = defs.construction.map(c => {
    const path = `${kind}.${c.path}`;
    if (c.kind === 'bool') return `<label class="check wide"><input type="checkbox" data-path="${path}" data-kind="bool"> ${c.label}</label>`;
    if (c.kind === 'select') return `<label class="wide">${c.label}<select data-path="${path}" data-kind="text">${c.options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
    return `<label>${c.label} <span class="unit" data-unit="body"></span><input data-path="${path}" data-kind="body" inputmode="decimal"></label>`;
  }).join('');
  (kind === 'shirt' ? drawShirtGuide : drawTrousersGuide)($('#gGuide'), numberOf(kind));
  showGarmentGuide(kind, null);
}

export function showGarmentGuide(kind, key) {
  $$('#gGuide [data-guide]').forEach(e => e.classList.toggle('on', e.dataset.guide === key));
  $$('#gMeasureList label').forEach(l => l.classList.toggle('hl', l.dataset.guide === key));
  const m = GARMENT_FIELDS[kind].measurements.find(x => x.key === key);
  $('#gHow').innerHTML = m
    ? `<b>${numberOf(kind)(key)}. ${m.label}</b> — ${m.how}`
    : 'Click a measurement field (or a number in the drawing) to see where and how to measure it.';
}

/**
 * Render the garment results.
 * @param h helpers from app.js: { fmt, len, grams, card, cite, spare }
 * @param ring { spec, stats, material, verdict, pitch }
 */
export function renderGarment(kind, state, ring, h) {
  const m = state[kind];
  const r = kind === 'shirt' ? buildShirt(m, ring.pitch) : buildTrousers(m, ring.pitch);
  const net = r.rings;
  const order = Math.ceil(net * (1 + h.spare / 100));
  const mass = net * ring.stats.mass;

  $('#cards').innerHTML =
    h.card('Rings to order', order.toLocaleString(), `${net.toLocaleString()} + ${h.spare}% spare, one size`) +
    h.card('Finished weight', h.grams(mass), ring.material.name) +
    h.card(term('ar', 'Aspect ratio'), ring.stats.ar.toFixed(1), ring.verdict.text, ring.verdict.level) +
    h.card('Area of mail', h.area(r.area), `${r.pieces.length} kinds of pieces`);

  const warnings = [...r.notes];
  if (ring.verdict.level === 'bad') warnings.push(`These rings won’t work for 4-in-1: aspect ratio ${ring.stats.ar.toFixed(2)} is ${ring.verdict.text}. Choose thinner wire or a larger inner diameter.`);
  for (const p of r.pieces) {
    const dev = p.tube ? p.tube.rings / p.tube.ringsByArea - 1 : 0;
    if (Math.abs(dev) > 0.12) warnings.push(`${p.name}: the rings are large for a piece this size, so its ring count may be off by about ${Math.round(Math.abs(dev) * 100)}%. Smaller rings give a smoother fit.`);
  }
  $('#warnings').innerHTML = warnings.map(w => `<div class="warn-box">${w}</div>`).join('');

  lastPattern = { kind, r, m, pitch: ring.pitch, wd: ring.spec.wd };
  drawPatternNow();

  $('#gOrder').innerHTML =
    `<thead><tr><th>Rings</th><th>Size</th><th class="n">Need</th><th class="n">Order</th><th class="n">Weight</th></tr></thead><tbody>` +
    `<tr><td>Rings (4-in-1)<br><small class="muted">${ring.material.name}</small></td>` +
    `<td>${h.fmt('ring', ring.spec.wd)} × ${h.fmt('ring', ring.spec.id)} ID<br><small class="muted">AR ${ring.stats.ar.toFixed(2)} · ${h.len(order * ring.stats.wireLength)} wire</small></td>` +
    `<td class="n">${net.toLocaleString()}</td><td class="n"><b>${order.toLocaleString()}</b></td><td class="n">${h.grams(mass)}</td></tr></tbody>`;

  $('#gPieces').innerHTML =
    `<thead><tr><th>Piece</th><th class="n">×</th><th class="n">Rings each</th><th class="n">Total</th></tr></thead><tbody>` +
    r.pieces.map(p => `<tr><td>${p.name}${p.tube ? `<br><small class="muted">${p.tube.rows.length} rounds</small>` : ''}</td>` +
      `<td class="n">${p.count}</td><td class="n">${p.rings.toLocaleString()}</td><td class="n">${(p.rings * p.count).toLocaleString()}</td></tr>`).join('') +
    `<tr class="total"><td>Total</td><td></td><td></td><td class="n">${net.toLocaleString()}</td></tr></tbody>`;

  // first/last round counts, '–' when a piece is too short for a round
  const ends = tube => (tube.rows.length ? `${tube.rows[0].rings} → ${tube.rows.at(-1).rings}` : '–');
  const row = (k, v) => `<tr><td>${k}</td><td class="n">${v}</td></tr>`;
  const fit = [];
  if (kind === 'shirt') {
    const body = r.pieces.find(p => p.key === 'body');
    const top = body.tube.rows.at(-1)?.rings ?? 0;
    const front = Math.round(top * body.frontShare);
    fit.push(row(`Chest with ${term('ease')}`, h.fmt('body', m.chest + m.ease.body)));
    fit.push(row('Top round of the body: front / back', `${front} / ${top - front} rings${h.cite('mailShirt')}`));
    const sl = r.pieces.find(p => p.key === 'sleeve');
    if (sl) fit.push(row('Rings per round, sleeve: shoulder → cuff', `${ends(sl.tube)}`));
    fit.push(row(`${term('ease', 'Ease')}: body / sleeves`, `${h.fmt('body', m.ease.body)} / ${h.fmt('body', m.ease.arm)}${h.cite('chainMailGuy')}`));
  } else {
    const legs = r.pieces.find(p => p.key === 'leg');
    fit.push(row(`${term('seams', 'Rise')} (waist → crotch)`, h.fmt('body', m.outseam - m.inseam)));
    fit.push(row('Rings per round, leg: thigh → ankle', `${ends(legs.tube)}`));
    const g = r.pieces.find(p => p.key === 'gusset');
    if (g) fit.push(row('Crotch gusset (our estimate)', `${h.fmt('body', g.size.width)} square, ${g.rings} rings`));
    fit.push(row(`${term('ease', 'Ease')}: waist and hips / legs`, `${h.fmt('body', m.ease.body)} / ${h.fmt('body', m.ease.limb)}`));
  }
  $('#gFit').innerHTML = `<tbody>${fit.join('')}</tbody>`;

  // round-by-round instructions per tube, plain notes for flat pieces
  $('#gRounds').innerHTML = r.pieces.map(p => {
    const head = `<h3>${p.name}${p.count > 1 ? ` <small class="muted">× ${p.count}</small>` : ''}</h3>`;
    if (p.tube) {
      const extra = [];
      if (p.contraction) extra.push(`Leave out rings with ${term('holeKnot', p.contraction)}${h.cite('mailShirt')}.`);
      if (p.frontShare) extra.push(`About ${Math.round(p.frontShare * 100)}% of the rings in each round are the front, the rest the back, so the back is wider${h.cite('mailShirt')}.`);
      return head + `<ol class="steps">${tubeSteps(p.tube).map(st => `<li>${stepText(st)}</li>`).join('')}</ol>` +
        (extra.length ? `<p class="muted">${extra.join(' ')}</p>` : '');
    }
    if (p.key === 'seams') return head + `<p>${p.rings} rings per seam to join sleeve and body over ${h.fmt('body', p.length)}, front and back of each shoulder${h.cite('mailShirt')}.</p>`;
    if (p.key === 'yoke') return head + `<p>Flat front and back above the armpits, joined over the shoulders, neck opening left free: about ${p.rings.toLocaleString()} rings.</p>`;
    return head + `<p>About ${p.rings} rings, ${h.fmt('body', p.size.width)} × ${h.fmt('body', p.size.height)}. Our size is an estimate — check it on the body.</p>`;
  }).join('');
}
