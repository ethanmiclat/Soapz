/* Does the chat panel clear the on-screen keyboard?

   Run with: node tests/chat-keyboard.test.js

   The panel is position:fixed, so it is placed against the layout viewport,
   and iOS does not shrink that when the keyboard opens. Opening the chat
   focuses the input, so the keyboard is up almost every time the panel is,
   and getting this wrong hides the field the visitor was just asked to type
   into. keyboardFit() does the sums; this checks them against the viewport
   shapes real phones report, which is the part that cannot be eyeballed on
   one device.

   Geometry, all measured from the top of the layout viewport:

       0            top of the layout viewport (fixed elements sit here)
       offsetTop    top of the strip still visible (iOS pushes the page up)
       ...          viewHeight tall, this is what the visitor can see
       keyboardTop  layoutHeight - hidden
       layoutHeight bottom of the layout viewport, under the keyboard

   The panel's `bottom` is an offset up from layoutHeight, so clearing the
   keyboard means bottom >= hidden. */

var assert = require('assert');
var soapzy = require('../assets/js/chat.js');
var fit = soapzy.keyboardFit;

/* 18px root font, so the panel's 4.75rem resting offset on mobile is 85.5px. */
var RESTING = 85.5;

var checks = 0;
var failures = [];

function check(name, fn) {
  checks++;
  try {
    fn();
  } catch (e) {
    failures.push(name + '\n      ' + e.message);
  }
}

/* The properties that matter, in priority order. The panel clips from the
   bottom, so a panel shorter than its own minimum loses its input, which is
   the one thing that must survive: the visitor is mid-sentence. Running off
   the top only costs them the header they have already read. */
function assertClears(view, got, label) {
  var floor = view.minHeight || soapzy.PANEL_MIN_HEIGHT;
  var hidden = view.layoutHeight - view.viewHeight - view.offsetTop;
  var keyboardTop = view.layoutHeight - hidden;
  var panelBottomEdge = view.layoutHeight - got.bottom;
  var panelTopEdge = panelBottomEdge - got.maxHeight;

  assert.ok(
    panelBottomEdge <= keyboardTop + 0.5,
    label + ': panel overlaps the keyboard by ' + (panelBottomEdge - keyboardTop) + 'px'
  );
  assert.ok(
    got.maxHeight >= floor,
    label + ': panel given ' + got.maxHeight + 'px, below the ' + floor +
      'px it needs, so the input would be clipped'
  );

  /* Fitting inside the strip is required only when the strip can hold the
     panel at all. Below that the overflow is deliberate and goes upward. */
  if (view.viewHeight - soapzy.PANEL_TOP_GAP >= floor) {
    assert.ok(
      panelTopEdge >= view.offsetTop - 0.5,
      label + ': panel top ' + panelTopEdge + ' is above the visible strip (' + view.offsetTop + ')'
    );
  }
}

/* ---------- No keyboard ---------- */

check('no keyboard at all returns null', function () {
  assert.strictEqual(
    fit({ layoutHeight: 844, viewHeight: 844, offsetTop: 0, restingBottom: RESTING }),
    null
  );
});

check('a hiding browser toolbar is not a keyboard', function () {
  /* Safari's bar is about 50px. Moving the panel for it would make the page
     twitch on every scroll. */
  assert.strictEqual(
    fit({ layoutHeight: 844, viewHeight: 800, offsetTop: 0, restingBottom: RESTING }),
    null
  );
  assert.strictEqual(
    fit({ layoutHeight: 844, viewHeight: 844 - (soapzy.KEYBOARD_MIN - 1), offsetTop: 0, restingBottom: RESTING }),
    null
  );
});

check('a shrink right on the threshold counts', function () {
  var got = fit({
    layoutHeight: 844, viewHeight: 844 - soapzy.KEYBOARD_MIN,
    offsetTop: 0, restingBottom: RESTING
  });
  assert.ok(got, 'expected a fit at exactly KEYBOARD_MIN');
  assert.strictEqual(got.hidden, soapzy.KEYBOARD_MIN);
});

/* ---------- Real phones ---------- */

/* layoutHeight, viewHeight, offsetTop, description */
var PHONES = [
  [844, 508, 0, 'iPhone 14, portrait, keyboard up'],
  [844, 468, 0, 'iPhone 14, keyboard plus the predictive strip'],
  [667, 331, 0, 'iPhone SE, portrait'],
  [390, 190, 0, 'iPhone 14, landscape, keyboard eats most of it'],
  [915, 500, 0, 'Pixel, portrait'],
  [844, 508, 40, 'iOS having scrolled the page up under the keyboard'],
  [844, 400, 120, 'iOS pushed up hard, small strip left']
];

PHONES.forEach(function (p) {
  var view = { layoutHeight: p[0], viewHeight: p[1], offsetTop: p[2], restingBottom: RESTING };
  check(p[3], function () {
    var got = fit(view);
    assert.ok(got, 'expected the keyboard to be detected');
    assert.strictEqual(got.hidden, p[0] - p[1] - p[2], 'wrong keyboard height');
    assert.ok(got.maxHeight > 0, 'panel given no height');
    assertClears(view, got, p[3]);
  });
});

