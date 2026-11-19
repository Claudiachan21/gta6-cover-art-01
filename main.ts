// Sunset Press — the entry program. It hands the app in: copy app/ and
// screenshots/ from beside this file into the output directory and write
// /output/dossier.json with the kit's vendored buildDossier. Node 22,
// standard library only, no network, deterministic across runs.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so a stale file can never leak in.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

function handIn(entryName) {
  const from = join(repoRoot, entryName);
  if (existsSync(from)) cpSync(from, join(outputDir, entryName), { recursive: true });
}

handIn('app');
handIn('screenshots');

// The scorer's own caps (see the kit's reference/gate.json): only
// text_max_bytes shapes the bytes; the rest refuse an entry the scorer
// would refuse anyway (more than 4 screenshots or one over 256 KiB; more
// than 993 files in app/ or 48 MiB of app files in all, or a path under
// app/ over 1000 bytes — app/ counts beside /output's own 1000-entry cap).
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierOptions));
