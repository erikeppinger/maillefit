// Tapered tube of European 4-in-1: the building block for sleeves, legs and
// shirt bodies. The tube is woven in closed rounds; each round's ring count
// follows the girth at its height, and the difference to the previous round
// is an expansion (+) or contraction (−).
//
// stations: [{ at, girth }] — distance from the start of the tube and the
// girth there (mm, ease already included), sorted by `at`. Between stations the
// girth is interpolated linearly.
// around: which lattice pitch runs around the tube. 'along' = rows go round
// (rings side by side around the limb); 'across' = rows run lengthwise (the
// classic T-shirt with the weave hanging the same way everywhere).

export function girthAt(stations, at) {
  if (at <= stations[0].at) return stations[0].girth;
  for (let i = 1; i < stations.length; i++) {
    const a = stations[i - 1], b = stations[i];
    if (at <= b.at) return a.girth + (b.girth - a.girth) * (at - a.at) / (b.at - a.at);
  }
  return stations[stations.length - 1].girth;
}

export function buildTube({ stations, pitch, around = 'along', minRound = 6 }) {
  const pAround = pitch[around];
  const pLength = pitch[around === 'along' ? 'across' : 'along'];
  const length = stations[stations.length - 1].at - stations[0].at;
  const rows = [];
  let prev = null;
  for (let k = 0; ; k++) {
    const at = stations[0].at + (k + 0.5) * pLength;
    if (at > stations[0].at + length) break;
    const girth = girthAt(stations, at);
    const rings = Math.max(minRound, Math.round(girth / pAround));
    rows.push({ index: k + 1, at, girth, rings, delta: prev === null ? null : rings - prev });
    prev = rings;
  }
  // exact surface (trapezoids between stations) for the area cross-check
  let area = 0;
  for (let i = 1; i < stations.length; i++) {
    area += (stations[i].girth + stations[i - 1].girth) / 2 * (stations[i].at - stations[i - 1].at);
  }
  return {
    rows,
    stations,
    length,
    area,
    rings: rows.reduce((n, r) => n + r.rings, 0),
    ringsByArea: area / (pitch.along * pitch.across),
    expansions: rows.reduce((n, r) => n + Math.max(0, r.delta ?? 0), 0),
    contractions: rows.reduce((n, r) => n + Math.max(0, -(r.delta ?? 0)), 0),
  };
}

/**
 * Weaving instructions per section between two stations (e.g. shoulder →
 * elbow → wrist): the girth changes linearly there, so the expansions or
 * contractions are spread evenly ("−1 about every 4 rounds").
 */
export function tubeSteps(tube) {
  const { rows, stations } = tube;
  const steps = [];
  for (let s = 1; s < stations.length; s++) {
    const inSeg = rows.filter(r => r.at > stations[s - 1].at && r.at <= stations[s].at);
    if (!inSeg.length) continue;
    const first = inSeg[0], last = inSeg[inSeg.length - 1];
    // the change into this section counts from the last round before it
    const before = rows[first.index - 2] ?? first;
    const change = last.rings - before.rings;
    const rounds = last.index - before.index;
    steps.push({ from: first.index, to: last.index, startRings: before.rings, endRings: last.rings, change, every: change ? rounds / Math.abs(change) : null });
  }
  return steps;
}

export function stepText(st) {
  if (!st.change) return `rounds ${st.from}–${st.to}: ${st.endRings} rings each`;
  const word = st.change > 0 ? 'expand' : 'contract';
  const every = st.every >= 1.5 ? `1 about every ${Math.round(st.every)} rounds` : `${Math.round(1 / st.every)} per round`;
  return `rounds ${st.from}–${st.to}: ${st.startRings} → ${st.endRings} rings (${word} ${every})`;
}
