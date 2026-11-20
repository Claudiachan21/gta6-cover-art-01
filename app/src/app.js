// Sunset Press — editor wiring: state, UI controls, drag-pan / wheel-zoom
// per panel, upload, and PNG export. The canvas is rendered by render.js;
// this file only owns state and events.
import { SIZES, LAYOUTS, SAMPLES, GRADES, CAPTION_COLORS, CAPTION } from './presets.js';
import { renderCover, sampleById } from './render.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const canvas = $('#cover-canvas');
const ctx = canvas.getContext('2d');
const images = {};
let imagesReady = false;

const state = {
  size: 'wide',
  layout: 'trio',
  panels: [
    { imageKey: null, focal: { x: 0.5, y: 0.68 }, zoom: 1.35 },
    { imageKey: null, focal: { x: 0.48, y: 0.5 }, zoom: 1.06 },
    { imageKey: null, focal: { x: 0.0, y: 0.424 }, zoom: 1.06 },
  ],
  selected: 0,
  caption: SIZES.wide.caption,
  sub: SIZES.wide.sub,
  captionColor: CAPTION_COLORS[0].value,
  captionScale: CAPTION.sizeDefault,
  captionPos: 'bottom',
  grade: 0,
  photos: [],
};

const debug = { ready: false, captionLines: [], subLines: [] };
window.__coverDebug = debug;

function loadImages() {
  const jobs = SAMPLES.map((s) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { images[s.id] = img; res(); };
    img.onerror = () => res();
    img.src = s.src;
  }));
  return Promise.all(jobs).then(() => { imagesReady = true; });
}

function render() {
  const S = SIZES[state.size];
  canvas.width = S.w;
  canvas.height = S.h;
  renderCover(ctx, S.w, S.h, state, images, debug);
  debug.ready = imagesReady;
  updateLabels();
}

function updateLabels() {
  const S = SIZES[state.size];
  $('#size-label').textContent = `${S.w} × ${S.h}`;
  $('#caption-preview').textContent = state.caption;
  $('#caption-preview').style.color = state.captionColor;
  const empty = state.panels.every((p) => !p.imageKey);
  $('#empty-state').style.display = empty ? '' : 'none';
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', +b.dataset.grade === state.grade));
  $$('[data-sample]').forEach((b) => {
    const sel = state.panels[state.selected];
    b.classList.toggle('active', sel && sel.imageKey === b.dataset.sample);
  });
  $$('[data-color]').forEach((b) => b.classList.toggle('active', b.dataset.color === state.captionColor));
  $$('[data-pos]').forEach((b) => b.classList.toggle('active', b.dataset.pos === state.captionPos));
  $$('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === currentTab));
  $$('.tab-page').forEach((p) => { p.hidden = p.dataset.page !== currentTab; });
}

let currentTab = 'foto';

function setTab(tab) {
  currentTab = tab;
  updateLabels();
}

function applySize(id) {
  const keepCaption = state.caption;
  const keepSub = state.sub;
  state.size = id;
  const S = SIZES[id];
  state.caption = keepCaption || S.caption;
  state.sub = keepSub || S.sub;
  render();
}

function loadSample(id) {
  const s = sampleById(id);
  state.panels[state.selected] = {
    imageKey: s.id, focal: { ...s.focal }, zoom: s.zoom,
  };
  render();
}

// Staging hook for the ?shot= screenshots (shots.js): fill one panel.
window.__stagePanel = (index, sampleId) => {
  const s = sampleById(sampleId);
  state.panels[index] = { imageKey: s.id, focal: { ...s.focal }, zoom: s.zoom };
  render();
};

function setLayout(id) {
  state.layout = id;
  const n = LAYOUTS[id].panels.length;
  while (state.panels.length < n) {
    state.panels.push({ imageKey: 'street', focal: { x: 0.5, y: 0.5 }, zoom: 1 });
  }
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
  render();
}

function exportPNG() {
  const S = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = S.w;
  off.height = S.h;
  renderCover(off.getContext('2d'), S.w, S.h, state, images, {});
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-press-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('#export-status').textContent = 'PNG saved';
  }, 'image/png');
}

// --- events ---------------------------------------------------------------

