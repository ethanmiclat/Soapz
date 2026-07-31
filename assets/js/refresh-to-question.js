/* Refreshing any page sends you back to the entry question on index.html.
   Only a reload does this: normal links, and the back and forward buttons,
   behave as usual.

   Loaded synchronously from <head> so the redirect happens before this page
   paints, otherwise you would see it flash up before the question appears. */
(function () {
  var nav = performance.getEntriesByType
    ? performance.getEntriesByType('navigation')[0]
    : null;

  var isReload = nav
    ? nav.type === 'reload'
    // Older Safari and Firefox: 1 is TYPE_RELOAD.
    : !!(performance.navigation && performance.navigation.type === 1);

  // replace() rather than href, so the refreshed page does not become a
  // back-button stop of its own.
  if (isReload) window.location.replace('index.html');
})();
