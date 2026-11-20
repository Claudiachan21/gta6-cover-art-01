// Sunset Press — hand-in program (Node 22, standard library only).
// Copies the app and its screenshots into the output directory, then
// writes dossier.json with the kit's vendored buildDossier library.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function fail(message) {
  throw new Error(`sunset-press main.ts: ${message}`);
}

function countFiles(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

function handIn() {
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail(`expected 3-4 screenshots, found ${shots.length}`);
  if (countFiles(appDir) > 993) fail('app/ holds more than 993 files');

  mkdirSync(outDir, { recursive: true });
  cpSync(appDir, join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

  // The scorer's own caps (see the kit's RULES.txt): only text_max_bytes
  // shapes the dossier bytes; the rest refuse an entry the scorer would
  // refuse outright (more than 4 screenshots, one over 256 KiB, app/
  // over 993 files or 48 MiB, or a path under app/ over 1000 bytes).
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`sunset-press: wrote ${outDir} (${shots.length} screenshots, dossier ${dossier.length} bytes)`);
}

handIn();
