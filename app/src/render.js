// Sunset Press — renderCover: one function draws the cover for the live
// preview and for the exported PNG, so what you see is what you get.
// Steps: photo panels (clipped to diagonal polygons) → paper dividers →
// grade washes → caption + pink rule + sub-caption + sun badge → ink frame.

import { INK, PAPER, SUN, LAYOUTS, GRADES, SIZES } from './presets.js';

// Measure a line of Anton at a given pixel size.
function lineWidth(ctx, text, px) {
  ctx.font = `${px}px Anton, sans-serif`;
  return ctx.measureText(text).width;
}

// Fit a caption into maxW. Rule from the approved design: try one line at
// the nominal size; if it would need to shrink below 72% of nominal, wrap
// into two balanced lines at nominal size instead and only shrink those to
// fit. Returns { lines, size }.
export function fitCaption(ctx, text, maxW, nominal) {
  const one = lineWidth(ctx, text, nominal);
  if (one <= maxW) return { lines: [text], size: nominal };
  const ratio = maxW / one;
  if (ratio >= 0.72) return { lines: [text], size: nominal * ratio };
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return { lines: [text], size: nominal * ratio };
  let best = null;
  for (let cut = 1; cut < words.length; cut++) {
    const a = words.slice(0, cut).join(' ');
    const b = words.slice(cut).join(' ');
    const w = Math.max(lineWidth(ctx, a, nominal), lineWidth(ctx, b, nominal));
    if (!best || w < best.w) best = { lines: [a, b], w };
  }
  const size = Math.min(nominal, (nominal * maxW) / best.w);
  return { lines: best.lines, size };
}

// A sub-caption never wraps: one line, shrunk to fit, never below half size.
// Measured in Inter with its 0.08em tracking, which is how it is drawn.
export function fitSub(ctx, text, maxW, nominal) {
  const measure = (px) => {
    ctx.font = `${px}px Inter, sans-serif`;
    return ctx.measureText(text).width + text.length * px * 0.08;
  };
  const w = measure(nominal);
  const size = w <= maxW ? nominal : Math.max(nominal * 0.5, (nominal * maxW) / w);
  return { lines: [text], size };
}

// Right edge x of a polygon at height y (linear interpolation on its edges).
function edgeAt(points, y) {
  let right = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
      const t = (y - y1) / (y2 - y1);
      right = Math.max(right, x1 + t * (x2 - x1));
    }
  }
  return right === -Infinity ? 1 : right;
}

// Draw one photo into a polygon: cover-fit around its focal point, with
// zoom and drag-pan offsets. Without a photo, paint a warm sunset gradient
// so the canvas is never blank (the empty state still shows a cover).
function drawPanel(ctx, W, H, poly, panel) {
  ctx.save();
  ctx.beginPath();
  for (const [x, y] of poly) ctx.lineTo(x * W, y * H);
  ctx.closePath();
  ctx.clip();
  const xs = poly.map(([x]) => x * W);
  const ys = poly.map(([, y]) => y * H);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const bw = Math.max(...xs) - bx;
  const bh = Math.max(...ys) - by;
  const img = panel.img;
  if (img && img.naturalWidth > 0) {
    const zoom = panel.zoom || 1;
    const s = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    const fx = panel.focalX ?? 0.5;
    const fy = panel.focalY ?? 0.5;
    const dxRaw = bx + bw / 2 - fx * dw + (panel.dx || 0) * bw;
    const dyRaw = by + bh / 2 - fy * dh + (panel.dy || 0) * bh;
    // Clamp so the photo always covers the whole panel box: a focal point
    // near an edge must never leave a paper strip on the far side.
    const dx = Math.max(bx + bw - dw, Math.min(bx, dxRaw));
    const dy = Math.max(by + bh - dh, Math.min(by, dyRaw));
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, '#FF6B35');
    g.addColorStop(0.55, '#FF5A8A');
    g.addColorStop(1, '#2E7FB8');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.restore();
  // Paper divider around the panel so the diagonal cuts read as print.
  ctx.save();
  ctx.beginPath();
  for (const [x, y] of poly) ctx.lineTo(x * W, y * H);
  ctx.closePath();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(2, 0.006 * W);
  ctx.stroke();
  ctx.restore();
}

// Sun badge: yellow disc, dashed ink ring, four plus ticks at the cardinals.
function drawBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.setLineDash([r * 0.45, r * 0.3]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = Math.max(2, r * 0.22);
  ctx.lineCap = 'round';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const ox = cx + dx * r * 1.45;
    const oy = cy + dy * r * 1.45;
    const t = r * 0.32;
    ctx.beginPath();
    ctx.moveTo(ox - t, oy);
    ctx.lineTo(ox + t, oy);
    ctx.moveTo(ox, oy - t);
    ctx.lineTo(ox, oy + t);
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.restore();
}

