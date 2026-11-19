// Sunset Press — editor state + UI wiring. One render function (renderCover)
// drives the preview canvas and the PNG export, so what you see is what the
// PNG holds. Photos never leave the machine: uploads become object URLs.
import { SIZES, LAYOUTS, GRADES, SAMPLES, CAPTION_COLORS } from './presets.js';
import { renderCover, coverMetrics } from './render.js';
import { applyShot } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const canvas = $('#cover-canvas');
const ctx = canvas.getContext('2d');

const state = {
  size: 'landscape',
  layout: 'trio',
  caption: SIZES.landscape.caption,
  sub: SIZES.landscape.sub,
  captionColor: CAPTION_COLORS[0].value,
  captionScale: 1.1,
  captionPos: 'bottom',
  grade: SIZES.landscape.grade,
  panels: [],
  activePanel: 0,
  captionTouched: false,
};
const images = {}; // sample id -> HTMLImageElement
let debug = { ready: false, captionLines: [], subLines: [] };
let hasPhoto = false;

function defaultPanels(layoutId) {
  return LAYOUTS[layoutId].slots.map((slot) => ({
    sample: slot.sample, fx: slot.fx, fy: slot.fy, zoom: slot.zoom ?? 1,
  }));
}
state.panels = defaultPanels('trio');

function previewSize() {
  if (state.size === 'landscape') return [1280, 720];
  if (state.size === 'portrait') return [864, 1080];
  return [900, 900];
}

function render() {
  const [w, h] = previewSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  debug = { ...renderCover(ctx, w, h, state, images), ready: true, size: state.size, layout: state.layout, grade: state.grade };
  window.__coverDebug = debug;
  $('#empty-state').classList.toggle('hidden', hasPhoto);
  $('#caption-preview').textContent = state.caption;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function preloadSamples() {
  await Promise.all(SAMPLES.map(async (s) => {
    images[s.id] = await loadImage(s.file);
  }));
  render();
}

// ---- size / layout ----
function applySize(sizeId, keepCaption) {
  const s = SIZES[sizeId];
  state.size = sizeId;
  state.grade = s.grade;
  if (!keepCaption && !state.captionTouched) {
    state.caption = s.caption;
    state.sub = s.sub;
    $('#caption-input').value = state.caption;
    $('#sub-input').value = state.sub;
  }
  $('#size-label').textContent = s.label;
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === sizeId));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', +b.dataset.grade === state.grade));
  render();
}

function applyLayout(layoutId) {
  state.layout = layoutId;
  state.panels = defaultPanels(layoutId);
  state.activePanel = 0;
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === layoutId));
  syncPanelControls();
  render();
}

// ---- tabs ----
function showTab(tab) {
  $$('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $$('[data-pane]').forEach((p) => p.classList.toggle('active', p.dataset.pane === tab));
}

// ---- samples ----
function loadSample(id) {
  const panel = state.panels[state.activePanel];
  if (panel) { panel.sample = id; }
  hasPhoto = true;
  $$('[data-sample]').forEach((b) => b.classList.toggle('selected', b.dataset.sample === id));
  render();
}

async function addUpload(file) {
  const url = URL.createObjectURL(file);
  const id = `up${Object.keys(images).length}`;
  images[id] = await loadImage(url);
  const grid = $('#sample-grid');
  const btn = document.createElement('button');
  btn.className = 'sample';
  btn.dataset.sample = id;
  btn.type = 'button';
  const thumb = document.createElement('img');
  thumb.src = url;
  thumb.alt = file.name;
  btn.appendChild(thumb);
  btn.appendChild(document.createTextNode(file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'Upload'));
  btn.addEventListener('click', () => loadSample(id));
  grid.appendChild(btn);
  loadSample(id);
}

// ---- panel controls ----
function pointInPoly(x, y, poly, W, H) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = [poly[i][0] * W, poly[i][1] * H];
    const [xj, yj] = [poly[j][0] * W, poly[j][1] * H];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function pickPanel(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const layout = LAYOUTS[state.layout];
  for (let i = 0; i < layout.slots.length; i++) {
    if (pointInPoly(x, y, layout.slots[i].poly, canvas.width, canvas.height)) return i;
  }
  return -1;
}

function syncPanelControls() {
  const panel = state.panels[state.activePanel];
  $('#panel-name').textContent = `Panel ${state.activePanel + 1} — ${LAYOUTS[state.layout].name}`;
  $('#panel-zoom').value = panel ? panel.zoom : 1;
  $('#panel-zoom-val').textContent = panel ? `${Math.round(panel.zoom * 100)}%` : '—';
  $$('#panel-sample option').forEach((o) => { o.selected = panel && o.value === panel.sample; });
}

function wireCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const i = pickPanel(e.clientX, e.clientY);
    if (i < 0) return;
    state.activePanel = i;
    syncPanelControls();
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, panel: state.panels[i] };
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const panel = drag.panel;
    const img = images[panel.sample];
    if (!img) return;
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const slot = LAYOUTS[state.layout].slots[state.activePanel];
    const xs = slot.poly.map(([fx]) => fx * canvas.width);
    const ys = slot.poly.map(([, fy]) => fy * canvas.height);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    const { dw, dh } = coverMetrics(img, bw, bh, panel.zoom);
    panel.fx = Math.min(1, Math.max(0, panel.fx - ((e.clientX - drag.x) * scaleX) / dw));
    panel.fy = Math.min(1, Math.max(0, panel.fy - ((e.clientY - drag.y) * scaleX) / dh));
    drag.x = e.clientX;
    drag.y = e.clientY;
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.activePanel];
    if (!panel) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    syncPanelControls();
    render();
  }, { passive: false });
}