$$('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$$('[data-size]').forEach((b) => b.addEventListener('click', () => applySize(b.dataset.size)));
$$('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
$$('[data-sample]').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.sample)));
$$('[data-grade]').forEach((b) => b.addEventListener('click', () => { state.grade = +b.dataset.grade; render(); }));
$$('[data-color]').forEach((b) => b.addEventListener('click', () => { state.captionColor = b.dataset.color; render(); }));
$$('[data-pos]').forEach((b) => b.addEventListener('click', () => { state.captionPos = b.dataset.pos; render(); }));

$('#caption-input').addEventListener('input', (e) => { state.caption = e.target.value.toUpperCase(); render(); });
$('#sub-input').addEventListener('input', (e) => { state.sub = e.target.value.toUpperCase(); render(); });
$('#caption-size').addEventListener('input', (e) => { state.captionScale = +e.target.value; render(); });
$('#btn-export').addEventListener('click', exportPNG);

// Upload: photos stay on the machine, read as object URLs, never uploaded.
$('#file-input').addEventListener('change', (e) => {
  for (const file of e.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const key = `user-${state.photos.length}`;
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      state.photos.push({ key, name: file.name });
      state.panels[state.selected] = { imageKey: key, focal: { x: 0.5, y: 0.5 }, zoom: 1 };
      renderUserPhotos();
      render();
    };
    img.src = URL.createObjectURL(file);
  }
  e.target.value = '';
});

function renderUserPhotos() {
  const wrap = $('#user-photos');
  wrap.innerHTML = '';
  state.photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'sample-card';
    b.type = 'button';
    b.dataset.photo = p.key;
    const img = document.createElement('img');
    img.src = images[p.key].src;
    img.alt = p.name;
    const span = document.createElement('span');
    span.textContent = p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name;
    b.append(img, span);
    b.addEventListener('click', () => {
      state.panels[state.selected] = { imageKey: p.key, focal: { x: 0.5, y: 0.5 }, zoom: 1 };
      render();
    });
    wrap.append(b);
  });
  $('#your-photos').hidden = state.photos.length === 0;
}

// --- canvas interaction: click a panel to select it, drag to pan,
// scroll to zoom, double-click to set the focal point ----------------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function panelAt(x, y) {
  const W = canvas.width, H = canvas.height;
  const pts = LAYOUTS[state.layout].panels;
  for (let i = pts.length - 1; i >= 0; i--) {
    const xs = pts[i].map((p) => p[0] * W), ys = pts[i].map((p) => p[1] * H);
    if (x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys)) return i;
  }
  return 0;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  state.selected = panelAt(p.x, p.y);
  try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
  drag = { x: p.x, y: p.y };
  render();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slot = state.panels[state.selected];
  const img = slot && slot.imageKey ? images[slot.imageKey] : null;
  if (img) {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * slot.zoom;
    slot.focal.x -= (p.x - drag.x) / (img.width * scale);
    slot.focal.y -= (p.y - drag.y) / (img.height * scale);
    slot.focal.x = Math.min(1, Math.max(0, slot.focal.x));
    slot.focal.y = Math.min(1, Math.max(0, slot.focal.y));
  }
  drag = { x: p.x, y: p.y };
  render();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[state.selected];
  if (!slot) return;
  slot.zoom = Math.min(3, Math.max(1, slot.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  render();
}, { passive: false });
canvas.addEventListener('dblclick', (e) => {
  const p = canvasPoint(e);
  const slot = state.panels[state.selected];
  const img = slot && slot.imageKey ? images[slot.imageKey] : null;
  if (!img) return;
  // Focal point = the clicked spot inside the drawn photo.
  const S = SIZES[state.size];
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * slot.zoom;
  slot.focal.x = Math.min(1, Math.max(0, p.x / (img.width * scale)));
  slot.focal.y = Math.min(1, Math.max(0, p.y / (img.height * scale)));
  render();
});

// Panel tab: zoom slider for the selected panel.
$('#panel-zoom').addEventListener('input', (e) => {
  const slot = state.panels[state.selected];
  if (slot) { slot.zoom = +e.target.value; render(); }
});
$('#panel-next').addEventListener('click', () => {
  state.selected = (state.selected + 1) % state.panels.length;
  render();
});

// Caption tab: Next moves to the Grade tab.
$('#caption-next').addEventListener('click', () => setTab('grade'));

// --- boot -----------------------------------------------------------------
document.fonts.load('400 100px Anton').finally(() => render());
document.fonts.load('700 40px Inter').finally(() => render());
loadImages().then(() => render());
render();
