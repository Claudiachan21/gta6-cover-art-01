// Sunset Press — the one render function. Preview and export both call
// renderCover, so what you see in the editor is exactly what the PNG gets.
// Draw order: paper base, photos clipped to their diagonal panels, grade
// washes, cream divider lines, ink frame, caption block, sun badge,
// hairline. The caption is measured with the real fonts (Anton for the
// title, Inter + tracking for the sub), never guessed.

import { SIZES, SIZE_DEFAULTS, LAYOUTS, GRADES, INK, PAPER, SUN, PINK } from './presets.js';

// Panel polygons in canvas pixels for a layout.
export function panelsForLayout(layoutKey, W, H) {
  return LAYOUTS[layoutKey].panels.map((poly) =>
    poly.map(([fx, fy]) => [fx * W, fy * H]),
  );
}

function polyPath(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

function polyBBox(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

// The hero panel's right edge x at canvas height y: the edge runs from the
// polygon's top-right corner to its bottom-right corner.
function heroRightAt(heroPoly, y) {
  const [tx, ty] = heroPoly[1];
  const [bx, by] = heroPoly[2];
  if (by === ty) return tx;
  const t = Math.min(1, Math.max(0, (y - ty) / (by - ty)));
  return tx + (bx - tx) * t;
}

// Cover-fit draw of one photo into a panel bbox, centred on the panel's
// focal point (cx, cy are image fractions) and clamped so the photo always
// covers the whole bbox — no paper strip can ever show through at an edge.
function drawPanelPhoto(ctx, img, bbox, panel) {
  const bw = bbox.maxX - bbox.minX;
  const bh = bbox.maxY - bbox.minY;
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  let dx = bbox.minX + bw / 2 - panel.cx * dw;
  let dy = bbox.minY + bh / 2 - panel.cy * dh;
  dx = Math.min(Math.max(dx, bbox.minX + bw - dw), bbox.minX);
  dy = Math.min(Math.max(dy, bbox.minY + bh - dh), bbox.minY);
  ctx.drawImage(img, dx, dy, dw, dh);
  return { dx, dy, dw, dh };
}

// Fit the caption: one line at nominal size when it fits; shrink down to
// 72% of nominal before giving up on one line; below that, wrap into two
// lines at nominal size (shrinking the wrapped lines only as far as they
// need to fit). Returns the lines and the size they are drawn at.
function fitCaption(ctx, text, maxW, nominal) {
  ctx.font = `${nominal}px Anton, sans-serif`;
  ctx.letterSpacing = '0px';
  const single = ctx.measureText(text).width;
  if (single <= maxW) return { lines: [text], size: nominal };
  const shrunk = (nominal * maxW) / single;
  if (shrunk >= 0.72 * nominal) return { lines: [text], size: shrunk };
  const words = text.split(/\s+/).filter(Boolean);
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || w < best.w) best = { lines: [a, b], w };
  }
  if (best) {
    const size = best.w > maxW ? Math.max((nominal * maxW) / best.w, nominal * 0.5) : nominal;
    return { lines: best.lines, size };
  }
  return { lines: [text], size: shrunk };
}

// The sub-caption never wraps: one line, shrunk to fit. It is measured with
// the same Inter + 0.08em tracking it is drawn with, so the fit is exact.
function fitSub(ctx, text, maxW, size0) {
  ctx.font = `600 ${size0}px Inter, sans-serif`;
  ctx.letterSpacing = '0.08em';
  const w = ctx.measureText(text).width;
  if (w <= maxW) return size0;
  return Math.max((size0 * maxW) / w, size0 * 0.45);
}

