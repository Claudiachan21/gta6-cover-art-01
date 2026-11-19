// Sunset Press — the editor. Wires the DOM to the renderer: size, layout,
// grade, caption, photos, drag-pan and wheel zoom, PNG export. The staged
// screenshot mode (?shot=cover / ?shot=editor) renders the approved cover
// for the dossier and signals readiness for the screenshot scripts.

import { SAMPLES, GRADES, LAYOUTS, CAPTION_COLORS, CAPTION_SCALE, SIZE_DEFAULTS, sampleById, gradeById } from './presets.js';
import { renderCover } from './render.js';

// The three export sizes. The label is what the stage shows.
const SIZES = {
  landscape: { w: 1920, h: 1080, label: '1920×1080' },
  portrait: { w: 1080, h: 1350, label: '1080×1350' },
  square: { w: 1080, h: 1080, label: '1080×1080' },
};

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // 'cover' | 'editor' | null
const SHOT_SIZE = params.get('size') || 'landscape';

// ---------------------------------------------------------------- state

const state = {
  size: 'landscape',
  layout: 'diagonal',
  grade: 'sunset',
  capScale: 0.91,
  caption: 'SUNSET DRIVE',
  sub: 'OCEAN DRIVE • EST. 2026',
  captionColor: '#FFFFFF',
  captionScale: CAPTION_SCALE.default,
  captionPos: 'bottom',
  captionEdited: false,
  panels: [],
  selected: 0,
  pan: {},
  zoom: {},
};

// id -> { img, focal } for the samples and the user's uploads.
const images = {};
const uploads = [];

function applySizeDefaults(sizeId, withPanels = true) {
  const def = SIZE_DEFAULTS[sizeId];
  if (!def) return;
  state.layout = def.layout;
  state.grade = def.grade;
  state.capScale = def.capScale || 1;
  // The panels are only staged when asked: at a cold start the stage is
  // empty (the empty state shows), and the samples load on demand.
  if (withPanels) state.panels = [...def.panels];
  // The user's own lettering is never overwritten by a size switch.
  if (!state.captionEdited) {
    state.caption = def.caption;
    state.sub = def.sub;
  }
}

// ----------------------------------------------------------------- dom

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $('#cover-canvas');
const ctx = canvas.getContext('2d');
const emptyState = $('#empty-state');
const sizeLabel = $('#size-label');
const layoutLabel = $('#layout-label');
const statusEl = $('#export-status');
const captionPreview = $('#caption-preview');

// -------------------------------------------------------------- images

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  await Promise.all(SAMPLES.map(async (s) => {
    if (images[s.id]) return;
    const img = await loadImage(`samples/${s.file}`);
    images[s.id] = { img, focal: s.focal };
  }));
}

function loadUpload(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error('cannot load upload'));
    img.src = url;
  });
}

// -------------------------------------------------------------- render

function render() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  window.__coverDebug = renderCover(ctx, size.w, size.h, state, images);
  updateChrome();
}

function updateChrome() {
  sizeLabel.textContent = SIZES[state.size].label;
  const layout = LAYOUTS[state.layout];
  layoutLabel.textContent = `LAYOUT · ${layout.name.toUpperCase()}`;
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  $$('[data-grade]').forEach((b) => b.classList.toggle('selected', b.dataset.grade === state.grade));
  $$('[data-color]').forEach((b) => b.classList.toggle('selected', b.dataset.color === state.captionColor));
  $$('[data-pos]').forEach((b) => b.classList.toggle('active', b.dataset.pos === state.captionPos));
  captionPreview.textContent = state.caption;
  const anyPhoto = state.panels.some((id) => id && images[id]);
  emptyState.classList.toggle('hidden', anyPhoto);
  updateSampleSelection();
}

function updateSampleSelection() {
  const current = state.panels[state.selected];
  $$('[data-sample]').forEach((el) => {
    el.classList.toggle('selected', el.dataset.sample === current);
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ------------------------------------------------------------ controls

function bindTabs() {
  $$('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== `tab-${btn.dataset.tab}`));
    });
  });
}

function bindSizes() {
  $$('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      // Re-stage the panels only if the stage is already filled; a cold
      // stage stays empty until the user loads samples.
      applySizeDefaults(state.size, state.panels.some((p) => p));
      state.pan = {};
      state.zoom = {};
      render();
    });
  });
}

function bindCaption() {
  const input = $('#caption-input');
  input.addEventListener('input', () => {
    state.caption = input.value;
    state.captionEdited = true;
    render();
  });
  const subInput = $('#sub-input');
  subInput.addEventListener('input', () => {
    state.sub = subInput.value;
    state.captionEdited = true;
    render();
  });
  $$('[data-color]').forEach((sw) => {
    sw.addEventListener('click', () => {
      state.captionColor = sw.dataset.color;
      render();
    });
  });
  const range = $('#caption-size-range');
  range.addEventListener('input', () => {
    state.captionScale = parseFloat(range.value);
    render();
  });
  $$('[data-pos]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.captionPos = btn.dataset.pos;
      render();
    });
  });
}

function bindLayoutsAndGrades() {
  $$('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      render();
    });
  });
  $$('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      render();
    });
  });
}

function assignPhoto(id) {
  if (!images[id]) return;
  const layout = LAYOUTS[state.layout];
  // Fill the first empty panel, otherwise the selected one.
  let idx = state.panels.findIndex((p) => !p || !images[p]);
  if (idx === -1) idx = state.selected;
  if (idx >= layout.panels) idx = 0;
  state.panels[idx] = id;
  state.selected = idx;
  render();
}

