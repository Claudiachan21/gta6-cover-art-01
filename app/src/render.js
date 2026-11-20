// Sunset Press — one render function for preview and export.
// renderCover(ctx, W, H, state) draws the whole cover; the editor preview
// and the PNG export call the same code, so what you see is what you get.
import {
  INK, PAPER, SUN, PINK, SIZES, LAYOUTS, SAMPLES, GRADES, CAPTION, BADGE, FRAME,
} from './presets.js';

function polyPath(ctx, pts, W, H) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * W, y * H) : ctx.lineTo(x * W, y * H)));
  ctx.closePath();
}

function bboxOf(pts, W, H) {
  const xs = pts.map((p) => p[0] * W);
  const ys = pts.map((p) => p[1] * H);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Right edge of the hero polygon at a given y (px): the caption must stop
// 0.07W short of it so the type never crosses the diagonal.
function heroRightX(heroPts, yPx, W, H) {
  const y = yPx / H;
  let best = 0;
  for (let i = 0; i < heroPts.length; i++) {
    const a = heroPts[i], b = heroPts[(i + 1) % heroPts.length];
    if ((a[1] <= y && b[1] >= y) || (b[1] <= y && a[1] >= y)) {
      if (a[1] === b[1]) continue;
      const t = (y - a[1]) / (b[1] - a[1]);
      best = Math.max(best, a[0] + t * (b[0] - a[0]));
    }
  }
  return best * W;
}

function coverFit(img, box, focal, zoom) {
  const scale = Math.max(box.w / img.width, box.h / img.height) * zoom;
  const dw = img.width * scale, dh = img.height * scale;
  let dx = box.x + box.w / 2 - focal.x * dw;
  let dy = box.y + box.h / 2 - focal.y * dh;
  // Clamp so the photo always covers the whole panel box.
  dx = Math.min(box.x, Math.max(box.x + box.w - dw, dx));
  dy = Math.min(box.y, Math.max(box.y + box.h - dh, dy));
  return { dx, dy, dw, dh };
}

function drawPanel(ctx, W, H, pts, img, focal, zoom) {
  const box = bboxOf(pts, W, H);
  polyPath(ctx, pts, W, H);
  ctx.save();
  ctx.clip();
  if (img) {
    const { dx, dy, dw, dh } = coverFit(img, box, focal, zoom);
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = PAPER;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.restore();
  // Paper hairline along the panel edge — the diagonal divider.
  polyPath(ctx, pts, W, H);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(2, 0.003 * W);
  ctx.stroke();
}

// Fit the caption: one line at nominal unless it would shrink below 72%
// of nominal, then wrap into two lines at nominal (shrunk only to fit).
export function fitCaption(ctx, text, nominal, maxW) {
  ctx.font = `${nominal}px Anton, sans-serif`;
  const oneW = ctx.measureText(text).width;
  // fitRatio = how much the one-liner must shrink to fit. Mild shrink
  // (>= 72% of nominal) stays one line; heavier shrink wraps to two.
  const fitRatio = maxW / oneW;
  if (oneW <= maxW || fitRatio >= CAPTION.wrapThreshold) {
    const size = Math.max(nominal * CAPTION.oneLineFloor, Math.min(nominal, nominal * fitRatio));
    return { lines: [text], size };
  }
  const words = text.split(/\s+/);
  let best = null;
  for (let cut = 1; cut < words.length; cut++) {
    const a = words.slice(0, cut).join(' ');
    const b = words.slice(cut).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || w < best.w) best = { lines: [a, b], w };
  }
  const size = Math.min(nominal, nominal * (maxW / best.w));
  return { lines: best.lines, size };
}

function drawBadge(ctx, W, H, top) {
  const cx = top ? (1 - BADGE.cx) * W : BADGE.cx * W;
  const cy = BADGE.cy * H;
  const discR = BADGE.discR * W;
  const ringR = BADGE.ringR * W;
  ctx.save();
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fill();
  // Dashed ring.
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(1, BADGE.ringWidth * W);
  ctx.setLineDash([BADGE.ringDash[0] * W, BADGE.ringDash[1] * W]);
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Four PLUS ticks at the cardinals: a horizontal and a vertical bar each.
  const tc = BADGE.tickCentre * W, arm = BADGE.tickArm * W, th = Math.max(1, BADGE.tickThick * W);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const px = cx + dx * tc, py = cy + dy * tc;
    ctx.fillRect(px - arm, py - th / 2, arm * 2, th);
    ctx.fillRect(px - th / 2, py - arm, th, arm * 2);
  }
  ctx.restore();
}

