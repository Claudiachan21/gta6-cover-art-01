// Sunset Press — editor state and wiring. The canvas preview and the PNG
// export share one renderer (render.js), so the editor never lies about
// the export. Photos are read on this machine and never uploaded.

import { SIZES, SIZE_DEFAULTS, SAMPLES, LAYOUTS, GRADES, CAPTION_COLORS } from './presets.js';
import { renderCover, panelsForLayout } from './render.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $('#cover-canvas');
const emptyState = $('#empty-state');
const exportStatus = $('#export-status');

// Loaded photos: sample id or upload id -> HTMLImageElement.
const images = new Map();
// Uploaded photos, appended to the sample grid as they arrive.
const extraSamples = [];
let uploadCount = 0;

function blankPanels(count) {
  return Array.from({ length: count }, () => ({ photo: null, zoom: 1, cx: 0.5, cy: 0.5 }));
}

const state = {
  size: 'wide',
  layout: 'trio',
  grade: SIZE_DEFAULTS.wide.grade,
  caption: SIZE_DEFAULTS.wide.caption,
  sub: SIZE_DEFAULTS.wide.sub,
  captionColor: CAPTION_COLORS[0].value,
  captionSize: 1.1,
  captionPos: 'bottom',
  panels: blankPanels(LAYOUTS.trio.panels.length),
  activePanel: 0,
  selectedSample: null,
};

function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || extraSamples.find((s) => s.id === id);
}

function loadImage(id) {
  if (images.has(id)) return Promise.resolve(images.get(id));
  const sample = sampleById(id);
  if (!sample) return Promise.reject(new Error(`unknown photo ${id}`));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(id, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`could not load ${sample.src}`));
    img.src = sample.src;
  });
}

function loadAllPhotos() {
  const ids = new Set(state.panels.map((p) => p.photo).filter(Boolean));
  return Promise.all([...ids].map((id) => loadImage(id).catch(() => null)));
}

function draw() {
  const { w, h } = SIZES[state.size];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  const debug = renderCover(ctx, w, h, state, images);
  window.__coverDebug = { ready: true, ...debug };
  const anyPhoto = state.panels.some((p) => p.photo);
  emptyState.classList.toggle('hidden', anyPhoto);
  const preview = $('#caption-preview');
  if (preview) preview.textContent = state.caption;
  const sizeLabel = $('#size-label');
  if (sizeLabel) sizeLabel.textContent = SIZES[state.size].label;
}

function setSize(sizeKey) {
  if (!SIZES[sizeKey]) return;
  state.size = sizeKey;
  // The size's grade becomes the grade; the caption the user typed stays.
  state.grade = SIZE_DEFAULTS[sizeKey].grade;
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === sizeKey));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', +b.dataset.grade === state.grade));
  draw();
}

function setLayout(layoutKey) {
  if (!LAYOUTS[layoutKey]) return;
  const old = state.panels;
  state.layout = layoutKey;
  state.panels = LAYOUTS[layoutKey].panels.map((_, i) => old[i] || { photo: null, zoom: 1, cx: 0.5, cy: 0.5 });
  state.activePanel = Math.min(state.activePanel, state.panels.length - 1);
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === layoutKey));
  renderPanelTab();
  draw();
}

async function loadSample(id) {
  try {
    await loadImage(id);
  } catch {
    return;
  }
  const panel = state.panels[state.activePanel];
  const sample = sampleById(id);
  panel.photo = id;
  panel.zoom = 1;
  panel.cx = sample.focal.x;
  panel.cy = sample.focal.y;
  state.selectedSample = id;
  $$('[data-sample]').forEach((b) => b.classList.toggle('selected', b.dataset.sample === id));
  renderPanelTab();
  draw();
}

function switchTab(tab) {
  $$('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === tab));
}

function renderPanelTab() {
  const list = $('#panel-list');
  if (!list) return;
  list.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt panel-pick' + (i === state.activePanel ? ' active' : '');
    btn.dataset.panel = String(i);
    btn.textContent = i === 0 ? `Panel ${i + 1} — Hero` : `Panel ${i + 1}`;
    btn.addEventListener('click', () => {
      state.activePanel = i;
      renderPanelTab();
      draw();
    });
    list.appendChild(btn);
  });
  const zoom = $('#panel-zoom');
  if (zoom) zoom.value = String(state.panels[state.activePanel].zoom);
  const zoomLabel = $('#panel-zoom-label');
  if (zoomLabel) zoomLabel.textContent = `${state.panels[state.activePanel].zoom.toFixed(2)}×`;
}

