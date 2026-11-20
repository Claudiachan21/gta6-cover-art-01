# Sunset Press — Vice-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Sunset Press** turns your photos into Vice City-style multi-panel cover art:
upload a photo (or tap a sample), frame each diagonal panel, write a big
condensed caption, pick a sunset grade, and export a PNG to share.

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
Referral: `jgf2sdsn`.

## How it works

1. **Add photos** — upload your own or tap a sample. Each panel takes its own photo.
2. **Frame it** — drag to pan, scroll to zoom, double-click to set the focal point.
3. **Type & export** — write the caption, pick a grade, export a PNG to share.

Everything runs on your machine. Photos are never uploaded.

## Features

- 4 sample photos from one Vice City sunset world (Boulevard, Night Drive, Pier, Street)
- 4 diagonal panel layouts: Sunset Trio, Split Duo, Hero Strip, Vice Quad
- Per-panel focal point, drag-pan, and wheel zoom
- Big Anton caption with hard ink outline + pink rule, auto-fit (wraps to two lines)
- Sub-caption in Inter with tracking, always one line
- 5 colour grades: Neon, Sunset, Dusk, Mono, Pastel
- Export PNG in the common post sizes: 1080×1080, 1080×1350, 1920×1080
- Offline: fonts vendored under `app/fonts/` (SIL OFL), no network requests

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Hand in the entry (writes `/output`, or `MAKEFUN_OUTPUT_DIR` outside the grader):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html` — editor shell (top bar, rail, canvas stage, control panel)
- `app/style.css` — Vice Sunset Press tokens and layout
- `app/src/presets.js` — sizes, layouts, samples, grades, caption geometry
- `app/src/render.js` — `renderCover()`, the single render path for preview + export
- `app/src/app.js` — editor state, controls, drag-pan / zoom / focal point
- `app/src/shots.js` — deterministic `?shot=` staging for the dossier screenshots
- `app/fonts/` — Anton + Inter (woff2, SIL OFL 1.1)
- `app/samples/` — four AI-generated sample photos, one sunset world
- `screenshots/` — the four dossier screenshots (cover, editor, portrait, square)

## License

MIT — see [LICENSE](LICENSE). Fonts under `app/fonts/` are licensed under the
SIL Open Font License 1.1 (see `app/fonts/OFL-anton.txt` and `app/fonts/OFL-inter.txt`).
