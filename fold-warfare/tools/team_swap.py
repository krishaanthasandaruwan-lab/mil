#!/usr/bin/env python3
"""
Swap a unit image's team color (red <-> blue) by shifting only saturated hues in the team range.
Grey armor, orange fire, smoke and the green background are untouched.

  python3 tools/team_swap.py to_blue in.png out.png
  python3 tools/team_swap.py to_red  in.png out.png
  python3 tools/team_swap.py to_gold in.png out.png   (blue glow -> gold, for "selected" UI)
"""

import colorsys
import sys

from PIL import Image

BLUE_HUE = 0.585  # #2E9BFF
RED_HUE = 0.0     # #FF3B3B
GOLD_HUE = 0.125  # #FFC83D


def in_red(h):
    return h >= 0.925 or h <= 0.03


def in_blue(h):
    return 0.49 <= h <= 0.70


def swap(img, direction):
    img = img.convert("RGB")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if g > 200 and r < 80 and b < 80:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.28 or v < 0.18:
                continue
            if direction == "to_blue" and in_red(hh):
                offset = (hh + 0.5) % 1 - 0.5
                nh = (BLUE_HUE + offset * 0.6) % 1
                nv = min(1.0, v * 1.08)
            elif direction == "to_red" and in_blue(hh):
                nh = (RED_HUE + (hh - BLUE_HUE) * 0.4) % 1
                nv = v
            elif direction == "to_gold" and in_blue(hh):
                nh = (GOLD_HUE + (hh - BLUE_HUE) * 0.3) % 1
                nv = min(1.0, v * 1.15)
            else:
                continue
            nr, ng, nb = colorsys.hsv_to_rgb(nh, s, nv)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255))
    return img


if __name__ == "__main__":
    direction, src, dst = sys.argv[1:4]
    swap(Image.open(src), direction).save(dst)
