// Sunset Press — editor state + UI wiring. The preview canvas and the PNG
// export share renderCover, so what you see is what the file holds.
import { SIZES, LAYOUTS, SAMPLES, GRADES, CAPTION_COLORS, CAPTION } from './presets.js';
import { renderCover } from './render.js';
import { stageShot } from './shots.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const canvas = $('#cover-canvas');
const ctx = canvas.getContext('2d');

// One panel per layout slot. A panel holds either a sample photo or a
// user upload (an object URL); panX/panY are fractions of W/H.
function blankPanels(layoutId) {
  return LAYOUTS[layoutId].polys.map(() => ({ img: null, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 }));
}

const state = {
  sizeId: 'landscape',
  layoutId: 'trio',
  panels: blankPanels('trio'),
  selected: 0,
  caption: SIZES.landscape.caption,
  sub: SIZES.landscape.sub,
  captionEdited: false,
  subEdited: false,
  captionColor: CAPTION_COLORS[0].value,
  captionScale: CAPTION.sliderDefault,
  captionPos: 'bottom',
  gradeIndex: 0,
};

const sampleImages = {};
function loadSampleImage(sample) {
  if (sampleImages[sample.id]) return Promise.resolve(sampleImages[sample.id]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { sampleImages[sample.id] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = sample.src;
  });
}

function assignSample(slot, sample) {
  return loadSampleImage(sample).then((img) => {
    if (!img) return false;
    state.panels[slot] = { img, fx: sample.fx, fy: sample.fy, zoom: sample.zoom, panX: 0, panY: 0 };
    return true;
  });
}

function assignUpload(slot, file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.panels[slot] = { img, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 };
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function hasPhoto() {
  return state.panels.some((p) => p.img);
}

// Preview resolution: half the post size keeps the canvas crisp without
// paying full export cost on every keystroke.
function previewSize() {
  const s = SIZES[state.sizeId];
  return { w: Math.round(s.w / 2), h: Math.round(s.h / 2) };
}

let debug = { ready: false, captionLines: [], subLines: [] };
function render() {
  const shot = document.body.classList.contains('shot-cover');
  let W;
  let H;
  if (shot) {
    W = window.innerWidth;
    H = window.innerHeight;
  } else {
    ({ w: W, h: H } = previewSize());
  }
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const info = renderCover(ctx, W, H, state);
  debug = { ready: true, ...info };
  window.__coverDebug = debug;
  const empty = $('#empty-state');
  if (empty) empty.style.display = hasPhoto() ? 'none' : '';
  const preview = $('#caption-preview');
  if (preview) preview.textContent = state.caption;
  const sizeLabel = $('#size-label');
  if (sizeLabel) sizeLabel.textContent = SIZES[state.sizeId].label;
  const zoom = $('#panel-zoom');
  if (zoom) zoom.value = String(state.panels[state.selected]?.zoom ?? 1);
}

function applySize(sizeId) {
  state.sizeId = sizeId;
  const size = SIZES[sizeId];
  if (!state.captionEdited) state.caption = size.caption;
  if (!state.subEdited) state.sub = size.sub;
  const input = $('#caption-input');
  if (input) input.value = state.caption;
  const subInput = $('#sub-input');
  if (subInput) subInput.value = state.sub;
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === sizeId));
  render();
}

function applyLayout(layoutId) {
  state.layoutId = layoutId;
  const old = state.panels;
  state.panels = blankPanels(layoutId);
  for (let i = 0; i < Math.min(old.length, state.panels.length); i++) {
    state.panels[i] = old[i];
  }
  state.selected = 0;
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === layoutId));
  renderPanelList();
  render();
}

function renderPanelList() {
  const list = $('#panel-list');
  if (!list) return;
  list.innerHTML = '';
  state.panels.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-chip' + (i === state.selected ? ' active' : '');
    btn.dataset.panel = String(i);
    btn.textContent = i === 0 ? 'Panel 1 · Hero' : `Panel ${i + 1}`;
    btn.addEventListener('click', () => { state.selected = i; renderPanelList(); render(); });
    list.appendChild(btn);
  });
}

