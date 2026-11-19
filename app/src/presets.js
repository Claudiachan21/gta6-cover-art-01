// Sunset Press — shared presets: sizes, samples, layouts, grades, colours.
// Everything the renderer and the editor agree on lives here, in one place,
// so a layout or grade change only ever needs a single edit.

export const INK = '#0E1A24';
export const PAPER = '#FFF6E8';
export const SUN = '#FFD94D';
export const PINK = '#FF5A8A';
export const ORANGE = '#FF6B35';

// Post sizes the bounty asks for. Label is what the editor shows.
export const SIZES = {
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
};

// Per-size defaults: the caption, sub-caption, grade and caption scale the
// dossier covers are staged with. capScale exists because one nominal size
// cannot fit all three aspect ratios: portrait needs a smaller nominal so
// "NEON RUN" still fits on one line, square needs the full size so
// "PALM DUSK" wraps into two big lines.
export const SIZE_DEFAULTS = {
  wide: { caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026', grade: 0, capScale: 0.91 },
  portrait: { caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026', grade: 1, capScale: 0.75 },
  square: { caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY', grade: 0, capScale: 1.0 },
};

// The four sample photos shipped with the app (AI-made, free to use).
// focal is the point of the photo the panel centres on by default.
export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg', focal: { x: 0.5, y: 0.35 } },
  { id: 'nightdrive', name: 'Night Drive', src: 'samples/nightdrive.jpg', focal: { x: 0.5, y: 0.5 } },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg', focal: { x: 0.5, y: 0.45 } },
  { id: 'street', name: 'Street', src: 'samples/street.jpg', focal: { x: 0.5, y: 0.5 } },
];

// Diagonal multi-panel layouts. Every polygon is a list of [x, y] fractions
// of the canvas; panel 0 is always the hero and always carries the caption.
// The shared diagonal edge leans left as it runs down (top x larger than
// bottom x), which is what makes the poster read as one slanted composition.
export const LAYOUTS = {
  trio: {
    name: 'Sunset Trio',
    panels: [
      [[0, 0], [0.61, 0], [0.56, 1], [0, 1]],
      [[0.61, 0], [1, 0], [1, 0.5], [0.585, 0.5]],
      [[0.585, 0.5], [1, 0.5], [1, 1], [0.56, 1]],
    ],
  },
  duo: {
    name: 'Split Duo',
    panels: [
      [[0, 0], [0.64, 0], [0.58, 1], [0, 1]],
      [[0.64, 0], [1, 0], [1, 1], [0.58, 1]],
    ],
  },
  strip: {
    name: 'Hero Strip',
    panels: [
      [[0, 0], [1, 0], [1, 0.64], [0, 0.64]],
      [[0, 0.64], [0.36, 0.64], [0.32, 1], [0, 1]],
      [[0.36, 0.64], [0.69, 0.64], [0.65, 1], [0.32, 1]],
      [[0.69, 0.64], [1, 0.64], [1, 1], [0.65, 1]],
    ],
  },
  quad: {
    name: 'Vice Quad',
    panels: [
      [[0, 0], [0.53, 0], [0.49, 0.5], [0, 0.5]],
      [[0.53, 0], [1, 0], [1, 0.5], [0.49, 0.5]],
      [[0, 0.5], [0.49, 0.5], [0.45, 1], [0, 1]],
      [[0.49, 0.5], [1, 0.5], [1, 1], [0.45, 1]],
    ],
  },
};

// Five colour grades. Each is two full-canvas washes applied after the
// photos: a screen wash that lifts the brights, then a soft-light wash
// that tints the mids. Neon is the loudest (pink screen 0.30); Sunset is
// the warm default for the landscape and square covers.
export const GRADES = [
  { name: 'Sunset', dot: '#FF6B35', washes: [['screen', 'rgba(255,122,40,0.16)'], ['soft-light', 'rgba(255,90,138,0.10)']] },
  { name: 'Neon', dot: '#FF5A8A', washes: [['screen', 'rgba(255,90,138,0.30)'], ['soft-light', 'rgba(46,127,184,0.16)']] },
  { name: 'Dusk', dot: '#7A54BE', washes: [['screen', 'rgba(122,84,190,0.22)'], ['soft-light', 'rgba(255,140,60,0.10)']] },
  { name: 'Teal', dot: '#1F8A7A', washes: [['screen', 'rgba(31,138,122,0.20)'], ['soft-light', 'rgba(46,127,184,0.12)']] },
  { name: 'Noir', dot: '#141E28', washes: [['overlay', 'rgba(16,20,28,0.22)'], ['screen', 'rgba(255,255,255,0.06)']] },
];

// Caption ink choices in the Teks tab. Paper is the default.
export const CAPTION_COLORS = [
  { name: 'Paper', value: '#FFF6E8' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Sun', value: '#FFD94D' },
  { name: 'Pink', value: '#FF5A8A' },
  { name: 'Ocean', value: '#7FC4E8' },
];
