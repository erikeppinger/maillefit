// Standalone measurement form for the client: one self-contained HTML file
// (no internet needed) with the drawing, the how-to texts and the fields. The
// client saves a small JSON file and sends it back; the designer opens it with
// "Open…". Values are stored in mm under the same paths as in the project:
//   bra      → data.client   (also what version-1 files contain)
//   shirt    → data.shirt
//   trousers → data.trousers

export const CLIENT_FILE_TYPE = 'chainmail-client-measurements';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const COPY = {
  bra: {
    title: 'Measurements for your chainmail top',
    need: 'You need a soft tape measure, a mirror and four small stickers or a washable marker.',
    step1: '1 · Stick four dots on each breast',
    how: 'Stand upright, arms relaxed. Tape on the skin, snug but not pulling. Measure from dot to dot following the skin.',
  },
  shirt: {
    title: 'Measurements for your chainmail shirt',
    need: 'You need a soft tape measure and, ideally, a helper for the lengths along the back and arms.',
    step1: '1 · Where to measure',
    how: 'Wear what you will wear under the mail (shirt or padded jacket). Stand upright, arms relaxed. Girths snug but not pulling — the maker adds the ease.',
  },
  trousers: {
    title: 'Measurements for your chainmail trousers',
    need: 'You need a soft tape measure and, ideally, a helper for the lengths down the legs.',
    step1: '1 · Where to measure',
    how: 'Wear what you will wear under the mail. Stand upright, feet slightly apart. Girths snug but not pulling — the maker adds the ease.',
  },
};

/**
 * @param garment       'bra' | 'shirt' | 'trousers'
 * @param measurements  [{ key, path, right?, label, how }] — paths start with the root ('client.' / 'shirt.' / 'trousers.')
 * @param points        bra only: the dots to stick on (may be empty)
 * @param guideSvg      the measurement drawing (outerHTML)
 */
