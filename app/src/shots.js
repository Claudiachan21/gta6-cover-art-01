// Sunset Press — deterministic staging for the dossier screenshots.
// ?shot=cover | editor | portrait | square picks the size, caption and
// panels, then hides the editor chrome for the cover shots so the screenshot
// is the exported cover itself, full-bleed.
import { SIZES, SAMPLES } from './presets.js';

const STAGING = {
  cover: { sizeId: 'landscape', caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026', panels: ['boulevard', 'nightdrive', 'pier'] },
  portrait: { sizeId: 'portrait', caption: 'NEON NIGHTS', sub: 'VICE CITY • EST. 2026', panels: ['boulevard', 'nightdrive', 'pier'] },
  square: { sizeId: 'square', caption: 'PALM DUSK', sub: 'PALMS MOTEL • VACANCY', panels: ['boulevard', 'nightdrive', 'pier'] },
  editor: { sizeId: 'landscape', caption: 'SUNSET DRIVE', sub: 'OCEAN DRIVE • EST. 2026', panels: ['boulevard', 'nightdrive', 'pier'], selected: 2 },
};

export async function stageShot(state, api) {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot || !STAGING[shot]) return false;
  const stage = STAGING[shot];
  state.sizeId = stage.sizeId;
  state.caption = stage.caption;
  state.sub = stage.sub;
  state.captionEdited = true;
  state.subEdited = true;
  state.selected = stage.selected ?? 0;
  const input = document.querySelector('#caption-input');
  if (input) input.value = state.caption;
  const subInput = document.querySelector('#sub-input');
  if (subInput) subInput.value = state.sub;
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === stage.sizeId));

  for (let i = 0; i < stage.panels.length; i++) {
    const id = stage.panels[i];
    if (!id) continue;
    const sample = SAMPLES.find((s) => s.id === id);
    if (sample) await api.assignSample(i, sample);
  }
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.classList.toggle('active', b.dataset.sample === 'pier');
  });

  if (shot !== 'editor') {
    document.body.classList.add('shot-cover');
  }
  api.render();
  // One more frame so the canvas paint lands before the screenshot.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
  return true;
}