function drawCaptionBlock(ctx, W, H, size, state, debug) {
  const S = SIZES[state.size];
  const nominal = CAPTION.nominal * H * S.capScale * state.captionScale;
  const subBaseline = CAPTION.subBaseline * H;
  const capGap = S.capGap * H;
  const hero = LAYOUTS[state.layout].panels[0];
  const maxW = heroRightX(hero, subBaseline - capGap, W, H) - CAPTION.maxWTrim * W;
  const x = CAPTION.captionX * W;

  const fit = fitCaption(ctx, state.caption || 'SUNSET DRIVE', nominal, maxW);
  const lineH = fit.size * 1.02;
  const lastBaseline = subBaseline - capGap;
  const firstBaseline = lastBaseline - (fit.lines.length - 1) * lineH;
  debug.captionLines = fit.lines;
  debug.captionSize = fit.size;

  // Pink rule above the first line's glyph top.
  ctx.font = `${fit.size}px Anton, sans-serif`;
  const ascent = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent || fit.size * 0.8;
  const glyphTop = firstBaseline - ascent;
  const ruleH = CAPTION.ruleHeight * H;
  const ruleY = glyphTop - S.ruleGap * H - ruleH;
  const widest = Math.max(...fit.lines.map((l) => ctx.measureText(l).width));
  const ruleW = CAPTION.ruleWidth * widest;
  const ruleYPos = state.captionPos === 'top'
    ? H - glyphTop + S.ruleGap * H - ruleH // mirrored when the block is at the top
    : ruleY;

  const drawTextBlock = (baselineTop) => {
    // Rule.
    ctx.fillStyle = PINK;
    ctx.fillRect(x, baselineTop === 'top' ? ruleYPos : ruleY, ruleW, ruleH);
    // Caption lines.
    ctx.font = `${fit.size}px Anton, sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    fit.lines.forEach((line, i) => {
      const b = (baselineTop === 'top'
        ? firstBaseline + (fit.lines.length - 1) * lineH - i * lineH
        : firstBaseline + i * lineH);
      const by = state.captionPos === 'top' ? H - b + fit.size : b;
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, fit.size * 0.055);
      ctx.strokeText(line, x, by);
      ctx.fillStyle = state.captionColor;
      ctx.fillText(line, x, by);
    });
    // Sub-caption, one line, never wrapped.
    const subSize = fit.size * CAPTION.subScale;
    ctx.font = `700 ${subSize}px Inter, sans-serif`;
    try { ctx.letterSpacing = `${CAPTION.subTracking * subSize}px`; } catch { /* older canvas */ }
    let sub = state.sub || '';
    let sw = ctx.measureText(sub).width;
    if (sw > maxW) {
      subSizeFit(sub);
    }
    function subSizeFit(s) {
      let fs = subSize;
      while (fs > 8 && ctx.measureText(s).width > maxW) {
        fs *= 0.95;
        ctx.font = `700 ${fs}px Inter, sans-serif`;
        try { ctx.letterSpacing = `${CAPTION.subTracking * fs}px`; } catch { /* */ }
      }
      return fs;
    }
    const subY = state.captionPos === 'top' ? H - subBaseline + subSize : subBaseline;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, subSize * 0.08);
    ctx.strokeText(sub, x, subY);
    ctx.fillStyle = SUN;
    ctx.fillText(sub, x, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* */ }
    debug.subLines = [sub];
  };

  if (state.captionPos === 'top') {
    // Flip the block: caption sits near the top, sub below it.
    const topFirst = H * 0.06 + fit.size;
    ctx.font = `${fit.size}px Anton, sans-serif`;
    const asc = ctx.measureText(fit.lines[0]).actualBoundingBoxAscent || fit.size * 0.8;
    const topGlyph = topFirst - asc;
    ctx.fillStyle = PINK;
    ctx.fillRect(x, topGlyph - S.ruleGap * H - ruleH, ruleW, ruleH);
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    fit.lines.forEach((line, i) => {
      const by = topFirst + i * lineH;
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, fit.size * 0.055);
      ctx.strokeText(line, x, by);
      ctx.fillStyle = state.captionColor;
      ctx.fillText(line, x, by);
    });
    const subSize = fit.size * CAPTION.subScale;
    ctx.font = `700 ${subSize}px Inter, sans-serif`;
    try { ctx.letterSpacing = `${CAPTION.subTracking * subSize}px`; } catch { /* */ }
    const subY = topFirst + (fit.lines.length - 1) * lineH + capGap;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, subSize * 0.08);
    ctx.strokeText(state.sub || '', x, subY);
    ctx.fillStyle = SUN;
    ctx.fillText(state.sub || '', x, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* */ }
    debug.subLines = [state.sub || ''];
  } else {
    drawTextBlock('bottom');
  }
}

export function renderCover(ctx, W, H, state, images, debug = {}) {
  const S = SIZES[state.size];
  const layout = LAYOUTS[state.layout];
  const grade = GRADES[state.grade] || GRADES[0];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 1. Panels.
  layout.panels.forEach((pts, i) => {
    const slot = state.panels[i];
    const img = slot && slot.imageKey ? images[slot.imageKey] : null;
    const focal = slot?.focal || { x: 0.5, y: 0.5 };
    const zoom = slot?.zoom || 1;
    drawPanel(ctx, W, H, pts, img, focal, zoom);
  });

  // 2. Grade washes.
  for (const wash of grade.washes) {
    ctx.save();
    ctx.globalCompositeOperation = wash.blend;
    ctx.globalAlpha = wash.alpha;
    ctx.fillStyle = wash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 3. Sun badge (top-right when the caption is at the top).
  drawBadge(ctx, W, H, state.captionPos === 'top');

  // 4. Caption block + sub.
  drawCaptionBlock(ctx, W, H, S, state, debug);

  // 5. Ink frame + hairline.
  const f = FRAME * W;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, f);
  ctx.fillRect(0, H - f, W, f);
  ctx.fillRect(0, 0, f, H);
  ctx.fillRect(W - f, 0, f, H);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = Math.max(1, 0.0015 * W);
  ctx.strokeRect(f + 2, f + 2, W - 2 * f - 4, H - 2 * f - 4);
  return debug;
}

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || SAMPLES[0];
}
