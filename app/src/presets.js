// Sunset Press — presets: sizes, diagonal layouts, grades, samples, caption colours.
// All geometry is in fractions of the cover width (W) and height (H).
// Trio slant 0.08W (hero top-right 0.60W -> bottom-right 0.52W) per loop-history-v4
// W1 fix, verified against the approved v3 renders (design/shots-v3-iter3/).

export const INK = '#0E1A24';
export const PAPER = '#FFF6E8';
export const SUN = '#FFD94D';
export const PINK = '#FF5A8A';
export const ORANGE = '#FF6B35';
export const OCEAN = '#2E7FB8';
export const TEAL = '#1F8A7A';

export const SIZES = {
  landscape: {
    label: '1920 × 1080', exportW: 1920, exportH: 1080,
    caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
    capScale: 0.91, capGap: 0.076, ruleGap: 0.015, grade: 0,
  },
  portrait: {
    label: '1080 × 1350', exportW: 1080, exportH: 1350,
    caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026',
    capScale: 0.75, capGap: 0.073, ruleGap: 0.011, grade: 1,
  },
  square: {
    label: '1080 × 1080', exportW: 1080, exportH: 1080,
    caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY',
    capScale: 1.0, capGap: 0.077, ruleGap: 0.011, grade: 0,
  },
};

// Each layout is a list of slots. A slot is a polygon (fractions of W/H),
// a default sample and a focal point (fx, fy) the cover-fit centres on.
export const LAYOUTS = {
  trio: {
    name: 'Trio',
    slots: [
      { poly: [[0, 0], [0.60, 0], [0.52, 1], [0, 1]], sample: 'boulevard', fx: 0.5, fy: 0.35 },
      { poly: [[0.60, 0], [1, 0], [1, 0.5], [0.56, 0.5]], sample: 'nightdrive', fx: 0.48, fy: 0.5, zoom: 1.06 },
      { poly: [[0.56, 0.5], [1, 0.5], [1, 1], [0.52, 1]], sample: 'pier', fx: 0.44, fy: 0.424, zoom: 1.06 },
    ],
  },
  duo: {
    name: 'Duo',
    slots: [
      { poly: [[0, 0], [0.58, 0], [0.52, 1], [0, 1]], sample: 'boulevard', fx: 0.5, fy: 0.35 },
      { poly: [[0.58, 0], [1, 0], [1, 1], [0.52, 1]], sample: 'nightdrive', fx: 0.5, fy: 0.5 },
    ],
  },
  strip: {
    name: 'Strip',
    slots: [
      { poly: [[0, 0], [1, 0], [1, 0.55], [0, 0.62]], sample: 'boulevard', fx: 0.5, fy: 0.35 },
      { poly: [[0, 0.62], [0.54, 0.55], [0.50, 1], [0, 1]], sample: 'pier', fx: 0.5, fy: 0.45 },
      { poly: [[0.54, 0.55], [1, 0.55], [1, 1], [0.50, 1]], sample: 'street', fx: 0.5, fy: 0.5 },
    ],
  },
  quad: {
    name: 'Quad',
    slots: [
      { poly: [[0, 0], [0.55, 0], [0.50, 0.5], [0, 0.5]], sample: 'boulevard', fx: 0.5, fy: 0.35 },
      { poly: [[0.55, 0], [1, 0], [1, 0.5], [0.50, 0.5]], sample: 'nightdrive', fx: 0.5, fy: 0.5 },
      { poly: [[0, 0.5], [0.50, 0.5], [0.55, 1], [0, 1]], sample: 'pier', fx: 0.5, fy: 0.45 },
      { poly: [[0.50, 0.5], [1, 0.5], [1, 1], [0.55, 1]], sample: 'street', fx: 0.5, fy: 0.5 },
    ],
  },
};

// Grade washes drawn over the panels: { colour, alpha, composite }.
export const GRADES = [
  { name: 'Sunset', washes: [
    { c: '#FF6B35', a: 0.10, m: 'screen' },
    { c: '#FF5A8A', a: 0.18, m: 'screen' },
    { c: '#2E7FB8', a: 0.08, m: 'soft-light' },
  ] },
  { name: 'Neon', washes: [
    { c: '#FF5A8A', a: 0.30, m: 'screen' },
    { c: '#2E7FB8', a: 0.16, m: 'soft-light' },
  ] },
  { name: 'Noir', washes: [
    { c: '#8A97A8', a: 0.18, m: 'color' },
    { c: '#0E1A24', a: 0.12, m: 'multiply' },
  ] },
  { name: 'Palm', washes: [
    { c: '#1F8A7A', a: 0.20, m: 'screen' },
    { c: '#FFD94D', a: 0.10, m: 'screen' },
  ] },
  { name: 'Vice', washes: [
    { c: '#FF5A8A', a: 0.22, m: 'screen' },
    { c: '#2E7FB8', a: 0.20, m: 'overlay' },
  ] },
];

export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', file: 'samples/boulevard.jpg', fx: 0.5, fy: 0.35 },
  { id: 'nightdrive', name: 'Night Drive', file: 'samples/nightdrive.jpg', fx: 0.5, fy: 0.5 },
  { id: 'pier', name: 'Pier Dusk', file: 'samples/pier.jpg', fx: 0.5, fy: 0.45 },
  { id: 'street', name: 'Street', file: 'samples/street.jpg', fx: 0.5, fy: 0.5 },
];

export const CAPTION_COLORS = [
  { name: 'Paper', value: '#FFF6E8' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Sun', value: '#FFD94D' },
  { name: 'Pink', value: '#FF5A8A' },
  { name: 'Sky', value: '#8FD8FF' },
];

// Right edge x (fraction of W) of the hero polygon at a given y fraction.
// Used to cap the caption width so it never crosses the diagonal.
export function heroRightAtY(layout, yFrac) {
  const poly = LAYOUTS[layout].slots[0].poly;
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    if ((y1 <= yFrac && y2 >= yFrac) || (y2 <= yFrac && y1 >= yFrac)) {
      if (y2 === y1) { best = Math.max(best, x1, x2); continue; }
      const t = (yFrac - y1) / (y2 - y1);
      best = Math.max(best, x1 + (x2 - x1) * t);
    }
  }
  return best || 1;
}
