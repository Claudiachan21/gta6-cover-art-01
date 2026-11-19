// Sunset Press — deterministic staging for screenshots. `?shot=` loads a
// fixed demo state (sample photos, a layout, a grade, a caption) so every
// screenshot is reproducible. Cover shots hide the editor chrome and show
// only the poster itself.
import { defaultPanels } from './presets.js';

const COVER_SHOTS = {
  landscape: {
    size: 'landscape',
    layout: 'diagonal',
    grade: 'sunset',
    caption: 'SUNSET DRIVE',
    subcaption: 'OCEAN DRIVE · EST. 2026',
  },
  portrait: {
    size: 'portrait',
    layout: 'diagonal',
    grade: 'neon',
    caption: 'NEON NIGHTS',
    subcaption: 'OCEAN DRIVE',
    // Hero gets the car (no edge text to slice); boulevard top-right keeps
    // the sun badge over sky, street goes bottom-right (N2, W7).
    photos: ['sample-night', 'sample-boulevard', 'sample-street'],
  },
  square: {
    size: 'square',
    layout: 'diagonal',
    grade: 'dusk',
    caption: 'PALM DUSK',
    subcaption: 'LAST LIGHT · 2026',
  },
};

export async function stageShot(state, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  await api.loadSamples();
  const preset = COVER_SHOTS[params.get('size') || 'landscape'] || COVER_SHOTS.landscape;
  if (shot === 'cover') {
    state.size = preset.size;
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.caption = preset.caption;
    state.subcaption = preset.subcaption;
    state.captionPos = 'bottom';
    state.panels = defaultPanels(preset.layout, true);
    if (preset.photos) {
      preset.photos.forEach((id, i) => { if (state.panels[i]) state.panels[i].photoId = id; });
    }
    document.body.classList.add('cover-only');
    const input = document.querySelector('#caption-input');
    if (input) input.value = state.caption;
    const sub = document.querySelector('#subcaption-input');
    if (sub) sub.value = state.subcaption;
    api.refreshChrome();
    api.queueRender();
    requestAnimationFrame(() => { window.__shotReady = true; });
    return;
  }
  if (shot === 'editor') {
    state.size = 'landscape';
    state.layout = 'diagonal';
    state.grade = 'sunset';
    state.caption = 'SUNSET DRIVE';
    state.subcaption = 'OCEAN DRIVE · EST. 2026';
    state.panels = defaultPanels('diagonal', true);
    api.refreshChrome();
    api.queueRender();
    requestAnimationFrame(() => { window.__shotReady = true; });
  }
}
