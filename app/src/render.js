// Sunset Press — one render function for preview and export (single source
// of truth, WYSIWYG). renderCover(ctx, W, H, state, images) draws the whole
// cover: diagonal panels, grade washes, ink frame, badge, caption + sub.
// Caption geometry (measured against the approved v3 renders, design/
// shots-v3-iter3/): sub baseline 0.939H, caption last baseline one
// per-size gap above it (capGap: landscape 0.076H, portrait 0.073H,
// square 0.077H), pink rule above the first line's glyph top (ruleGap:
// landscape 0.015H, portrait/square 0.011H), rule height 0.012H, rule
// width 34% of the widest caption line. Badge: disc r 0.011W, dashed
// ring r 0.025W, four PLUS ticks (two crossing strokes each) at the cardinals,
// centre (0.058W, 0.069H) — left by default, right when the caption is on top.
// Geometry measured from the approved v3 renders (design/shots-v3-iter3/):
// disc r ~0.011W, tick centres 0.018W out, arms 0.003W, standing ~5px clear
// of the disc and ~4px clear of the ring (golden v3: ticks are separate
// components; iter-4 gaps of ~1.9px/~0.6px merged everything into one bar).

import { LAYOUTS, GRADES, SIZES, heroRightAtY, INK, PAPER, SUN, PINK } from './presets.js';

const CAPTION_FONT = 'Anton, "Arial Narrow", sans-serif';
const SUB_FONT = 'Inter, system-ui, sans-serif';

