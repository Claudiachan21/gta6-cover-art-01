// Sunset Press — presets: sizes, diagonal layouts, colour grades, sample photos.
// Every value here is a design decision from DESIGN.md; the renderer in
// render.js only reads these tables, it never hard-codes a look.

export const INK = '#0E1A24';
export const PAPER = '#FFF6E8';
export const SUN = '#FFD94D';
export const SUNSET = '#FF6B35';
export const NEON = '#FF5A8A';
export const OCEAN = '#2E7FB8';
export const TEAL = '#1F8A7A';

// Export sizes the bounty asks for, keyed by the size buttons in the UI.
export const SIZES = {
  square: { label: '1080 × 1080', width: 1080, height: 1080, capScale: 1.0 },
  portrait: { label: '1080 × 1350', width: 1080, height: 1350, capScale: 0.75 },
  landscape: { label: '1920 × 1080', width: 1920, height: 1080, capScale: 0.91 },
};

// Four diagonal panel layouts. Points are normalised [x, y] polygons; the
// first panel of every layout is the hero, where the caption lives.
export const LAYOUTS = [
  {
    id: 'trio',
    name: 'Sunset Trio',
    panels: [
      { points: [[0, 0], [0.62, 0], [0.54, 1], [0, 1]], photo: 'boulevard', focal: [0.5, 0.35] },
      { points: [[0.62, 0], [1, 0], [1, 0.48], [0.545, 0.5]], photo: 'nightdrive', focal: [0.5, 0.55] },
      { points: [[0.545, 0.5], [1, 0.48], [1, 1], [0.54, 1]], photo: 'pier', focal: [0.5, 0.5] },
    ],
  },
  {
    id: 'duo',
    name: 'Split Duo',
    panels: [
      { points: [[0, 0], [0.55, 0], [0.45, 1], [0, 1]], photo: 'boulevard', focal: [0.5, 0.35] },
      { points: [[0.55, 0], [1, 0], [1, 1], [0.45, 1]], photo: 'street', focal: [0.5, 0.5] },
    ],
  },
  {
    id: 'strip',
    name: 'Hero Strip',
    panels: [
      { points: [[0, 0], [1, 0], [1, 0.62], [0, 0.7]], photo: 'pier', focal: [0.5, 0.45] },
      { points: [[0, 0.7], [0.5, 0.66], [0.5, 1], [0, 1]], photo: 'boulevard', focal: [0.5, 0.35] },
      { points: [[0.5, 0.66], [1, 0.62], [1, 1], [0.5, 1]], photo: 'nightdrive', focal: [0.5, 0.55] },
    ],
  },
  {
    id: 'quad',
    name: 'Vice Quad',
    panels: [
      { points: [[0, 0], [0.52, 0], [0.48, 0.5], [0, 0.54]], photo: 'boulevard', focal: [0.5, 0.35] },
      { points: [[0.52, 0], [1, 0], [1, 0.46], [0.48, 0.5]], photo: 'street', focal: [0.5, 0.5] },
      { points: [[0, 0.54], [0.48, 0.5], [0.52, 1], [0, 1]], photo: 'nightdrive', focal: [0.5, 0.55] },
      { points: [[0.48, 0.5], [1, 0.46], [1, 1], [0.52, 1]], photo: 'pier', focal: [0.5, 0.45] },
    ],
  },
];

// Five grades. Each wash is a full-cover fill: colour, strength, blend mode.
// Neon is the strongest wash — pink screen 0.30, blue soft-light 0.16 —
// tuned so a portrait sky lands dusky blue-grey, not magenta.
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    washes: [
      { color: '#FF6B35', alpha: 0.18, blend: 'screen' },
      { color: '#FF5A8A', alpha: 0.12, blend: 'soft-light' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    washes: [
      { color: '#FF5A8A', alpha: 0.3, blend: 'screen' },
      { color: '#2E7FB8', alpha: 0.16, blend: 'soft-light' },
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean Drive',
    washes: [
      { color: '#2E7FB8', alpha: 0.22, blend: 'overlay' },
      { color: '#1F8A7A', alpha: 0.12, blend: 'soft-light' },
    ],
  },
  {
    id: 'vice',
    name: 'Vice Pink',
    washes: [
      { color: '#FF5A8A', alpha: 0.2, blend: 'overlay' },
      { color: '#FFD94D', alpha: 0.1, blend: 'screen' },
    ],
  },
  {
    id: 'noir',
    name: 'Noir',
    washes: [
      { color: '#0E1A24', alpha: 0.2, blend: 'soft-light' },
      { color: '#8a8a8a', alpha: 0.15, blend: 'overlay' },
    ],
  },
];

// Sample photos shipped with the app (AI-made, free to use). The key is the
// file stem under app/samples/; focal is the [x, y] point a panel centres on.
export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg', focal: [0.5, 0.35] },
  { id: 'nightdrive', label: 'Night Drive', file: 'samples/nightdrive.jpg', focal: [0.5, 0.55] },
  { id: 'pier', label: 'Pier', file: 'samples/pier.jpg', focal: [0.5, 0.45] },
  { id: 'street', label: 'Street', file: 'samples/street.jpg', focal: [0.5, 0.5] },
];

// Caption colours offered as swatches in the Text tab.
export const CAPTION_COLORS = ['#FFF6E8', '#FFD94D', '#FF6B35', '#FF5A8A', '#7FD4C7'];

// Defaults for a fresh editor: landscape cover, trio layout, sunset grade.
export const DEFAULTS = {
  size: 'landscape',
  layout: 0,
  grade: 0,
  caption: 'SUNSET DRIVE',
  sub: 'OCEAN DRIVE • EST. 2026',
  captionColor: '#FFF6E8',
  captionSize: 1.1,
  captionPos: 'bottom',
};

// Per-shot staging used by shots.js: which state each dossier screenshot
// shows. Cover = the exported landscape art; editor = the app at work.
export const SHOTS = {
  cover: { size: 'landscape', layout: 0, grade: 0, caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026' },
  editor: { size: 'landscape', layout: 0, grade: 0, caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026' },
  portrait: { size: 'portrait', layout: 0, grade: 1, caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026' },
  square: { size: 'square', layout: 0, grade: 3, caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY' },
};
