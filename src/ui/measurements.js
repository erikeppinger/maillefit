// Client measurement definitions: order, labels and how-to text. Everything is
// taken with a soft tape so the client can measure alone (a mirror helps).
// For the cups, first stick four small dots on each breast (T, S, C, M — see
// POINTS), then measure between them over the skin.
// `how` also goes into the client form, so it avoids maker's terms; `note` is
// shown only in the tool and says what the measurement is used for.
// `right` marks the per-cup measurements (left path = client's left side).
// `key` links each measurement to its line in the schematic.

export const POINTS = [
  { id: 'T', text: 'top of the cup at the side — at the outer edge of the breast, just below the armpit, where the shoulder strap will start' },
  { id: 'S', text: 'bottom of the cup at the side — straight below T, where the fold under the breast ends at the side' },
  { id: 'C', text: 'inner bottom corner — in the fold under the breast, where the breast begins next to the breastbone' },
  { id: 'M', text: 'straight below the nipple, on an imagined line from T down to C' },
];

export const MEASUREMENTS = [
  { key: 'underbust', path: 'client.underbust', label: 'Underbust girth',
    how: 'Around the ribcage directly under the breasts, in the fold. Keep the tape level all round and snug.',
    note: 'Sets the length of the side bands to the back.' },
  { key: 'highBust', path: 'client.highBust', label: 'Chest girth above the breasts',
    how: 'Around the chest high up under the armpits, above the breasts.',
    note: 'Only used for the fit summary.' },
  { key: 'fullBust', path: 'client.fullBust', label: 'Bust girth (over the nipples)',
    how: 'Around the fullest part, over both nipples, tape level at the back. Don\'t pull — just let the tape touch.',
    note: 'Only used for the cup-size estimate.' },
  { key: 'sideEdge', path: 'client.cup.side', right: 'client.right.side', label: 'Side T → S',
    how: 'From dot T straight down the side of the breast to dot S.',
    note: 'The outer edge of the upper triangle.' },
  { key: 'fold', path: 'client.cup.fold', right: 'client.right.fold', label: 'Under the breast S → C',
    how: 'From dot S along the fold under the breast to dot C.',
    note: 'The bottom edge of the cup.' },
  { key: 'neckUpper', path: 'client.cup.neckUpper', right: 'client.right.neckUpper', label: 'Neckline T → M',
    how: 'From dot T over the upper part of the breast to dot M.',
    note: 'The 6-in-1 neckline runs along here.' },
  { key: 'neckLower', path: 'client.cup.neckLower', right: 'client.right.neckLower', label: 'Neckline M → C',
    how: 'From dot M down the inner side of the breast to dot C.',
    note: 'The 6-in-1 neckline continues here down to C.' },
  { key: 'stitch', path: 'client.cup.stitch', right: 'client.right.stitch', label: 'Across the breast S → M',
    how: 'From dot S over the breast, just under the nipple, to dot M.',
    note: 'The stitch: the two triangles of the cup are joined along this line, which gives the cup its curve.' },
  { key: 'apexToApex', path: 'client.apexToApex', label: 'Nipple to nipple',
    how: 'Straight across from one nipple to the other. Hold the tape straight; don\'t follow the skin.',
    note: 'The gap between the cups is worked out from this: nipple to nipple, minus how far each cup reaches from C to M.' },
  { key: 'centreGap', path: 'client.centreGap', label: 'Gap between the cups C ↔ C', optional: true,
    how: 'Only if asked to: straight across the breastbone from one C dot to the other.',
    note: 'Use this instead of nipple to nipple if you prefer to set the gap directly. 0 means the cups touch.' },
  { key: 'strap', path: 'client.strapLength', label: 'Strap T → over the shoulder → back',
    how: 'From dot T up over the top of the shoulder and down the back to where the strap should end.',
    note: 'The strap ends in an O-ring with a ribbon tie.' },
];
