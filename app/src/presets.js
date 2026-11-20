// Sunset Press — presets: sizes, diagonal layouts, sample photos, grades.
// All geometry is normalised (0..1 of the cover) so one preset serves
// every export size; the renderer multiplies by the real W/H.

export const INK = '#0E1A24';
export const PAPER = '#FFF6E8';
export const SUN = '#FFD94D';
export const PINK = '#FF5A8A';
export const ORANGE = '#FF6B35';
export const OCEAN = '#2E7FB8';
export const TEAL = '#1F8A7A';
export const PANEL_DARK = '#141E28';

export const SIZES = {
  wide: {
    id: 'wide', w: 1920, h: 1080, label: 'Wide · 1920×1080',
    capScale: 0.91, capGap: 0.076, ruleGap: 0.015,
    caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
  },
  portrait: {
    id: 'portrait', w: 1080, h: 1350, label: 'Portrait · 1080×1350',
    capScale: 0.75, capGap: 0.073, ruleGap: 0.011,
    caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026',
  },
  square: {
    id: 'square', w: 1080, h: 1080, label: 'Square · 1080²',
    capScale: 1.0, capGap: 0.077, ruleGap: 0.011,
    caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY',
  },
};

// Diagonal panel polygons, each a list of [x, y] in 0..1 space.
// The hero panel is always first; its right edge slants 0.08W (golden).
export const LAYOUTS = {
  trio: {
    id: 'trio', label: 'Sunset Trio',
    panels: [
      [[0, 0], [0.60, 0], [0.52, 1], [0, 1]],
      [[0.60, 0], [1, 0], [1, 0.5], [0.56, 0.5]],
      [[0.56, 0.5], [1, 0.5], [1, 1], [0.52, 1]],
    ],
  },
  duo: {
    id: 'duo', label: 'Split Duo',
    panels: [
      [[0, 0], [0.55, 0], [0.48, 1], [0, 1]],
      [[0.55, 0], [1, 0], [1, 1], [0.48, 1]],
    ],
  },
  strip: {
    id: 'strip', label: 'Hero Strip',
    panels: [
      [[0, 0], [1, 0], [1, 0.58], [0, 0.66]],
      [[0, 0.66], [1, 0.58], [1, 1], [0, 1]],
    ],
  },
  quad: {
    id: 'quad', label: 'Vice Quad',
    panels: [
      [[0, 0], [0.55, 0], [0.50, 0.5], [0, 0.5]],
      [[0.55, 0], [1, 0], [1, 0.5], [0.50, 0.5]],
      [[0, 0.5], [0.50, 0.5], [0.55, 1], [0, 1]],
      [[0.50, 0.5], [1, 0.5], [1, 1], [0.55, 1]],
    ],
  },
};

// Sample photos: one Vice City sunset world, four moments.
// focal is the point the cover-fit keeps centred (0..1 of the photo).
export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg', focal: { x: 0.5, y: 0.68 }, zoom: 1.35 },
  { id: 'nightdrive', label: 'Night Drive', src: 'samples/nightdrive.jpg', focal: { x: 0.48, y: 0.5 }, zoom: 1.06 },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg', focal: { x: 0.0, y: 0.424 }, zoom: 1.06 },
  { id: 'street', label: 'Street', src: 'samples/street.jpg', focal: { x: 0.5, y: 0.5 }, zoom: 1.0 },
];

// Five colour grades. Each wash is drawn full-canvas with its blend mode
// after the panels and before the lettering, so the type stays clean.
export const GRADES = [
  { id: 'neon', label: 'Neon', washes: [
    { color: PINK, alpha: 0.30, blend: 'screen' },
    { color: OCEAN, alpha: 0.16, blend: 'soft-light' },
  ] },
  { id: 'sunset', label: 'Sunset', washes: [
    { color: ORANGE, alpha: 0.28, blend: 'screen' },
    { color: PINK, alpha: 0.14, blend: 'soft-light' },
  ] },
  { id: 'dusk', label: 'Dusk', washes: [
    { color: '#7A4DBB', alpha: 0.22, blend: 'screen' },
    { color: OCEAN, alpha: 0.20, blend: 'soft-light' },
  ] },
  { id: 'mono', label: 'Mono', washes: [
    { color: '#888888', alpha: 0.35, blend: 'saturation' },
    { color: INK, alpha: 0.10, blend: 'multiply' },
  ] },
  { id: 'pastel', label: 'Pastel', washes: [
    { color: SUN, alpha: 0.18, blend: 'screen' },
    { color: TEAL, alpha: 0.12, blend: 'soft-light' },
  ] },
];

export const CAPTION_COLORS = [
  { id: 'paper', label: 'Paper', value: PAPER },
  { id: 'white', label: 'White', value: '#FFFFFF' },
  { id: 'sun', label: 'Sun', value: SUN },
  { id: 'pink', label: 'Pink', value: PINK },
  { id: 'teal', label: 'Teal', value: TEAL },
];

// Caption geometry (fractions of H unless noted, all measured vs golden).
export const CAPTION = {
  nominal: 0.16,        // × H × capScale × size slider
  sizeMin: 0.7, sizeMax: 1.3, sizeDefault: 1.1,
  wrapThreshold: 0.72,  // wrap when the one-line fit drops below this of nominal
  oneLineFloor: 0.55,   // never shrink a one-liner below this of nominal
  subScale: 0.38,       // sub size relative to the drawn caption size
  subBaseline: 0.939,   // × H
  subTracking: 0.08,    // em
  captionX: 0.040,      // × W, left edge of the caption block
  ruleHeight: 0.012,    // × H
  ruleWidth: 0.34,      // of the widest caption line
  maxWTrim: 0.07,       // caption max width = hero right edge − this × W
};

// Sun badge geometry (fractions of W/H).
export const BADGE = {
  cx: 0.058, cy: 0.069,       // centre, caption Bottom
  discR: 0.0105, ringR: 0.025,
  ringWidth: 0.0018, ringDash: [0.005, 0.009],
  tickCentre: 0.018, tickArm: 0.0035, tickThick: 0.0022,
};

export const FRAME = 0.01; // ink frame thickness, × W
