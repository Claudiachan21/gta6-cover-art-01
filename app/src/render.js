// Sunset Press — the renderer. One function, renderCover, paints a poster
// onto any 2D context: the photos clipped into their slanted panels, the
// gold dividers, the grade washes, the lettered caption and the sun badge.
// The preview canvas and the PNG export share this exact code path, so
// what you see is what the export is.

import { LAYOUTS, gradeById } from './presets.js';

const INK = '#0E1A24';
const PAPER = '#FFF6E8';
const GOLD = '#FFD94D';
const PINK = '#FF5A8A';

// ---------------------------------------------------------------- fonts

function setMainFont(ctx, size, tracking = 0.02) {
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.letterSpacing = `${(size * tracking).toFixed(1)}px`;
  ctx.textBaseline = 'alphabetic';
}

function setSubFont(ctx, size, tracking = 0.08) {
  ctx.font = `700 ${size}px Inter, sans-serif`;
  ctx.letterSpacing = `${(size * tracking).toFixed(1)}px`;
  ctx.textBaseline = 'alphabetic';
}

// ------------------------------------------------------------- text fit

// Greedy word wrap for the main caption. Single words longer than the cap
// are left whole (a poster word is never hyphenated).
function wrapLines(ctx, text, cap) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= cap || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

// Fit text into `cap` pixels. One line if it fits at or above the wrap
// threshold (72% of nominal); below that the type gets too small for a
// poster, so wrap at the nominal size instead and shrink the wrapped lines
// only until they fit. This is what keeps "PALM DUSK" two big lines instead
// of one small line. The shrink steps down ~3% at a time and never below
// the floor. With noWrap (the sub-caption), never wrap: shrink the single
// line all the way to the floor instead — a sub drawn on two lines at one
// baseline would print over itself.
function fitText(ctx, text, cap, nominal, floorFrac, trackingFrac = 0.02, noWrap = false, sub = false) {
  const setFont = (size) => (sub ? setSubFont(ctx, size, trackingFrac) : setMainFont(ctx, size, trackingFrac));
  const floor = Math.max(10, nominal * floorFrac);
  const wrapAt = nominal * 0.72;
  let size = nominal;
  setFont(size);
  if (ctx.measureText(text).width <= cap) return { size, lines: [text] };
  while (size > (noWrap ? floor : wrapAt)) {
    size = Math.max(noWrap ? floor : wrapAt, size - Math.max(1, size * 0.03));
    setFont(size);
    if (ctx.measureText(text).width <= cap) return { size, lines: [text] };
  }
  if (noWrap) return { size: floor, lines: [text] };
  size = nominal;
  setFont(size);
  let lines = wrapLines(ctx, text, cap);
  while (size > floor) {
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= cap) return { size, lines };
    size = Math.max(floor, size - Math.max(1, size * 0.03));
    setFont(size);
    lines = wrapLines(ctx, text, cap);
  }
  return { size: floor, lines };
}

// ------------------------------------------------------------- geometry

// The hero polygon's right edge at height y (used for the caption cap).
function heroRightEdge(layout, W, H, y) {
  const hero = layout.polygons(W, H)[layout.captionPanel || 0];
  let right = 0;
  for (const [x, py] of hero) {
    if (py <= y) right = Math.max(right, x);
  }
  // Interpolate along the slanted edge for a tighter cap.
  const pts = hero.slice().sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (y1 <= y && y <= y2 && y2 > y1) {
      right = Math.max(right, x1 + ((x2 - x1) * (y - y1)) / (y2 - y1));
    }
  }
  return right;
}

