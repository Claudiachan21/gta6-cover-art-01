# Sunset Press — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos into a Vice City sunset poster. **Sunset Press** frames one
photo — or several — into a bold multi-panel cover with a big Anton caption,
a pink rule, a sun badge, and a neon grade, then exports a share-ready PNG.

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
If you enter too, my referral code is `jgf2sdsn`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: the app is static files under `app/`, served by
any static HTTP server. Fonts are vendored under `app/fonts/` (SIL OFL);
sample photos under `app/samples/` were made with an image model and are
free to use.

## How it works

1. **Add photos** — upload your own, or tap a sample photo. Each one lands
   in a panel; click a panel to select it.
2. **Frame it** — pick one of four diagonal layouts (Sunset Trio, Split Duo,
   Hero Strip, Vice Quad), drag to pan, scroll to zoom, per panel.
3. **Type & export** — write your caption and sub-caption, pick a colour,
   size and position (bottom or top), choose one of five sunset grades,
   then **Export PNG** in 1080×1080, 1080×1350, or 1920×1080.

The preview canvas and the export share one renderer (`app/src/render.js`),
so what you see is exactly what the PNG holds.

## Layout

- `app/index.html` — editor shell (topbar, How-it-works rail, canvas stage, control panel)
- `app/style.css` — all styling; warm paper, dark ink chrome, sunset tokens only
- `app/src/app.js` — state + UI wiring (upload, panels, caption, grade, export)
- `app/src/render.js` — `renderCover(ctx, W, H, state)` (preview + export)
- `app/src/presets.js` — sizes, diagonal layouts, samples, grades, caption math
- `app/src/shots.js` — deterministic `?shot=` staging for the dossier screenshots
- `app/fonts/` — Anton + Inter (woff2, SIL OFL)
- `app/samples/` — four AI-made starter photos
- `main.ts` — copies `app/` + `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — tiny static server for local testing

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
