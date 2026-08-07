"""Turn the supplied brand artwork in brand/source/ into the web assets in
assets/img/. Run from the repo root:  python3 tools/build-brand-assets.py

Nothing on the site reads brand/source/ directly. Those three files are the
artwork exactly as it was handed over, kept so this can be re-run at a
different size or with a different crop; the site only ever loads what this
script writes out.

The wordmark and the mascot arrive as flat art sitting on an opaque white
page, so the white has to come off before either can go on a coloured band. A
blanket "white -> transparent" would eat the white INSIDE the art too (the
mascot's shoes and eyes, the white letterforms of "Soapz"), so the background
is found by flooding in from the border instead, and only the antialiased rim
is un-matted.

Needs Pillow and NumPy.
"""
import os

import numpy as np
from PIL import Image
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'brand', 'source') + os.sep
OUT = os.path.join(ROOT, 'assets', 'img') + os.sep


def on_white(path):
    """The supplied files carry a stray alpha channel whose transparent pixels
    hold grey, not white. Flatten onto white first or the flood below reads
    that grey as artwork."""
    im = Image.open(SRC + path).convert('RGBA')
    page = Image.new('RGBA', im.size, (255, 255, 255, 255))
    return np.array(Image.alpha_composite(page, im).convert('RGB')).astype(float)


def flood_background(rgb, tol=18):
    """Boolean mask of the page white: near-white pixels reachable from an edge."""
    h, w, _ = rgb.shape
    near_white = (rgb.min(2) >= 255 - tol)
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def dilate(mask, r=1):
    out = mask.copy()
    for _ in range(r):
        p = np.pad(out, 1, constant_values=False)
        out = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | out)
    return out


def components(mask):
    """Label 4-connected True regions; yields (size, bbox, mask) per region."""
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            cells = []
            while q:
                y, x = q.popleft()
                cells.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            ys = [c[0] for c in cells]
            xs = [c[1] for c in cells]
            m = np.zeros((h, w), bool)
            m[tuple(np.array(cells).T)] = True
            yield len(cells), (min(xs), min(ys), max(xs), max(ys)), m


def cut_out(path, ink_luma=60):
    """White page off, antialiased rim rebuilt as partial alpha."""
    rgb = on_white(path)
    bg = flood_background(rgb)
    alpha = np.where(bg, 0.0, 1.0)

    # The rim: art pixels touching the page. Their colour is ink blended with
    # white, so recover both the coverage and the underlying ink.
    rim = dilate(bg, 2) & ~bg
    luma = rgb @ (0.299, 0.587, 0.114)
    a = np.clip((255.0 - luma) / (255.0 - ink_luma), 0, 1)
    out = rgb.copy()
    with np.errstate(divide='ignore', invalid='ignore'):
        un = np.where(a[..., None] > 0.02, (rgb - 255.0 * (1 - a[..., None])) / np.maximum(a[..., None], 1e-6), rgb)
    out[rim] = np.clip(un[rim], 0, 255)
    alpha[rim] = a[rim]
    return np.dstack([out, alpha * 255]).astype(np.uint8)


def trim(rgba, pad=0):
    a = rgba[..., 3]
    ys, xs = np.where(a > 8)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    y0 = max(0, y0 - pad); x0 = max(0, x0 - pad)
    y1 = min(rgba.shape[0] - 1, y1 + pad); x1 = min(rgba.shape[1] - 1, x1 + pad)
    return rgba[y0:y1 + 1, x0:x1 + 1]


def save(rgba, name, colors=None):
    im = Image.fromarray(rgba, 'RGBA')
    if colors:
        im = im.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGBA')
    im.save(OUT + name, optimize=True)
    print(name, im.size)


# ---------------------------------------------------------------- wordmark
save(trim(cut_out('logo-wordmark.png'), pad=2), 'logo-wordmark.png')

# ---------------------------------------------------------------- mascot
mask = cut_out('mascot-soapzy.png')
art = mask[..., 3] > 40
regions = sorted(components(art), key=lambda r: -r[0])
h, w = art.shape
keep = np.zeros((h, w), bool)
for i, (size, bbox, m) in enumerate(regions):
    touches_bottom = bbox[3] >= h - 1
    # The figure itself is clipped by the bottom edge of the supplied file, so
    # it is allowed to touch it. Everything else that runs off the page is a
    # fragment of some other element from the original sheet: drop it.
    if i == 0 or not touches_bottom:
        keep |= m
mascot = mask.copy()
mascot[..., 3] = np.where(keep, mascot[..., 3], 0)
mascot = trim(mascot, pad=2)
save(mascot, 'mascot-soapzy.png')

# Chat-sized avatar: head and thumbs-up only, so the face still reads at 40px.
mh, mw = mascot.shape[:2]
side = int(mh * 0.75)
top = 0
left = max(0, min(mw - side, int(mw * 0.53) - side // 2))
head = mascot[top:top + side, left:left + side]
Image.fromarray(head, 'RGBA').resize((256, 256), Image.LANCZOS).save(OUT + 'mascot-soapzy-avatar.png', optimize=True)
print('mascot-soapzy-avatar.png', (256, 256))

# ---------------------------------------------------------------- shirt logo
# Unlike the other three, this one already renders with clean alpha (it came
# from a PDF, not a flattened page), so it skips on_white/cut_out and just
# gets trimmed and palette-reduced like the badge. MEDIANCUT (what save()
# uses) can't quantize a transparent image, hence FASTOCTREE done by hand
# here instead of going through save().
shirt = trim(np.array(Image.open(SRC + 'logo-shirt.png').convert('RGBA')), pad=2)
im = Image.fromarray(shirt, 'RGBA').quantize(colors=128, method=Image.FASTOCTREE, dither=Image.NONE).convert('RGBA')
im.save(OUT + 'logo-shirt.png', optimize=True)
print('logo-shirt.png', im.size)

# ---------------------------------------------------------------- badge
badge = on_white('logo-badge.png').astype(np.uint8)
badge = badge[2:-2, 2:-2]                      # 1px white rule around the art
# Flat art with a printed grain: full colour costs 380kB and looks identical to
# a 128-colour palette, which costs a tenth of that.
Image.fromarray(badge).quantize(colors=128, method=Image.MEDIANCUT).save(OUT + 'logo-badge.png', optimize=True)
print('logo-badge.png', badge.shape)

icon = Image.fromarray(badge).resize((180, 180), Image.LANCZOS)
icon.save(OUT + 'icon-180.png', optimize=True)
icon.resize((32, 32), Image.LANCZOS).save(OUT + 'favicon-32.png', optimize=True)
print('icons written')