function bindPhotos() {
  $$('[data-sample]').forEach((el) => {
    el.addEventListener('click', () => assignPhoto(el.dataset.sample));
  });
  $('#btn-load-samples').addEventListener('click', async () => {
    await loadSamples();
    state.panels = [...SIZE_DEFAULTS[state.size].panels];
    state.selected = 0;
    render();
  });
  const fileInput = $('#file-input');
  $('#btn-add-photos').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (const file of fileInput.files) {
      try {
        const { img } = await loadUpload(file);
        const id = `upload-${uploads.length}`;
        images[id] = { img, focal: { x: 0.5, y: 0.5 } };
        uploads.push({ id, label: file.name.replace(/\.[^.]+$/, '') });
        addUploadThumb(id, file.name);
        assignPhoto(id);
      } catch (e) {
        setStatus(`Could not load ${file.name}.`);
      }
    }
    fileInput.value = '';
  });
}

function addUploadThumb(id, name) {
  const list = $('#your-photos');
  const empty = list.querySelector('.empty-note');
  if (empty) empty.remove();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb upload-thumb';
  btn.dataset.sample = id;
  btn.innerHTML = `<span class="thumb-label">${escapeHtml(name.replace(/\.[^.]+$/, ''))}</span>`;
  btn.addEventListener('click', () => assignPhoto(id));
  list.appendChild(btn);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------------------------------- canvas input

function toCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function bindCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvasCoords(e);
    const layout = LAYOUTS[state.layout];
    const polys = layout.polygons(canvas.width, canvas.height);
    for (let i = 0; i < polys.length; i++) {
      if (pointInPoly(p.x, p.y, polys[i])) {
        state.selected = i;
        drag = { start: p, pan: { ...(state.pan[i] || { x: 0, y: 0 }) } };
        canvas.setPointerCapture(e.pointerId);
        updateSampleSelection();
        break;
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCanvasCoords(e);
    state.pan[state.selected] = {
      x: drag.pan.x + (p.x - drag.start.x),
      y: drag.pan.y + (p.y - drag.start.y),
    };
    render();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = toCanvasCoords(e);
    const layout = LAYOUTS[state.layout];
    const polys = layout.polygons(canvas.width, canvas.height);
    for (let i = 0; i < polys.length; i++) {
      if (pointInPoly(p.x, p.y, polys[i])) {
        const cur = state.zoom[i] || 1;
        state.zoom[i] = Math.min(3, Math.max(1, cur * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        state.selected = i;
        render();
        break;
      }
    }
  }, { passive: false });
}

// -------------------------------------------------------------- export

async function exportPNG() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext('2d'), size.w, size.h, state, images);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sunset-press-${state.size}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  setStatus(`PNG saved — sunset-press-${state.size}.png (${size.label})`);
}

// ---------------------------------------------------------------- init

function buildSwatches() {
  const wrap = $('#caption-colors');
  for (const c of CAPTION_COLORS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.color = c.hex;
    b.style.background = c.hex;
    b.title = c.label;
    b.setAttribute('aria-label', c.label);
    wrap.appendChild(b);
  }
  const grades = $('#grade-list');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-chip';
    b.dataset.grade = g.id;
    b.innerHTML = `<span class="grade-dot" style="background:${g.swatch}"></span>${g.name}`;
    grades.appendChild(b);
  }
  const layouts = $('#layout-list');
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-chip';
    b.dataset.layout = id;
    b.textContent = l.name;
    layouts.appendChild(b);
  }
  const samples = $('#sample-list');
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb sample-thumb';
    b.dataset.sample = s.id;
    b.innerHTML = `<img src="samples/${s.file}" alt="${s.label}"><span class="thumb-label">${s.label}</span>`;
    samples.appendChild(b);
  }
  const range = $('#caption-size-range');
  range.min = CAPTION_SCALE.min;
  range.max = CAPTION_SCALE.max;
  range.step = 0.05;
  range.value = CAPTION_SCALE.default;
}

async function init() {
  buildSwatches();
  bindTabs();
  bindSizes();
  bindCaption();
  bindLayoutsAndGrades();
  bindPhotos();
  bindCanvas();
  $('#btn-export').addEventListener('click', exportPNG);
  // The editor starts on the landscape defaults (caption included) with
  // an empty stage — the empty state shows until samples are loaded.
  applySizeDefaults('landscape', false);
  if (SHOT === 'cover') {
    document.body.classList.add('shot-mode');
    state.size = SHOT_SIZE in SIZES ? SHOT_SIZE : 'landscape';
    state.captionEdited = false;
    applySizeDefaults(state.size);
  }
  try {
    await Promise.all([
      document.fonts.load('16px Anton'),
      document.fonts.load('700 16px Inter'),
      document.fonts.ready,
      loadSamples(),
    ]);
  } catch (e) {
    // Offline and local: the fonts and samples are vendored, so a failure
    // here is a real problem — but the editor still renders with fallbacks.
    setStatus('Some assets failed to load — rendering with fallbacks.');
  }
  if (SHOT === 'editor') {
    state.panels = [...SIZE_DEFAULTS[state.size].panels];
  }
  render();
  setStatus('Ready — pick a size, then Export PNG.');
  if (SHOT) {
    window.__shotReady = true;
  } else {
    window.__editorReady = true;
  }
}

init();
