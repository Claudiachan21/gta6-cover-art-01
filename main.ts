// Sunset Press — entry program (Node 22, standard library only).
// It gathers the app and its screenshots from this repository, checks the
// gate's own caps before handing anything over, and writes /output/dossier.json
// with the vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const APP_DIR = join(REPO_ROOT, 'app');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function checkShots() {
  if (!existsSync(SHOTS_DIR)) fail('screenshots/ is missing');
  const shots = readdirSync(SHOTS_DIR).filter((f) => !f.startsWith('.')).sort();
  if (shots.length < 3 || shots.length > 4) fail(`expected 3-4 screenshots, found ${shots.length}`);
  for (const shot of shots) {
    const bytes = statSync(join(SHOTS_DIR, shot)).size;
    if (bytes > 262144) fail(`screenshot ${shot} is ${bytes} bytes (cap 256 KiB)`);
  }
  return shots;
}

function checkApp() {
  if (!existsSync(join(APP_DIR, 'index.html'))) fail('app/index.html is missing');
  const indexBytes = statSync(join(APP_DIR, 'index.html')).size;
  if (indexBytes > 1048576) fail(`app/index.html is ${indexBytes} bytes (cap 1 MiB)`);
}

const shots = checkShots();
checkApp();

mkdirSync(OUT_DIR, { recursive: true });
cpSync(APP_DIR, join(OUT_DIR, 'app'), { recursive: true });
mkdirSync(join(OUT_DIR, 'screenshots'), { recursive: true });
cpSync(SHOTS_DIR, join(OUT_DIR, 'screenshots'), { recursive: true });

const dossier = buildDossier(OUT_DIR, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
console.log(`main.ts: wrote ${shots.length} screenshots + dossier.json (${dossier.length} chars) to ${OUT_DIR}`);
