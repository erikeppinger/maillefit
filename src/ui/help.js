// Help texts: the step-by-step guide per garment (dialog) and one short help
// per section. Words with a dotted underline open the glossary.
import { term } from './glossary.js';

const RINGS_STEP = { title: 'Choose the rings',
  text: `Pick a preset or type the ${term('wd', 'wire thickness')} and ${term('id', 'inner diameter')}. Next to each ring set the tool shows its ${term('ar', 'aspect ratio')} and whether it suits the weave. Sizes you use often can be kept with <b>Save preset</b>.` };
const SWATCH_STEP = { title: 'Weave a test piece and calibrate',
  text: `The tool starts from an estimate of how much space a ring takes. Weave a small ${term('swatch')} with your real rings, count and measure it, and enter it under <b>Swatch calibration</b>. All ring counts then follow your rings.` };
const SAVE_STEP = { title: 'Save and print',
  text: '<b>Save file</b> keeps the whole project as a small file you can open again later. <b>Print</b> gives a clean sheet for the workbench.' };
const CLIENT_STEP = what => ({ title: 'Get the measurements',
  text: `Measure yourself, or click <b>Client form</b> and send the file to your client. They fill it in at home, ${what}save a small measurements file and send it back. Load it with <b>Open…</b>.` });

export const GUIDES = {
  bra: {
    title: 'How to plan a bra',
    steps: [
      CLIENT_STEP('alone in front of a mirror, '),
      { title: 'Four dots, then the lengths between them',
        text: 'On each breast stick four small dots: T (top of the cup at the side), S (bottom of the cup at the side), C (inner bottom corner) and M (straight below the nipple). Measure the five lengths between the dots over the skin, plus the distance from nipple to nipple — the tool works out the gap between the cups from it. If the breasts differ, tick “Measure left and right cup separately”.' },
      RINGS_STEP,
      SWATCH_STEP,
      { title: 'Choose the details',
        text: `Under <b>Construction</b>: straps, side bands, edging, how many rows of ${term('e61', '6-in-1')} and how the ${term('bridge', 'gap between the cups')} is bridged.` },
      { title: 'Read the results',
        text: '<b>Order list</b>: how many rings of each size to buy. <b>Pattern</b>: both cups laid flat — point at a row in the table below to find it. <b>Cup, row by row</b>: every row of both triangles with where to leave out rings. Yellow boxes flag measurements that don’t fit together.' },
      SAVE_STEP,
    ],
  },
  shirt: {
    title: 'How to plan a shirt',
    steps: [
      CLIENT_STEP(''),
      { title: 'Measure the body',
        text: `Girths and lengths with a soft tape, over whatever will be worn under the mail. Measure the body as it is — the room to move (${term('ease')}) is added under Construction.` },
      RINGS_STEP,
      SWATCH_STEP,
      { title: 'Choose the details',
        text: `Sleeve style (${term('tstyle', 'T-style or 45°')}), ${term('gusset', 'gussets')} at the shoulders and elbows, a collar, and how much wider the back is than the front.` },
      { title: 'Read the results',
        text: `<b>Order list</b> and <b>Pieces</b>: how many rings to buy and where they go. <b>Pattern</b>: every piece laid flat. <b>Round by round</b>: how many rings each ${term('round')} has and where to ${term('expand', 'add or leave out')} rings so the sleeves taper.` },
      SAVE_STEP,
    ],
  },
  trousers: {
    title: 'How to plan trousers',
    steps: [
      CLIENT_STEP(''),
      { title: 'Measure the body',
        text: `Girths and lengths with a soft tape, over whatever will be worn under the mail. Measure the body as it is — the room to move (${term('ease')}) is added under Construction.` },
      RINGS_STEP,
      SWATCH_STEP,
      { title: 'Choose the details',
        text: `Full trousers with a seat and a crotch ${term('gusset')}, or ${term('chausses')} (legs only, hanging from a belt), and the ${term('ease')}.` },
      { title: 'Read the results',
        text: `<b>Order list</b> and <b>Pieces</b>: how many rings to buy and where they go. <b>Pattern</b>: every piece laid flat. <b>Round by round</b>: how many rings each ${term('round')} has and where to ${term('expand', 'add or leave out')} rings so the legs taper.` },
      SAVE_STEP,
    ],
  },
};

export const SECTION_HELP = {
  client: 'Use a soft tape on the skin, snug but not pulling. Stick the dots first (small pieces of tape or a washable marker), then measure between them following the skin. The three girths only set the side bands and the cup-size estimate. Click any field to see it in the drawing.',
  rings: `The ${term('ar', 'aspect ratio')} — ${term('id', 'inner diameter')} ÷ ${term('wd', 'wire diameter')} — decides whether a weave fits together and how stiff it is. For a bra each part can use its own rings: the ${term('stitch')} rings and the ${term('e61', '6-in-1')} parts are often a different size from the cup panels. “Same rings as the panels” puts them together in the order list.`,
  calib: `Weave a ${term('swatch')} of at least 10 × 10 rings, lay it flat on the table and smooth it out without stretching. <b>Along a row</b>: count the rings that lean the same way side by side and measure from the centre of the first to the centre of the last. <b>Rows</b>: count the rows and measure across them the same way. For the 6-in-1 strip only the length along the strip counts.`,
  construction: `<b>6-in-1 rows</b>: how wide the neckline, straps and side bands are. <b>Stitch rows</b>: how many rows of connector rings join the two triangles of a cup. <b>Cup ease</b>: a little extra size in the cups. <b>Bridge</b>: what fills the gap between the cups. <b>${term('spare', 'Spare rings')}</b>: extra to order for losses.`,
  garmentMeasure: 'Use a soft tape over whatever will be worn under the mail (a shirt or padded jacket). Girths snug but not pulling. Lengths are easier with a helper. If someone else will wear it, send them the <b>Client form</b>. Click a field or a number in the drawing to see where it is measured.',
  garmentConstruction: {
    shirt: `${term('tstyle', 'T-style')} is the most common mail shirt: the weave runs the same way everywhere and there are no seams; the sleeves narrow with ${term('holeKnot', 'hole-row contractions')}. 45° sleeves turn the weave on the sleeves; that needs four short seams at the shoulders but tapers more neatly (M.A.I.L.). ${term('gusset', 'Gussets')} at the shoulders and elbows give room to move; the back is usually about 10 cm (4″) wider than the front. The default ${term('ease')} of 15 cm (6″) on the body and 10 cm (4″) on the sleeves follows The Chain Mail Guy’s calculator.`,
    trousers: `The seat is woven as one tube from the waist down to the crotch, each leg as a tube that narrows from thigh to ankle. Where the two legs together are wider than the seat, a diamond-shaped ${term('gusset')} fills the crotch — its size is our own estimate, so check it on the body. “Legs only” gives ${term('chausses')}.`,
  },
};