function pointInPoly(x, y, poly, W, H) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0] * W, yi = poly[i][1] * H;
    const xj = poly[j][0] * W, yj = poly[j][1] * H;
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function wire() {
  // Tabs.
  $$('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('[data-tab]').forEach((t) => t.classList.toggle('active', t === tab));
      $$('.tab-page').forEach((p) => p.classList.toggle('active', p.dataset.page === tab.dataset.tab));
    });
  });

  // Upload: each file fills the next empty panel, then the selected one.
  const fileInput = $('#file-input');
  $('#btn-upload').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    for (const file of files) {
      let slot = state.panels.findIndex((p) => !p.img);
      if (slot < 0) slot = state.selected;
      await assignUpload(slot, file);
    }
    fileInput.value = '';
    render();
  });

  // Sample photos: load into the selected panel.
  $$('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sample = SAMPLES.find((s) => s.id === btn.dataset.sample);
      if (!sample) return;
      await assignSample(state.selected, sample);
      $$('[data-sample]').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  // Post size + layout chips.
  $$('[data-size]').forEach((b) => b.addEventListener('click', () => applySize(b.dataset.size)));
  $$('[data-layout]').forEach((b) => b.addEventListener('click', () => applyLayout(b.dataset.layout)));

  // Panel controls: zoom slider + reset.
  const zoom = $('#panel-zoom');
  zoom.addEventListener('input', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = parseFloat(zoom.value); render(); }
  });
  $('#btn-panel-reset').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1; p.panX = 0; p.panY = 0; render(); }
  });

  // Caption tab.
  $('#caption-input').addEventListener('input', (e) => {
    state.caption = e.target.value;
    state.captionEdited = true;
    render();
  });
  $('#sub-input').addEventListener('input', (e) => {
    state.sub = e.target.value;
    state.subEdited = true;
    render();
  });
  $$('[data-color]').forEach((b) => {
    b.addEventListener('click', () => {
      state.captionColor = b.dataset.color;
      $$('[data-color]').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
  });
  $('#caption-size').addEventListener('input', (e) => {
    state.captionScale = parseFloat(e.target.value);
    render();
  });
  $$('[data-pos]').forEach((b) => {
    b.addEventListener('click', () => {
      state.captionPos = b.dataset.pos;
      $$('[data-pos]').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
  });
  $('#btn-caption-next').addEventListener('click', () => {
    document.querySelector('[data-tab="grade"]').click();
  });

  // Grade tab.
  $$('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      state.gradeIndex = parseInt(b.dataset.grade, 10);
      $$('[data-grade]').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
  });

  // Drag-pan + wheel zoom on the canvas, per selected panel.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const layout = LAYOUTS[state.layoutId];
    const hit = layout.polys.findIndex((poly) => pointInPoly(x, y, poly, canvas.width, canvas.height));
    if (hit >= 0) {
      state.selected = hit;
      renderPanelList();
    }
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, panX: state.panels[state.selected]?.panX || 0, panY: state.panels[state.selected]?.panY || 0 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const p = state.panels[state.selected];
    if (!p) return;
    p.panX = drag.panX + ((e.clientX - drag.x) / rect.width) * (canvas.width / canvas.width);
    p.panY = drag.panY + ((e.clientY - drag.y) / rect.height) * (canvas.height / canvas.height);
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    render();
  }, { passive: false });

  // Export: render the full post size offscreen and download the PNG.
  $('#btn-export').addEventListener('click', () => {
    const size = SIZES[state.sizeId];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    const octx = off.getContext('2d');
    renderCover(octx, size.w, size.h, state);
    off.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sunset-press-${state.sizeId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      $('#export-status').textContent = 'PNG saved';
      setTimeout(() => { URL.revokeObjectURL(a.href); }, 5000);
    }, 'image/png');
  });
}

function buildChips() {
  const sizeWrap = $('#size-chips');
  Object.values(SIZES).forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (s.id === state.sizeId ? ' active' : '');
    b.dataset.size = s.id;
    b.textContent = s.chip;
    sizeWrap.appendChild(b);
  });
  const layoutWrap = $('#layout-chips');
  Object.values(LAYOUTS).forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (l.id === state.layoutId ? ' active' : '');
    b.dataset.layout = l.id;
    b.textContent = l.label;
    layoutWrap.appendChild(b);
  });
  const sampleWrap = $('#sample-grid');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    b.dataset.sample = s.id;
    const img = document.createElement('img');
    img.src = s.src;
    img.alt = s.label;
    img.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = s.label;
    b.append(img, label);
    sampleWrap.appendChild(b);
  });
  const swatchWrap = $('#caption-swatches');
  CAPTION_COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (c.value === state.captionColor ? ' active' : '');
    b.dataset.color = c.value;
    b.style.background = c.value;
    b.title = c.label;
    b.setAttribute('aria-label', c.label);
    swatchWrap.appendChild(b);
  });
  const gradeWrap = $('#grade-list');
  GRADES.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === state.gradeIndex ? ' active' : '');
    b.dataset.grade = String(i);
    b.textContent = g.label;
    gradeWrap.appendChild(b);
  });
  renderPanelList();
}

async function boot() {
  buildChips();
  wire();
  // Wait for the vendored fonts so the first paint already has real metrics.
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('600 20px Inter'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts; render anyway */ }
  const staged = await stageShot(state, { assignSample, loadSampleImage, render, applySize });
  if (!staged) render();
  window.__coverDebug = debug;
}

boot();