function polygonBBox(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

// --------------------------------------------------------------- photos

// Draw one photo into its panel, cover-fit, centred on the photo's focal
// point and shifted by the panel's drag pan. The image always covers the
// panel's bounding box — no gaps, ever.
function drawPhoto(ctx, img, poly, focal, zoom, pan) {
  const box = polygonBBox(poly);
  if (box.w <= 0 || box.h <= 0 || !img || !img.naturalWidth) return;
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * (zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  let dx = box.x + box.w / 2 - focal.x * dw;
  let dy = box.y + box.h / 2 - focal.y * dh;
  dx = Math.min(box.x, Math.max(box.x + box.w - dw, dx));
  dy = Math.min(box.y, Math.max(box.y + box.h - dh, dy));
  dx += (pan && pan.x) || 0;
  dy += (pan && pan.y) || 0;
  dx = Math.min(box.x, Math.max(box.x + box.w - dw, dx));
  dy = Math.min(box.y, Math.max(box.y + box.h - dh, dy));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// The gold dividers: every polygon edge that is not on the cover boundary
// gets a gold line. The slant is the poster's signature, so the dividers
// are drawn, never implied.
function drawDividers(ctx, W, H, polys) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, 0.0035 * W);
  ctx.lineJoin = 'round';
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      const onBoundary = (x, y) => x <= 0 || x >= W || y <= 0 || y >= H;
      if (onBoundary(x1, y1) && onBoundary(x2, y2)) continue;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------ sun badge

// The sun badge: a sun-yellow disc with a hard ink outline, a dashed orbit
// ring, and a small plus tick at each cardinal point — the poster's
// signature mark, top-left of every cover (top-right when the caption is
// at the top, so it never sits on the first letter).
function drawSunBadge(ctx, W, H, right = false) {
  const cx = right ? W - 0.05 * W : 0.05 * W;
  const cy = 0.075 * H;
  const r = 0.013 * W;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
  ctx.setLineDash([Math.max(2, 0.35 * r), Math.max(2, 0.3 * r)]);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, 0.09 * r);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, 0.11 * r);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const r0 = r * 1.3;
    const r1 = r * 1.95;
    ctx.beginPath();
    ctx.moveTo(cx + dx * r0, cy + dy * r0);
    ctx.lineTo(cx + dx * r1, cy + dy * r1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dx * r * 1.6 - dy * r * 0.28, cy + dy * r * 1.6 + dx * r * 0.28);
    ctx.lineTo(cx + dx * r * 1.6 + dy * r * 0.28, cy + dy * r * 1.6 - dx * r * 0.28);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, 0.0016 * W);
  ctx.stroke();
  ctx.restore();
}

// -------------------------------------------------------------- caption

// The lettered caption: Anton main caption, Inter sub-caption, a pink rule
// above the main caption's top glyph. The block is anchored by the sub's
// baseline (0.94H at the bottom, or the cap top at 0.14H at the top) so the
// caption never crosses the divider and never collides with the sub.
function drawCaption(ctx, W, H, state, layout) {
  const caption = (state.caption || '').toUpperCase();
  const sub = (state.sub || '').toUpperCase();
  const x = 0.04 * W;
  const top = state.captionPos === 'top';
  const capScale = state.captionScale || 1;
  const nominal = 0.16 * H * capScale * (state.capScale || 1);
  const anchorY = top ? 0.14 * H : 0.94 * H;
  const cap = Math.min(0.55 * W, heroRightEdge(layout, W, H, anchorY) - x - 0.01 * W);
  const main = caption ? fitText(ctx, caption, cap, nominal, 0.55) : { size: nominal * 0.55, lines: [] };
  const subFit = sub ? fitText(ctx, sub, Math.min(0.55 * W, heroRightEdge(layout, W, H, anchorY) - x - 0.01 * W), main.size * 0.38, 0.5, 0.08, true, true) : { size: 0, lines: [] };
  const subSize = subFit.size;
  const subLines = subFit.lines;

  // Baselines: bottom-anchored by the sub, top-anchored by the cap top.
  let firstMainBaseline;
  let subBaseline;
  if (top) {
    firstMainBaseline = anchorY + main.size * 0.72;
    const lastMainBaseline = firstMainBaseline + (main.lines.length - 1) * main.size * 1.02;
    subBaseline = lastMainBaseline + main.size * 0.3 + subSize;
  } else {
    subBaseline = anchorY;
    const lastMainBaseline = subBaseline - subSize - main.size * 0.3;
    firstMainBaseline = lastMainBaseline - (main.lines.length - 1) * main.size * 1.02;
  }

  // The pink rule sits above the main caption's top glyph, 34% of the
  // widest line — a signature, not a decoration.
  setMainFont(ctx, main.size);
  const widest = main.lines.length
    ? Math.max(...main.lines.map((l) => ctx.measureText(l).width))
    : 0;
  const ascent = main.lines.length
    ? ctx.measureText(main.lines[0]).actualBoundingBoxAscent || main.size * 0.72
    : main.size * 0.72;
  const ruleY = top ? anchorY - 0.014 * H : firstMainBaseline - ascent - 0.014 * H;
  if (widest > 0) {
    ctx.save();
    ctx.fillStyle = PINK;
    ctx.fillRect(x, ruleY, widest * 0.34, Math.max(3, 0.006 * H));
    ctx.restore();
  }

  // The main caption: filled in the chosen colour, outlined in ink (or in
  // paper when the caption itself is ink, so it still reads on the photo).
  const outline = state.captionColor === INK ? PAPER : INK;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  main.lines.forEach((line, i) => {
    const baseline = firstMainBaseline + i * main.size * 1.02;
    setMainFont(ctx, main.size);
    ctx.lineWidth = Math.max(2, main.size * 0.09);
    ctx.strokeStyle = outline;
    ctx.strokeText(line, x, baseline);
    ctx.fillStyle = state.captionColor || '#FFFFFF';
    ctx.fillText(line, x, baseline);
  });
  // The sub-caption: always gold, one line, same ink outline.
  subLines.forEach((line) => {
    setSubFont(ctx, subSize);
    ctx.lineWidth = Math.max(1.5, subSize * 0.09);
    ctx.strokeStyle = outline;
    ctx.strokeText(line, x, subBaseline);
    ctx.fillStyle = GOLD;
    ctx.fillText(line, x, subBaseline);
  });
  ctx.restore();

  return { mainLines: main.lines, subLines, mainSize: main.size, subSize };
}

