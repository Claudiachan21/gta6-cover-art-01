// Sunset Press — the entrypoint. Builds the submission bundle: a clean
// copy of the app, a clean copy of the four staged screenshots, and a
// dossier describing them. Run from anywhere; the output directory comes
// from MAKEFUN_OUTPUT_DIR (default: ./output next to this file).
//
// This file is deliberately plain Node — no build step, no dependencies —
// so the harness can run it with a bare `node main.ts` and get the same
// bundle every time.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOTS, checkShot } from './app/src/shots.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || join(here, 'output');
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// Read a JPEG's pixel dimensions from its SOF segment — no decoder needed.
function jpegSize(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('not a JPEG');
  let i = 2;
  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xff) { i += 1; continue; }
    const marker = bytes[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + len;
  }
  throw new Error('no SOF segment found');
}

function buildDossier(imageRows) {
  return {
    format: 'sunset-press-dossier/1',
    title: 'Sunset Press — Cover Maker',
    tagline: 'A GTA 6 cover maker: four photos, one diagonal, sunset type.',
    description:
      'Sunset Press turns four photos into a GTA 6 cover. Pick a size, fill the slanted panels ' +
      'with your photos (or the four sample shots from one sunset shoot), letter the Anton caption, ' +
      'pick one of five warm grades, and export a PNG. Everything runs offline in the browser: ' +
      'the fonts are vendored, the photos never leave the machine, and the preview canvas is the ' +
      'exact code path the export uses.',
    images: imageRows,
    cover: 0,
    sizes: {
      landscape: '1920×1080',
      portrait: '1080×1350',
      square: '1080×1080',
    },
    features: [
      'Upload your own photos plus four AI sample photos from one world',
      'Four diagonal panel layouts (Diagonal 3, Grid 4, Hero 1, Duo 2)',
      'Focal point, drag-pan and wheel zoom per panel',
      'Anton caption with Inter sub-caption, auto-fit and baseline-aware',
      'Five colour grades (Sunset, Neon, Dusk, Gold, Noir)',
      'PNG export in 1080×1080, 1080×1350 and 1920×1080',
      'Fully offline — vendored fonts, no network',
    ],
    shots: SHOTS,
  };
}

function main() {
  const appOut = join(outDir, 'app');
  const shotsOut = join(outDir, 'screenshots');
  rmSync(appOut, { recursive: true, force: true });
  rmSync(shotsOut, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(appDir, appOut, { recursive: true });
  cpSync(shotsDir, shotsOut, { recursive: true });

  const problems = [];
  const imageRows = SHOTS.map((shot) => {
    const file = join(shotsOut, shot.name);
    if (!existsSync(file)) {
      problems.push(`${shot.name}: missing`);
      return { name: shot.name, width: 0, height: 0, bytes: 0, sha256: '' };
    }
    const bytes = readFileSync(file);
    const { width, height } = jpegSize(bytes);
    problems.push(...checkShot(shot.name, width, height, bytes.length));
    return { name: shot.name, width, height, bytes: bytes.length, sha256: sha256(bytes) };
  });
  if (problems.length > 0) {
    throw new Error(`screenshot check failed:\n${problems.join('\n')}`);
  }

  const dossier = buildDossier(imageRows);
  writeFileSync(join(outDir, 'dossier.json'), `${JSON.stringify(dossier, null, 2)}\n`);
  const appFiles = statSync(appOut).isDirectory() ? 'copied' : 'missing';
  console.log(`Sunset Press bundle ready in ${outDir} (app ${appFiles}, ${imageRows.length} screenshots, dossier ${JSON.stringify(dossier).length} chars).`);
}

main();
