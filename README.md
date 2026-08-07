# Soapz Laundry Co. website

A four-page static site. No build step, no framework, no npm install. Open
`index.html` in a browser, or upload the whole folder to any host.

```
index.html            Entry page: "Do you like doing laundry?" Yes / No
home.html             Home
self-service.html     Self-service wash
wash-fold.html        Wash & fold drop-off
locations.html        Visit us (hours, map, photos)
assets/css/styles.css All styling, one file
assets/fonts/         Outfit + Public Sans, self-hosted (59 KB total)
assets/img/           Photography, the two logos and the mascot
assets/js/            The chat widget and two small page scripts
brand/source/         The logo and mascot artwork exactly as supplied
tools/                One script, which turns brand/source into assets/img
```

### How the pages connect

`index.html` is the front door. It is a single full-screen question with two
answers and no nav bar, because the page has exactly one job:

```
                    index.html
              Do you like doing laundry?
                  [ Yes ]   [ No ]
                   /            \
        self-service.html    wash-fold.html
```

There is also a "see the full site" link to `home.html` for anyone who does not
want to answer. `home.html` is the normal home page and keeps the photo hero,
the two service cards, the reasons-to-choose-us section, the FAQ and the hours.
Every inner page links back to it as "Home", and the Soapz logo in the header
goes there too. The footer of each inner page carries a "Not sure which you
need?" link back to the question page.

**One tradeoff to be aware of:** people who find you through Google will land
on `index.html`, which is a question rather than a page full of information
about your business. That is a deliberate choice, but it gives search engines
less to read. Two things offset it: the page carries the full business details
in a structured-data block in its `<head>`, and the address, hours and phone
number appear as visible text near the answers. If you ever notice you are not
showing up in local searches, the fix is to swap the two files so `home.html`
becomes `index.html`.

## Replace before going live

Everything below is placeholder content. Search and replace across all four
HTML files.

| What | Placeholder value | Where |
|---|---|---|
| Phone number (display) | `(555) 019-2847` | all 4 pages, several places each |
| Phone number (link) | `tel:+15550192847` | all 4 pages |
| Email | `hello@soapzlaundry.com` | footer of all 4 pages |
| Street address | `100 Example Street` | footers, `locations.html`, `index.html` |
| City, state, ZIP | `Springfield, MO 65804` | footers, `locations.html`, `index.html` |
| Self-service prices | `$3.25 / $5.50 / $8.00 / $0.25` | `self-service.html` |
| Wash & fold prices | `$1.75 / $17.50 / $22.00` | `wash-fold.html` |
| Map embed | `q=100%20Example%20Street...` | `locations.html` |
| Directions link | `destination=100+Example+Street...` | `locations.html` |
| Search/SEO data | JSON-LD block | top of `index.html` |
| The app section | name, features, both download links | `self-service.html`, see below |
| The Comfort Club section | `$19.00 / $1.40`, every perk | `wash-fold.html`, see below |

Every placeholder price and address also has an uppercase `PLACEHOLDER`
comment directly above it in the HTML, so you can find them by searching the
files for `PLACEHOLDER`.

**The opening hours are the one real value on the site: 7:00am to 9:00pm, every
day, last wash 8:00pm.** If they ever change, they are in more places than you
would expect, and the four that are easy to miss are not clock times at all:

| Where | What it says |
|---|---|
| Utility bar and footer, all 5 pages | `7:00am to 9:00pm` |
| Hours tables on `home.html` and `locations.html` | the three day rows, plus `Last wash` |
| JSON-LD in `index.html` and `home.html` | `"opens": "07:00"`, `"closes": "21:00"` — this is what Google reads |
| `chat.js` `hours` and `holidays` | the two answers that quote the hours outright |
| `chat.js` `busy` and `trip-time`, and the "how busy are we" band on `self-service.html` | "before 10:00am or after 7:00pm" is the quiet window, which only makes sense inside the opening hours |
| `chat.js` `turnaround` | same-day orders ready by 6:00pm, which has to stay before closing |

The last four are the ones that go quietly wrong: nothing looks broken, the
advice is just no longer true.

