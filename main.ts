// Sunset Press — entry program (Node 22, standard library only).
//
// What it does, in order: sanity-check the hand-in (the app shell exists,
// the screenshots are 3-4 files), copy app/ and screenshots/ beside this file
// into the output directory, then write dossier.json with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

function fail(message) {
  throw new Error(`sunset-press main: ${message}`);
}

function checkedCopy(srcDir, dstDir) {
  const entries = readdirSync(srcDir);
  if (entries.length === 0) fail(`${srcDir} is empty`);
  cpSync(srcDir, dstDir, { recursive: true });
  return entries.length;
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
if (!statSync(join(appDir, 'index.html')).isFile()) fail('app/index.html is not a file');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  fail(`expected 3-4 screenshots, found ${shotFiles.length}`);
}

mkdirSync(outDir, { recursive: true });
checkedCopy(appDir, join(outDir, 'app'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
checkedCopy(shotsDir, join(outDir, 'screenshots'));

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse anyway (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files in all, or a path under app/ over 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
