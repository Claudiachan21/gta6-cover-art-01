// Sunset Press — presets: sizes, diagonal layouts, samples, grades, caption math.
// All geometry is fractions of the cover (W, H) so one spec drives every post size.
export const INK = '#0E1A24';
export const PAPER = '#FFF6E8';
export const SUNSET = '#FF6B35';
export const SUN = '#FFD94D';
export const PINK = '#FF5A8A';
export const OCEAN = '#2E7FB8';
export const TEAL = '#1F8A7A';
export const PANEL_DARK = '#141E28';

export const CAPTION = {
  x: 0.04, // captionX — left edge of the caption block, fraction of W
  nominal: 0.16, // nominal caption size, fraction of H
  wrapAt: 0.72, // wrap to two lines when one line fits below 72% of nominal
  subScale: 0.38, // sub-caption size as a fraction of the fitted caption size
  subTracking: 0.08, // sub letter-spacing, em
  subBaseline: 0.939, // sub-caption baseline, fraction of H
  maxWTrim: 0.07, // caption max width = hero right edge minus this, fraction of W
  ruleWidth: 0.34, // pink rule width as a fraction of the widest caption line
  ruleHeight: 0.012, // pink rule height, fraction of H
  sliderMin: 0.7,
  sliderMax: 1.3,
  sliderDefault: 1.1,
};

export const BADGE = {
  cx: 0.058, // badge centre x, fraction of W (mirrored when caption is Top)
  cy: 0.069, // badge centre y, fraction of H
  discR: 0.011, // sun disc radius, fraction of W
  ringR: 0.025, // dashed ring radius, fraction of W
  ringW: 0.0018, // ring stroke width, fraction of W
  ringDash: [0.005, 0.009], // ring dash pattern, fractions of W
  tickC: 0.018, // PLUS tick centre distance from badge centre, fraction of W
  tickArm: 0.003, // PLUS tick half-arm, fraction of W
  tickW: 0.0035, // PLUS tick stroke width, fraction of W
};

export const FRAME_W = 0.01; // ink frame thickness, fraction of W

export const SIZES = {
  landscape: {
    id: 'landscape', w: 1920, h: 1080, label: '1920 × 1080', chip: 'Wide · 1920×1080',
    capScale: 0.91, capGap: 0.076, ruleGap: 0.015,
    caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026',
  },
  portrait: {
    id: 'portrait', w: 1080, h: 1350, label: '1080 × 1350', chip: 'Portrait · 1080×1350',
    capScale: 0.75, capGap: 0.073, ruleGap: 0.011,
    caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026',
  },
  square: {
    id: 'square', w: 1080, h: 1080, label: '1080 × 1080', chip: 'Square · 1080²',
    capScale: 1.0, capGap: 0.077, ruleGap: 0.011,
    caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY',
  },
};

// Diagonal multi-panel layouts. Each panel is a polygon of [x, y] fractions.
// The first panel is the hero (large, left); the rest fill the right side.
export const LAYOUTS = {
  trio: {
    id: 'trio', label: 'Sunset Trio',
    polys: [
      [[0, 0], [0.60, 0], [0.52, 1], [0, 1]],
      [[0.60, 0], [1, 0], [1, 0.5], [0.56, 0.5]],
      [[0.56, 0.5], [1, 0.5], [1, 1], [0.52, 1]],
    ],
  },
  duo: {
    id: 'duo', label: 'Split Duo',
    polys: [
      [[0, 0], [0.55, 0], [0.47, 1], [0, 1]],
      [[0.55, 0], [1, 0], [1, 1], [0.47, 1]],
    ],
  },
  strip: {
    id: 'strip', label: 'Hero Strip',
    polys: [
      [[0, 0], [1, 0], [1, 0.58], [0, 0.66]],
      [[0, 0.66], [0.52, 0.58], [0.48, 1], [0, 1]],
      [[0.52, 0.58], [1, 0.58], [1, 1], [0.48, 1]],
    ],
  },
  quad: {
    id: 'quad', label: 'Vice Quad',
    polys: [
      [[0, 0], [0.52, 0], [0.48, 0.5], [0, 0.5]],
      [[0.52, 0], [1, 0], [1, 0.5], [0.48, 0.5]],
      [[0, 0.5], [0.48, 0.5], [0.52, 1], [0, 1]],
      [[0.48, 0.5], [1, 0.5], [1, 1], [0.52, 1]],
    ],
  },
};

// Sample photos (AI-made, free to use). fx/fy is the focal point the panel
// centres on; zoom is the starting cover-fit multiplier. Pier sits at fx 0
// so the motel sign survives the right-edge crop; boulevard focal y 0.35
// keeps the face and sky inside short wide panels.
export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg', fx: 0.5, fy: 0.35, zoom: 1.0 },
  { id: 'nightdrive', label: 'Night Drive', src: 'samples/nightdrive.jpg', fx: 0.48, fy: 0.5, zoom: 1.06 },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg', fx: 0, fy: 0.424, zoom: 1.06 },
  { id: 'street', label: 'Street', src: 'samples/street.jpg', fx: 0.5, fy: 0.5, zoom: 1.0 },
];

// Five colour grades. Each is a screen wash plus a soft-light wash over the
// photos (never over the caption, which is drawn afterwards).
export const GRADES = [
  { id: 'sunset', label: 'Sunset', screen: [PINK, 0.30], soft: [OCEAN, 0.16] },
  { id: 'neon', label: 'Vice Neon', screen: [PINK, 0.38], soft: [OCEAN, 0.22] },
  { id: 'golden', label: 'Golden Hour', screen: [SUNSET, 0.25], soft: [SUN, 0.12] },
  { id: 'midnight', label: 'Midnight', screen: [OCEAN, 0.25], soft: [PINK, 0.10] },
  { id: 'rose', label: 'Rose', screen: [PINK, 0.22], soft: [TEAL, 0.10] },
];

export const CAPTION_COLORS = [
  { id: 'paper', label: 'Paper', value: PAPER },
  { id: 'sun', label: 'Sun', value: SUN },
  { id: 'white', label: 'White', value: '#FFFFFF' },
  { id: 'pink', label: 'Pink', value: PINK },
  { id: 'ocean', label: 'Ocean', value: OCEAN },
];

// Hero right edge x (fraction of W) at a given y — the caption's max width
// is this minus CAPTION.maxWTrim. Trio's right edge slants 0.60 -> 0.52.
export function heroRightX(layout, yFrac) {
  const hero = LAYOUTS[layout].polys[0];
  let top = null;
  let bottom = null;
  for (const [x, y] of hero) {
    if (y === 0 && x > 0) top = x;
    if (y === 1 && x > 0) bottom = x;
  }
  if (top === null) top = 1;
  if (bottom === null) bottom = 1;
  return top + (bottom - top) * yFrac;
}
