// Help texts: the step-by-step guide (dialog) and one short help per section.

export const GUIDE_STEPS = [
  { title: 'Get the measurements',
    text: 'Either measure the client yourself, or click <b>Client form</b> and send the file. The client fills it in at home, saves a small measurements file and sends it back; load it with <b>Open…</b>.' },
  { title: 'Mark four dots, measure five lengths',
    text: 'On each breast: T (cup top at the side), S (cup bottom at the side), C (inner bottom corner) and M (stitch end on the neckline). Measure T→S, S→C, T→M, M→C and the stitch S→M over the skin, and the gap between the two C dots — a 6-in-1 bridge fills it. If the breasts differ, tick “Measure left and right cup separately”.' },
  { title: 'Choose the rings',
    text: 'Pick a preset or type wire diameter and inner diameter. Each ring set shows its aspect ratio (AR) with the published range for its weave. Save sizes you use often with <b>Save preset</b>.' },
  { title: 'Weave a swatch and calibrate',
    text: 'The default ring spacing is an estimate. Weave a small swatch with the real rings, let it hang, count and measure it and enter it under <b>Swatch calibration</b>. All counts then follow your rings.' },
  { title: 'Set up the construction',
    text: 'Choose straps, side bands and edging, rows of 6-in-1, stitch rows and spare rings.' },
  { title: 'Read the results',
    text: '<b>Order list</b>: how many rings of each size to buy. <b>Pattern</b>: both cups laid flat; hover a row in the tables to find it. <b>Row by row</b>: every row of both triangles, starting along the stitch, with where to drop rings. Check the yellow boxes — they flag measurements that don\'t fit together.' },
  { title: 'Save and print',
    text: '<b>Save file</b> stores the whole project as a small file you can open again. <b>Print</b> gives a clean sheet for the workbench.' },
];

export const SECTION_HELP = {
  client: 'Soft tape, skin contact, not pulling. Stick the dots first (small tape pieces or a washable marker), then measure between them following the skin. The girths are only used for the side bands and the fit summary. Click any field to highlight it in the drawing.',
  rings: 'AR (aspect ratio) = inner diameter ÷ wire diameter; it decides whether a weave closes and how stiff it is. Each set can use its own size: the stitch rings and the 6-in-1 are often a different gauge from the panels. Ticking “Same rings as the panels” merges them in the order list.',
  calib: 'Lay the swatch flat and let it relax. Along a row: count rings leaning the same way side by side, and measure from the centre of the first to the centre of the last. Rows: count rows across and measure the same way. For the 6-in-1 strip only the ring spacing along the strip matters.',
  construction: 'Rows of 6-in-1 apply to the neckline, the straps and the side bands. Stitch rows: how many rows of connector rings join the two triangles. Spare: extra rings to order for mistakes and lost rings.',
};