function renderSampleGrid() {
  const grid = $('#sample-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const sample of [...SAMPLES, ...extraSamples]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sample' + (state.selectedSample === sample.id ? ' selected' : '');
    btn.dataset.sample = sample.id;
    const img = document.createElement('img');
    img.src = sample.src;
    img.alt = sample.name;
    const label = document.createElement('span');
    label.textContent = sample.name;
    btn.append(img, label);
    btn.addEventListener('click', () => loadSample(sample.id));
    grid.appendChild(btn);
  }
}

function renderGradeTab() {
  const wrap = $('#grade-list');
  if (!wrap) return;
  wrap.innerHTML = '';
  GRADES.forEach((grade, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt grade-pick' + (i === state.grade ? ' active' : '');
    btn.dataset.grade = String(i);
    const dot = document.createElement('span');
    dot.className = 'grade-dot';
    dot.style.background = grade.dot;
    const label = document.createElement('span');
    label.textContent = grade.name;
    btn.append(dot, label);
    btn.addEventListener('click', () => {
      state.grade = i;
      renderGradeTab();
      draw();
    });
    wrap.appendChild(btn);
  });
}

function renderCaptionTab() {
  const wrap = $('#color-swatches');
  if (!wrap) return;
  wrap.innerHTML = '';
  CAPTION_COLORS.forEach((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch' + (state.captionColor === color.value ? ' active' : '');
    btn.dataset.color = color.value;
    btn.style.background = color.value;
    btn.title = color.name;
    btn.setAttribute('aria-label', color.name);
    btn.addEventListener('click', () => {
      state.captionColor = color.value;
      renderCaptionTab();
      draw();
    });
    wrap.appendChild(btn);
  });
}

// Canvas hit-testing: which panel polygon holds this canvas point?
function panelAtPoint(px, py) {
  const { w, h } = SIZES[state.size];
  const polys = panelsForLayout(state.layout, w, h);
  for (let i = polys.length - 1; i >= 0; i--) {
    let inside = false;
    const poly = polys[i];
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [ax, ay] = poly[a];
      const [bx, by] = poly[b];
      if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return 0;
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    rect,
  };
}

function panelDrawGeom(index) {
  const { w, h } = SIZES[state.size];
  const poly = panelsForLayout(state.layout, w, h)[index];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const panel = state.panels[index];
  const img = panel.photo ? images.get(panel.photo) : null;
  if (!img) return null;
  const bw = maxX - minX;
  const bh = maxY - minY;
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * panel.zoom;
  return {
    minX, minY, bw, bh,
    dw: img.naturalWidth * scale,
    dh: img.naturalHeight * scale,
  };
}

function wireCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const index = panelAtPoint(p.x, p.y);
    state.activePanel = index;
    renderPanelTab();
    const panel = state.panels[index];
    if (!panel.photo) return;
    canvas.setPointerCapture(e.pointerId);
    drag = { index, startX: e.clientX, startY: e.clientY, cx: panel.cx, cy: panel.cy };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const geom = panelDrawGeom(drag.index);
    if (!geom) return;
    const rect = canvas.getBoundingClientRect();
    const dxPx = ((e.clientX - drag.startX) / rect.width) * canvas.width;
    const dyPx = ((e.clientY - drag.startY) / rect.height) * canvas.height;
    const panel = state.panels[drag.index];
    panel.cx = drag.cx - dxPx / geom.dw;
    panel.cy = drag.cy - dyPx / geom.dh;
    draw();
  });
  const endDrag = () => {
    drag = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = canvasPoint(e);
    const index = panelAtPoint(p.x, p.y);
    const panel = state.panels[index];
    if (!panel.photo) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    state.activePanel = index;
    renderPanelTab();
    draw();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    const p = canvasPoint(e);
    const index = panelAtPoint(p.x, p.y);
    const panel = state.panels[index];
    const geom = panelDrawGeom(index);
    if (!geom) return;
    const dx = geom.minX + geom.bw / 2 - panel.cx * geom.dw;
    const dy = geom.minY + geom.bh / 2 - panel.cy * geom.dh;
    panel.cx = (p.x - dx) / geom.dw;
    panel.cy = (p.y - dy) / geom.dh;
    draw();
  });
}

