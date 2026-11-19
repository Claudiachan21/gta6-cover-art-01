// Sunset Press — deterministic staging for screenshots (?shot=...).
// cover: the exported cover alone, landscape. editor: the app UI with a
// photo loaded. portrait / square: the cover alone in those post sizes.
// In cover-only modes the editor chrome is hidden and the canvas fills the
// viewport at exactly the viewport size, so the shot is the app's own
// drawing of the exported cover, never edited or composited.
import { renderCover } from './render.js';

function renderShot(state, images, w, h) {
  const canvas = document.querySelector('#cover-canvas');
  canvas.width = w;
  canvas.height = h;
  const debug = renderCover(canvas.getContext('2d'), w, h, state, images);
  window.__coverDebug = { ...debug, ready: true, size: state.size, layout: state.layout };
  document.querySelector('#empty-state').classList.add('hidden');
}

export async function applyShot(shot, api) {
  const { state, images, render, applySize, applyLayout, loadSample, showTab } = api;
  const done = async () => {
    await document.fonts.ready;
    window.__shotReady = true;
  };
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    applyLayout('trio');
    applySize('landscape', false);
    state.caption = 'SUNSET DRIVE';
    state.sub = 'OCEAN DRIVE • EST. 2026';
    state.grade = 0;
    loadSample('boulevard');
    renderShot(state, images, 1280, 720);
    await done();
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    applyLayout('trio');
    applySize('portrait', false);
    state.caption = 'NEON NIGHTS';
    state.sub = 'VICE CITY • EST. 2026';
    state.grade = 1;
    loadSample('boulevard');
    renderShot(state, images, 1024, 1280);
    await done();
  } else if (shot === 'square') {
    document.body.classList.add('shot-cover');
    applyLayout('trio');
    applySize('square', false);
    state.caption = 'PALM DUSK';
    state.sub = 'PALMS MOTEL • VACANCY';
    state.grade = 0;
    loadSample('boulevard');
    renderShot(state, images, 1080, 1080);
    await done();
  } else {
    // editor: the app UI, Foto tab active, Pier sample loaded + selected
    // into the bottom-right panel — the hero stays Boulevard, as in golden.
    showTab('foto');
    applyLayout('trio');
    applySize('landscape', false);
    state.activePanel = 2;
    loadSample('pier');
    render();
    await done();
  }
}
