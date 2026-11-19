// Sunset Press — deterministic staging for the dossier screenshots.
// ?shot=cover|editor|portrait|square drives the editor through its own
// DOM controls (the same clicks a user makes), then flags __shotReady.
// Plain shots hide the chrome so the frame is just the cover art.

import { SHOTS, SAMPLES } from './presets.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot && SHOTS[shot]) {
  const cfg = SHOTS[shot];
  const click = (sel) => document.querySelector(sel)?.click();
  const setText = (sel, value) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Size first (it keeps the caption), then grade, then text.
  click(`[data-size="${cfg.size}"]`);
  click(`[data-grade="${GRADES_INDEX(cfg.grade)}"]`);
  setText('#caption-input', cfg.caption);
  setText('#sub-input', cfg.sub);

  // Fill every panel with a sample photo: pick panel, pick sample.
  const panelBtns = () => [...document.querySelectorAll('#panel-picker .chip')];
  const sampleBtns = () => [...document.querySelectorAll('#sample-picker [data-sample]')];
  const order = SAMPLES.map((s) => s.id);
  panelBtns().forEach((btn, i) => {
    btn.click();
    sampleBtns().find((b) => b.dataset.sample === order[i % order.length])?.click();
  });
  panelBtns()[0]?.click();

  if (shot !== 'editor') {
    document.body.classList.add('shot-plain');
  }

  // Wait for fonts and sample images, then one last draw and the flag.
  const ready = async () => {
    try {
      await document.fonts.ready;
    } catch (_) {}
    for (let i = 0; i < 40; i++) {
      const pending = [...document.images].some((img) => !img.complete);
      if (!pending && window.__coverDebug?.ready) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    // One more render pass now that every image is in.
    document.querySelector('#cover-canvas')?.dispatchEvent(new Event('pointerup'));
    window.__shotReady = true;
  };
  ready();
}

function GRADES_INDEX(i) {
  return i;
}