function drawSunBadge(ctx, cx, cy, W) {
  const discR = 0.016 * W;
  const ringR = 0.024 * W;
  const tickLen = 0.01 * W;
  ctx.save();
  ctx.fillStyle = SUN;
  ctx.strokeStyle = SUN;
  // Disc.
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fill();
  // Dashed ring.
  ctx.lineWidth = Math.max(1.5, 0.0035 * W);
  ctx.setLineDash([0.008 * W, 0.006 * W]);
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Four plus ticks at the cardinals, just outside the ring.
  ctx.lineWidth = Math.max(1.5, 0.0035 * W);
  ctx.lineCap = 'round';
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const ox = cx + dx * (ringR + tickLen * 0.4);
    const oy = cy + dy * (ringR + tickLen * 0.4);
    ctx.beginPath();
    if (dx === 0) {
      ctx.moveTo(ox - tickLen / 2, oy);
      ctx.lineTo(ox + tickLen / 2, oy);
    } else {
      ctx.moveTo(ox, oy - tickLen / 2);
      ctx.lineTo(ox, oy + tickLen / 2);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// The whole cover. state: {size, layout, grade, caption, sub, captionColor,
// captionSize, captionPos, panels: [{photo, zoom, cx, cy}]}.
// images: Map photo id -> loaded HTMLImageElement.
// Returns debug info (caption lines, sub lines, sizes) for the probe/gate.
export function renderCover(ctx, W, H, state, images) {
  const panels = panelsForLayout(state.layout, W, H);
  const hero = panels[0];
  const heroBox = polyBBox(hero);
  const heroH = heroBox.maxY - heroBox.minY;

  // 1. Paper base.
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 2. Photos, one per panel; an empty panel stays paper.
  panels.forEach((poly, i) => {
    const panel = state.panels[i];
    const img = panel && panel.photo ? images.get(panel.photo) : null;
    ctx.save();
    polyPath(ctx, poly);
    ctx.clip();
    if (img) drawPanelPhoto(ctx, img, polyBBox(poly), panel);
    ctx.restore();
  });

  // 3. Grade washes over the whole cover.
  for (const [mode, color] of GRADES[state.grade].washes) {
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';

  // 4. Cream divider lines along every panel edge.
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(2, 0.004 * W);
  ctx.lineJoin = 'round';
  for (const poly of panels) {
    polyPath(ctx, poly);
    ctx.stroke();
  }

  // 4b. Ink frame, solid 0.01W on all four sides, over the grade so it
  // stays deep navy.
  const frame = 0.01 * W;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, frame);
  ctx.fillRect(0, H - frame, W, frame);
  ctx.fillRect(0, 0, frame, H);
  ctx.fillRect(W - frame, 0, frame, H);

  // 5. Caption block, anchored in the hero panel.
  const capScale = SIZE_DEFAULTS[state.size].capScale;
  const nominal = 0.16 * heroH * capScale * state.captionSize;
  const captionX = heroBox.minX + 0.04 * W;
  const subBaseline = heroBox.maxY - 0.06 * heroH;
  const maxWAt = (y) => heroRightAt(hero, y) - 0.07 * W - captionX;

  // Fit against the width available at the caption's own baseline, then
  // lay the block out bottom-up (default) or top-down (Top position).
  const probeMaxW = maxWAt(heroBox.maxY - 0.14 * heroH);
  const fit = fitCaption(ctx, state.caption, probeMaxW, nominal);
  const subSize = fitSub(ctx, state.sub, probeMaxW, 0.38 * fit.size);
  const gap = 0.3 * fit.size;
  const lineStep = fit.size * 1.02;

  let firstBaseline;
  let subY;
  if (state.captionPos === 'top') {
    const ruleH = 0.012 * heroH;
    const ruleGap = 0.014 * heroH;
    const ruleTop = heroBox.minY + 0.075 * heroH;
    ctx.font = `${fit.size}px Anton, sans-serif`;
    const ascent = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent;
    const glyphTop = ruleTop + ruleH + ruleGap;
    firstBaseline = glyphTop + ascent;
    subY = firstBaseline + (fit.lines.length - 1) * lineStep + gap + subSize;
    drawCaptionBlock(ctx, state, fit, subSize, captionX, firstBaseline, subY, {
      ruleTop, ruleH, glyphTop,
    });
  } else {
    const captionBaseline = subBaseline - subSize - gap;
    firstBaseline = captionBaseline - (fit.lines.length - 1) * lineStep;
    subY = subBaseline;
    ctx.font = `${fit.size}px Anton, sans-serif`;
    const ascent = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent;
    const glyphTop = firstBaseline - ascent;
    const ruleH = 0.012 * heroH;
    const ruleTop = glyphTop - 0.014 * heroH - ruleH;
    drawCaptionBlock(ctx, state, fit, subSize, captionX, firstBaseline, subY, {
      ruleTop, ruleH, glyphTop,
    });
  }

  // 6. Sun badge: top-left by default, top-right when the caption is Top.
  const badgeY = heroBox.minY + 0.08 * heroH;
  const badgeX =
    state.captionPos === 'top'
      ? heroRightAt(hero, badgeY) - 0.055 * W
      : heroBox.minX + 0.055 * W;
  drawSunBadge(ctx, badgeX, badgeY, W);

  // 7. Hairline just inside the frame.
  ctx.strokeStyle = 'rgba(255,246,232,0.6)';
  ctx.lineWidth = Math.max(1, 0.0015 * W);
  ctx.strokeRect(0.012 * W, 0.012 * W, W - 0.024 * W, H - 0.024 * W);

  ctx.restore();
  return {
    captionLines: fit.lines,
    subLines: [state.sub],
    captionSize: fit.size,
    subSize,
    badge: { x: badgeX, y: badgeY },
  };
}

function drawCaptionBlock(ctx, state, fit, subSize, x, firstBaseline, subY, rule) {
  const widest = Math.max(
    ...fit.lines.map((line) => {
      ctx.font = `${fit.size}px Anton, sans-serif`;
      return ctx.measureText(line).width;
    }),
  );

  // Pink rule above the first line's glyph top, 34% of the widest line.
  ctx.fillStyle = PINK;
  ctx.fillRect(x, rule.ruleTop, 0.34 * widest, rule.ruleH);

  // Caption: thick ink outline + hard offset shadow + paper-coloured fill.
  ctx.font = `${fit.size}px Anton, sans-serif`;
  ctx.letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = fit.size * 0.1;
  ctx.strokeStyle = INK;
  fit.lines.forEach((line, i) => {
    const y = firstBaseline + i * fit.size * 1.02;
    ctx.strokeText(line, x, y);
  });
  ctx.save();
  ctx.shadowColor = 'rgba(14,26,36,0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = fit.size * 0.03;
  ctx.shadowOffsetY = fit.size * 0.045;
  ctx.fillStyle = state.captionColor;
  fit.lines.forEach((line, i) => {
    const y = firstBaseline + i * fit.size * 1.02;
    ctx.fillText(line, x, y);
  });
  ctx.restore();

  // Sub-caption: Inter, tracked, sun yellow with a thin ink keyline.
  ctx.font = `600 ${subSize}px Inter, sans-serif`;
  ctx.letterSpacing = '0.08em';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, subSize * 0.08);
  ctx.strokeStyle = INK;
  ctx.strokeText(state.sub, x, subY);
  ctx.fillStyle = SUN;
  ctx.fillText(state.sub, x, subY);
  ctx.letterSpacing = '0px';
}
