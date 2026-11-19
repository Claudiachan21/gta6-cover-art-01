# Sunset Press — GTA 6-style cover art maker

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-FF6B35)](https://make.fun/c/gta6-cover-art-01)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD94D)](LICENSE)
[![Offline app](https://img.shields.io/badge/offline-static%20app-1F8A7A)](app/index.html)

Turn your photos into Vice City-style cover art: multi-panel diagonal
posters, bold Anton captions with a hard ink outline, a sunset or neon
grade, exported as a PNG in the common post sizes — **1080 × 1080**,
**1080 × 1350**, **1920 × 1080**.

Built for the [make.fun GTA 6 Cover Art bounty](https://make.fun/c/gta6-cover-art-01).
If you enter through my referral, use code **jgf2sdsn**:
https://make.fun/c/gta6-cover-art-01?ref=jgf2sdsn

## What it does

- **Any photo** — upload your own or start from 4 AI-made sample photos;
  fill several panels with one photo or several.
- **Crop & position each panel** — drag to pan, scroll to zoom, double-click
  to set the focal point, per panel.
- **4 diagonal layouts** — Sunset Trio, Split Duo, Hero Strip, Vice Quad.
- **Bold lettering** — Anton caption with auto-fit (wraps big when it needs
  to), tracked Inter sub-caption, 5 caption colours, bottom or top.
- **5 colour grades** — Sunset, Neon Nights, Ocean Drive, Vice Pink, Noir.
- **Fast & easy** — three steps from a photo to an exported PNG.

## Run it

No build step, no network. Serve `app/` with any static server and open
`app/index.html` in desktop Chrome:

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Everything the app loads — scripts, fonts (Anton + Inter, SIL OFL),
sample photos — is a file under `app/`. Photos stay on your machine.

## How it is built

- `app/index.html` — editor shell (rail, stage, control panel)
- `app/style.css` — Vice Sunset Press tokens, flat dark chrome + warm paper
- `app/src/app.js` — state + UI wiring (upload, panels, caption, export)
- `app/src/render.js` — `renderCover`, the one renderer for preview + export
- `app/src/presets.js` — sizes, layouts, grades, samples
- `app/src/shots.js` — deterministic `?shot=` staging for screenshots
- `main.ts` — copies `app/` + `screenshots/` to `/output`, writes the dossier

## License

MIT — see [LICENSE](LICENSE).
