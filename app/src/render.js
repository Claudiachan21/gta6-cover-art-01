// Sunset Press — the cover renderer. One function draws the whole poster:
// photo panels clipped to the layout, the colour grade, the frame, then the
// caption. The editor preview and the PNG export both call renderCover, so
// what you see is exactly what you share.
import { LAYOUTS, GRADES } from './presets.js';

const INK = '#0E1A24';
const SUN = '#FFD94D';
const ORANGE = '#FF6B35';
const PINK = '#FF5A8A';
const WHITE = '#FFFFFF';

function polyPath(ctx, pts, W, H) {
  ctx.beginPath();
  pts.forEach(([fx, fy], i) => {
    const x = fx * W;
    const y = fy * H;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawPanelPhoto(ctx, slot, photo, panel, W, H) {
  if (!photo || !photo.img || !photo.img.complete || photo.img.naturalWidth === 0) return;
  const xs = slot.map(([fx]) => fx * W);
  const ys = slot.map(([, fy]) => fy * H);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const sw = x1 - x0;
  const sh = y1 - y0;
  const iw = photo.img.naturalWidth;
  const ih = photo.img.naturalHeight;
  const base = Math.max(sw / iw, sh / ih);
  const scale = base * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // Per-photo focal point (0..1, 0.5 = centre): the photo anchors on it, so a
  // subject near the top (a face, a sign) is never cropped out of a short
  // panel. Dragging a panel shifts the window from that anchor.
  const fx = photo.fx == null ? 0.5 : photo.fx;
  const fy = photo.fy == null ? 0.5 : photo.fy;
  const dx = Math.max(x1 - dw, Math.min(x0, x0 + (sw - dw) * fx + (panel.ox || 0) * sw));
  const dy = Math.max(y1 - dh, Math.min(y0, y0 + (sh - dh) * fy + (panel.oy || 0) * sh));
  ctx.save();
  polyPath(ctx, slot, W, H);
  ctx.clip();
  ctx.drawImage(photo.img, dx, dy, dw, dh);
  ctx.restore();
}

function drawEmptySlot(ctx, slot, W, H, n) {
  ctx.save();
  polyPath(ctx, slot, W, H);
  ctx.clip();
  const xs = slot.map(([fx]) => fx * W);
  const ys = slot.map(([, fy]) => fy * H);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, '#2A3644');
  grad.addColorStop(1, '#141E28');
  ctx.fillStyle = grad;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(255, 246, 232, 0.35)';
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.setLineDash([W * 0.012, W * 0.008]);
  ctx.strokeRect(x0 + W * 0.02, y0 + H * 0.03, (x1 - x0) - W * 0.04, (y1 - y0) - H * 0.06);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 246, 232, 0.75)';
  ctx.font = `600 ${Math.round(Math.min(x1 - x0, y1 - y0) * 0.09)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${n + 1}`, (x0 + x1) / 2, (y0 + y1) / 2);
  ctx.restore();
}