// Draw the caption block: pink rule above the glyphs, Anton letters with a
// hard ink outline and offset shadow, then the tracked sub-caption below.
// Returns { lines, size, top, bottom } for the probe and the badge layout.
function drawCaption(ctx, W, H, state, layout) {
  const size = SIZES[state.size];
  const nominal = 0.16 * H * state.captionSize * size.capScale;
  const hero = layout.panels[0];
  const bottom = state.captionPos === 'top';
  // Caption box: from the left margin to the hero edge at the caption line.
  const anchorY = bottom ? 0.12 : 0.88;
  const heroRight = edgeAt(hero.points, anchorY) * W;
  const maxW = Math.min(0.88 * W, Math.max(0.3 * W, heroRight - 0.04 * W));
  const fit = fitCaption(ctx, state.caption.toUpperCase(), maxW, nominal);
  const lineH = fit.size * 1.02;
  const blockH = lineH * fit.lines.length;
  const top = bottom ? 0.07 * H : 0.88 * H - blockH;
  const baseline0 = top + fit.size * 0.92;
  // Pink rule above the first glyph top (real ascent + a 0.014H gap),
  // clear of the letters so the thick ink outline never buries it.
  ctx.font = `${fit.size}px Anton, sans-serif`;
  const ascent = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent || fit.size * 0.8;
  const glyphTop = baseline0 - ascent;
  const ruleH = Math.max(3, 0.012 * H);
  const ruleY = glyphTop - 0.014 * H - ruleH;
  const widest = Math.max(...fit.lines.map((l) => lineWidth(ctx, l, fit.size)));
  ctx.save();
  ctx.fillStyle = '#FF5A8A';
  ctx.fillRect(0.04 * W, ruleY, 0.34 * widest, ruleH);
  // Hard shadow, then outlined letters.
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  fit.lines.forEach((line, i) => {
    const y = baseline0 + i * lineH;
    ctx.font = `${fit.size}px Anton, sans-serif`;
    ctx.fillStyle = INK;
    ctx.fillText(line, 0.04 * W + fit.size * 0.045, y + fit.size * 0.045);
    ctx.lineWidth = Math.max(2, fit.size * 0.13);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.strokeText(line, 0.04 * W, y);
    ctx.fillStyle = state.captionColor;
    ctx.fillText(line, 0.04 * W, y);
  });
  // Sub-caption: one line, tracked, at 0.94H (bottom) or under the block.
  const subNominal = nominal * 0.38;
  const subFit = fitSub(ctx, state.sub.toUpperCase(), maxW, subNominal);
  const subY = bottom ? top + blockH + subFit.size * 1.9 : 0.94 * H;
  ctx.font = `${subFit.size}px Inter, sans-serif`;
  try {
    ctx.letterSpacing = `${subFit.size * 0.08}px`;
  } catch (_) {
    /* older canvas: no letterSpacing, spacing stays natural */
  }
  ctx.fillStyle = INK;
  ctx.fillText(state.sub.toUpperCase(), 0.04 * W + 2, subY + 2);
  ctx.fillStyle = '#FFF6E8';
  ctx.fillText(state.sub.toUpperCase(), 0.04 * W, subY);
  try {
    ctx.letterSpacing = '0px';
  } catch (_) {}
  ctx.restore();
  return { lines: fit.lines, size: fit.size, subLines: subFit.lines, top, bottom: top + blockH };
}

export function renderCover(ctx, W, H, state) {
  const layout = LAYOUTS[state.layout];
  const grade = GRADES[state.grade];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < layout.panels.length; i++) {
    drawPanel(ctx, W, H, layout.panels[i].points, state.panels[i] || {});
  }
  // Grade washes over the photos, under the type.
  for (const wash of grade.washes) {
    ctx.save();
    ctx.globalCompositeOperation = wash.blend;
    ctx.globalAlpha = wash.alpha;
    ctx.fillStyle = wash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const debug = drawCaption(ctx, W, H, state, layout);
  // Sun badge: top-left by default; top-right when the caption is on top,
  // so it never sits on the first letter.
  const r = 0.012 * W;
  if (state.captionPos === 'top') drawBadge(ctx, 0.93 * W, 0.07 * H, r);
  else drawBadge(ctx, 0.06 * W, 0.07 * H, r);
  // Ink frame after the washes so it stays navy dark, hairline on top.
  const fw = 0.01 * W;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, fw);
  ctx.fillRect(0, H - fw, W, fw);
  ctx.fillRect(0, 0, fw, H);
  ctx.fillRect(W - fw, 0, fw, H);
  ctx.strokeStyle = PAPER;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = Math.max(1, 0.002 * W);
  ctx.strokeRect(fw + 2, fw + 2, W - 2 * fw - 4, H - 2 * fw - 4);
  ctx.restore();
  return debug;
}