export function buildClientForm({ garment = 'bra', measurements, points = [], guideSvg, units, maker }) {
  const copy = COPY[garment];
  const root = garment === 'bra' ? 'client' : garment;
  const unit = units === 'imperial' ? 'in' : 'cm';
  const sided = measurements.some(m => m.right);
  const fields = measurements.map((m, i) => `
    <label data-guide="${m.key}" class="${m.right ? 'sided' : ''}">
      <span class="lab">${garment === 'bra' ? '' : `${i + 1}. `}${esc(m.label)} <small>(${unit}${m.optional ? ', optional' : ''})</small></span>
      <span class="how">${esc(m.how)}</span>
      <span class="pair">
        ${m.right ? '<i>L</i>' : ''}<input inputmode="decimal" data-path="${m.path}"${m.optional ? ' data-optional="1"' : ''}>
        ${m.right ? `<i class="r">R</i><input class="r" inputmode="decimal" data-path="${m.right}">` : ''}
      </span>
    </label>`).join('');
  const pts = points.length ? `<ol class="pts">${points.map(p => `<li><b>${p.id}</b> — ${esc(p.text)}</li>`).join('')}</ol>` : '';
  // the drawing's id must be "guide" for the styles and the highlight script below
  const svg = guideSvg.replace(/<svg([^>]*?)\sid="[^"]*"/, '<svg$1').replace('<svg', '<svg id="guide"');

  // the script below runs in the client's browser; it must stay self-contained
  const script = `
const TYPE = ${JSON.stringify(CLIENT_FILE_TYPE)}, GARMENT = ${JSON.stringify(garment)}, ROOT = ${JSON.stringify(root)}, F = ${units === 'imperial' ? 25.4 : 10};
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const sep = $('#sep');
if (sep) sep.addEventListener('change', () => document.body.classList.toggle('separate', sep.checked));
$$('label[data-guide] input').forEach(i => i.addEventListener('focus', () => {
  const k = i.closest('label').dataset.guide;
  $$('#guide [data-guide]').forEach(e => e.classList.toggle('on', e.dataset.guide === k));
}));
function collect() {
  const values = sep ? { separateSides: sep.checked } : {}, missing = [];
  $$('input[data-path]').forEach(i => {
    if (i.classList.contains('r') && !(sep && sep.checked)) return;
    const v = parseFloat(i.value.replace(',', '.'));
    const path = i.dataset.path.slice(ROOT.length + 1).split('.');
    if (!(v >= 0) || i.value.trim() === '') { if (!i.dataset.optional) missing.push(i.closest('label').querySelector('.lab').textContent.trim()); return; }
    if (i.dataset.optional && i.dataset.path.endsWith('centreGap')) values.gapFrom = 'measured';
    let o = values; path.slice(0, -1).forEach(k => o = o[k] ??= {}); o[path.at(-1)] = +(v * F).toFixed(1);
  });
  return { values, missing };
}
$('#save').addEventListener('click', () => {
  const { values, missing } = collect();
  if (missing.length && !confirm('Not filled in yet:\\n- ' + missing.join('\\n- ') + '\\n\\nSave anyway?')) return;
  const name = $('#name').value.trim() || 'client';
  const data = { type: TYPE, version: 2, garment: GARMENT, units: 'mm', name, notes: $('#notes').value, date: new Date().toISOString().slice(0, 10), [ROOT]: values };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'measurements-' + GARMENT + '-' + name.replace(/[^\\w-]+/g, '_') + '.json';
  a.click();
  $('#done').hidden = false;
});`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(copy.title)}</title>
<style>
:root { --bg:#f6f4f0; --card:#fff; --ink:#1f1d1a; --ink2:#5d5850; --line:#dcd7ce; --accent:#6b5bd6; --pb:#b08a3e; --part:#2b8a8a; --metal:#8a8f98; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, "Segoe UI", sans-serif; }
main { max-width: 720px; margin: 0 auto; padding: 16px; }
h1 { font-size: 22px; margin: 8px 0 4px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 12px 0; }
.muted { color: var(--ink2); font-size: 13.5px; }
ol.pts { padding-left: 0; list-style: none; } ol.pts b { color: var(--accent); display: inline-block; width: 16px; }
label { display: block; padding: 10px 0; border-top: 1px solid var(--line); }
.lab { font-weight: 600; } .how { display: block; color: var(--ink2); font-size: 13.5px; margin: 2px 0 6px; }
.pair { display: flex; gap: 8px; align-items: center; } .pair i { font-style: normal; color: var(--ink2); font-size: 13px; }
input, textarea { font: inherit; border: 1px solid var(--line); border-radius: 6px; padding: 7px 9px; width: 100%; max-width: 160px; background: #fff; color: var(--ink); }
textarea { max-width: none; min-height: 70px; }
body:not(.separate) .r { display: none; } body:not(.separate) .pair i { display: none; }
button { font: inherit; background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; }
#guide { width: 100%; display: block; max-height: 420px; }
#guide .body { fill: none; stroke: var(--ink2); stroke-width: 1.4; stroke-linejoin: round; } #guide .body.faint { opacity: .45; }
#guide .m { stroke: var(--metal); stroke-width: 2; fill: none; opacity: .55; } #guide .m.on { stroke: var(--accent); opacity: 1; stroke-width: 3; }
#guide .hit { fill: none; stroke: transparent; stroke-width: 12; }
#guide text { font-size: 10px; fill: var(--ink2); } #guide text.on { fill: var(--accent); font-weight: 700; }
#guide .nip { fill: var(--ink2); } #guide .tri { fill: rgba(176,138,62,.1); stroke: var(--pb); stroke-width: .8; }
#guide .e61 { fill: none; stroke: var(--part); stroke-width: 5; stroke-linecap: round; opacity: .35; }
#guide .dot { fill: #fff; stroke: var(--accent); stroke-width: 1.4; } #guide .dotlab { font-size: 6.5px; font-weight: 700; fill: var(--accent); } #guide .cap { font-size: 9px; }
</style></head>
<body><main>
<h1>${esc(copy.title)}</h1>
<p class="muted">${maker ? `For ${esc(maker)}. ` : ''}Takes about 10 minutes. ${copy.need} Nothing is sent anywhere: at the end you save a small file and send it back by e-mail or messenger.</p>
<div class="card">
  <b>${copy.step1}</b>
  ${pts}
  ${svg}
  <p class="muted">${copy.how} Clicking a field highlights it in the drawing.</p>
</div>
<div class="card">
  <b>2 · Measure</b>
  ${sided ? '<p><label style="border:0;padding:0"><input type="checkbox" id="sep" style="width:auto"> My breasts differ noticeably — measure left (L) and right (R) separately</label></p>' : ''}
  ${fields}
</div>
<div class="card">
  <b>3 · Save and send</b>
  <label style="border:0"><span class="lab">Your name</span><input id="name" style="max-width:none"></label>
  <label><span class="lab">Notes</span><span class="how">Anything the maker should know: preferred fit, allergies (nickel!), colours…</span><textarea id="notes"></textarea></label>
  <p><button id="save">Save measurements file</button></p>
  <p id="done" hidden class="muted">Saved — look in your downloads for <b>measurements-….json</b> and send that file back.</p>
</div>
</main>
<script>${script}</script>
</body></html>`;
}
