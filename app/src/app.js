// Sunset Press — editor state and wiring. The preview canvas and the PNG
// export share one renderer (render.js), so the poster you see is the
// poster you share.
import { SIZES, LAYOUTS, GRADES, SAMPLES, DEFAULT_CAPTION, DEFAULT_SUBCAPTION, defaultPanels } from './presets.js';
import { renderCover } from './render.js';
import { stageShot } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const CAPTION_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Sun yellow', value: '#FFD94D' },
  { name: 'Neon pink', value: '#FF5A8A' },
  { name: 'Ocean blue', value: '#2E7FB8' },
  { name: 'Ink', value: '#0E1A24' },
];

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('sunset-press-settings') || '{}');
  } catch (e) {
    return {};
  }
}

function saveSettings(state) {
  try {
    localStorage.setItem('sunset-press-settings', JSON.stringify({
      size: state.size,
      layout: state.layout,
      grade: state.grade,
      gradeStrength: state.gradeStrength,
      caption: state.caption,
      subcaption: state.subcaption,
      captionColor: state.captionColor,
      captionScale: state.captionScale,
      captionPos: state.captionPos,
    }));
  } catch (e) { /* private mode */ }
}

const saved = loadSettings();
const state = {
  size: saved.size || 'landscape',
  layout: saved.layout || 'diagonal',
  grade: saved.grade || 'sunset',
  gradeStrength: saved.gradeStrength == null ? 0.55 : saved.gradeStrength,
  caption: saved.caption || DEFAULT_CAPTION,
  subcaption: saved.subcaption || DEFAULT_SUBCAPTION,
  captionColor: saved.captionColor || '#FFFFFF',
  captionScale: saved.captionScale || 0.145,
  captionPos: saved.captionPos || 'bottom',
  panels: defaultPanels(saved.layout || 'diagonal'),
  photos: [],
  selectedPanel: 0,
};

const canvas = $('#cover-canvas');
const ctx = canvas.getContext('2d');
let renderQueued = false;
let fontsReady = false;

function currentSize() {
  return SIZES[state.size];
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    draw();
  });
}

function draw() {
  const { w, h } = currentSize();
  const previewScale = Math.min(1, 1200 / Math.max(w, h));
  canvas.width = Math.round(w * previewScale);
  canvas.height = Math.round(h * previewScale);
  renderCover(ctx, canvas.width, canvas.height, state);
}

function anyPhotoLoaded() {
  return state.panels.some((p) => p.photoId);
}

