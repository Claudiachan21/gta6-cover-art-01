// Sunset Press — editor wiring: state, samples, upload, panel controls,
// caption controls, sizes, layouts, grades, export. The preview canvas and
// the exported PNG share one renderer (render.js), so WYSIWYG holds.

import { SIZES, LAYOUTS, GRADES, SAMPLES, CAPTION_COLORS, DEFAULTS } from './presets.js';
import { renderCover } from './render.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// One panel per layout slot: { key, img, zoom, dx, dy, focalX, focalY }.
const state = {
  size: DEFAULTS.size,
  layout: DEFAULTS.layout,
  grade: DEFAULTS.grade,
  caption: DEFAULTS.caption,
  sub: DEFAULTS.sub,
  captionColor: DEFAULTS.captionColor,
  captionSize: DEFAULTS.captionSize,
  captionPos: DEFAULTS.captionPos,
  panels: [],
  selected: 0,
};

const images = new Map(); // sample id -> loaded HTMLImageElement
let photosLoaded = 0;

function sampleImage(id) {
  if (images.has(id)) return images.get(id);
  const meta = SAMPLES.find((s) => s.id === id);
  const img = new Image();
  img.src = meta.file;
  img.onload = () => draw();
  images.set(id, img);
  return img;
}

function freshPanels(layoutIdx) {
  const layout = LAYOUTS[layoutIdx];
  return layout.panels.map((p, i) => {
    const old = state.panels[i];
    if (old && old.key) return old;
    return {
      key: p.photo,
      img: sampleImage(p.photo),
      zoom: 1,
      dx: 0,
      dy: 0,
      focalX: p.focal[0],
      focalY: p.focal[1],
    };
  });
}

// Preview canvas: internal pixels follow the export aspect, capped for speed.
function previewDims() {
  const s = SIZES[state.size];
  const scale = Math.min(1, 960 / s.width, 720 / s.height);
  return { w: Math.round(s.width * scale), h: Math.round(s.height * scale) };
}

function draw() {
  const canvas = $('#cover-canvas');
  const { w, h } = previewDims();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  const renderState = {
    size: state.size,
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    sub: state.sub,
    captionColor: state.captionColor,
    captionSize: state.captionSize,
    captionPos: state.captionPos,
    panels: state.panels.map((p) => ({
      img: p.img,
      zoom: p.zoom,
      dx: p.dx,
      dy: p.dy,
      focalX: p.focalX,
      focalY: p.focalY,
    })),
  };
  const debug = renderCover(ctx, w, h, renderState);
  window.__coverDebug = {
    captionLines: debug.lines,
    subLines: debug.subLines,
    captionSize: debug.size,
    ready: true,
  };
  $('#caption-preview').textContent = state.caption.toUpperCase();
  $('#size-label').textContent = SIZES[state.size].label;
  const anyPhoto = state.panels.some((p) => p.key);
  $('#empty-state').classList.toggle('hidden', anyPhoto);
}

function assignPhoto(panelIdx, key, img) {
  const layout = LAYOUTS[state.layout];
  const meta = SAMPLES.find((s) => s.id === key);
  state.panels[panelIdx] = {
    key,
    img: img || sampleImage(key),
    zoom: 1,
    dx: 0,
    dy: 0,
    focalX: meta ? meta.focal[0] : 0.5,
    focalY: meta ? meta.focal[1] : 0.5,
  };
  photosLoaded++;
  syncPanelControls();
  draw();
}

function applySize(sizeKey) {
  state.size = sizeKey; // the user's caption survives a size switch
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === sizeKey));
  draw();
}

function applyLayout(idx) {
  state.layout = idx;
  state.selected = 0;
  state.panels = freshPanels(idx);
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', +b.dataset.layout === idx));
  buildPanelPicker();
  syncPanelControls();
  draw();
}

function applyGrade(idx) {
  state.grade = idx;
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', +b.dataset.grade === idx));
  draw();
}

// --- Panel tab: pick a panel, then its three controls (zoom, pan, photo) ---
function buildPanelPicker() {
  const wrap = $('#panel-picker');
  wrap.innerHTML = '';
  LAYOUTS[state.layout].panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = i === 0 ? 'Hero' : `Panel ${i + 1}`;
    b.classList.toggle('active', i === state.selected);
    b.addEventListener('click', () => {
      state.selected = i;
      buildPanelPicker();
      syncPanelControls();
    });
    wrap.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selected] || {};
  $('#zoom-range').value = p.zoom ?? 1;
  $('#zoom-val').textContent = `${Math.round((p.zoom ?? 1) * 100)}%`;
  $('#panx-range').value = (p.dx ?? 0) * 100;
  $('#pany-range').value = (p.dy ?? 0) * 100;
  $('#panel-photo-label').textContent = p.key ? p.key : '—';
}

// --- Tabs ---
$$('[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
    $$('[data-pane]').forEach((p) => p.classList.toggle('active', p.dataset.pane === btn.dataset.tab));
  });
});

// --- Foto tab: upload + samples + sizes + layouts ---
$('#file-input').addEventListener('change', (e) => {
  const files = [...e.target.files];
  files.forEach((file, k) => {
    const idx = Math.min(state.selected + k, state.panels.length - 1);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => draw();
    img.src = url;
    state.panels[idx] = {
      key: file.name,
      img,
      zoom: 1,
      dx: 0,
      dy: 0,
      focalX: 0.5,
      focalY: 0.5,
    };
  });
  photosLoaded += files.length;
  syncPanelControls();
  draw();
  e.target.value = '';
});

$$('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('[data-sample]').forEach((b) => b.classList.toggle('selected', b === btn));
    assignPhoto(state.selected, btn.dataset.sample);
  });
});

