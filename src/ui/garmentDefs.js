// Measurement and construction fields for the shirt and the trousers. Paths
// point into state.shirt / state.trousers; `kind` follows app.js (body = cm/in).

export const GARMENT_FIELDS = {
  shirt: {
    title: 'Shirt',
    measurements: [
      { key: 'chest', label: 'Chest girth', how: 'Around the fullest part of the chest, under the arms, breathing in normally. Ease is added separately.' },
      { key: 'hem', label: 'Girth at the hem', how: 'Around the body where the shirt should end — waist for a short shirt, hips or seat for a longer one.' },
      { key: 'length', label: 'Length shoulder → hem', how: 'From the top of the shoulder next to the neck straight down to where the shirt should end.' },
      { key: 'armhole', label: 'Armhole depth', how: 'From the top of the shoulder straight down to the level of the armpit. Easiest with a ruler held in the armpit.' },
      { key: 'sleeve', label: 'Sleeve length', how: 'From the shoulder point (outer edge of the shoulder bone) along the slightly bent arm to where the sleeve should end. 0 = sleeveless.' },
      { key: 'shoulderToElbow', label: 'Shoulder → elbow', how: 'From the shoulder point to the tip of the bent elbow.' },
      { key: 'upperArm', label: 'Upper arm girth', how: 'Around the thickest part of the upper arm, muscle tensed.' },
      { key: 'elbow', label: 'Elbow girth', how: 'Around the elbow, arm slightly bent.' },
      { key: 'wrist', label: 'Wrist girth', how: 'Around the wrist bone — or where the sleeve should end if it stops earlier (allow for gloves).' },
      { key: 'neck', label: 'Neck girth', how: 'Around the base of the neck. Sets the neck opening and the collar.' },
    ],
    construction: [
      { path: 'sleeveStyle', label: 'Sleeves', kind: 'select', options: [['t', 'T-style — no seams, hole-row contractions'], ['45', '45° sleeves — 4 shoulder seams, knot-row contractions']] },
      { path: 'ease.body', label: 'Ease, body', kind: 'body' },
      { path: 'ease.arm', label: 'Ease, sleeves', kind: 'body' },
      { path: 'backExtra', label: 'Back wider than front by', kind: 'body' },
      { path: 'shoulderGusset.on', label: 'Shoulder gussets', kind: 'bool' },
      { path: 'shoulderGusset.base', label: 'Shoulder gusset base', kind: 'body' },
      { path: 'shoulderGusset.height', label: 'Shoulder gusset height', kind: 'body' },
      { path: 'elbowGusset.on', label: 'Elbow gussets', kind: 'bool' },
      { path: 'elbowGusset.size', label: 'Elbow gusset size', kind: 'body' },
      { path: 'collar.on', label: 'Standing collar', kind: 'bool' },
      { path: 'collar.height', label: 'Collar height', kind: 'body' },
      { path: 'collar.ease', label: 'Collar ease', kind: 'body' },
    ],
  },
  trousers: {
    title: 'Trousers',
    measurements: [
      { key: 'waist', label: 'Waist girth', how: 'Around the waist where the trousers will sit (with a belt usually just above the hip bones).' },
      { key: 'seat', label: 'Seat girth', how: 'Around the fullest part of the hips and seat, feet together.' },
      { key: 'thigh', label: 'Thigh girth', how: 'Around the top of the thigh, just below the crotch.' },
      { key: 'knee', label: 'Knee girth', how: 'Around the knee, leg slightly bent.' },
      { key: 'ankle', label: 'Ankle girth', how: 'Around the ankle — or the girth where the leg should end (over boots if worn over them).' },
      { key: 'outseam', label: 'Outseam waist → ankle', how: 'Down the side of the leg from the waist line to the ankle.' },
      { key: 'inseam', label: 'Inseam crotch → ankle', how: 'Down the inside of the leg from the crotch to the ankle.' },
      { key: 'crotchToKnee', label: 'Crotch → knee', how: 'Down the inside of the leg from the crotch to the middle of the knee.' },
      { key: 'waistToSeat', label: 'Waist → seat', how: 'Down the side from the waist line to the level of the fullest part of the seat.' },
    ],
    construction: [
      { path: 'legsOnly', label: 'Legs only (chausses) — no seat, no gusset', kind: 'bool' },
      { path: 'ease.body', label: 'Ease, waist and seat', kind: 'body' },
      { path: 'ease.limb', label: 'Ease, legs', kind: 'body' },
    ],
  },
};

export const GARMENT_HELP = {
  shirt: 'T-style is the most common mail shirt: one weave direction everywhere and no seams; the sleeves are tapered with hole-row contractions. 45° sleeves turn the weave on the sleeves, which needs four seams at the shoulders but allows neater knot-row contractions (M.A.I.L.). Gussets at the shoulders and elbows improve the fit; the back is usually made about 4″ wider than the front. Ease 6″/4″ follows The Chain Mail Guy calculator.',
  trousers: 'The seat is woven as one tube from the waist down to the crotch, the legs as two tubes that taper from thigh to ankle. Where the two legs together are wider than the seat, a diamond gusset fills the crotch — its size is our own estimate. “Legs only” gives chausses that hang from a belt.',
};
