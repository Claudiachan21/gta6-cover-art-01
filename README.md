# Sunset Press — Cover Maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/badge/gta6-cover-art-01/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/offline-yes-brightgreen.svg)](#sunset-press--cover-maker)

A GTA 6 cover maker: four photos, one diagonal, sunset type. Pick a size,
fill the slanted panels with your photos (or the four sample shots from one
sunset shoot), letter the Anton caption, pick one of five warm grades, and
export a PNG to share.

Built for the [make.fun bounty](https://make.fun/badge/gta6-cover-art-01/)
— referral code `jgf2sdsn`.

## Run it

```sh
node serve.ts --port=8080
# open http://localhost:8080
```

No build step, no dependencies, no network. The fonts (Anton + Inter) are
vendored in `app/fonts/` under the OFL, the sample photos live in
`app/samples/`, and your photos never leave your machine.

## How it works

1. **Pick a size up top** — Landscape 1920×1080, Portrait 1080×1350, or
   Square 1080×1080. Each size has its own staged cover.
2. **Fill the panels with your photos** — click a panel on the cover, then
   a photo, to fill it. Drag a photo on the cover to reposition it; scroll
   over a panel to zoom. Or tap **Load samples** for the four-shot set.
3. **Letter the caption** — Anton main caption, Inter sub-caption, five
   colours, a size slider, Bottom or Top. The caption auto-fits the hero
   panel: it shrinks before it ever crosses the diagonal.
4. **Export PNG** — the preview canvas is the exact code path the export
   uses, so what you see is what you get.

## Layouts and grades

- **Layouts:** Diagonal 3 (the default), Grid 4, Hero 1, Duo 2. Dividers
  are slanted, never straight verticals — that slant is the poster's
  signature.
- **Grades:** Sunset, Neon, Dusk, Gold, Noir. Warm and neon washes over the
  panels, never under the caption.

## Build the bundle

```sh
node main.ts
# writes output/app, output/screenshots and output/dossier.json
# (or set MAKEFUN_OUTPUT_DIR to choose the directory)
```

## Screenshots

| Shot | What it shows |
| --- | --- |
| `1-cover.jpg` | The landscape cover, 1280×720 |
| `2-editor.jpg` | The editor in the browser, 1280×800 |
| `3-portrait.jpg` | The portrait cover, 1024×1280 |
| `4-square.jpg` | The square cover, 1080×1080 |

## License

MIT — see [LICENSE](LICENSE). The fonts are under the SIL Open Font
License (see `app/fonts/OFL-anton.txt` and `app/fonts/OFL-inter.txt`).
