// Every figure the tool states to the user either cites one of these sources
// or is labelled as our own estimate. Keep quotes verbatim and short.

export const SOURCES = {
  mailE41: {
    title: 'European 4 in 1 — weave page',
    publisher: 'M.A.I.L. (Maille Artisans International League)',
    url: 'https://www.mailleartisans.org/weaves/weavedisplay.php?key=6',
    quotes: [
      'Weave data: "Ideal AR: 4.0", "Min. AR: 2.83" (no maximum listed)',
      '"Shirts, coifs, and other clothing items are generally made in the four to six range."',
    ],
  },
  mailE61: {
    title: 'European 6 in 1 — weave page',
    publisher: 'M.A.I.L. (Maille Artisans International League)',
    url: 'https://www.mailleartisans.org/weaves/weavedisplay.php?key=7',
    quotes: [
      'Weave data: "Ideal AR: 4.9", "Min. AR: 4.25" (no maximum listed)',
    ],
  },
  jonesE61: {
    title: 'Aspect Ratio for European 6 in 1',
    publisher: 'Kylie Jones, Wirejewelry.com',
    url: 'https://www.wirejewelry.com/jewelry_making_tips_techniques/Aspect-Ratio-for-European-6-in-1-_458.html',
    quotes: [
      '"…an aspect ratio of 4 is really too tight to be functional."',
      'At AR 6.2 and 6.5 the weave "still hold[s] the definition of the pattern" but is more spread out.',
    ],
  },
  mailRpi: {
    title: 'Calculating Rings Per Coverage',
    publisher: 'M.A.I.L. article 647',
    url: 'https://www.mailleartisans.org/articles/articledisplay.php?key=647',
    quotes: [
      'E4-1 swatch, wire 0.063″, ID 0.346″ (AR 5.5): 14 rings over 5 113/128″ along the rows, 13 columns over 3 11/32″.',
      'Our default E4-1 ring spacing (1.21 × ID along a row, 0.74 × ID row to row) is scaled from this one swatch.',
    ],
  },
  mailShirt: {
    title: 'Chainmail Shirt; Construction',
    publisher: 'M.A.I.L. article 89 (Chainmailbasket_com)',
    url: 'https://www.mailleartisans.org/articles/articledisplay.php?key=89',
    quotes: [
      'T-style: "there are no seams and the weave hangs in the same direction over the whole shirt" — "the most common form of chainmail shirt".',
      'T-style sleeves are tapered with "hole row" contractions; 45° sleeves need 4 seams but allow knot-row contractions.',
    ],
  },
  chainMailGuy: {
    title: 'Pricing calculator (shirt, dress, coverage table)',
    publisher: 'The Chain Mail Guy',
    url: 'https://www.chainmailguy.com/pricing.htm',
    quotes: [
      'Shirt formula in the page script: area in² = (chest + 6) × length + (arm + 4) × sleeve × 2; dress uses overbust + 8.',
      'E4-1 coverage, e.g. 1/16″ × 1/4″: 2400 rings/ft², 1/16″ × 3/8″: 1200, 14 AWG × 1/2″: 750. "For 6-in-1, double the pricing".',
    ],
  },
  metalDesignz: {
    title: 'Anodized aluminum jump rings 16 gauge 1/4″',
    publisher: 'Metal Designz',
    url: 'https://www.metaldesignz.com/anodized-aluminum-jump-rings-16-gauge-1-4/',
    quotes: ['"AR=4.2" … "European 4-1 (3050 rings per sq/ft)"'],
  },
  ironskin: {
    title: 'Chainmail weight, cost and time — FAQ',
    publisher: 'Ironskin',
    url: 'https://www.ironskin.com/faq-chainmail-weight-and-cost/',
    quotes: [
      'About 30,000 rings for a long-sleeved shirt in 8 mm rings.',
      'Short-sleeved shirt "around 8kg"; hauberk "12 kg"; chausses "another 5 kg".',
    ],
  },
  en13402: {
    title: 'Bra size — EN 13402 cup letters',
    publisher: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Bra_size',
    quotes: [
      'European cup letters step every 2 cm of (bust − underbust), starting with AA at 10–12 cm.',
    ],
  },
};

/** Things we state without a published source — shown as such in the UI. */
export const UNSOURCED = [
  'E6-1 ring spacing (1.1 × ID along a row, 0.45 × ID row to row) — our rough estimate, calibrate with a swatch.',
  'Behaviour above AR 6 (E4-1) and above AR 6.5 (E6-1) — no published limit found; described as "more open" only.',
  'The cup model (flat triangles, fold at M) — derived from the reference bra, not yet checked against a fitted garment.',
];

export const SOURCE_ORDER = Object.keys(SOURCES);
export const sourceNumber = id => SOURCE_ORDER.indexOf(id) + 1;
