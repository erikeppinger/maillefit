import { DEFAULT_PROJECT, computeBra } from '../model/bra.js';
import { MATERIALS, AWG, SWG, RING_PRESETS, RING_PRESET_FILE_TYPE } from '../model/rings.js';
import { rowHint } from '../model/triangleCup.js';
import { SOURCES, SOURCE_ORDER, UNSOURCED, sourceNumber } from '../model/sources.js';
import { MEASUREMENTS, POINTS } from './measurements.js';
import { drawGuide, highlightGuide, guideNumber, drawPattern, highlightRow } from './diagrams.js';
import { GUIDES, SECTION_HELP } from './help.js';
import { term, glossaryText, glossaryHtml } from './glossary.js';
import { buildClientForm, CLIENT_FILE_TYPE } from './clientForm.js';
import { isGarment, buildGarmentForm, showGarmentGuide, renderGarment } from './garmentUI.js';
import { GARMENT_FIELDS } from './garmentDefs.js';

const STORE_KEY = 'chainmail-designer.project.v3';
const PRESET_KEY = 'chainmail-designer.ringPresets';
const SEEN_GUIDE_KEY = 'chainmail-designer.seenGuide';
let rowsSide = 'left'; // which cup the row table shows when the sides differ
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ---------------------------------------------------------------- state ----
function merge(base, over) {
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over || {})) out[k] = merge(base[k], over[k]);
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return merge(structuredClone(DEFAULT_PROJECT), JSON.parse(raw));
  } catch { /* storage unavailable or corrupt — fall back to defaults */ }
  return structuredClone(DEFAULT_PROJECT);
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

let state = load();

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

// ---------------------------------------------------------------- units ----
const UNIT = {
  metric:   { body: { f: 10, u: 'cm', d: 1 }, ring: { f: 1, u: 'mm', d: 2 } },
  imperial: { body: { f: 25.4, u: 'in', d: 2 }, ring: { f: 25.4, u: 'in', d: 3 } },
};
const unit = kind => UNIT[state.units][kind];

