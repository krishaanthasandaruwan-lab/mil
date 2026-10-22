#!/usr/bin/env python3
"""
Turns raw Nano Banana images in art_raw/ into game-ready PNGs in public/assets/ and writes
public/assets/manifest.json, which the game reads at boot. Only Pillow is required.

  python3 tools/process_assets.py            # process everything new or changed
  python3 tools/process_assets.py --force    # reprocess all
"""

import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from asset_specs import SPECS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "art_raw")
OUT = os.path.join(ROOT, "public", "assets")
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def find_raw(stem):
    for ext in EXTS:
        path = os.path.join(RAW, stem + ext)
        if os.path.exists(path):
            return path
    return None


def chroma_key(img, keep_green=False):
    """
    Green screen -> alpha. Only green connected to the image border (or enclosed holes that match the
    sampled background exactly) is removed, so green parts of the object itself - a radar screen, a
    green button core - survive. Edges get soft alpha and green-spill removal.
    """
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + \
             [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    samples = [px[x, y] for x, y in border]
    bg = tuple(sorted(c[i] for c in samples)[len(samples) // 2] for i in range(3))

    def dominance(c):
        return c[1] - max(c[0], c[2])

    def near_bg(c):
        return abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) < 70

    is_bg = bytearray(w * h)
    stack = [(x, y) for x, y in border if dominance(px[x, y]) > 18]
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if is_bg[i]:
            continue
        is_bg[i] = 1
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not is_bg[ny * w + nx] and dominance(px[nx, ny]) > 18:
                stack.append((nx, ny))
    if not keep_green:
        for y in range(h):
            for x in range(w):
                c = px[x, y]
                if not is_bg[y * w + x] and dominance(c) > 70 and near_bg(c):
                    is_bg[y * w + x] = 1

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = g - max(r, b)
            if is_bg[y * w + x]:
                if d > 70:
                    px[x, y] = (0, 0, 0, 0)
                else:
                    alpha = int(255 * max(0, 70 - d) / 52)
                    px[x, y] = (r, min(g, max(r, b)), b, min(a, alpha))
                continue
            if not keep_green:
                if g > max(r, b):
                    px[x, y] = (r, max(r, b), b, a)
                continue
            touches_bg = any(
                0 <= nx < w and 0 <= ny < h and is_bg[ny * w + nx]
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 2, y), (x - 2, y), (x, y + 2), (x, y - 2))
            )
            if touches_bg and g > max(r, b):
                px[x, y] = (r, max(r, b), b, a)
    return img


def clear_cell_borders(img, grid, band=0.018):
    """Blacks out thin strips along cell edges so stray grid lines in AI sprite sheets don't flicker in-game."""
    cols, rows = grid
    w, h = img.size
    px = img.load()
    bw, bh = max(2, int(w * band)), max(2, int(h * band))
    for c in range(cols + 1):
        x0 = round(c * w / cols)
        for x in range(max(0, x0 - bw), min(w, x0 + bw)):
            for y in range(h):
                px[x, y] = (0, 0, 0)
    for r in range(rows + 1):
        y0 = round(r * h / rows)
        for y in range(max(0, y0 - bh), min(h, y0 + bh)):
            for x in range(w):
                px[x, y] = (0, 0, 0)
    return img


def black_to_alpha(img):
    """Glows on black -> alpha from brightness, colour un-premultiplied so it blends correctly."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            a = max(r, g, b)
            if a < 8:
                px[x, y] = (0, 0, 0, 0)
                continue
            scale = 255 / a
            px[x, y] = (min(255, int(r * scale)), min(255, int(g * scale)), min(255, int(b * scale)), a)
    return img


def trim(img, pad=6):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def fit(img, size):
    max_w, max_h = (size, size) if isinstance(size, int) else size
    scale = min(max_w / img.width, max_h / img.height, 1.0)
    if scale < 1:
        img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
    return img


def cover(img, size):
    w, h = size
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (img.width - w) // 2
    top = (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def process(spec, src):
    img = Image.open(src)
    mode = spec["mode"]
    size = spec["size"]
    if mode == "key":
        img = fit(trim(chroma_key(img, spec.get("keep_green", False))), size)
    elif mode == "key_sheet":
        img = chroma_key(img).resize((size, size * spec["grid"][1] // spec["grid"][0]), Image.LANCZOS)
    elif mode == "black":
        if spec.get("grid"):
            img = clear_cell_borders(img.convert("RGB"), spec["grid"])
        img = black_to_alpha(img)
        img = img.resize((size, size), Image.LANCZOS) if spec.get("grid") else fit(trim(img), size)
    elif mode == "tile":
        img = img.convert("RGB").resize((size, size), Image.LANCZOS)
    elif mode == "cover":
        img = cover(img.convert("RGB"), size)
    else:
        img = fit(img.convert("RGB"), size)
    return img


def derive_missing():
    """Red (and gold) variants are recoloured from their blue source when no hand-made version exists."""
    from team_swap import swap
    made = []
    for spec in SPECS:
        if not spec.get("derive") or find_raw(spec["file"]):
            continue
        direction, source = spec["derive"]
        src = find_raw(source)
        if not src:
            continue
        swap(Image.open(src), direction).save(os.path.join(RAW, spec["file"] + ".png"))
        made.append(spec["file"])
    if made:
        print("  auto-recolored: " + ", ".join(made))


def main():
    force = "--force" in sys.argv
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    derive_missing()
    manifest = {}
    made, skipped, missing = 0, 0, []
    known = {s["file"] for s in SPECS}

    for spec in SPECS:
        src = find_raw(spec["file"])
        dst = os.path.join(OUT, spec["file"] + ".png")
        if not src:
            missing.append(spec["file"])
            continue
        if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            skipped += 1
        else:
            process(spec, src).save(dst, optimize=True)
            made += 1
            print(f"  ok  {spec['file']}")
        with Image.open(dst) as done:
            manifest[spec["file"]] = {"path": f"assets/{spec['file']}.png", "w": done.width, "h": done.height}
            if spec.get("grid"):
                manifest[spec["file"]]["grid"] = list(spec["grid"])

    strays = sorted(
        os.path.splitext(f)[0] for f in os.listdir(RAW)
        if f.lower().endswith(EXTS) and os.path.splitext(f)[0] not in known
    )
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1, sort_keys=True)

    print(f"\nProcessed {made}, up to date {skipped}, still missing {len(missing)} of {len(SPECS)}.")
    if strays:
        print("Unrecognised file names in art_raw/ (check spelling): " + ", ".join(strays))


if __name__ == "__main__":
    main()