function exportPNG() {
  const { w, h } = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off.getContext('2d'), w, h, state, images);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-press-${state.size}.png`;
    a.click();
    exportStatus.textContent = 'PNG saved';
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function wireUI() {
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $$('[data-size]').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
  $$('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
  $$('[data-pos]').forEach((b) =>
    b.addEventListener('click', () => {
      state.captionPos = b.dataset.pos;
      $$('[data-pos]').forEach((x) => x.classList.toggle('active', x === b));
      draw();
    }),
  );
  $('#caption-input').addEventListener('input', (e) => {
    state.caption = e.target.value.toUpperCase();
    draw();
  });
  $('#sub-input').addEventListener('input', (e) => {
    state.sub = e.target.value.toUpperCase();
    draw();
  });
  $('#caption-size').addEventListener('input', (e) => {
    state.captionSize = +e.target.value;
    draw();
  });
  $('#panel-zoom').addEventListener('input', (e) => {
    state.panels[state.activePanel].zoom = +e.target.value;
    const label = $('#panel-zoom-label');
    if (label) label.textContent = `${(+e.target.value).toFixed(2)}×`;
    draw();
  });
  $('#btn-frame-reset').addEventListener('click', () => {
    const panel = state.panels[state.activePanel];
    const sample = sampleById(panel.photo);
    panel.zoom = 1;
    panel.cx = sample ? sample.focal.x : 0.5;
    panel.cy = sample ? sample.focal.y : 0.5;
    renderPanelTab();
    draw();
  });
  $('#btn-export').addEventListener('click', exportPNG);
  $('#btn-try-sample').addEventListener('click', () => loadSample('boulevard'));
  $('#btn-next-grade').addEventListener('click', () => switchTab('grade'));
  const fileInput = $('#file-input');
  $('.upload-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (const file of fileInput.files) {
      const id = `up-${++uploadCount}`;
      const url = URL.createObjectURL(file);
      extraSamples.push({ id, name: file.name.replace(/\.[^.]+$/, ''), src: url, focal: { x: 0.5, y: 0.5 } });
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      images.set(id, img);
      const panel = state.panels[state.activePanel];
      panel.photo = id;
      panel.zoom = 1;
      panel.cx = 0.5;
      panel.cy = 0.5;
      state.selectedSample = id;
    }
    fileInput.value = '';
    renderSampleGrid();
    renderPanelTab();
    draw();
  });
  wireCanvas();
}

// Staging for the dossier screenshots (?shot=cover|editor|portrait|square).
// Loads the staged photos, applies the staged state, renders once the fonts
// and photos are ready, then flags __shotReady for the shooter.
const STAGING = {
  cover: { size: 'wide', caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026', grade: 0, photos: ['boulevard', 'nightdrive', 'pier'] },
  portrait: { size: 'portrait', caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026', grade: 1, photos: ['boulevard', 'nightdrive', 'pier'] },
  square: { size: 'square', caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY', grade: 0, photos: ['boulevard', 'nightdrive', 'pier'] },
  editor: { size: 'wide', caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026', grade: 0, photos: ['boulevard', 'nightdrive', 'pier'] },
};

async function applyShot(shot) {
  const stage = STAGING[shot];
  if (!stage) return false;
  if (shot !== 'editor') document.body.classList.add('shot-cover');
  state.size = stage.size;
  state.caption = stage.caption;
  state.sub = stage.sub;
  state.grade = stage.grade;
  state.captionPos = 'bottom';
  state.captionSize = 1.1;
  state.layout = 'trio';
  state.panels = LAYOUTS.trio.panels.map((_, i) => {
    const id = stage.photos[i];
    const sample = sampleById(id);
    return { photo: id || null, zoom: 1, cx: sample ? sample.focal.x : 0.5, cy: sample ? sample.focal.y : 0.5 };
  });
  state.selectedSample = 'pier';
  state.activePanel = 0;
  const captionInput = $('#caption-input');
  if (captionInput) captionInput.value = stage.caption;
  const subInput = $('#sub-input');
  if (subInput) subInput.value = stage.sub;
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === stage.size));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', +b.dataset.grade === stage.grade));
  renderSampleGrid();
  renderPanelTab();
  renderGradeTab();
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('600 16px Inter'),
    loadAllPhotos(),
  ]);
  draw();
  return true;
}

async function init() {
  renderSampleGrid();
  renderPanelTab();
  renderGradeTab();
  renderCaptionTab();
  wireUI();
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('600 16px Inter'),
    document.fonts.ready,
  ]);
  draw();
}

window.__sunset = { state, draw, applyShot, loadSample, exportPNG, loadAllPhotos };
init();
