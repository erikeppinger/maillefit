// Weave registry. A sheet weave is modelled as a lattice with two pitches:
//   along  – centre-to-centre distance between neighbouring rings in one row
//            (rings that lean the same way, side by side)
//   across – distance from one row to the next
// One ring occupies along × across of surface. Panels are woven in rows
// parallel to the band; strips (band, laces, edging) are a fixed number of rows.
//
// Default pitches are estimates scaled by the inner diameter. They should be
// replaced by a swatch calibration as soon as the real rings are at hand.

export const WEAVES = {
  e41: {
    id: 'e41',
    name: 'European 4-in-1',
    // AR bands, each with the source it rests on (see sources.js)
    arBands: [
      { below: 2.83, level: 'bad', text: 'below the published minimum AR 2.83 — the weave will not close', src: ['mailE41'] },
      { below: 4.0, level: 'warn', text: 'tight and stiff — below the 4–6 range used for clothing (ideal 4.0 is for structural work)', src: ['mailE41'] },
      { below: 6.0, level: 'good', text: 'within the 4–6 range used for clothing', src: ['mailE41'] },
      { below: Infinity, level: 'warn', text: 'above the 4–6 clothing range; no published maximum — expect a more open, stretchier sheet', src: ['mailE41'] },
    ],
    // Derived from a published relaxed AR 5.5 swatch (WD 1.6 mm, ID 8.79 mm):
    // 14 rings along a row over 149.4 mm, 13 rows over 84.9 mm
    // (mailleartisans.org article 647). Linked-neighbour distance then comes
    // out at 0.96 × ID, which matches the physical limit of ~1 × ID for two
    // interlocked rings pulled taut, so the lattice is self-consistent.
    alongFactor: 1.21,
    acrossFactor: 0.74,
    source: 'estimate from AR 5.5 reference swatch',
  },
  e61: {
    id: 'e61',
    name: 'European 6-in-1',
    arBands: [
      { below: 4.25, level: 'bad', text: 'below the published minimum AR 4.25 — AR 4 is described as too tight to be functional', src: ['mailE61', 'jonesE61'] },
      { below: 4.9, level: 'good', text: 'firm — between the published minimum 4.25 and the ideal 4.9', src: ['mailE61'] },
      { below: 6.5, level: 'good', text: 'at or above the ideal 4.9; AR 6.2–6.5 still holds the pattern, more open', src: ['mailE61', 'jonesE61'] },
      { below: Infinity, level: 'warn', text: 'looser than any published example we found — the pattern may lose definition (unsourced)', src: [] },
    ],
    // Rough: E6-1 packs rows much tighter than E4-1 (each ring also links the
    // row two away), the spacing along a row stays similar. Not yet checked
    // against a real swatch — calibrate.
    alongFactor: 1.1,
    acrossFactor: 0.45,
    source: 'unsourced rough estimate — calibrate',
  },
};

export function defaultPitch(weave, ring) {
  return {
    along: weave.alongFactor * ring.id,
    across: weave.acrossFactor * ring.id,
    source: weave.source,
  };
}

/**
 * Resolve the pitch to use: a swatch calibration wins over the default estimate.
 * Counts are rings (or rows); lengths are centre of first to centre of last, mm.
 * @param cal {{enabled, alongCount, alongLength, acrossCount?, acrossLength?}}
 */
export function resolvePitch(weave, ring, cal) {
  const d = defaultPitch(weave, ring);
  if (!cal || !cal.enabled) return d;
  const along = cal.alongCount > 1 && cal.alongLength > 0 ? cal.alongLength / (cal.alongCount - 1) : null;
  const across = cal.acrossCount > 1 && cal.acrossLength > 0 ? cal.acrossLength / (cal.acrossCount - 1) : null;
  let source = 'default estimate';
  if (along && across) source = 'swatch calibration';
  else if (along || across) source = 'partly calibrated';
  return { along: along ?? d.along, across: across ?? d.across, source };
}
