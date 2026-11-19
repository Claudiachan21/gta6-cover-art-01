// Sunset Press — the entry program (Node 22, standard library only).
//
// What it does, in order: work out where the repository and the output
// directory are, copy the app and the screenshots across, then ask the
// vendored make.fun library to write the dossier from what landed in
// /output. The library's own caps mirror the scorer's, so an entry the
// library accepts is one the gate can read.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where the repository root is (this file lives there) and where the
// grader wants the entry. /output is the grader's directory; anywhere
// else, MAKEFUN_OUTPUT_DIR overrides it.
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The dossier caps are the scorer's caps, named here so a too-big entry
// fails loudly at build time instead of silently at the gate.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function copyIfPresent(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return 0;
  copyTree(from, join(outputDir, name));
  return readdirSync(from).length;
}

mkdirSync(outputDir, { recursive: true });
copyIfPresent('app');
copyIfPresent('screenshots');

const dossier = buildDossier(outputDir, dossierOptions);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
