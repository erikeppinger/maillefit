# MailleFit

Plan chainmail (maille) garments from body measurements: ring counts, weights, flat patterns and weaving instructions for a bra, a shirt and trousers.

**Use it online:** https://erikeppinger.github.io/maillefit/ (everything runs in your browser; nothing is uploaded).

The bra is a triangle-cup design: each cup is two flat E4-1 triangles joined by a 4-in-1 stitch (the fold along the stitch gives the curve), 2 rows of E6-1 along the V neckline continuing as shoulder straps, optional E6-1 side bands and edging, O-rings and ribbon ties. The gap between the cups is worked out from the nipple-to-nipple distance (or measured directly) and bridged by one ring or an odd number of vertical E6-1 rows.

```
npm start      # http://localhost:5180
npm test       # model tests
```

No build step, no dependencies: plain ES modules, so it can later be wrapped as a desktop app (Tauri/Electron → exe/msi, dmg, AppImage).

## Desktop app (Windows: .exe, .msi)

Built with Tauri 2: the same web app in a native window using Windows' Edge WebView2, with native Save dialogs. Needs Rust (MSVC toolchain) and Visual Studio Build Tools.

```
npm run desktop:build   # → src-tauri/target/release/bundle/msi/ and bundle/nsis/
npm run desktop:dev     # desktop window against the dev server (run npm start first)
```

`scripts/build-web.mjs` copies index.html, css/ and src/ into dist/, which Tauri embeds. The app icon comes from app-icon.svg (`npx tauri icon app-icon.svg -o src-tauri/icons`). macOS (.dmg) and Linux (.AppImage/.deb) builds use the same config but have to be built on those systems.

## Features

- Guide dialog (first visit + Guide button) and a ? help box per section
- Sources panel: every published figure is cited (src/model/sources.js); own estimates are listed as such
- Ring presets: common sizes built in; own presets saved in the browser, export/import as ring-presets.json
- Client form (bra, shirt, trousers): downloads a standalone HTML form for the current garment; the client saves measurements-<garment>-<name>.json, which Open… loads into that garment (construction settings are kept)

## Shirt and trousers

Switch with Bra / Shirt / Trousers in the header. Each garment has its own measurement drawing, construction options, flat pattern and round-by-round instructions; the ring set and swatch calibration are shared.

- src/model/tube.js — tapered E4-1 tube woven in rounds; rings per round from the girth, instructions per section ("contract 1 about every 4 rounds")
- src/model/garments.js — shirt (T-style or 45° sleeves with 4 shoulder seams, shoulder/elbow gussets, back wider than front, collar) and trousers/chausses (seat, legs, crotch gusset); ease defaults from The Chain Mail Guy calculator
- src/ui/garmentUI.js, garmentDefs.js, garmentDiagrams.js — forms, guides and results for the garments
- node scripts/compare-garments.mjs — compares density and garment totals with published numbers

## Layout

- `src/model/` — pure geometry, no DOM (testable in Node)
  - `rings.js` — gauges (AWG/SWG), materials, AR, mass, wire length
  - `weaves.js` — weave registry; a sheet weave is a lattice with `along` (ring-to-ring in a row) and `across` (row-to-row) pitch, default estimate or swatch calibration
  - `triangleCup.js` — cup from four body points T, S, C, M and the five tape lengths between them; two flat triangles, the dart at M, rows parallel to the stitch
  - `bra.js` — whole project: cups, bridge, side bands, straps, totals, consistency checks
- `src/ui/` — form, measurement guide, SVG cup layout

## Model assumptions (to be validated)

- Measuring: dots T (cup top at the side), S (cup bottom at the side), C (centre V), M (stitch end on the neckline, straight below the nipple); tape lengths T–S, S–C, T–M, M–C, S–M over the skin. Each triangle is fixed by its three edges.
- The cup curve is the angle missing at M when both triangles lie flat (the stitch closes it).
- E4-1 default pitch: along = 1.21·ID, across = 0.74·ID, scaled from one published AR 5.5 swatch. E6-1 (along 1.1·ID, across 0.45·ID) is a rough guess. Use swatch calibration for real work.
- Panels are woven in rows parallel to the stitch, from the stitch towards the far corner.
- Left/right cups can be measured separately (client.cup = left, client.right = right).