// ------------------------------------------------------------ the cover

export function renderCover(ctx, W, H, state, images) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.diagonal;
  const polys = layout.polygons(W, H);
  const panels = state.panels || [];
  const captionDebug = { mainLines: [], subLines: [], mainSize: 0, subSize: 0 };

  // 1. Ink underneath, so any gap between panels reads as shadow.
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 2. The photos, clipped into their slanted panels.
  polys.forEach((poly, i) => {
    const photo = images[panels[i]];
    if (!photo) return;
    const focal = (photo.focal) || { x: 0.5, y: 0.5 };
    const zoom = (state.zoom && state.zoom[i]) || 1;
    const pan = (state.pan && state.pan[i]) || { x: 0, y: 0 };
    drawPhoto(ctx, photo.img || photo, poly, focal, zoom, pan);
  });

  // 3. The gold dividers.
  drawDividers(ctx, W, H, polys);

  // 4. The grade washes, over the panels but under the caption.
  const grade = gradeById(state.grade);
  for (const step of grade.steps) {
    ctx.save();
    ctx.globalCompositeOperation = step.op;
    ctx.globalAlpha = step.alpha;
    ctx.fillStyle = step.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 4c. The ink frame: a solid ~1% border, drawn after the washes so it
  // stays ink-dark like the golden — the poster reads as a print.
  const frame = 0.01 * W;
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, frame);
  ctx.fillRect(0, H - frame, W, frame);
  ctx.fillRect(0, 0, frame, H);
  ctx.fillRect(W - frame, 0, frame, H);
  ctx.restore();

  // 4b. The hero layout's ink scrim strip, so the caption reads.
  if (state.layout === 'hero') {
    ctx.save();
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, 0.72 * H, W, 0.28 * H);
    ctx.restore();
  }

  // 5. The lettered caption.
  const fit = drawCaption(ctx, W, H, state, layout);
  captionDebug.mainLines = fit.mainLines;
  captionDebug.subLines = fit.subLines;
  captionDebug.mainSize = fit.mainSize;
  captionDebug.subSize = fit.subSize;

  // 6. The sun badge, top-left — or top-right when the caption is at the
  // top, so it never sits on the first letter.
  drawSunBadge(ctx, W, H, state.captionPos === 'top');

  // 7. A hairline inside the frame so the cover reads as a printed poster.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 246, 232, 0.25)';
  ctx.lineWidth = Math.max(1, 0.001 * W);
  ctx.strokeRect(0.008 * W, 0.008 * W, W - 0.016 * W, H - 0.016 * H);
  ctx.restore();

  // Test hook (also used by the behavior probe): how the caption fitted.
  return {
    mainLines: captionDebug.mainLines,
    subLines: captionDebug.subLines,
    mainSize: captionDebug.mainSize,
    subSize: captionDebug.subSize,
  };
}