function drawGrade(ctx, grade, strength, W, H) {
  const s = strength == null ? 0.55 : strength;
  const g = GRADES[grade] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, g.washTop);
  wash.addColorStop(1, g.washBottom);
  ctx.save();
  ctx.globalAlpha = s / 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  const [gx, gy] = g.glowAt;
  const glow = ctx.createRadialGradient(gx * W, gy * H, 0, gx * W, gy * H, W * 0.42);
  glow.addColorStop(0, g.glow);
  glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vig.addColorStop(0, 'rgba(14, 26, 36, 0)');
  vig.addColorStop(1, `rgba(14, 26, 36, ${g.vignette * (s / 0.55)})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function wrapCaption(ctx, text, maxW) {
  const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawSunMark(ctx, cx, cy, r) {
  ctx.save();
  // Dashed orbit ring: the mark reads as a designed badge, not a sticker (W1).
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.setLineDash([r * 0.34, r * 0.22]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = SUN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r * 1.35;
    const y1 = cy + Math.sin(a) * r * 1.35;
    const x2 = cx + Math.cos(a) * r * 1.75;
    const y2 = cy + Math.sin(a) * r * 1.75;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// The hero panel's right edge at a given height fraction: the diagonal
// slants left as it goes down, so the panel is narrowest at the bottom.
function slotRightEdgeAtY(slot, yFrac) {
  let maxX = 0;
  for (let i = 0; i < slot.length; i += 1) {
    const [x1, y1] = slot[i];
    const [x2, y2] = slot[(i + 1) % slot.length];
    if ((y1 <= yFrac && y2 >= yFrac) || (y2 <= yFrac && y1 >= yFrac)) {
      if (y1 === y2) maxX = Math.max(maxX, x1, x2);
      else maxX = Math.max(maxX, x1 + ((yFrac - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  return maxX;
}

// Widest the sub-caption may be: the hero panel's width at its baseline
// (the narrowest point, y 0.95), minus the left margin and a safety gap.
function subMaxWFor(state, W) {
  if (state.layout === 'diagonal' || state.layout === 'duo') {
    const edge = slotRightEdgeAtY(LAYOUTS[state.layout].slots[0], 0.95);
    return Math.max(W * 0.2, (edge - 0.055 - 0.02) * W);
  }
  return W * 0.88;
}

function drawCaption(ctx, state, W, H) {
  const caption = (state.caption || '').trim() || 'UNTITLED';
  const sub = (state.subcaption || '').trim();
  const pos = state.captionPos || 'bottom';
  const color = state.captionColor || WHITE;
  const size0 = Math.round(Math.min(W, H) * (state.captionScale || 0.145));
  let size = size0;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  // Left-hero layouts pin the caption inside the hero panel, so no divider
  // ever crosses the lettering (W2). Grid and hero span the full width, so
  // the caption gets a deliberate ink scrim band instead.
  const heroCap = state.layout === 'diagonal' ? 0.52 : state.layout === 'duo' ? 0.42 : 0.88;
  const maxW = W * heroCap;
  let lines = wrapCaption(ctx, caption, maxW);
  // Shrink-to-fit: keep the widest caption line clear of the diagonal at
  // its baseline (y 0.9), with a safety gap (WARN 2 — the clearance was
  // 5–10 px). Shrink first, wrap only below the floor.
  if (state.layout === 'diagonal' || state.layout === 'duo') {
    const edge = slotRightEdgeAtY(LAYOUTS[state.layout].slots[0], 0.9);
    const capW = Math.max(W * 0.2, (edge - 0.055 - 0.02) * W);
    const floor = Math.round(size0 * 0.6);
    for (let i = 0; i < 3; i += 1) {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest <= capW || size <= floor) break;
      size = Math.max(floor, Math.floor(size * (capW / widest)));
      lines = wrapCaption(ctx, caption, maxW);
    }
  }
  const lineH = size * 1.02;
  // Sub-caption auto-fit: one line, capped by the hero panel's width at the
  // sub-caption's baseline — the diagonal slants left as it goes down, so
  // the panel is narrowest where the sub sits (FAIL 1). Shrink (never wrap
  // to an orphan) until it fits, down to a floor; wrap only below the floor.
  // Letter-spacing is measured by hand (raw width + gaps) because canvas
  // measureText may or may not include it — the first version trusted it
  // and still produced an orphan "2026" in the portrait preview.
  const subBaseSize = Math.round(size * 0.26);
  let subSize = subBaseSize;
  let subLines = [];
  if (sub) {
    const subMaxW = subMaxWFor(state, W);
    const subText = sub.toUpperCase();
    const floor = Math.max(10, Math.round(size * 0.1));
    const measureSub = (px) => {
      ctx.font = `800 ${px}px Inter, sans-serif`;
      try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
      const raw = ctx.measureText(subText).width;
      return raw + Math.max(0, subText.length - 1) * Math.round(px * 0.22);
    };
    let fullW = measureSub(subSize);
    for (let i = 0; i < 4 && fullW > subMaxW && subSize > floor; i += 1) {
      subSize = Math.max(floor, Math.floor(subSize * (subMaxW / fullW)));
      fullW = measureSub(subSize);
    }
    // Final guard, measured exactly as the wrap step will measure it: the
    // shrink above can land a few px over the cap (rounding, gap count),
    // which is exactly how the orphan "2026" survived iteration 7.
    ctx.font = `800 ${subSize}px Inter, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
    let drawnW = ctx.measureText(subText).width;
    for (let i = 0; i < 3 && drawnW > subMaxW && subSize > floor; i += 1) {
      subSize = Math.max(floor, subSize - 1);
      ctx.font = `800 ${subSize}px Inter, sans-serif`;
      try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
      drawnW = ctx.measureText(subText).width;
    }
    subLines = wrapCaption(ctx, sub, subMaxW);
  }
  const subLineH = subSize * 1.35;
  const blockH = lines.length * lineH + (subLines.length ? size * 0.3 + (subLines.length - 1) * subLineH + subSize * 0.55 : 0);
  const margin = W * 0.055;
  let top;
  if (pos === 'top') {
    top = H * 0.045;
  } else {
    top = H - H * 0.05 - blockH;
  }
  const ruleY = top - size * 0.18;
  if (state.layout === 'grid' || state.layout === 'hero') {
    // Tight strip behind the lettering only — never a full-width band (N1).
    const pad = H * 0.02;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    const capW = Math.max(...lines.map((l) => ctx.measureText(l).width));
    ctx.font = `800 ${subSize}px Inter, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
    const subW = subLines.length ? Math.max(...subLines.map((l) => ctx.measureText(l).width)) : 0;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    const stripW = Math.max(capW, subW);
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.82;
    ctx.fillRect(margin - pad, ruleY - pad, stripW + pad * 2, (top + blockH - ruleY) + pad * 2);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = PINK;
  ctx.fillRect(margin, ruleY, W * 0.16, Math.max(3, size * 0.045));
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  lines.forEach((line, i) => {
    const y = top + (i + 1) * lineH - size * 0.12;
    ctx.fillStyle = INK;
    ctx.fillText(line, margin + size * 0.05, y + size * 0.05);
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.11;
    ctx.strokeText(line, margin, y);
    ctx.fillStyle = color;
    ctx.fillText(line, margin, y);
  });
  if (subLines.length) {
    ctx.font = `800 ${subSize}px Inter, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch (e) { /* older canvas */ }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = subSize * 0.28;
    subLines.forEach((line, i) => {
      const y = top + lines.length * lineH + size * 0.3 + i * subLineH;
      ctx.strokeText(line, margin, y);
      ctx.fillStyle = INK;
      ctx.fillText(line, margin + subSize * 0.12, y + subSize * 0.12);
      ctx.fillStyle = SUN;
      ctx.fillText(line, margin, y);
    });
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  // Sun badge, top-left: the top-right corner belongs to the photos (a sign
  // in portrait, a face in the boulevard panel) — the badge collided there.
  drawSunMark(ctx, margin + size * 0.22, H * 0.055 + size * 0.2, size * 0.16);
  ctx.restore();
}

