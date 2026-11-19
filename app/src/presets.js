// Sunset Press — layout, grade and size presets for the cover maker.
// Every layout is a list of panel slots; each slot is a polygon in fractions
// of the cover (0..1), so one layout fits every export size.

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080, short: '1080×1080' },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350, short: '1080×1350' },
  landscape: { label: 'Landscape · 1920 × 1080', w: 1920, h: 1080, short: '1920×1080' },
};

export const LAYOUTS = {
  diagonal: {
    label: 'Diagonal 3',
    hint: 'Hero left, two stacked right',
    slots: [
      [[0, 0], [0.64, 0], [0.54, 1], [0, 1]],
      [[0.64, 0], [1, 0], [1, 0.5], [0.59, 0.5]],
      [[0.59, 0.5], [1, 0.5], [1, 1], [0.54, 1]],
    ],
    dividers: [
      [[0.64, 0], [0.54, 1]],
      [[0.59, 0.5], [1, 0.5]],
    ],
  },
  grid: {
    label: 'Grid 4',
    hint: 'Four panels, diagonal split',
    slots: [
      [[0, 0], [0.58, 0], [0.48, 0.5], [0, 0.5]],
      [[0.58, 0], [1, 0], [1, 0.5], [0.48, 0.5]],
      [[0, 0.5], [0.48, 0.5], [0.42, 1], [0, 1]],
      [[0.48, 0.5], [1, 0.5], [1, 1], [0.42, 1]],
    ],
    dividers: [
      [[0.58, 0], [0.48, 0.5]],
      [[0.48, 0.5], [0.42, 1]],
      [[0, 0.5], [1, 0.5]],
    ],
  },
  hero: {
    label: 'Hero 3',
    hint: 'One wide hero, two below',
    slots: [
      [[0, 0], [1, 0], [1, 0.5], [0, 0.7]],
      [[0, 0.7], [0.5, 0.6], [0.5, 1], [0, 1]],
      [[0.5, 0.6], [1, 0.5], [1, 1], [0.5, 1]],
    ],
    dividers: [
      [[0, 0.7], [1, 0.5]],
      [[0.5, 0.6], [0.5, 1]],
    ],
  },
  duo: {
    label: 'Duo 2',
    hint: 'Two panels, diagonal cut',
    slots: [
      [[0, 0], [0.58, 0], [0.42, 1], [0, 1]],
      [[0.58, 0], [1, 0], [1, 1], [0.42, 1]],
    ],
    dividers: [
      [[0.58, 0], [0.42, 1]],
    ],
  },
};

export const GRADES = {
  sunset: {
    label: 'Sunset Strip',
    hint: 'Warm orange wash, sun glow',
    washTop: 'rgba(255, 107, 53, 0)',
    washBottom: 'rgba(255, 107, 53, 0.24)',
    glow: 'rgba(255, 217, 77, 0.38)',
    glowAt: [0.76, 0.16],
    tint: null,
    vignette: 0.3,
  },
  neon: {
    label: 'Neon Nights',
    hint: 'Pink dusk, cyan streets',
    washTop: 'rgba(255, 90, 138, 0.20)',
    washBottom: 'rgba(46, 127, 184, 0.22)',
    glow: 'rgba(255, 90, 138, 0.30)',
    glowAt: [0.2, 0.14],
    tint: null,
    vignette: 0.34,
  },
  noir: {
    label: 'Vice Noir',
    hint: 'Desaturated, hard contrast',
    washTop: 'rgba(14, 26, 36, 0.10)',
    washBottom: 'rgba(14, 26, 36, 0.30)',
    glow: 'rgba(255, 217, 77, 0.12)',
    glowAt: [0.5, 0.5],
    tint: 'grayscale(0.85) contrast(1.14)',
    vignette: 0.42,
  },
  dusk: {
    label: 'Palm Dusk',
    hint: 'Pink to amber evening',
    washTop: 'rgba(255, 90, 138, 0.16)',
    washBottom: 'rgba(255, 140, 40, 0.26)',
    glow: 'rgba(255, 217, 77, 0.26)',
    glowAt: [0.5, 0.08],
    tint: null,
    vignette: 0.3,
  },
};

export const SAMPLES = [
  { id: 'sample-street', name: 'Palms Motel', src: 'samples/street.jpg', fy: 0.1, fx: 0.5, thumbPos: 'center' },
  { id: 'sample-night', name: 'Night Drive', src: 'samples/nightdrive.jpg', fy: 0.5, fx: 0.5, thumbPos: 'center' },
  { id: 'sample-boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg', fy: 0.05, fx: 0.5, thumbPos: 'top' },
  { id: 'sample-pier', name: 'Pier', src: 'samples/pier.jpg', fy: 0.3, fx: 0.5, thumbPos: 'center 30%' },
];

export const DEFAULT_CAPTION = 'SUNSET DRIVE';
export const DEFAULT_SUBCAPTION = 'OCEAN DRIVE · EST. 2026';

export function defaultPanels(layoutId, fill = false) {
  const n = LAYOUTS[layoutId].slots.length;
  const photos = ['sample-street', 'sample-night', 'sample-boulevard', 'sample-pier'];
  return Array.from({ length: n }, (_, i) => ({
    photoId: fill ? photos[i % photos.length] : null,
    zoom: 1.12,
    ox: 0,
    oy: 0,
  }));
}
