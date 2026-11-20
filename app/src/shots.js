// Sunset Press — deterministic staging for the dossier screenshots.
// ?shot=cover    wide cover, all three panels filled, chrome hidden
// ?shot=editor   the editor at work (Pier selected in panel 3)
// ?shot=portrait portrait cover, chrome hidden
// ?shot=square   square cover, chrome hidden
//
// The editor boots with empty panels (empty state visible), so every shot
// stages its panels explicitly through the app's __stagePanel hook.

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

if (shot) {
  const setCaption = (cap, sub) => {
    const ci = document.querySelector('#caption-input');
    ci.value = cap;
    ci.dispatchEvent(new Event('input', { bubbles: true }));
    const si = document.querySelector('#sub-input');
    si.value = sub;
    si.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const stageCover = () => {
    window.__stagePanel(0, 'boulevard');
    window.__stagePanel(1, 'nightdrive');
    window.__stagePanel(2, 'pier');
  };
  if (shot === 'cover' || shot === 'portrait' || shot === 'square') {
    document.body.classList.add('shot-cover');
    if (shot === 'portrait') {
      document.querySelector('[data-size="portrait"]')?.click();
      setCaption('NEON NIGHTS', 'VICE CITY • EST. 2026');
    }
    if (shot === 'square') {
      document.querySelector('[data-size="square"]')?.click();
      setCaption('PALM DUSK', 'PALMS MOTEL • VACANCY');
    }
    stageCover();
  } else if (shot === 'editor') {
    stageCover();
    // Select panel 3 (bottom-right, Pier) by tapping the canvas there.
    const canvas = document.querySelector('#cover-canvas');
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, clientX: r.left + r.width * 0.78, clientY: r.top + r.height * 0.75,
    }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  }
  // Fonts first, then flag ready for the shooter.
  Promise.all([
    document.fonts.load('400 100px Anton'),
    document.fonts.load('700 40px Inter'),
    document.fonts.ready,
  ]).then(() => setTimeout(() => { window.__shotReady = true; }, 350));
  setTimeout(() => { window.__shotReady = true; }, 6000);
}
