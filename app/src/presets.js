// Sunset Press — presets: the sample photos, the colour grades, the panel
// layouts and the per-size defaults. One world, one woman, one convertible,
// sunset and neon. Everything here is a design token, not a setting: the
// grades are washes, the layouts are slanted polygons, and the caption
// scale belongs to the size (a portrait poster letters smaller than a
// landscape one, because its hero is narrower).

// The four sample photos, all from the same shoot. `focal` is the point the
// cover-fit window centres on — the sign or the face the diagonal must
// never cut. `label` is the name shown under the thumbnail.
export const SAMPLES = [
  { id: 'street', file: 'street.jpg', label: 'Palms Motel', focal: { x: 0.55, y: 0.45 } },
  { id: 'nightdrive', file: 'nightdrive.jpg', label: 'Night Drive', focal: { x: 0.6, y: 0.55 } },
  { id: 'boulevard', file: 'boulevard.jpg', label: 'Boulevard', focal: { x: 0.5, y: 0.35 } },
  { id: 'pier', file: 'pier.jpg', label: 'Pier', focal: { x: 0.5, y: 0.45 } },
];

// Colour grades: each is a list of full-cover washes drawn over the panels
// (never under the caption), in order. `op` is a canvas composite mode,
// `color` a fill, `alpha` its strength. All washes are warm or neon — the
// grade is the sunset, not a filter preset.
export const GRADES = [
  {
    id: 'sunset', name: 'Sunset', swatch: '#FF6B35',
    steps: [
      { op: 'overlay', color: '#FF6B35', alpha: 0.16 },
      { op: 'soft-light', color: '#FFD94D', alpha: 0.22 },
    ],
  },
  {
    id: 'neon', name: 'Neon', swatch: '#FF5A8A',
    steps: [
      { op: 'screen', color: '#FF5A8A', alpha: 0.30 },
      { op: 'soft-light', color: '#2E7FB8', alpha: 0.16 },
    ],
  },
  {
    id: 'dusk', name: 'Dusk', swatch: '#7A4A8A',
    steps: [
      { op: 'multiply', color: '#5A2A78', alpha: 0.16 },
      { op: 'screen', color: '#FF6B35', alpha: 0.14 },
      { op: 'soft-light', color: '#FFD94D', alpha: 0.12 },
    ],
  },
  {
    id: 'gold', name: 'Gold', swatch: '#FFD94D',
    steps: [
      { op: 'soft-light', color: '#FFD94D', alpha: 0.3 },
      { op: 'overlay', color: '#FFB347', alpha: 0.1 },
    ],
  },
  {
    id: 'noir', name: 'Noir', swatch: '#0E1A24',
    steps: [
      { op: 'saturation', color: '#808080', alpha: 0.9 },
      { op: 'overlay', color: '#0E1A24', alpha: 0.18 },
      { op: 'soft-light', color: '#FFD94D', alpha: 0.08 },
    ],
  },
];

// Panel layouts. Each layout is a function of (W, H) returning an array of
// polygons (arrays of [x, y] in pixels). The first polygon is the hero — the
// caption lives inside it for diagonal and duo. Dividers are slanted, never
// straight verticals: that slant is the poster's signature.
//   diagonal: hero left + two stacked right panels (the default cover).
//   grid:     four panels, 2x2 with the same slanted divider (diagonal-4).
//   hero:     one full-bleed photo, caption on an ink scrim strip.
//   duo:      two panels split by one diagonal.
export const LAYOUTS = {
  diagonal: {
    name: 'Diagonal 3', panels: 3, captionPanel: 0,
    polygons(W, H) {
      return [
        [[0, 0], [0.62 * W, 0], [0.5 * W, H], [0, H]],
        [[0.62 * W, 0], [W, 0], [W, 0.5 * H], [0.56 * W, 0.5 * H]],
        [[0.56 * W, 0.5 * H], [W, 0.5 * H], [W, H], [0.5 * W, H]],
      ];
    },
  },
  grid: {
    name: 'Grid 4', panels: 4, captionPanel: 0,
    polygons(W, H) {
      return [
        [[0, 0], [0.55 * W, 0], [0.5 * W, 0.5 * H], [0, 0.5 * H]],
        [[0.55 * W, 0], [W, 0], [W, 0.5 * H], [0.5 * W, 0.5 * H]],
        [[0, 0.5 * H], [0.5 * W, 0.5 * H], [0.45 * W, H], [0, H]],
        [[0.5 * W, 0.5 * H], [W, 0.5 * H], [W, H], [0.45 * W, H]],
      ];
    },
  },
  hero: {
    name: 'Hero 1', panels: 1, captionPanel: 0,
    polygons(W, H) {
      return [[[0, 0], [W, 0], [W, H], [0, H]]];
    },
  },
  duo: {
    name: 'Duo 2', panels: 2, captionPanel: 0,
    polygons(W, H) {
      return [
        [[0, 0], [0.58 * W, 0], [0.48 * W, H], [0, H]],
        [[0.58 * W, 0], [W, 0], [W, H], [0.48 * W, H]],
      ];
    },
  },
};

// The five caption colours. White is the default; gold is the sub-caption's
// colour in the staged covers.
export const CAPTION_COLORS = [
  { id: 'white', hex: '#FFFFFF', label: 'White' },
  { id: 'gold', hex: '#FFD94D', label: 'Gold' },
  { id: 'neon', hex: '#FF5A8A', label: 'Neon pink' },
  { id: 'blue', hex: '#2E7FB8', label: 'Blue' },
  { id: 'ink', hex: '#0E1A24', label: 'Ink' },
];

// The caption-size slider: 0.7–1.3, default 1.1.
export const CAPTION_SCALE = { min: 0.7, max: 1.3, default: 1.1 };

// Per-size defaults: the three staged covers. The caption and the grade
// belong to the size — landscape is a sunset drive, portrait a neon night,
// square a palm dusk — and the hero photo is the one whose sign or face the
// diagonal must not cut. `capScale` is the caption's per-size scale: one
// nominal size cannot fit all three heroes, because a portrait hero is
// narrower than a square one while its caption must stay one line.
export const SIZE_DEFAULTS = {
  landscape: {
    layout: 'diagonal', grade: 'sunset', capScale: 0.91,
    caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
    panels: ['street', 'nightdrive', 'boulevard'],
  },
  portrait: {
    layout: 'diagonal', grade: 'neon', capScale: 0.75,
    caption: 'NEON NIGHTS', sub: 'OCEAN DRIVE',
    panels: ['nightdrive', 'boulevard', 'street'],
  },
  square: {
    layout: 'diagonal', grade: 'dusk', capScale: 1.0,
    caption: 'PALM DUSK', sub: 'LAST LIGHT • 2026',
    panels: ['street', 'nightdrive', 'boulevard'],
  },
};

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || null;
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