$$('[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => applySize(btn.dataset.size));
});

$$('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => applyLayout(+btn.dataset.layout));
});

// --- Panel controls ---
$('#zoom-range').addEventListener('input', (e) => {
  const p = state.panels[state.selected];
  p.zoom = +e.target.value;
  $('#zoom-val').textContent = `${Math.round(p.zoom * 100)}%`;
  draw();
});
$('#panx-range').addEventListener('input', (e) => {
  state.panels[state.selected].dx = +e.target.value / 100;
  draw();
});
$('#pany-range').addEventListener('input', (e) => {
  state.panels[state.selected].dy = +e.target.value / 100;
  draw();
});
$('#btn-change-photo').addEventListener('click', () => {
  const order = SAMPLES.map((s) => s.id);
  const cur = state.panels[state.selected].key;
  const next = order[(order.indexOf(cur) + 1) % order.length];
  assignPhoto(state.selected, next);
  $$(`[data-sample="${next}"]`).forEach((b) => b.classList.add('selected'));
});

// --- Drag-pan, wheel zoom and double-click focal on the canvas ---
const canvas = $('#cover-canvas');
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = state.panels[state.selected];
  const rect = canvas.getBoundingClientRect();
  p.dx += (e.clientX - drag.x) / rect.width;
  p.dy += (e.clientY - drag.y) / rect.height;
  p.dx = Math.max(-0.4, Math.min(0.4, p.dx));
  p.dy = Math.max(-0.4, Math.min(0.4, p.dy));
  drag = { x: e.clientX, y: e.clientY };
  syncPanelControls();
  draw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.zoom = Math.max(1, Math.min(3, p.zoom * (1 - e.deltaY * 0.001)));
  syncPanelControls();
  draw();
}, { passive: false });
canvas.addEventListener('dblclick', (e) => {
  const p = state.panels[state.selected];
  const rect = canvas.getBoundingClientRect();
  p.focalX = (e.clientX - rect.left) / rect.width;
  p.focalY = (e.clientY - rect.top) / rect.height;
  draw();
});

// --- Teks tab ---
$('#caption-input').addEventListener('input', (e) => {
  state.caption = e.target.value.trim() === '' ? DEFAULTS.caption : e.target.value;
  draw();
});
$('#sub-input').addEventListener('input', (e) => {
  state.sub = e.target.value;
  draw();
});
$$('[data-color]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.captionColor = btn.dataset.color;
    $$('[data-color]').forEach((b) => b.classList.toggle('selected', b === btn));
    draw();
  });
});
$('#caption-size').addEventListener('input', (e) => {
  state.captionSize = +e.target.value;
  $('#caption-size-val').textContent = `${Math.round(state.captionSize * 100)}%`;
  draw();
});
$$('[data-pos]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.captionPos = btn.dataset.pos;
    $$('[data-pos]').forEach((b) => b.classList.toggle('active', b === btn));
    draw();
  });
});
$('#btn-next-grade').addEventListener('click', () => {
  document.querySelector('[data-tab="grade"]').click();
});

// --- Grade tab ---
$$('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => applyGrade(+btn.dataset.grade));
});

// --- Export: render at full export size, download the PNG ---
$('#btn-export').addEventListener('click', () => {
  const s = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = s.width;
  off.height = s.height;
  const ctx = off.getContext('2d');
  renderCover(ctx, s.width, s.height, {
    size: state.size,
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    sub: state.sub,
    captionColor: state.captionColor,
    captionSize: state.captionSize,
    captionPos: state.captionPos,
    panels: state.panels.map((p) => ({
      img: p.img,
      zoom: p.zoom,
      dx: p.dx,
      dy: p.dy,
      focalX: p.focalX,
      focalY: p.focalY,
    })),
  });
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-press-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('#export-status').textContent = 'PNG saved';
  }, 'image/png');
});

// --- Build the static option lists from the preset tables ---
(function buildOptions() {
  const layoutWrap = $('#layout-picker');
  LAYOUTS.forEach((l, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = i;
    b.textContent = l.name;
    b.classList.toggle('active', i === 0);
    b.addEventListener('click', () => applyLayout(i));
    layoutWrap.appendChild(b);
  });
  const gradeWrap = $('#grade-picker');
  GRADES.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.dataset.grade = i;
    b.textContent = g.name;
    b.classList.toggle('active', i === 0);
    b.addEventListener('click', () => applyGrade(i));
    gradeWrap.appendChild(b);
  });
  const swatchWrap = $('#swatch-picker');
  CAPTION_COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.color = c;
    b.style.background = c;
    b.title = c;
    b.classList.toggle('selected', i === 0);
    b.addEventListener('click', () => {
      state.captionColor = c;
      $$('[data-color]').forEach((x) => x.classList.toggle('selected', x === b));
      draw();
    });
    swatchWrap.appendChild(b);
  });
  const sampleWrap = $('#sample-picker');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample-btn';
    b.dataset.sample = s.id;
    const img = document.createElement('img');
    img.src = s.file;
    img.alt = s.label;
    const span = document.createElement('span');
    span.textContent = s.label;
    b.append(img, span);
    b.addEventListener('click', () => {
      $$('[data-sample]').forEach((x) => x.classList.toggle('selected', x === b));
      assignPhoto(state.selected, s.id);
    });
    sampleWrap.appendChild(b);
  });
})();

// --- Boot: empty state first (no photo yet), caption default on canvas ---
state.panels = LAYOUTS[0].panels.map((p) => ({
  key: null,
  img: null,
  zoom: 1,
  dx: 0,
  dy: 0,
  focalX: p.focal[0],
  focalY: p.focal[1],
}));
buildPanelPicker();
syncPanelControls();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => draw());
}
draw();
