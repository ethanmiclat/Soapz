/* Refresh always lands at the top of the page (the hero), instead of the
   browser dropping you back where you were scrolled to.

   Loaded synchronously from <head> on purpose: scrollRestoration has to be
   set before the browser restores the old position, which happens as soon as
   the document starts rendering. */
(function () {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // A link to #visit or the skip link should still jump to that section, so
  // only force the top when the URL has no fragment of its own.
  function toTop() {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }

  window.addEventListener('load', toTop);

  // Restoring from the back/forward cache skips 'load', and Safari in
  // particular replays the old scroll position there too.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) toTop();
  });
})();