Ask Soapzy has placeholders of its own. A handful of its answers stand in for
decisions only you can make, so instead of inventing a policy they point at the
phone number: delivery, gift cards and EBT, discounts, hiring, which languages
the staff speak, and whether there is a notice board or a donation bin. The app
and the Comfort Club answers are placeholders of a different kind, since those
two features do not exist yet at all. Every one of them has a `PLACEHOLDER
POLICY` comment above it in `assets/js/chat.js`, so searching that file for
`PLACEHOLDER` finds the lot.

## Ask Soapzy, the chat widget

The mascot chat in the corner of every page is built by `assets/js/chat.js`.
Soapzy is the detergent-bottle character from the brand artwork; his name and
his portrait are the two constants at the top of that file (`NAME` and
`MASCOT`), so renaming him or swapping his picture is a one-line change in one
place. The greeting topic also answers to him by name — `soapzy`, plus the
`soapzee` and `soapzie` spellings people reach for by ear — so those keywords
have to move with him too.

There is no model behind it and nothing is sent anywhere: it matches the
question against a list of 150 topics, each with the keywords that lead to it.
The file's own comments cover how a topic is scored. What matters if you are
editing it:

- **Answers live in `ANSWERS`,** one entry per topic. `keys` are the phrases
  that trigger it, `context` are supporting words that only nudge a topic the
  question already reached, and `avoid` are words that argue against it. The
  last two are how questions that share a word get told apart: "how much to dry
  a load" and "can I dry a wool jumper" both say *dry*, and the rest of the
  sentence decides which answer comes back.
- **Prefer a new topic to a new keyword.** Most wrong answers are not a
  matching failure, they are a question the list had no answer for, so it
  landed on the nearest thing. "Can I wash a car seat cover" reaching the
  camping gear answer is fixed by writing a car seat answer, not by adding
  keywords to camping gear.
- **Run the tests after any edit:** `node tests/chat-matching.test.js`. It puts
  2,016 real phrasings through the matcher, including a set that must
  come back unanswered, and it will tell you exactly which questions moved. A
  new keyword really can steal questions from a topic elsewhere in the list, so
  this is not optional politeness. It also fails on the two mistakes that are
  invisible by eye: the same keyword listed twice in one entry, and an entry
  with two `keys`, `context` or `avoid` lines, where JavaScript silently keeps
  the second and drops the first.
- **Adding a topic** means adding an entry and adding its questions to the
  test. The test fails if a topic has no cases of its own.
- **`node tests/chat-keyboard.test.js` is the other one to run,** and it covers
  something quite different: where the panel sits when a phone's keyboard is
  up. Opening the chat focuses the input, so the keyboard is up nearly every
  time the panel is on a phone, and the panel is `position: fixed`, which iOS
  places against a viewport it does not shrink for the keyboard. Left alone
  the keyboard covers the field the visitor was just invited to type into.
  `keyboardFit()` in `chat.js` does the sums and the test checks them against
  the viewport shapes real phones report, portrait and landscape, since this
  is the sort of thing that looks right on whichever handset you own and is
  broken on the next one. Touch it and run the test.

When you are ready for a real model, `askSoapzy()` at the bottom of the file is
the only function to replace, and the comment above it has the code. Call your
own server rather than Anthropic directly, or your API key ships to every
visitor.

## The logos and the mascot

There are two official marks and one mascot, and each has a job:

| File | What it is | Where it appears |
|---|---|---|
| `assets/img/logo-wordmark.png` | The horizontal `Soapz Laundry / Est. 2026` wordmark, navy and red | Nav bar on all four inner pages, and the home hero card |
| `assets/img/logo-badge.png` | The round bubble emblem on its navy field | Footer of all four pages, and the card on `index.html` |
| `assets/img/mascot-soapzy-avatar.png` | Soapzy, cropped to head and thumb | The chat launcher, its header and every reply bubble |
| `assets/img/mascot-soapzy.png` | Soapzy full figure, transparent | Nothing yet. Here for when a page wants him larger |
| `assets/img/icon-180.png`, `favicon-32.png` | The badge, square | Browser tab and phone home screen |

The artwork as it was handed over is in `brand/source/`. Nothing on the site
loads those files; they are the masters. `tools/build-brand-assets.py` is what
turns them into everything in the table above:

```
python3 tools/build-brand-assets.py      # needs Pillow and NumPy
```

Re-run it if you get new artwork or want a different crop. It does three
things worth knowing about:

- **It cuts the white page off the wordmark and the mascot** so both can sit on
  a coloured band. It does that by flooding in from the edges rather than by
  making white transparent everywhere, because the white *inside* the art has
  to stay: the mascot's shoes and eyes, and the white letterforms of "Soapz".
