// Client measurement definitions: order, labels and how-to text. Everything is
// taken with a soft tape so the client can measure alone (a mirror helps).
// For the cups, first stick four small dots on each breast (T, S, C, M — see
// POINTS), then measure between them over the skin.
// `right` marks the per-cup measurements (left path = client's left side).
// `key` links each measurement to its line in the schematic.

export const POINTS = [
  { id: 'T', text: 'cup top at the side — where the shoulder strap will meet the cup, at the outer edge of the breast just below the armpit' },
  { id: 'S', text: 'cup bottom at the side — straight below T, where the under-breast fold ends at the side' },
  { id: 'C', text: 'inner bottom corner of the cup — at the fold where the breast begins next to the breastbone; one dot on each side' },
  { id: 'M', text: 'stitch end — on the line from T to C, straight below the nipple; the stitch S–M runs just under the nipple' },
];

export const MEASUREMENTS = [
  { key: 'underbust', path: 'client.underbust', label: 'Underbust girth',
    how: 'Around the ribcage directly under the breasts, along the fold. Tape level all round, snug. Sets the side laces to the back.' },
  { key: 'highBust', path: 'client.highBust', label: 'Chest girth above breasts',
    how: 'Around the chest high up under the armpits, above the breast tissue — the chest without the breast. Only used for the fit summary.' },
  { key: 'fullBust', path: 'client.fullBust', label: 'Bust girth (nipple line)',
    how: 'Around the fullest part, over both nipples, tape level at the back. Don\'t pull — just touch. Only used for the fit summary.' },
  { key: 'sideEdge', path: 'client.cup.side', right: 'client.right.side', label: 'Side edge T → S',
    how: 'From dot T straight down the side of the breast to dot S. This is the outer edge of the upper triangle.' },
  { key: 'fold', path: 'client.cup.fold', right: 'client.right.fold', label: 'Fold S → C',
    how: 'From dot S along the under-breast fold to dot C. The bottom edge of the cup.' },
  { key: 'neckUpper', path: 'client.cup.neckUpper', right: 'client.right.neckUpper', label: 'Neckline T → M',
    how: 'From dot T over the upper breast to dot M. The 6-in-1 runs along here.' },
  { key: 'neckLower', path: 'client.cup.neckLower', right: 'client.right.neckLower', label: 'Neckline M → C',
    how: 'From dot M down the inside of the breast to dot C. The 6-in-1 continues here down to C.' },
  { key: 'stitch', path: 'client.cup.stitch', right: 'client.right.stitch', label: 'Stitch S → M',
    how: 'From dot S over the breast, just under the nipple, to dot M. The two triangles are joined along this line; the fold here shapes the cup.' },
  { key: 'apexToApex', path: 'client.apexToApex', label: 'Nipple to nipple',
    how: 'Straight across from one nipple to the other (tape held straight, not following the skin). The gap between the cups is worked out from this: nipple to nipple minus how far each cup reaches from C to M.' },
  { key: 'centreGap', path: 'client.centreGap', label: 'Gap between the cups C ↔ C', optional: true,
    how: 'Only if you prefer to measure the gap directly: straight across the breastbone from one C dot to the other. 0 = the cups touch in one V.' },
  { key: 'strap', path: 'client.strapLength', label: 'Strap T → shoulder → back',
    how: 'From dot T up over the top of the shoulder and down the back to where the strap should end (tie or O-ring).' },
];