/* ---------- Android that resizes the layout viewport ---------- */

check('nothing to do when the browser already moved the panel', function () {
  /* With interactive-widget=resizes-content the layout viewport shrinks with
     the keyboard, so a fixed panel has already been carried up and the
     visible strip matches the layout. Lifting again would double it. */
  assert.strictEqual(
    fit({ layoutHeight: 508, viewHeight: 508, offsetTop: 0, restingBottom: RESTING }),
    null
  );
});

/* ---------- Squashed ---------- */

check('a roomy screen keeps the panel at its usual offset', function () {
  /* Nothing clever should happen in the ordinary case: the panel rides up on
     top of the keyboard, still sitting its normal distance above the bottom. */
  var got = fit({ layoutHeight: 844, viewHeight: 508, offsetTop: 0, restingBottom: RESTING });
  assert.strictEqual(got.bottom, Math.round(RESTING + got.hidden));
});

check('a short strip gives up the offset before the height', function () {
  /* Landscape. Keeping the 85.5px offset here would push the panel's header
     off the top, so the offset shrinks and the panel sits on the keyboard. */
  var view = { layoutHeight: 390, viewHeight: 190, offsetTop: 0, restingBottom: RESTING };
  var got = fit(view);
  assert.ok(
    got.bottom - got.hidden < RESTING,
    'offset should have been given up, got ' + (got.bottom - got.hidden)
  );
  assert.strictEqual(got.maxHeight, soapzy.PANEL_MIN_HEIGHT, 'height should hold at the minimum');
  assertClears(view, got, 'landscape');
});

check('a strip too short for the panel overflows upward, not downward', function () {
  /* The panel would rather hang off the top of the screen than be squashed,
     because squashing pushes the input out through the bottom where
     overflow:hidden cuts it off. Losing the header is the cheaper failure. */
  var view = { layoutHeight: 400, viewHeight: 120, offsetTop: 0, restingBottom: RESTING };
  var got = fit(view);
  assert.strictEqual(got.maxHeight, soapzy.PANEL_MIN_HEIGHT, 'should hold at the floor');

  var panelBottomEdge = view.layoutHeight - got.bottom;
  assert.ok(panelBottomEdge <= view.viewHeight + 0.5, 'input must stay above the keyboard');
  assert.ok(panelBottomEdge - got.maxHeight < 0, 'this case is expected to overflow the top');
});

check('never squashed below a usable height', function () {
  var got = fit({ layoutHeight: 400, viewHeight: 180, offsetTop: 0, restingBottom: RESTING });
  assert.ok(got, 'expected a fit');
  assert.strictEqual(got.maxHeight, soapzy.PANEL_MIN_HEIGHT);
  assert.ok(got.bottom >= got.hidden, 'must still clear the keyboard');
});

check('the caller can supply the panel height it actually measured', function () {
  /* chat.js measures the rendered header and form rather than trusting the
     constant, so restyling either cannot leave a stale floor behind. */
  var view = {
    layoutHeight: 844, viewHeight: 300, offsetTop: 0,
    restingBottom: RESTING, minHeight: 260
  };
  var got = fit(view);
  assert.ok(got.maxHeight >= 260, 'measured floor should be respected');
  assertClears(view, got, 'measured floor');

  /* A taller floor must not be allowed to sink the panel into the keyboard. */
  assert.ok(view.layoutHeight - got.bottom <= view.viewHeight + 0.5, 'input above the keyboard');
});

check('the gap above the panel is respected when there is room', function () {
  var view = { layoutHeight: 844, viewHeight: 508, offsetTop: 0, restingBottom: RESTING };
  var got = fit(view);
  assert.strictEqual(got.maxHeight, Math.round(508 - RESTING - soapzy.PANEL_TOP_GAP));
});

/* ---------- Repeat openings ---------- */

check('the same viewport always gives the same answer', function () {
  /* liftOverKeyboard() resets the panel before measuring, so a second
     keyboard opening must not stack on the first. Same input, same output. */
  var view = { layoutHeight: 844, viewHeight: 508, offsetTop: 0, restingBottom: RESTING };
  assert.deepStrictEqual(fit(view), fit(view));
});

/* ---------- A dragged panel sits anywhere ---------- */

check('a panel dragged near the top still gets a valid fit', function () {
  var view = { layoutHeight: 844, viewHeight: 508, offsetTop: 0, restingBottom: 600 };
  var got = fit(view);
  assert.ok(got.maxHeight >= soapzy.PANEL_MIN_HEIGHT, 'height floor must hold');
});

if (failures.length) {
  console.log('\n' + failures.length + ' of ' + checks + ' checks failed:\n');
  failures.forEach(function (f) { console.log('  ' + f + '\n'); });
  process.exit(1);
}

console.log(checks + ' keyboard checks, all passed.');
