// Sunset Press — screenshot staging. ?shot=cover|editor|portrait|square
// drives the editor into a fixed state and flags __shotReady once the
// fonts, photos and render are done, so the shooter takes deterministic
// dossier shots. No other behaviour lives here.

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

if (shot && window.__sunset) {
  window.__sunset
    .applyShot(shot)
    .then((ok) => {
      window.__shotReady = ok === true;
    })
    .catch(() => {
      window.__shotReady = false;
    });
} else {
  window.__shotReady = false;
}
