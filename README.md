# Sunset Press

[![make.fun bounty](https://img.shields.io/badge/make.fun-gta6--cover--art--01-FF6B35)](https://make.fun/c/gta6-cover-art-01)
[![offline](https://img.shields.io/badge/offline-no%20network-1F8A7A)](#)
[![fonts OFL](https://img.shields.io/badge/fonts-SIL%20OFL%201.1-FFD94D)](app/fonts/OFL-anton.txt)

A Vice-style cover art maker that turns your photos and a caption into a
GTA-style multi-panel poster — and exports it as a PNG to share.

## What it does

- **Any photo:** upload your own, or tap one of the four AI-made sample photos. Each panel takes its own photo.
- **Four diagonal layouts:** Sunset Trio, Split Duo, Hero Strip, Vice Quad — the slanted panels, bold caption and sunset grade of a Vice City poster, in an original design.
- **Frame each panel:** drag to pan, scroll to zoom, double-click to set the focal point.
- **Big lettering:** Anton caption with a hard ink outline and a pink rule, Inter sub-caption with tracking, five caption colours, Bottom/Top position.
- **Five grades:** Sunset, Neon, Dusk, Teal, Noir — washes over the whole cover.
- **Post sizes:** 1080 × 1080, 1080 × 1350, 1920 × 1080. One click exports a PNG.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` — no build step, no network
request. Every script, image and font it loads is a file under `app/`,
and photos are read on your machine, never uploaded.

## How it works

1. **Add photos** — upload your own or tap a sample.
2. **Frame it** — drag, zoom, set the focal point per panel.
3. **Type & export** — write the caption, pick a grade, export a PNG.

## Files

- `app/index.html` — the editor shell
- `app/style.css` — all styling (Vice Sunset Press tokens)
- `app/src/presets.js` — sizes, samples, layouts, grades
- `app/src/render.js` — `renderCover`, the one render function for preview and export
- `app/src/app.js` — editor state and wiring
- `app/src/shots.js` — `?shot=` staging for the dossier screenshots
- `app/fonts/` — Anton + Inter (SIL OFL 1.1, vendored)
- `app/samples/` — four AI-made sample photos, free to use
- `main.ts` — hands the app in (copies `app/` + `screenshots/`, writes `dossier.json`)

## The bounty

Built for the [GTA 6 cover art bounty on make.fun](https://make.fun/c/gta6-cover-art-01)
($250 across the top 50). If you enter make.fun yourself, my referral code
is `jgf2sdsn` — sign up at https://make.fun/?ref=jgf2sdsn.

## License

MIT — see [LICENSE](LICENSE). Fonts under the SIL Open Font License 1.1
(see `app/fonts/OFL-anton.txt` and `app/fonts/OFL-inter.txt`). No Rockstar
Games logo, artwork or font is used anywhere in this app.
