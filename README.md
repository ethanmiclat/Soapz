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
assets/img/           Photography
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
| Opening hours | `6:00am to 10:00pm` | utility bar and footer on all 4 pages, hours tables on `index.html` and `locations.html` |
| Self-service prices | `$3.25 / $5.50 / $8.00 / $0.25` | `self-service.html` |
| Wash & fold prices | `$1.75 / $17.50 / $22.00` | `wash-fold.html` |
| Map embed | `q=100%20Example%20Street...` | `locations.html` |
| Directions link | `destination=100+Example+Street...` | `locations.html` |
| Search/SEO data | JSON-LD block | top of `index.html` |

Every placeholder price and address also has an uppercase `PLACEHOLDER`
comment directly above it in the HTML, so you can find them by searching the
files for `PLACEHOLDER`.

## Logo

The `SOAPZ / Laundry Co.` badge is a CSS wordmark, not an image file. It lives
in the `.brand` block in `styles.css` and appears in the header and footer of
each page. When you have real logo artwork, replace the contents of
`<a class="brand">` with an `<img>` and delete the `.brand__badge`,
`.brand__name` and `.brand__tag` rules.

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
- **No hamburger menu.** All four links are always visible. On phones the nav
  becomes a 2x2 grid of large tap targets instead of hiding behind an icon.
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
- **FAQ uses native HTML** `<details>` elements, so it works with keyboards and
  screen readers with no JavaScript. The site ships zero JavaScript.
- Colour contrast passes WCAG AA throughout. Body text is 6.4:1 or better
  against its background, and white on the sky-blue buttons is 4.68:1.

### About the blues

The palette is sky blue, defined as three tokens at the top of `styles.css`.
The split between them is deliberate, so be careful if you edit them:

| Token | Value | Only use it for |
|---|---|---|
| `--brand` | `#0a7ab8` | Button fills and icons. Too light for text on a white or tinted background. |
| `--brand-dark` | `#08628f` | All coloured text: links, prices, the phone number. |
| `--brand-darker` | `#0a5f8a` | The dark bands: top bar, facts strip, footer. |

Buttons cannot get much lighter than `--brand` without white label text
dropping below the 4.5:1 minimum and becoming hard to read, which matters more
than usual for this audience. If you want the page to feel lighter still, raise
`--sky-50`, `--sky-100` and `--paper` rather than lightening `--brand`.

The site is light mode only, on purpose, because the brand is white and light
blue. If you ever want a dark mode it would need a second set of colour tokens
in `styles.css`.

## Things you may want to add later

- Real customer reviews. There is no testimonials section yet because inventing
  reviews for a new business would be dishonest. Once you have real ones, the
  `.panel` style is a good fit.
- A machine-availability app. `self-service.html` currently tells customers to
  phone ahead to check how busy it is. If you adopt an app later, that section
  is the place to link it.