export function renderCover(ctx, W, H, state) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.diagonal;
  const photoById = new Map((state.photos || []).map((p) => [p.id, p]));
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#141E28';
  ctx.fillRect(0, 0, W, H);
  const grade = GRADES[state.grade] || GRADES.sunset;
  layout.slots.forEach((slot, i) => {
    const panel = (state.panels || [])[i] || { photoId: null, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photoId ? photoById.get(panel.photoId) : null;
    if (grade.tint) ctx.filter = grade.tint;
    if (photo) drawPanelPhoto(ctx, slot, photo, panel, W, H);
    else drawEmptySlot(ctx, slot, W, H, i);
    ctx.filter = 'none';
  });
  const dividerW = Math.max(4, W * 0.007);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = dividerW;
  ctx.lineCap = 'round';
  (layout.dividers || []).forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(a[0] * W, a[1] * H);
    ctx.lineTo(b[0] * W, b[1] * H);
    ctx.stroke();
  });
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(2, dividerW * 0.28);
  (layout.dividers || []).forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(a[0] * W, a[1] * H);
    ctx.lineTo(b[0] * W, b[1] * H);
    ctx.stroke();
  });
  ctx.restore();
  drawGrade(ctx, state.grade, state.gradeStrength, W, H);
  const frameW = Math.max(6, W * 0.011);
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = frameW;
  ctx.strokeRect(frameW / 2, frameW / 2, W - frameW, H - frameW);
  ctx.restore();
  drawCaption(ctx, state, W, H);
}

export function coverAspect(sizeId) {
  const sizes = { square: 1, portrait: 1080 / 1350, landscape: 1920 / 1080 };
  return sizes[sizeId] || sizes.landscape;
}