- **It drops the fragments.** The supplied mascot file has pieces of other
  elements running off the bottom edge; anything that is cut off by the edge
  and is not the mascot himself is discarded. The mascot's shoes are clipped in
  the original, which is why the chat uses a head-and-thumb crop rather than
  the whole figure.
- **It cuts the badge from 380 kB to 130 kB** by taking it down to a 128-colour
  palette. The artwork is flat colour with a printed grain and does not tell
  the difference.

The wordmark is navy and red, so it only goes on white or cream. Anywhere the
background is navy, use the badge instead: the badge is drawn on the same
`--navy` the site uses, so its edge disappears into the band.

## Photography

Photos are from Unsplash (free for commercial use, no attribution required)
and are downloaded into `assets/img/` so the site has no external dependencies.

Replacing these with real photos of your own store is the single highest-value
change you can make. Keep the same filenames and the pages pick them up with no
code changes. Target sizes:

| File | Size | Used for |
|---|---|---|
| `hero-laundromat.jpg` | 2000x1125 | Home hero. Needs empty space on the left for the white card. |
| `self-service.jpg` | 1600x1067 | Home service card |
| `wash-fold.jpg` | 1600x1067 | Home service card and wash & fold banner |
| `interior-machines.jpg` | 1400x933 | Home "why people keep coming back" |
| `hand-folding.jpg` | 1400x933 | Wash & fold "what is included" |
| `basket.jpg` | 1200x800 | Self-service "what you get" |
| `gallery-floor.jpg` | 1600x1067 | Locations gallery |
| `gallery-row.jpg` | 1400x2099 | Locations gallery |

If you swap an image for one with different dimensions, update the `width` and
`height` attributes on that `<img>` tag too. They are there to stop the page
jumping around while images load.

## Design decisions worth knowing

The audience for this site is people who are not confident with technology, so
some choices are deliberate and worth preserving if you edit things:

- **18px base text**, not the usual 16px. All sizes are in `rem`, so the whole
  site scales up correctly if someone increases their browser or OS text size.
- **No hamburger menu.** All four links are always visible. On phones they sit
  in one row under the wordmark instead of hiding behind an icon.
- **Buttons are at least 61px tall** and go full-width on mobile.
- **Nothing animates on its own.** No carousels, no autoplay, no scroll effects.
  The only motion is a small response when you hover or press something, and
  even that is switched off for anyone who has "reduce motion" turned on.
- **Hero text sits on a solid white card**, not directly on the photo, so it
  stays readable no matter which image you use.
- **The answer buttons say only Yes and No**, which is what makes them fast to
  read. Because a bare "Yes" does not say where it goes, each button has a
  short hint underneath it ("I will do it myself" / "Please do it for me"). The
  hint is joined to the button with `aria-describedby`, so a screen reader
  announces "Yes, I will do it myself" instead of just "Yes". If you delete a
  hint, delete its `aria-describedby` too, or the button loses that context.
- **The phone number is in the top bar of every page** and is tap-to-call.
- **The only JavaScript is the chat widget** and two small scripts that decide
  where a page starts when you reload it. Every page reads and works with
  JavaScript switched off; you lose Soapzy in the corner and nothing else.
- Colour contrast passes WCAG AA throughout, and the figures are in the token
  comments in `styles.css` so they can be checked. Body text is 13.2:1 on
  white, cream on the navy buttons and bands is 10.4:1, and the lightest
  pairing on the site is ink on the teal fact strip at 6.7:1.

### About the colours

Every colour comes off the two logos rather than being chosen to sit near
them. They are defined as tokens at the top of `styles.css`, and the split
between them is deliberate:

| Token | Value | Taken from | Only use it for |
|---|---|---|---|
| `--navy` | `#0f3f59` | The badge's field | Every fill (bars, buttons, footer) **and** every piece of blue text. Dark enough to do both. |
| `--paper` | `#faf6ea` | The badge's lettering | Tinted section bands, and the text that goes on navy. |
| `--teal` | `#7cc6b8` | The badge's bubbles | Light fills only: the fact strip, hairlines, the step rule. Text on it stays `--ink`. |
| `--teal-deep` | `#1c7a6e` | The same hue, darkened | The rare case where teal has to be written with. |
| `--coral` | `#e26a4a` | The badge's ring | Lines and dots only. It never carries text, at any size. |

