// Sunset Press — the staged shots. The four dossier screenshots, as one
// table: their names, their viewports, and the cover each one shows. The
// screenshot scripts and main.ts both read this table, so a screenshot can
// never drift from the dossier that describes it.
//
// The fix vs round 1 lives here: the editor shot is 1280x800, not 1440x900.
// The bounty caps every screenshot's long side at 1280 px, and the round-1
// editor shot at 1440 wide failed the harness gate on that alone.

export const SHOTS = [
  {
    name: '1-cover.jpg', mode: 'cover', size: 'landscape',
    w: 1280, h: 720, caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
  },
  {
    name: '2-editor.jpg', mode: 'editor', size: 'landscape',
    w: 1280, h: 800, caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
  },
  {
    name: '3-portrait.jpg', mode: 'cover', size: 'portrait',
    w: 1024, h: 1280, caption: 'NEON NIGHTS', sub: 'OCEAN DRIVE',
  },
  {
    name: '4-square.jpg', mode: 'cover', size: 'square',
    w: 1080, h: 1080, caption: 'PALM DUSK', sub: 'LAST LIGHT • 2026',
  },
];

// The bounty's screenshot rules (RULES.txt): JPEG, at most 256 KiB, long
// side at most 1280 px, short side at least 480 px.
export const SHOT_LIMITS = { maxBytes: 262144, maxLong: 1280, minShort: 480 };

// Validate one screenshot's dimensions and size. Returns a list of
// violations — empty means the shot is legal.
export function checkShot(name, w, h, bytes) {
  const problems = [];
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  if (bytes > SHOT_LIMITS.maxBytes) problems.push(`${name}: ${bytes} bytes exceeds ${SHOT_LIMITS.maxBytes}`);
  if (long > SHOT_LIMITS.maxLong) problems.push(`${name}: long side ${long} exceeds ${SHOT_LIMITS.maxLong}`);
  if (short < SHOT_LIMITS.minShort) problems.push(`${name}: short side ${short} below ${SHOT_LIMITS.minShort}`);
  return problems;
}