function refreshChrome() {
  $('#size-label').textContent = currentSize().short;
  $('#layout-label').textContent = `Layout · ${LAYOUTS[state.layout].label}`;
  $('#empty-state').hidden = anyPhotoLoaded();
  const panel = state.panels[state.selectedPanel];
  $('#panel-name').textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length}`;
  $('#panel-zoom').value = String(panel ? panel.zoom : 1.12);
  const sel = $('#panel-photo');
  sel.value = panel && panel.photoId ? panel.photoId : '';
  $$('.size-switch [data-size]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.size === state.size));
  });
  $$('.layout-card').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  $$('.grade-card').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  $$('.swatch').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.color === state.captionColor));
  });
  $$('.pos-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.pos === state.captionPos));
  });
  $('#caption-preview').textContent = state.caption || '—';
  $$('.thumb').forEach((t) => {
    t.setAttribute('aria-pressed', String(state.panels[state.selectedPanel]?.photoId === t.dataset.photoId));
  });
  saveSettings(state);
}

function addPhoto(photo) {
  const existing = state.photos.find((p) => p.id === photo.id);
  if (existing) return existing;
  state.photos.push(photo);
  return photo;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    if (state.photos.some((p) => p.id === s.id)) continue;
    try {
      const img = await loadImage(s.src);
      addPhoto({ id: s.id, name: s.name, src: s.src, img, w: img.naturalWidth, h: img.naturalHeight, fx: s.fx, fy: s.fy, thumbPos: s.thumbPos });
    } catch (e) { /* sample missing: skip it */ }
  }
  renderSampleThumbs();
  buildPanelPhotoSelect();
  refreshChrome();
  queueRender();
}

function photoThumb(photo, pressed) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb';
  btn.dataset.photoId = photo.id;
  btn.setAttribute('aria-pressed', String(pressed));
  btn.title = photo.name;
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.name;
  img.style.objectPosition = photo.thumbPos || 'center';
  const label = document.createElement('span');
  label.textContent = photo.name;
  btn.append(img, label);
  btn.addEventListener('click', () => {
    assignPhotoToSelected(photo.id);
  });
  return btn;
}

function renderSampleThumbs() {
  const grid = $('#sample-grid');
  grid.replaceChildren();
  for (const s of SAMPLES) {
    const photo = state.photos.find((p) => p.id === s.id);
    if (!photo) continue;
    const btn = photoThumb(photo, false);
    btn.dataset.sample = '';
    grid.appendChild(btn);
  }
}

function renderUploadThumbs() {
  const grid = $('#thumb-grid');
  grid.replaceChildren();
  const uploads = state.photos.filter((p) => !p.id.startsWith('sample-'));
  $('#thumb-empty').hidden = uploads.length > 0;
  for (const photo of uploads) {
    grid.appendChild(photoThumb(photo, false));
  }
}

function assignPhotoToSelected(photoId) {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  panel.photoId = photoId;
  panel.zoom = 1.12;
  panel.ox = 0;
  panel.oy = 0;
  refreshChrome();
  queueRender();
}

function buildLayoutPicker() {
  const grid = $('#layout-grid');
  grid.replaceChildren();
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-card';
    btn.dataset.layout = id;
    btn.setAttribute('aria-pressed', String(id === state.layout));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 64');
    svg.classList.add('layout-diagram');
    svg.setAttribute('aria-hidden', 'true');
    layout.slots.forEach((slot, i) => {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', slot.map(([x, y]) => `${x * 100},${y * 64}`).join(' '));
      poly.setAttribute('fill', ['#FF6B35', '#FFD94D', '#2E7FB8', '#1F8A7A'][i % 4]);
      poly.setAttribute('stroke', '#0E1A24');
      poly.setAttribute('stroke-width', '2');
      svg.appendChild(poly);
    });
    const strong = document.createElement('strong');
    strong.textContent = layout.label;
    const span = document.createElement('span');
    span.textContent = layout.hint;
    btn.append(svg, strong, span);
    btn.addEventListener('click', () => {
      const old = state.panels;
      state.layout = id;
      const n = LAYOUTS[id].slots.length;
      state.panels = Array.from({ length: n }, (_, i) => {
        const prev = old[i];
        return prev ? { ...prev } : { photoId: null, zoom: 1.12, ox: 0, oy: 0 };
      });
      state.selectedPanel = 0;
      refreshChrome();
      queueRender();
    });
    grid.appendChild(btn);
  }
}

function buildGradePicker() {
  const grid = $('#grade-grid');
  grid.replaceChildren();
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-card';
    btn.dataset.grade = id;
    btn.setAttribute('aria-pressed', String(id === state.grade));
    const sw = document.createElement('span');
    sw.className = 'grade-swatch';
    sw.style.background = `linear-gradient(135deg, ${grade.glow}, ${grade.washBottom})`;
    const strong = document.createElement('strong');
    strong.textContent = grade.label;
    const span = document.createElement('span');
    span.textContent = grade.hint;
    btn.append(sw, strong, span);
    btn.addEventListener('click', () => {
      state.grade = id;
      refreshChrome();
      queueRender();
    });
    grid.appendChild(btn);
  }
}

function buildSwatches() {
  const wrap = $('#caption-swatches');
  wrap.replaceChildren();
  for (const c of CAPTION_COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.color = c.value;
    btn.style.background = c.value;
    btn.title = c.name;
    btn.setAttribute('aria-label', `Caption colour ${c.name}`);
    btn.setAttribute('aria-pressed', String(c.value === state.captionColor));
    btn.addEventListener('click', () => {
      state.captionColor = c.value;
      refreshChrome();
      queueRender();
    });
    wrap.appendChild(btn);
  }
}

function buildPanelPhotoSelect() {
  const sel = $('#panel-photo');
  sel.replaceChildren();
  const none = document.createElement('option');
  none.value = '';
  none.textContent = '— Empty —';
  sel.appendChild(none);
  for (const photo of state.photos) {
    const opt = document.createElement('option');
    opt.value = photo.id;
    opt.textContent = photo.name;
    sel.appendChild(opt);
  }
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function hitPanel(event) {
  const { x, y } = canvasPoint(event);
  const layout = LAYOUTS[state.layout];
  const fx = x / canvas.width;
  const fy = y / canvas.height;
  for (let i = 0; i < layout.slots.length; i += 1) {
    if (pointInPolygon(fx, fy, layout.slots[i])) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const hit = hitPanel(event);
  if (hit < 0) return;
  state.selectedPanel = hit;
  refreshChrome();
  const panel = state.panels[hit];
  if (!panel || !panel.photoId) return;
  canvas.setPointerCapture(event.pointerId);
  drag = { x: event.clientX, y: event.clientY, ox: panel.ox, oy: panel.oy, panel };
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const slot = LAYOUTS[state.layout].slots[state.selectedPanel];
  const xs = slot.map(([fx]) => fx);
  const ys = slot.map(([, fy]) => fy);
  const slotW = (Math.max(...xs) - Math.min(...xs)) * rect.width;
  const slotH = (Math.max(...ys) - Math.min(...ys)) * rect.height;
  drag.panel.ox = drag.ox + (event.clientX - drag.x) / slotW;
  drag.panel.oy = drag.oy + (event.clientY - drag.y) / slotH;
  drag.panel.ox = Math.max(-0.6, Math.min(0.6, drag.panel.ox));
  drag.panel.oy = Math.max(-0.6, Math.min(0.6, drag.panel.oy));
  queueRender();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[state.selectedPanel];
  if (!panel || !panel.photoId) return;
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom - Math.sign(event.deltaY) * 0.08));
  $('#panel-zoom').value = String(panel.zoom);
  queueRender();
}, { passive: false });

async function exportPNG() {
  const { w, h } = currentSize();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const offCtx = off.getContext('2d');
  await document.fonts.ready;
  renderCover(offCtx, w, h, state);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  if (!blob) {
    $('#export-status').textContent = 'Export failed — try again.';
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = `sunset-press-${state.size}-${w}x${h}.png`;
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  $('#export-status').textContent = `PNG saved — ${name} (${Math.round(blob.size / 1024)} KB)`;
}

function wireUI() {
  $$('.size-switch [data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      refreshChrome();
      queueRender();
    });
  });
  $$('.tabs [data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tabs [data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      $$('.tab-page').forEach((p) => { p.hidden = p.dataset.page !== tab.dataset.tab; });
    });
  });
  $('#file-input').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const src = URL.createObjectURL(file);
      try {
        const img = await loadImage(src);
        const photo = addPhoto({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^.]+$/, '') || 'Photo',
          src,
          img,
          w: img.naturalWidth,
          h: img.naturalHeight,
        });
        const empty = state.panels.find((p) => !p.photoId);
        if (empty) {
          empty.photoId = photo.id;
          empty.zoom = 1.12;
          empty.ox = 0;
          empty.oy = 0;
        }
      } catch (e) { /* unreadable file: skip */ }
    }
    event.target.value = '';
    renderUploadThumbs();
    buildPanelPhotoSelect();
    refreshChrome();
    queueRender();
  });
  $('#btn-load-samples').addEventListener('click', async () => {
    await loadSamples();
    state.panels = defaultPanels(state.layout, true);
    refreshChrome();
    queueRender();
  });
  $('#panel-photo').addEventListener('change', (event) => {
    assignPhotoToSelected(event.target.value || null);
    buildPanelPhotoSelect();
    refreshChrome();
  });
  $('#panel-zoom').addEventListener('input', (event) => {
    const panel = state.panels[state.selectedPanel];
    if (panel) panel.zoom = Number(event.target.value);
    queueRender();
  });
  $('#btn-fit').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (panel) { panel.zoom = 1; panel.ox = 0; panel.oy = 0; }
    refreshChrome();
    queueRender();
  });
  $('#btn-clear-panel').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (panel) { panel.photoId = null; panel.zoom = 1; panel.ox = 0; panel.oy = 0; }
    refreshChrome();
    queueRender();
  });
  $('#caption-input').addEventListener('input', (event) => {
    state.caption = event.target.value;
    refreshChrome();
    queueRender();
  });
  $('#subcaption-input').addEventListener('input', (event) => {
    state.subcaption = event.target.value;
    queueRender();
  });
  $('#caption-size').addEventListener('input', (event) => {
    state.captionScale = Number(event.target.value);
    queueRender();
  });
  $$('.pos-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.captionPos = b.dataset.pos;
      refreshChrome();
      queueRender();
    });
  });
  $('#grade-strength').addEventListener('input', (event) => {
    state.gradeStrength = Number(event.target.value);
    queueRender();
  });
  $('#btn-export').addEventListener('click', exportPNG);
}

async function init() {
  buildLayoutPicker();
  buildGradePicker();
  buildSwatches();
  $('#caption-input').value = state.caption;
  $('#subcaption-input').value = state.subcaption;
  $('#caption-size').value = String(state.captionScale);
  $('#grade-strength').value = String(state.gradeStrength);
  wireUI();
  buildPanelPhotoSelect();
  renderSampleThumbs();
  refreshChrome();
  loadSamples();
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('800 20px Inter'),
      document.fonts.ready,
    ]);
    fontsReady = true;
  } catch (e) { fontsReady = true; }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await stageShot(state, { loadSamples, assignPhotoToSelected, refreshChrome, queueRender });
  }
  draw();
  window.__editorReady = true;
}

init();
