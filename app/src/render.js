// Sunset Press — renderer. One function, renderCover, draws the cover for
// both the live preview and the PNG export (single source of truth, WYSIWYG).
import {
  INK, PAPER, SUN, PINK, CAPTION, BADGE, FRAME_W,
  SIZES, LAYOUTS, GRADES, heroRightX,
} from './presets.js';

function polyPath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * W, y * H);
    else ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
}

function polyBBox(poly, W, H) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x * W); y0 = Math.min(y0, y * H);
    x1 = Math.max(x1, x * W); y1 = Math.max(y1, y * H);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Draw one photo into its panel polygon, cover-fit around the focal point.
// dx/dy are clamped so the photo always covers the whole bbox (no paper
// strips at the edges, whatever the focal point or zoom).
function drawPanel(ctx, poly, panel, W, H) {
  const bb = polyBBox(poly, W, H);
  ctx.save();
  polyPath(ctx, poly, W, H);
  ctx.clip();
  ctx.fillStyle = PAPER;
  ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
  if (panel && panel.img && panel.img.naturalWidth) {
    const img = panel.img;
    const zoom = panel.zoom || 1;
    const scale = Math.max(bb.w / img.naturalWidth, bb.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    let dx = bb.x + bb.w / 2 - (panel.fx ?? 0.5) * dw + (panel.panX || 0) * W;
    let dy = bb.y + bb.h / 2 - (panel.fy ?? 0.5) * dh + (panel.panY || 0) * H;
    dx = Math.min(bb.x, Math.max(bb.x + bb.w - dw, dx));
    dy = Math.min(bb.y, Math.max(bb.y + bb.h - dh, dy));
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Fit the caption: one line at nominal when it fits above the wrap
// threshold, otherwise greedy-wrap into two lines at nominal size, shrinking
// only as far as needed to fit maxW.
export function fitCaption(ctx, text, nominalPx, maxW) {
  ctx.font = `${nominalPx}px Anton, sans-serif`;
  const single = ctx.measureText(text).width;
  const ratio = maxW / single;
  if (ratio >= CAPTION.wrapAt) {
    return { lines: [text], size: nominalPx * Math.min(1, ratio) };
  }
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  let size = nominalPx;
  for (const line of lines) {
    size = Math.min(size, nominalPx * (maxW / ctx.measureText(line).width));
  }
  return { lines, size };
}

function drawBadge(ctx, W, H, top) {
  const cx = (top ? 1 - BADGE.cx : BADGE.cx) * W;
  const cy = BADGE.cy * H;
  const discR = BADGE.discR * W;
  const ringR = BADGE.ringR * W;
  const tickC = BADGE.tickC * W;
  const arm = BADGE.tickArm * W;
  const tickW = BADGE.tickW * W;
  ctx.save();
  ctx.fillStyle = SUN;
  ctx.strokeStyle = SUN;
  // Sun disc.
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fill();
  // Dashed ring.
  ctx.lineWidth = BADGE.ringW * W;
  ctx.setLineDash(BADGE.ringDash.map((d) => d * W));
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Four PLUS ticks at the cardinals. Each tick is a real plus (a horizontal
  // bar crossed by a vertical bar), standing clear of the disc and the ring.
  ctx.lineWidth = tickW;
  ctx.lineCap = 'butt';
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const tx = cx + dx * tickC;
    const ty = cy + dy * tickC;
    ctx.beginPath();
    ctx.moveTo(tx - arm, ty); ctx.lineTo(tx + arm, ty);
    ctx.moveTo(tx, ty - arm); ctx.lineTo(tx, ty + arm);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderCover(ctx, W, H, state) {
  const size = SIZES[state.sizeId] || SIZES.landscape;
  const layout = LAYOUTS[state.layoutId] || LAYOUTS.trio;
  const grade = GRADES[state.gradeIndex ?? 0] || GRADES[0];

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 1. Photos, one per panel polygon.
  layout.polys.forEach((poly, i) => drawPanel(ctx, poly, state.panels[i], W, H));

  // 2. Paper dividers between panels.
  ctx.save();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(2, 0.004 * W);
  ctx.lineJoin = 'round';
  for (const poly of layout.polys) {
    polyPath(ctx, poly, W, H);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Grade washes over the photos only.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = hexA(grade.screen[0], grade.screen[1]);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = hexA(grade.soft[0], grade.soft[1]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 4. Caption block: pink rule, Anton caption, sun-yellow sub-caption.
  const captionText = (state.caption || size.caption).toUpperCase();
  const subText = (state.sub || size.sub).toUpperCase();
  const nominal = CAPTION.nominal * H * size.capScale * (state.captionScale ?? CAPTION.sliderDefault);
  const anchorY = CAPTION.subBaseline; // sub baseline (bottom mode)
  const heroRight = heroRightX(state.layoutId, anchorY);
  const maxW = (heroRight - CAPTION.maxWTrim) * W;
  const capX = CAPTION.x * W;
  const fit = fitCaption(ctx, captionText, nominal, maxW);
  const lineH = fit.size * 1.02;
  const top = state.captionPos === 'top';
  // Bottom mode: last caption line baseline sits capGap above the sub
  // baseline; top mode mirrors the block from the top of the cover.
  let captionBaseline;
  let subY;
  if (!top) {
    subY = CAPTION.subBaseline * H;
    captionBaseline = subY - size.capGap * H;
  } else {
    subY = 0.061 * H + fit.size * 0.72 + (fit.lines.length - 1) * lineH + size.capGap * H;
    captionBaseline = subY - size.capGap * H;
  }
  const firstBaseline = captionBaseline - (fit.lines.length - 1) * lineH;

  // Pink rule above the glyph top of the first line.
  ctx.save();
  ctx.font = `${fit.size}px Anton, sans-serif`;
  const ascent = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent || fit.size * 0.72;
  const glyphTop = firstBaseline - ascent;
  const ruleH = CAPTION.ruleHeight * H;
  const widest = Math.max(...fit.lines.map((l) => ctx.measureText(l).width));
  const ruleY = glyphTop - size.ruleGap * H - ruleH;
  ctx.fillStyle = PINK;
  ctx.fillRect(capX, ruleY, CAPTION.ruleWidth * widest, ruleH);
  ctx.restore();

  // Caption: hard offset shadow, then ink outline + colour fill.
  ctx.save();
  ctx.font = `${fit.size}px Anton, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const shadowDx = fit.size * 0.03;
  const shadowDy = fit.size * 0.045;
  fit.lines.forEach((line, i) => {
    const y = firstBaseline + i * lineH;
    ctx.fillStyle = INK;
    ctx.fillText(line, capX + shadowDx, y + shadowDy);
    ctx.strokeStyle = INK;
    ctx.lineWidth = fit.size * 0.055;
    ctx.strokeText(line, capX, y);
    ctx.fillStyle = state.captionColor || PAPER;
    ctx.fillText(line, capX, y);
  });
  ctx.restore();

  // Sub-caption: one line, never wrapped, shrunk to fit maxW.
  ctx.save();
  let subSize = CAPTION.subScale * fit.size;
  ctx.font = `600 ${subSize}px Inter, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${CAPTION.subTracking}em`;
  let subW = ctx.measureText(subText).width;
  if (subW > maxW) {
    subSize *= maxW / subW;
    ctx.font = `600 ${subSize}px Inter, sans-serif`;
    subW = ctx.measureText(subText).width;
  }
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, subSize * 0.06);
  ctx.strokeText(subText, capX, subY);
  ctx.fillStyle = SUN;
  ctx.fillText(subText, capX, subY);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();

  // 5. Sun badge (mirrors to the right when the caption is on top).
  drawBadge(ctx, W, H, top);

  // 6. Ink frame + paper hairline, after the grade so the navy stays navy.
  const fw = FRAME_W * W;
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, fw);
  ctx.fillRect(0, H - fw, W, fw);
  ctx.fillRect(0, 0, fw, H);
  ctx.fillRect(W - fw, 0, fw, H);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(1.5, 0.0015 * W);
  ctx.strokeRect(fw, fw, W - 2 * fw, H - 2 * fw);
  ctx.restore();

  return {
    captionLines: fit.lines,
    subLines: [subText],
    captionSize: fit.size,
    subSize,
    ruleY,
    subBaseline: subY,
    maxW,
  };
}