function parseNumber(text) {
  const s = String(text).trim().replace(',', '.').replace(/["″]|in$|mm$|cm$/i, '').trim();
  if (s === '') return NaN;
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return +mixed[1] + mixed[2] / mixed[3];
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return frac[1] / frac[2];
  return Number(s);
}

function toDisplay(kind, mm) {
  if (kind === 'body' || kind === 'ring') {
    const { f, d } = unit(kind);
    return +(mm / f).toFixed(d);
  }
  return mm;
}

function fromInput(kind, input) {
  if (kind === 'bool') return input.checked;
  if (kind === 'text') return input.value;
  const n = parseNumber(input.value);
  if (!Number.isFinite(n)) return undefined;
  if (kind === 'int') return Math.round(n);
  if (kind === 'body' || kind === 'ring') return n * unit(kind).f;
  return n;
}

const fmt = (kind, mm) => `${toDisplay(kind, mm)} ${unit(kind).u}`;
const len = mm => (mm >= 1000 ? (state.units === 'imperial' ? `${(mm / 304.8).toFixed(1)} ft` : `${(mm / 1000).toFixed(2)} m`) : fmt('body', mm));
const grams = g => (state.units === 'imperial' ? `${(g / 28.35).toFixed(1)} oz` : `${Math.round(g)} g`);

// ------------------------------------------------------ ring presets ----
// Built-in presets plus the user's own, kept in this browser and exportable
// as a file so they survive a new computer or the desktop app.
function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY)) || []; } catch { return []; }
}
function storePresets(list) {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
let userPresets = loadPresets();

function fillPresetSelects() {
  $$('select[data-preset]').forEach(sel => {
    sel.innerHTML = '<option value="">Choose a preset…</option>';
    const group = (label, list, prefix) => {
      if (!list.length) return;
      const g = document.createElement('optgroup');
      g.label = label;
      list.forEach((p, i) => g.appendChild(new Option(`${p.name} · AR ${(p.id / p.wd).toFixed(1)}`, prefix + i)));
      sel.appendChild(g);
    };
    group('My presets', userPresets, 'u');
    group('Common sizes', RING_PRESETS, 'b');
  });
}

const presetAt = v => (v[0] === 'u' ? userPresets : RING_PRESETS)[+v.slice(1)];

function applyPreset(set, value) {
  const p = value && presetAt(value);
  if (!p) return;
  Object.assign(state.rings[set], { material: p.material, wd: p.wd, id: p.id });
  $(`[data-gauge-system="${set}"]`).value = MATERIALS[p.material].gauge;
  fillGauges(set);
  syncInputs();
  update();
}

function savePreset(set) {
  const r = state.rings[set];
  const suggestion = `${MATERIALS[r.material].name.split(' (')[0]} ${fmt('ring', r.wd)} × ${fmt('ring', r.id)}`;
  const name = prompt('Name for this ring preset:', suggestion);
  if (!name) return;
  userPresets = userPresets.filter(p => p.name !== name).concat({ name, material: r.material, wd: r.wd, id: r.id });
  storePresets(userPresets);
  fillPresetSelects();
}

function deletePreset(set) {
  const sel = $(`select[data-preset="${set}"]`);
  if (!sel.value.startsWith('u')) { alert('Choose one of “My presets” in the list first — common sizes can\'t be deleted.'); return; }
  const p = presetAt(sel.value);
  if (!confirm(`Delete the preset “${p.name}”?`)) return;
  userPresets = userPresets.filter(x => x !== p);
  storePresets(userPresets);
  fillPresetSelects();
}

/**
 * Save a text file. In the desktop app (Tauri) this opens the native "Save as"
 * dialog; in the browser it falls back to a normal download.
 */
async function download(name, text, type = 'application/json') {
  const tauri = window.__TAURI__;
  if (tauri?.dialog && tauri?.fs) {
    const ext = name.split('.').pop();
    const path = await tauri.dialog.save({
      defaultPath: name,
      filters: [{ name: ext === 'html' ? 'Web page' : 'MailleFit file', extensions: [ext] }],
    });
    if (!path) return; // cancelled
    try {
      await tauri.fs.writeTextFile(path, text);
    } catch (err) {
      alert(`Could not save ${name}: ${err}`);
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ------------------------------------------------------------- building ----
function ringFields(set) {
  const box = $(`[data-ringfields="${set}"]`);
  const row = document.createElement('div');
  row.className = 'preset-row';
  row.innerHTML = `<label style="flex:1">Preset<select data-preset="${set}"></select></label>
    <button type="button" data-preset-save="${set}" title="Save the current size as your own preset">Save preset</button>
    <button type="button" data-preset-del="${set}" title="Delete the selected preset from “My presets”" aria-label="Delete preset">✕</button>`;
  box.before(row);
  box.innerHTML = `
    <label>Material<select data-path="rings.${set}.material"></select></label>
    <label>Gauge helper<span class="pair">
      <select data-gauge-system="${set}"><option>AWG</option><option>SWG</option></select>
      <select data-gauge="${set}"><option value="">—</option></select></span></label>
    <label>Wire diameter (WD)<input data-path="rings.${set}.wd" data-kind="ring" inputmode="decimal"></label>
    <label>Inner diameter (ID)<input data-path="rings.${set}.id" data-kind="ring" inputmode="decimal" title="Imperial: fractions like 5/16 are fine"></label>`;
  const mat = box.querySelector('select[data-path]');
  for (const [k, m] of Object.entries(MATERIALS)) mat.add(new Option(m.name, k));
  box.querySelector('[data-gauge-system]').value = MATERIALS[state.rings[set].material].gauge;
  fillGauges(set);
}

function fillGauges(set) {
  const table = $(`[data-gauge-system="${set}"]`).value === 'SWG' ? SWG : AWG;
  const g = $(`[data-gauge="${set}"]`);
  g.length = 1;
  for (const [n, mm] of Object.entries(table)) g.add(new Option(`${n} ga — ${mm} mm`, n));
}

function buildForm() {
  const list = $('#measureList');
  const bodyInput = (path, side) => {
    const input = document.createElement('input');
    input.dataset.path = path;
    input.dataset.kind = 'body';
    input.inputMode = 'decimal';
    if (side) {
      input.dataset.side = side;
      input.setAttribute('aria-label', side === 'L' ? "client's left" : "client's right");
    }
    return input;
  };
  for (const m of MEASUREMENTS) {
    const label = document.createElement('label');
    label.dataset.guide = m.key;
    label.innerHTML = `<span>${guideNumber(m.key)}. ${m.label} <span class="unit" data-unit="body"></span></span>`;
    if (m.right) {
      label.classList.add('sided');
      const pair = document.createElement('span');
      pair.className = 'pair lr';
      const tag = s => Object.assign(document.createElement('span'), { className: 'side-tag', textContent: s });
      pair.append(tag('L'), bodyInput(m.path, 'L'), tag('R'), bodyInput(m.right, 'R'));
      label.appendChild(pair);
    } else {
      label.appendChild(bodyInput(m.path));
    }
    list.appendChild(label);
  }
  ['main', 'seam', 'support'].forEach(ringFields);

  $$('input[data-kind="ring"]').forEach(input => {
    const span = document.createElement('span');
    span.className = 'unit';
    span.dataset.unit = 'ring';
    input.before(span);
  });

  $('#points').innerHTML = POINTS.map(p => `<li><b>${p.id}</b> — ${p.text}</li>`).join('');
  drawGuide($('#guide'));
}

function syncInputs() {
  $$('[data-path]').forEach(input => {
    const kind = input.dataset.kind || 'text';
    const v = getPath(state, input.dataset.path);
    if (kind === 'bool') input.checked = !!v;
    else if (document.activeElement !== input) input.value = toDisplay(kind, v);
    input.classList.remove('invalid');
  });
  $$('[data-unit]').forEach(s => { s.textContent = `(${unit(s.dataset.unit).u})`; });
  $$('[data-units]').forEach(b => b.classList.toggle('on', b.dataset.units === state.units));
  $('#projectName').value = state.name;
  $$('[data-calib]').forEach(g => g.classList.toggle('on', !!state.calibration[g.dataset.calib].enabled));
  $$('.ringset').forEach(s => s.classList.toggle('same', !!state.rings[s.dataset.set].same));
  $('#measureList').classList.toggle('separate', !!state.client.separateSides);
  $('#measureList').dataset.gapfrom = state.client.gapFrom || 'nipples';
  document.body.dataset.garment = state.garment;
  $('#mainRingTitle').innerHTML = `${state.garment === 'bra' ? 'Cup panels' : 'Rings'} — ${term('e41', 'European 4-in-1')}`;
  $$('button[data-garment]').forEach(b => b.classList.toggle('on', b.dataset.garment === state.garment));
}

// ---------------------------------------------------------------- render ---
/** Numbered citation link(s) into the Sources panel. */
const cite = (...ids) => ids.map(id => `<sup class="cite"><a href="#src-${id}" title="${SOURCES[id].publisher}">[${sourceNumber(id)}]</a></sup>`).join('');

function renderStatic() {
  $('#sourceList').innerHTML = SOURCE_ORDER.map(id => {
    const s = SOURCES[id];
    return `<li id="src-${id}"><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a> — ${s.publisher}` +
      s.quotes.map(q => `<span class="q">${q}</span>`).join('') + '</li>';
  }).join('');
  $('#unsourcedList').innerHTML = UNSOURCED.map(u => `<li>${u}</li>`).join('');
  $$('[data-help-box]').forEach(b => { if (typeof SECTION_HELP[b.dataset.helpBox] === 'string') b.innerHTML = SECTION_HELP[b.dataset.helpBox]; });
  // static words in index.html get their explanation from the glossary
  $$('abbr.term:not([title])').forEach(a => { a.title = glossaryText(a.dataset.term); a.tabIndex = 0; });
  $('#glossaryList').innerHTML = glossaryHtml();
}

/** The guide dialog for the garment in use. */
function renderGuide() {
  const g = GUIDES[state.garment] || GUIDES.bra;
  $('#guideTitle').textContent = g.title;
  $('#guideSteps').innerHTML = g.steps.map(s => `<li><b class="t">${s.title}</b>${s.text}</li>`).join('');
}

/** Open the glossary, scrolled to one word (or at the top). */
function openGlossary(id) {
  const dlg = $('#glossaryDialog');
  if ($('#guideDialog').open) $('#guideDialog').close();
  if (!dlg.open) dlg.showModal();
  $$('#glossaryList dt').forEach(dt => dt.classList.toggle('on', dt.id === `term-${id}`));
  if (id) $(`#term-${id}`)?.scrollIntoView({ block: 'center' });
}

function card(k, v, s, level = '') {
  return `<div class="card ${level}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
}

function render() {
  let r;
  try {
    r = computeBra(state);
  } catch (e) {
    $('#warnings').innerHTML = `<div class="warn-box">Can't compute: ${e.message}</div>`;
    return;
  }
  const c = state.construction;
  const worst = ['bad', 'warn', 'good'].find(l => Object.values(r.sets).some(s => s.verdict.level === l && !(s.same && s.key !== 'main')));
  renderRingInfo(r);

  if (isGarment(state.garment)) {
    const main = r.sets.main;
    renderGarment(state.garment, state,
      { spec: main.spec, stats: main.stats, material: main.material, verdict: { ...main.verdict, text: main.verdict.text + cite(...main.verdict.src) }, pitch: r.mainPitch },
      { fmt, len, grams, card, cite, area: areaText, spare: c.spare });
    return;
  }

  $('#cards').innerHTML =
    card('Rings to order', r.totalOrder.toLocaleString(), `${r.net.toLocaleString()} + ${c.spare}% spare, ${r.order.length} size${r.order.length > 1 ? 's' : ''}`) +
    card('Finished weight', grams(r.mass), 'rings only') +
    card(term('ar', 'Aspect ratios'), Object.values(r.sets).filter(s => !s.same || s.key === 'main').map(s => s.stats.ar.toFixed(1)).join(' / '),
      worst === 'good' ? 'all rings suit their weave' : 'see the Rings section', worst) +
    card('Other parts', `${r.hardware.oRings} O-rings`, `${len(r.hardware.ribbon)} ribbon`) +
    card('Cup size (approx.)', r.body.cupLetter + cite('en13402'), `EU · bust − underbust ${fmt('body', r.body.bustMinusUnder)}`);

  $('#warnings').innerHTML = r.warnings.map(w => `<div class="warn-box">${w[0].toUpperCase() + w.slice(1)}</div>`).join('');

  drawPattern($('#pattern'), r, c);
  renderBraTables(r);
}

const areaText = mm2 => (state.units === 'imperial' ? `${(mm2 / 92903).toFixed(1)} ft²` : `${(mm2 / 1e6).toFixed(2)} m²`);

/** Ring-set info lines and spacing in the Rings / Calibration sections (all garments). */
function renderRingInfo(r) {
  for (const [key, s] of Object.entries(r.sets)) {
    const verdict = `<span class="lv ${s.verdict.level}">${s.verdict.text}</span>${cite(...s.verdict.src)}`;
    $(`[data-ringinfo="${key}"]`).innerHTML = s.same && key !== 'main'
      ? `Uses the cup rings — ${term('ar', 'aspect ratio')} ${s.stats.ar.toFixed(2)} for ${s.weave.name}: ${verdict}`
      : `${term('ar', 'Aspect ratio')} <b>${s.stats.ar.toFixed(2)}</b> for ${s.weave.name}: ${verdict}<br>` +
        `${term('od', 'Outer diameter')} <b>${fmt('ring', s.stats.od)}</b> · ${s.stats.mass.toFixed(3)} g per ring · wire usually sold in ${term('gauge', s.material.gauge)} sizes`;
  }
  const pitchLine = (p, strip, src) => `${term('spacing', 'Ring spacing')} along a row <b>${fmt('ring', p.along)}</b>` +
    (strip ? '' : ` · row to row <b>${fmt('ring', p.across)}</b> · ${Math.round(10000 / (p.along * p.across))} rings per 10 × 10 cm`) +
    ` · <i>${p.source}</i>${p.source.startsWith('swatch') ? '' : cite(...src)}`;
  $('#pitchMain').innerHTML = '4-in-1: ' + pitchLine(r.mainPitch, false, ['mailRpi']);
  $('#pitchSupport').innerHTML = '6-in-1: ' + pitchLine(r.supportPitch, true, []);
}

function renderBraTables(r) {
  const L = r.cups.left, R = r.cups.right;

  $('#orderList').innerHTML =
    `<thead><tr><th>Rings</th><th>Size</th><th class="n">Need</th><th class="n">Order</th><th class="n">Weight</th></tr></thead><tbody>` +
    r.order.map(o => `<tr><td>${o.uses.join(' + ')}<br><small class="muted">${o.material.name}</small></td>` +
      `<td>${fmt('ring', o.spec.wd)} × ${fmt('ring', o.spec.id)} ID<br><small class="muted">AR ${o.stats.ar.toFixed(2)} · ${len(o.wire)} wire</small></td>` +
      `<td class="n">${o.net.toLocaleString()}</td><td class="n"><b>${o.order.toLocaleString()}</b></td><td class="n">${grams(o.mass)}</td></tr>`).join('') +
    (r.hardware.oRings ? `<tr><td>O-rings</td><td>${fmt('ring', r.hardware.oRingId)} ID</td><td class="n">${r.hardware.oRings}</td><td class="n"><b>${r.hardware.oRings}</b></td><td></td></tr>` : '') +
    (r.hardware.ribbon ? `<tr><td>Ribbon</td><td>back ${len(r.hardware.backRibbon)} · strap ties ${len(r.hardware.strapRibbon)}</td><td class="n" colspan="2"><b>${len(r.hardware.ribbon)}</b></td><td></td></tr>` : '') +
    '</tbody>';

  $('#pieces').innerHTML =
    `<thead><tr><th>Piece</th><th>Layout</th><th class="n">Rings</th></tr></thead><tbody>` +
    r.pieces.map(p => `<tr><td>${p.label}</td><td>${p.layout}</td><td class="n">${p.rings.toLocaleString()}</td></tr>`).join('') +
    `<tr class="total"><td>Total</td><td></td><td class="n">${r.net.toLocaleString()}</td></tr></tbody>`;

  // per-cup values: "L x · R y" when measured separately, else one value
  const lr = fn => (r.separate ? `L ${fn(L)} · R ${fn(R)}` : fn(L));
  const row = (k, v) => `<tr><td>${k}</td><td class="n">${v}</td></tr>`;
  $('#geometry').innerHTML = '<tbody>' +
    row('Cup curve (fold at M)', lr(x => `${Math.max(0, Math.round(x.cup.layout.dartDeg))}°`)) +
    row('Upper triangle: rows × widest row', lr(x => `${x.cup.triangles[0].rows.length} × ${x.cup.triangles[0].rows[0]?.rings ?? 0}`)) +
    row('Lower triangle: rows × widest row', lr(x => `${x.cup.triangles[1].rows.length} × ${x.cup.triangles[1].rows[0]?.rings ?? 0}`)) +
    row(term('stitch', 'Stitch S → M'), lr(x => `${fmt('body', x.cup.stitch.length)}, ${x.cup.stitch.rings} rings`)) +
    row('6-in-1 neckline, each cup', lr(x => fmt('body', x.cup.neckline))) +
    row('Side band length, each', fmt('body', r.sides.length)) +
    row(r.bridge.fromNipples ? 'Gap between the cups (from nipple to nipple)' : 'Gap between the cups (measured)', fmt('body', r.bridge.wanted)) +
    row(term('bridge', 'Bridge'), r.bridge.style === 'rows'
      ? `${r.bridge.vertical} vertical rows × ${r.bridge.rows} rings = ${fmt('body', r.bridge.gap)} wide`
      : r.bridge.style === 'ring' ? `one connecting ring, ≈ ${fmt('body', r.bridge.gap)}` : 'cups touch') +
    row('Bust minus chest above the breasts', fmt('body', r.body.bustMinusHigh)) +
    row('Rings per cup: counted row by row / estimated from the area', lr(x => `${x.cup.rings} / ${Math.round(x.cup.ringsByArea)}`)) +
    '</tbody>';

  // row-by-row tables for one cup (tabs when the sides differ)
  $('#rowsTabs').hidden = !r.separate;
  $$('#rowsTabs [data-side]').forEach(b => b.classList.toggle('on', b.dataset.side === rowsSide));
  const shown = r.separate ? r.cups[rowsSide] : L;
  const hlSide = r.separate ? rowsSide : 'both';
  $('#rowsNote').textContent = r.separate
    ? `${shown.name} cup (client's ${rowsSide}) · each triangle starts along the stitch`
    : 'one cup — make two, mirrored · each triangle starts along the stitch';
  const { cup } = shown;
  $('#rows').innerHTML = cup.triangles.map(t =>
    `<thead><tr><th colspan="3" class="tri-head">${t.name} <small class="muted">stitch → ${t.key === 'upper' ? 'T (top at the side)' : 'C (inner bottom corner)'}</small></th></tr>` +
    `<tr><th>Row</th><th class="n">Rings</th><th>What to do</th></tr></thead><tbody>` +
    t.rows.map(x => `<tr data-row="${hlSide}-${t.key}-${x.index}"><td>${x.index}</td><td class="n">${x.rings}</td><td class="muted">${rowHint(x, t.edges)}</td></tr>`).join('') +
    `<tr class="total"><td>Total</td><td class="n">${t.rings}</td><td></td></tr></tbody>`).join('') +
    `<tbody><tr class="total"><td>Stitch</td><td class="n">${cup.stitch.rings}</td><td class="muted">rings that join the first rows of both triangles, 4-in-1 style</td></tr></tbody>`;
}

function update() {
  save();
  render();
}

// ---------------------------------------------------------------- events ---
function onInput(e) {
  const input = e.target;
  if (!input.dataset.path) return;
  const kind = input.dataset.kind || 'text';
  const v = fromInput(kind, input);
  if (v === undefined || (typeof v === 'number' && v < 0)) { input.classList.add('invalid'); return; }
  input.classList.remove('invalid');
  setPath(state, input.dataset.path, v);
  if (input.dataset.path === 'client.separateSides' && v) {
    // start the right side from the left measurements
    state.client.right = structuredClone(state.client.cup);
  }
  const mat = input.dataset.path.match(/^rings\.(\w+)\.material$/);
  if (mat) {
    $(`[data-gauge-system="${mat[1]}"]`).value = MATERIALS[v].gauge;
    fillGauges(mat[1]);
  }
  if (kind === 'bool' || input.dataset.path === 'client.gapFrom') syncInputs();
  update();
}

function showGuide(key) {
  highlightGuide($('#guide'), key);
  $$('#measureList label').forEach(l => l.classList.toggle('hl', l.dataset.guide === key));
  const m = MEASUREMENTS.find(x => x.key === key);
  $('#guideHow').innerHTML = m
    ? `<b>${guideNumber(key)}. ${m.label}</b> — ${m.how}${m.note ? ` <span class="muted">${m.note}</span>` : ''}`
    : 'Click a measurement field (or a number in the drawing) to see where and how to measure it.';
}

function bind() {
  const form = $('#form');
  form.addEventListener('input', onInput);
  form.addEventListener('change', e => {
    if (e.target.dataset.preset) { applyPreset(e.target.dataset.preset, e.target.value); return; }
    const set = e.target.dataset.gaugeSystem;
    if (set) { fillGauges(set); return; }
    const gs = e.target.dataset.gauge;
    if (gs && e.target.value) {
      const table = $(`[data-gauge-system="${gs}"]`).value === 'SWG' ? SWG : AWG;
      state.rings[gs].wd = table[e.target.value];
      syncInputs();
      update();
    }
  });
  form.addEventListener('focusout', syncInputs);
  $('#measureList').addEventListener('focusin', e => showGuide(e.target.closest('label')?.dataset.guide));
  $('#guide').addEventListener('click', e => {
    const key = e.target.dataset?.guide;
    if (key) $(`#measureList label[data-guide="${key}"] input`)?.focus();
  });

  $$('button[data-garment]').forEach(b => b.addEventListener('click', () => {
    state.garment = b.dataset.garment;
    if (isGarment(state.garment)) buildGarmentForm(state.garment);
    syncInputs();
    update();
  }));
  $('#gMeasureList').addEventListener('focusin', e => showGarmentGuide(state.garment, e.target.closest('label')?.dataset.guide));
  $('#gGuide').addEventListener('click', e => {
    const key = e.target.dataset?.guide;
    if (key) $(`#gMeasureList label[data-guide="${key}"] input`)?.focus();
  });

  $$('[data-units]').forEach(b => b.addEventListener('click', () => {
    state.units = b.dataset.units;
    syncInputs();
    update();
  }));
  $('#projectName').addEventListener('input', e => { state.name = e.target.value; save(); });

  $('#btnNew').addEventListener('click', () => {
    if (!confirm('Start a new project with default values? Unsaved changes are lost.')) return;
    state = structuredClone(DEFAULT_PROJECT);
    syncInputs();
    update();
  });
  $('#btnSave').addEventListener('click', () => {
    download(`${(state.name || 'chainmail').replace(/[^\w-]+/g, '_')}.json`, JSON.stringify(state, null, 2));
  });
  $('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
  $('#fileOpen').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.type === CLIENT_FILE_TYPE) {
        // a client's measurements file: take the body data, keep rings and
        // construction. Version-1 files (bra only) have no `garment` field.
        const g = data.garment || 'bra';
        const what = { bra: 'top', shirt: 'shirt', trousers: 'trousers' }[g];
        if (!what) throw new Error(`unknown garment “${g}”`);
        if (!confirm(`Load the ${what} measurements of “${data.name}” (${data.date}) into this project? The current ${what} measurements are replaced.`)) return;
        if (g === 'bra') state.client = merge(structuredClone(DEFAULT_PROJECT.client), data.client);
        else state[g] = merge(state[g], data[g]); // keeps ease, sleeves, gussets…
        state.garment = g;
        if (isGarment(g)) buildGarmentForm(g);
        state.name = data.name || state.name;
        if (data.notes) alert(`Notes from ${data.name}:\n\n${data.notes}`);
      } else {
        state = merge(structuredClone(DEFAULT_PROJECT), data);
      }
      syncInputs();
      update();
    } catch (err) {
      alert(`Could not open ${file.name}: ${err.message}`);
    }
    e.target.value = '';
  });
  $('#btnPrint').addEventListener('click', () => window.print());

  // guide + section help
  $('#btnGuide').addEventListener('click', () => { renderGuide(); $('#guideDialog').showModal(); });
  // the desktop app has no tabs: open the manual in the same window (it links back)
  if (window.__TAURI__) $$('a[href="manual.html"]').forEach(a => a.removeAttribute('target'));
  $('#openGlossary').addEventListener('click', e => { e.preventDefault(); openGlossary(null); });
  // any underlined word: click (or Enter) opens its glossary entry
  const termClick = e => {
    const t = e.target.closest?.('abbr.term');
    if (!t || (e.type === 'keydown' && e.key !== 'Enter')) return;
    e.preventDefault();
    e.stopPropagation();
    openGlossary(t.dataset.term);
  };
  document.addEventListener('click', termClick, true);
  document.addEventListener('keydown', termClick, true);
  $$('.help-btn').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); // don't toggle the surrounding <details>
    const box = $(`[data-help-box="${b.dataset.help}"]`);
    box.hidden = !box.hidden;
    b.closest('details').open = true;
  }));

  // client measurement form: a standalone file to send to the client
  $('#btnClientForm').addEventListener('click', () => {
    const g = state.garment;
    const svg = $(isGarment(g) ? '#gGuide' : '#guide').cloneNode(true);
    svg.querySelectorAll('.on').forEach(e => e.classList.remove('on'));
    const measurements = isGarment(g)
      ? GARMENT_FIELDS[g].measurements.map(m => ({ ...m, path: `${g}.${m.key}` }))
      : MEASUREMENTS;
    const html = buildClientForm({ garment: g, measurements, points: isGarment(g) ? [] : POINTS, guideSvg: svg.outerHTML, units: state.units, maker: '' });
    download(`chainmail-measurement-form-${g === 'bra' ? 'top' : g}.html`, html, 'text/html');
  });

  // ring presets
  form.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (t?.dataset.presetSave) savePreset(t.dataset.presetSave);
    if (t?.dataset.presetDel) deletePreset(t.dataset.presetDel);
  });
  $('#presetExport').addEventListener('click', () => {
    if (!userPresets.length) { alert('No presets of your own yet — use “Save preset” next to a ring size first.'); return; }
    download('ring-presets.json', JSON.stringify({ type: RING_PRESET_FILE_TYPE, version: 1, presets: userPresets }, null, 2));
  });
  $('#presetImport').addEventListener('click', () => $('#presetFile').click());
  $('#presetFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.type !== RING_PRESET_FILE_TYPE) throw new Error('not a ring preset file');
      const valid = data.presets.filter(p => p.name && MATERIALS[p.material] && p.wd > 0 && p.id > 0);
      const names = new Set(valid.map(p => p.name));
      userPresets = userPresets.filter(p => !names.has(p.name)).concat(valid);
      storePresets(userPresets);
      fillPresetSelects();
      alert(`Imported ${valid.length} preset${valid.length === 1 ? '' : 's'}.`);
    } catch (err) {
      alert(`Could not import ${file.name}: ${err.message}`);
    }
    e.target.value = '';
  });

  $('#rows').addEventListener('mouseover', e => highlightRow($('#pattern'), e.target.closest('tr[data-row]')?.dataset.row));
  $$('#rowsTabs [data-side]').forEach(b => b.addEventListener('click', () => { rowsSide = b.dataset.side; render(); }));
  $('#rows').addEventListener('mouseleave', () => highlightRow($('#pattern'), null));
}

buildForm();
if (isGarment(state.garment)) buildGarmentForm(state.garment);
fillPresetSelects();
renderStatic();
syncInputs();
bind();
showGuide(null);
render();
// first visit: show the guide once
try {
  if (!localStorage.getItem(SEEN_GUIDE_KEY)) {
    renderGuide();
    $('#guideDialog').showModal();
    localStorage.setItem(SEEN_GUIDE_KEY, '1');
  }
} catch { /* storage unavailable — skip */ }
