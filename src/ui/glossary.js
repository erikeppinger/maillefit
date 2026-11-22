// Words used in the tool, in plain language. One list feeds the hover
// explanations (term()), the glossary dialog and the manual page.

export const GLOSSARY = [
  { id: 'e41', term: '4-in-1 (European 4-in-1)', short: 'E4-1',
    text: 'The classic chainmail weave: every ring goes through four others. It makes a flexible sheet and is used for the cup triangles, shirts and trousers.' },
  { id: 'e61', term: '6-in-1 (European 6-in-1)', short: 'E6-1',
    text: 'A denser relative of 4-in-1: every ring goes through six others. It is firmer and less stretchy, so the bra uses it for the neckline, straps, side bands and the bridge between the cups.' },
  { id: 'wd', term: 'Wire diameter (WD)',
    text: 'How thick the wire of a ring is. Thicker wire is stronger and heavier.' },
  { id: 'id', term: 'Inner diameter (ID)',
    text: 'The width of the hole inside a ring. Ring sellers usually list rings by wire thickness and inner diameter.' },
  { id: 'od', term: 'Outer diameter (OD)',
    text: 'The full width of a ring: inner diameter plus twice the wire.' },
  { id: 'ar', term: 'Aspect ratio (AR)',
    text: 'Inner diameter divided by wire diameter. It decides whether a weave fits together at all and how stiff or loose it turns out. Each weave has a range that works; the tool checks your rings against published ranges.' },
  { id: 'gauge', term: 'Gauge (AWG, SWG)',
    text: 'The traditional way to name a wire thickness. A higher gauge number means thinner wire. AWG (American Wire Gauge) and SWG (Standard Wire Gauge) are two different scales, so the same number is not the same thickness. The gauge list only fills in the wire diameter for you.' },
  { id: 'row', term: 'Row',
    text: 'One line of rings across a flat piece. The cup triangles are woven row by row, starting at the stitch.' },
  { id: 'round', term: 'Round',
    text: 'One closed ring of rings around a tube, like one row of a knitted sleeve. Shirt bodies, sleeves and trouser legs are woven round by round.' },
  { id: 'spacing', term: 'Ring spacing',
    text: 'How far one ring sits from the next in the finished weave: along a row and from row to row. It turns your measurements into ring counts. The tool starts from an estimate; weave a swatch to replace it with your real numbers.' },
  { id: 'swatch', term: 'Swatch',
    text: 'A small test piece woven with the real rings, for example 15 × 15 rings. Measuring it tells the tool how much space your rings take up (see calibration).' },
  { id: 'calibration', term: 'Calibration',
    text: 'Entering what you counted and measured on your swatch. From then on all ring counts follow your rings instead of the estimate.' },
  { id: 'stitch', term: 'Stitch (bra)',
    text: 'The seam that joins the two triangles of one cup, from S to M. Joining two flat pieces at an angle gives the cup its curve. It is closed with connector rings, 4-in-1 style.' },
  { id: 'bridge', term: 'Bridge (bra)',
    text: 'The 6-in-1 piece between the two cups at the bottom: one connecting ring for a tiny gap, otherwise an odd number of short vertical rows so the pattern stays symmetrical.' },
  { id: 'expand', term: 'Expand / contract',
    text: 'Adding a ring to a round (expand) makes a tube wider; leaving one out (contract) makes it narrower. That is how sleeves and legs taper.' },
  { id: 'holeKnot', term: 'Hole-row / knot-row contraction',
    text: 'Two ways of taking a ring out of a round. Which one fits depends on how the weave runs along the sleeve: hole-row for T-style shirts, knot-row for 45° sleeves.' },
  { id: 'ease', term: 'Ease',
    text: 'Extra width added to a body measurement so the garment can be put on and lets you move. The client measures the body; the maker adds the ease.' },
  { id: 'gusset', term: 'Gusset',
    text: 'A small extra piece set into a seam where the body needs more room, here at the shoulders, at the elbows or in the crotch.' },
  { id: 'yoke', term: 'Yoke',
    text: 'The part of a shirt above the armpits, over the shoulders, with the neck opening.' },
  { id: 'tstyle', term: 'T-style / 45° sleeves',
    text: 'T-style: the weave runs the same way over the whole shirt and there are no seams. 45° sleeves: the weave on the sleeves is turned, which needs four seams at the shoulders and allows knot-row contractions.' },
  { id: 'chausses', term: 'Chausses',
    text: 'Mail leggings: two separate legs that hang from a belt, with no seat.' },
  { id: 'seams', term: 'Inseam / outseam / rise',
    text: 'Inseam: inside of the leg, crotch to ankle. Outseam: outside of the leg, waist to ankle. Rise: the difference, waist to crotch.' },
  { id: 'oring', term: 'O-ring',
    text: 'A larger single ring where a strap ends, so a ribbon can be tied through it.' },
  { id: 'spare', term: 'Spare rings',
    text: 'Extra rings to order on top of the count, for rings that get lost, bent or opened wrongly.' },
  { id: 'mail', term: 'M.A.I.L.',
    text: 'Maille Artisans International League, a long-running online archive of chainmail weaves and articles. Several of the figures in this tool come from it (see Sources).' },
];

const BY_ID = Object.fromEntries(GLOSSARY.map(g => [g.id, g]));
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** A word with a dotted underline: explanation on hover, click opens the glossary. */
export function term(id, label) {
  const g = BY_ID[id];
  if (!g) throw new Error(`unknown glossary term ${id}`);
  // default label: the word in running text, e.g. 'Stitch (bra)' → 'stitch'
  label ??= g.term.replace(/\s*\(.*\)/, '').toLowerCase();
  return `<abbr class="term" data-term="${id}" title="${attr(g.text)}" tabindex="0">${label}</abbr>`;
}

export const glossaryText = id => BY_ID[id]?.text ?? '';

/** The glossary as a definition list (dialog and manual). */
export const glossaryHtml = () => '<dl class="glossary">' +
  GLOSSARY.map(g => `<dt id="term-${g.id}">${g.term}</dt><dd>${g.text}</dd>`).join('') + '</dl>';
