# Sunset Press — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Claudiachan21/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos and a caption into a Vice City sunset cover poster — the
multi-panel diagonal look with bold condensed lettering and a neon grade —
then export it as a PNG to share. Built for the make.fun bounty
[gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) ($250).

Referral: `jgf2sdsn` — sign up at [make.fun](https://make.fun) and join the bounty.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `app/index.html` runs from plain static
files in desktop Chrome. Your photos never leave your machine.

## How it works

1. **Add photos** — upload your own or pick one of the four AI-made samples.
2. **Pick a layout** — Trio, Duo, Strip or Quad, all cut on the diagonal.
3. **Crop & position each panel** — drag a photo to pan it, scroll to zoom,
   or use the Panel tab (zoom slider, photo swap).
4. **Write the caption** — Anton display type with a hard ink outline and a
   pink rule, plus a one-line Inter sub-caption that auto-fits. Five caption
   colours, size slider, Bottom/Top position.
5. **Pick a grade** — Sunset, Neon, Noir, Palm or Vice.
6. **Export PNG** — 1920×1080, 1080×1350 or 1080×1080, rendered from the same
   function that draws the preview, so the PNG is exactly what you saw.

## Files

- `app/index.html`, `app/style.css` — the editor shell and styles.
- `app/src/presets.js` — sizes, diagonal layouts, grades, samples.
- `app/src/render.js` — `renderCover(ctx, W, H, state, images)`, the single
  render function for preview and export.
- `app/src/app.js` — editor state and UI wiring.
- `app/src/shots.js` — deterministic `?shot=` staging for screenshots.
- `app/samples/` — four AI-made sample photos, free to use.
- `app/fonts/` — Anton + Inter (SIL Open Font License), vendored locally.
- `main.ts` — hands the app in: copies `app/` + `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — the cover, the editor, portrait and square exports.

## Originality

Everything here is original: no Rockstar Games logo, wordmark, official
artwork, character or font. The fonts are OFL-licensed files under `app/`,
and the sample photos were made with an image model for this project.

## License

MIT — see [LICENSE](./LICENSE).