The one rule that holds the rest together: **navy is both the fill and the
text colour**, which is what makes link underlines coral rather than
decorative. A navy link inside a navy sentence cannot be told apart by hue, so
the underline is what marks it, and colour never carries meaning on its own.

The site is light mode only, on purpose: the marks are drawn for a light page.
A dark mode would need a second set of tokens and a reversed wordmark, since
the navy-and-red wordmark disappears on a dark background.

## The app and the Comfort Club

Two things are planned, one for each service:

- an **app for self-service**, the way the Speed Queen app works: check whether
  the machines are in use before setting out, and start the one you have loaded
  from your phone. It is convenience, not a discount. Nothing about it changes
  what a wash costs, and every machine works exactly the same without it.
- a **Comfort Club membership for wash, dry and fold**, which is the one that
  makes anything cheaper.

Keeping those two straight is the whole job here. They belong to different
services and they do different things, and the fastest way to make the site
wrong is to let a heading imply the app saves money.

Both are on the site now, and **every word of both is a placeholder.** Nothing
below is real: not the prices, not the benefits, not the download links.

| Placeholder | Where | What is invented |
|---|---|---|
| App section | `self-service.html`, `#app` | the name, the three features, both download buttons (they go to `#`) |
| Club section | `wash-fold.html`, `#comfort-club` | $19 a month, the $1.40 member rate, the dropped minimum, all three perks |
| Home band | `home.html`, above "Why people keep coming back" | announces both, links to the two sections above |
| Chat answers | `chat.js`: `app`, `app-trouble` | what the app covers, where to download it |
| Chat answers | `chat.js`: `comfort-club`, `club-manage` | the price, what comes with it, how to cancel |

Each carries an uppercase `PLACEHOLDER` comment directly above it, so
searching the repo for `PLACEHOLDER` finds all of them alongside the fake
prices and address.

**Before the site goes live, each one has to be filled in or deleted.** A
download button that leads nowhere and a membership nobody can buy are both
worse than saying nothing, and the chat test suite will hold a wrong promise in
place long after you have forgotten it is there.

Filling in the chat side means editing the `text` and nothing else. The
keywords are already right, including the crossover questions that are easy to
get wrong ("do I need the app for drop-off", "does the club cover
self-service"), and `tests/chat-matching.test.js` has 46 questions holding that
behaviour in place. `membership` is the piece that tells the two apart when
somebody asks about "signing up" without saying which service.

### What still assumes neither exists

These are correct today and go stale the day each feature is real. They are
not wrong yet, which is why they have been left alone.

**The app:** `chat.js` `how-many-machines` and `busy` both say to call ahead to
find out what is free; `cycle-done` says the machine beeps and the attendant
watches it for you; `booking` says there is nothing to book ahead, which stops
being true if the app can reserve a machine. On the page,
`self-service.html`'s "Want to know how busy we are?" band sends people to the
phone.

**The Comfort Club:** `chat.js` `per-pound` quotes $1.75 a pound and the $17.50
minimum with no member rate; `discounts` says to ask at the counter rather than
mentioning the club; `notifications`, `turnaround` and `rush` all assume every
order is treated the same. On the page, `wash-fold.html`'s "What it costs"
tiles are the non-member prices, which is correct, but they sit above a club
section claiming a cheaper rate, so the two have to be decided together.

One known overlap in the chat: "does the app tell me when my load is done"
answers with `cycle-done` (the display counts down and it beeps) rather than
the app topic. Fix that by editing `cycle-done` to mention the app once you
know what it shows, rather than by moving keywords around. The app is not
claimed to notify anybody: it shows time remaining, which is a different thing
and deliberately worded that way on the page.

## Other things you may want to add later

- Real customer reviews. There is no testimonials section yet because inventing
  reviews for a new business would be dishonest. Once you have real ones, the
  `.panel` style is a good fit.
- A real model behind Ask Soapzy. Matching on keywords covers the questions
  people actually ask, but there are three things it will never do, and all
  three need a server rather than more keywords: answer about *this* customer's
  order, hold a conversation over more than the one previous message, and take
  an action such as cancelling a pickup. Until then it is honest about that and
  hands those to the phone, which is what the `memory`, `track-order` and
  `change-order` answers are for.