// ---- export ----
async function exportPNG() {
  const s = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = s.exportW;
  off.height = s.exportH;
  renderCover(off.getContext('2d'), s.exportW, s.exportH, state, images);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sunset-press-${state.size}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  $('#export-status').textContent = 'PNG saved';
}

// ---- wire the UI ----
function wireUI() {
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $$('[data-size]').forEach((b) => b.addEventListener('click', () => applySize(b.dataset.size, true)));
  $$('[data-layout]').forEach((b) => b.addEventListener('click', () => applyLayout(b.dataset.layout)));
  $$('[data-sample]').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.sample)));
  $$('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    state.grade = +b.dataset.grade;
    $$('[data-grade]').forEach((x) => x.classList.toggle('active', x === b));
    render();
  }));
  $$('[data-color]').forEach((b) => b.addEventListener('click', () => {
    state.captionColor = b.dataset.color;
    $$('[data-color]').forEach((x) => x.classList.toggle('selected', x === b));
    render();
  }));
  $$('[data-pos]').forEach((b) => b.addEventListener('click', () => {
    state.captionPos = b.dataset.pos;
    $$('[data-pos]').forEach((x) => x.classList.toggle('active', x === b));
    render();
  }));
  $('#caption-input').addEventListener('input', (e) => {
    state.caption = e.target.value || 'SUNSET DRIVE';
    state.captionTouched = true;
    render();
  });
  $('#sub-input').addEventListener('input', (e) => {
    state.sub = e.target.value || 'OCEAN DRIVE';
    state.captionTouched = true;
    render();
  });
  $('#caption-size').addEventListener('input', (e) => {
    state.captionScale = +e.target.value;
    $('#caption-size-val').textContent = `${Math.round(state.captionScale * 100)}%`;
    render();
  });
  $('#panel-zoom').addEventListener('input', (e) => {
    const panel = state.panels[state.activePanel];
    if (panel) panel.zoom = +e.target.value;
    syncPanelControls();
    render();
  });
  $('#panel-sample').addEventListener('change', (e) => {
    const panel = state.panels[state.activePanel];
    if (panel) { panel.sample = e.target.value; hasPhoto = true; }
    render();
  });
  $('#panel-prev').addEventListener('click', () => {
    state.activePanel = (state.activePanel + LAYOUTS[state.layout].slots.length - 1) % LAYOUTS[state.layout].slots.length;
    syncPanelControls();
    render();
  });
  $('#panel-next').addEventListener('click', () => {
    state.activePanel = (state.activePanel + 1) % LAYOUTS[state.layout].slots.length;
    syncPanelControls();
    render();
  });
  $('#btn-export').addEventListener('click', exportPNG);
  $('.upload-btn').addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', async (e) => {
    for (const f of e.target.files) await addUpload(f);
    e.target.value = '';
  });
  $('#btn-next').addEventListener('click', () => showTab('grade'));
  wireCanvas();
}

wireUI();
syncPanelControls();
applySize('landscape', false);
preloadSamples().then(() => {
  const params = new URLSearchParams(location.search);
  if (params.has('shot')) applyShot(params.get('shot'), { state, images, render, applySize, applyLayout, loadSample, showTab });
});