function tracePoly(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([fx, fy], i) => {
    const x = fx * W, y = fy * H;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function polyBBox(poly, W, H) {
  const xs = poly.map(([fx]) => fx * W);
  const ys = poly.map(([, fy]) => fy * H);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Cover-fit metrics for an image inside a box, centred on a focal point.
export function coverMetrics(img, boxW, boxH, zoom) {
  const s = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight) * zoom;
  return { dw: img.naturalWidth * s, dh: img.naturalHeight * s };
}

function drawPanel(ctx, img, poly, W, H, fx, fy, zoom) {
  const box = polyBBox(poly, W, H);
  ctx.save();
  tracePoly(ctx, poly, W, H);
  ctx.clip();
  if (!img) {
    // Empty slot: dark slate with a faint diagonal hatch so the canvas is
    // never blank before a photo is loaded.
    ctx.fillStyle = '#22303E';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(255,246,232,0.07)';
    ctx.lineWidth = 1;
    for (let d = -box.h; d < box.w; d += 26) {
      ctx.beginPath();
      ctx.moveTo(box.x + d, box.y + box.h);
      ctx.lineTo(box.x + d + box.h, box.y);
      ctx.stroke();
    }
  } else {
    const { dw, dh } = coverMetrics(img, box.w, box.h, zoom);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    // Focal point maps onto the box centre, then clamp so the photo always
    // covers the whole polygon (v3 fix: no paper strip at the edges).
    let dx = cx - fx * dw;
    let dy = cy - fy * dh;
    dx = dw > box.w ? Math.min(Math.max(dx, box.x + box.w - dw), box.x) : box.x + (box.w - dw) / 2;
    dy = dh > box.h ? Math.min(Math.max(dy, box.y + box.h - dh), box.y) : box.y + (box.h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

// Fit the caption: one line when it fits at >=72% of nominal size, else wrap
// at nominal size and shrink the wrapped lines only as far as needed.
function fitCaption(ctx, text, nominal, maxW) {
  ctx.font = `${nominal}px ${CAPTION_FONT}`;
  const single = ctx.measureText(text).width;
  if (single <= maxW) return { lines: [text], size: nominal };
  if (maxW / single >= 0.72) return { lines: [text], size: nominal * (maxW / single) };
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(trial).width <= maxW || !cur) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  let widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  let size = nominal;
  if (widest > maxW) { size = nominal * (maxW / widest); widest = maxW; }
  return { lines, size, widest };
}

// The sub-caption never wraps: one line, shrunk to fit.
function fitSub(ctx, text, size, maxW) {
  ctx.font = `600 ${size}px ${SUB_FONT}`;
  ctx.letterSpacing = `${0.08 * size}px`;
  let w = ctx.measureText(text).width;
  let s = size;
  while (w > maxW && s > size * 0.4) {
    s *= 0.94;
    ctx.font = `600 ${s}px ${SUB_FONT}`;
    ctx.letterSpacing = `${0.08 * s}px`;
    w = ctx.measureText(text).width;
  }
  ctx.letterSpacing = '0px';
  return { size: s, width: w };
}

function drawBadge(ctx, W, H, rightSide) {
  const cx = (rightSide ? 0.942 : 0.058) * W;
  const cy = 0.069 * H;
  const discR = 0.011 * W;
  const ringR = 0.025 * W;
  ctx.save();
  // Dashed ring, fine strokes (golden v3: thin dashes, not chunky blocks).
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(1.5, 0.0018 * W);
  ctx.setLineDash([0.005 * W, 0.009 * W]);
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Four thin PLUS ticks at the cardinals, standing clear of the disc AND
  // the ring (critic #4: iter-4 gap was only ~1.9px disc->tick and ~0.6px
  // tick->ring, so render/JPEG merged everything into one bar; golden has
  // ~5px gaps on both sides, 3 separate runs down the centre column).
  const tickD = 0.018 * W;
  const arm = 0.003 * W;
  ctx.lineWidth = Math.max(2, 0.0035 * W);
  ctx.lineCap = 'round';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const tx = cx + dx * tickD, ty = cy + dy * tickD;
    ctx.beginPath();
    ctx.moveTo(tx - arm, ty); ctx.lineTo(tx + arm, ty);
    ctx.moveTo(tx, ty - arm); ctx.lineTo(tx, ty + arm);
    ctx.stroke();
  }
  // Solid disc on top.
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderCover(ctx, W, H, state, images) {
  const size = SIZES[state.size];
  const layout = LAYOUTS[state.layout];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // 1. Panels.
  state.panels.forEach((panel, i) => {
    const slot = layout.slots[i];
    drawPanel(ctx, images[panel.sample] || null, slot.poly, W, H, panel.fx, panel.fy, panel.zoom);
  });
  // Crisp diagonal dividers: a light paper hairline, as in the golden
  // renders (a dark divider reads as a crack across the poster).
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(2, 0.003 * W);
  ctx.lineJoin = 'miter';
  layout.slots.forEach((slot) => {
    tracePoly(ctx, slot.poly, W, H);
    ctx.stroke();
  });

  // 2. Grade washes.
  for (const wash of GRADES[state.grade].washes) {
    ctx.globalCompositeOperation = wash.m;
    ctx.globalAlpha = wash.a;
    ctx.fillStyle = wash.c;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // 3. Ink frame (after the washes so it stays navy) + inner hairline.
  const frame = 0.01 * W;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, frame);
  ctx.fillRect(0, H - frame, W, frame);
  ctx.fillRect(0, 0, frame, H);
  ctx.fillRect(W - frame, 0, frame, H);
  ctx.strokeStyle = 'rgba(255,246,232,0.4)';
  ctx.lineWidth = Math.max(1, 0.0015 * W);
  ctx.strokeRect(frame + 0.003 * W, frame + 0.003 * W, W - 2 * (frame + 0.003 * W), H - 2 * (frame + 0.003 * W));

  // 4. Caption + sub-caption.
  const captionX = 0.04 * W;
  const heroRight = heroRightAtY(state.layout, 0.864) * W;
  const maxW = Math.max(120, heroRight - 0.07 * W);
  const nominal = 0.16 * H * size.capScale * state.captionScale;
  const fit = fitCaption(ctx, state.caption.toUpperCase(), nominal, maxW);
  const subSize = 0.38 * fit.size;
  const sub = fitSub(ctx, state.sub.toUpperCase(), subSize, maxW);
  const lineHeight = 1.04 * fit.size;

  let subBaseline, firstBaseline;
  if (state.captionPos === 'top') {
    firstBaseline = 0.17 * H;
    subBaseline = firstBaseline + (fit.lines.length - 1) * lineHeight + size.capGap * H;
  } else {
    subBaseline = 0.939 * H;
    firstBaseline = subBaseline - size.capGap * H - (fit.lines.length - 1) * lineHeight;
  }
  const ruleH = 0.012 * H;
  ctx.font = `${fit.size}px ${CAPTION_FONT}`;
  const ascent = Math.max(...fit.lines.map((l) => ctx.measureText(l).actualBoundingBoxAscent));
  const glyphTop = firstBaseline - ascent;
  const ruleY = glyphTop - size.ruleGap * H - ruleH;
  const widest = Math.max(...fit.lines.map((l) => ctx.measureText(l).width));
  ctx.fillStyle = PINK;
  ctx.fillRect(captionX, ruleY, 0.34 * widest, ruleH);

  const shadowDx = 0.04 * fit.size, shadowDy = 0.05 * fit.size;
  fit.lines.forEach((line, i) => {
    const baseline = firstBaseline + i * lineHeight;
    ctx.font = `${fit.size}px ${CAPTION_FONT}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.fillText(line, captionX + shadowDx, baseline + shadowDy);
    ctx.lineWidth = Math.max(2, 0.07 * fit.size);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.strokeText(line, captionX, baseline);
    ctx.fillStyle = state.captionColor;
    ctx.fillText(line, captionX, baseline);
  });

  ctx.font = `600 ${sub.size}px ${SUB_FONT}`;
  ctx.letterSpacing = `${0.08 * sub.size}px`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = SUN;
  ctx.fillText(state.sub.toUpperCase(), captionX, subBaseline);
  ctx.letterSpacing = '0px';

  // 5. Badge (right side when the caption sits on top).
  drawBadge(ctx, W, H, state.captionPos === 'top');
  ctx.restore();

  return {
    captionLines: fit.lines,
    subLines: [state.sub],
    captionSize: fit.size,
    subSize: sub.size,
    subBaseline,
    firstBaseline,
    ruleY,
  };
}
