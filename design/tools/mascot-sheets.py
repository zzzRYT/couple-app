#!/usr/bin/env python3
"""
mascot-sheets.py — draw the review sheets for the mascot files.

  design/mascot/contact-sheet.png  all eleven poses: supplied cutout (top) and harmonized version (bottom), cream and night
  design/mascot/before-after.png   main pose + three small poses at ~200 / 96 / 48 px high on the day wall, night wall
                                   and the dark app surface (left = supplied cutout, right = harmonized)

Usage: python3 design/tools/mascot-sheets.py --mascot design/mascot
Requirements: Python 3.9+, Pillow. Optional: MASCOT_LIBS=/path/to/site-packages
"""
import argparse, os, sys

if os.environ.get("MASCOT_LIBS"):
    sys.path.insert(0, os.environ["MASCOT_LIBS"])
from PIL import Image, ImageDraw, ImageFont

ORDER = ["mascot_wave_main", "mascot_cheer", "mascot_lookup", "mascot_walk", "mascot_back", "mascot_lie",
         "mascot_sleep", "mascot_star_sit", "mascot_box", "mascot_heart", "mascot_phone"]
BEFORE_AFTER = ["mascot_wave_main", "mascot_cheer", "mascot_lie", "mascot_lookup"]
SURFACES = [("day wall #FBF1E3", (0xFB, 0xF1, 0xE3)), ("night wall #2B2320", (0x2B, 0x23, 0x20)), ("dark app surface #352A25", (0x35, 0x2A, 0x25))]
INK = (0x4A, 0x34, 0x26)


def font(size):
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def fit(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def contact(m):
    cell_h, pad, cap = 190, 14, 22
    rows = []
    for bg in (SURFACES[0][1], SURFACES[1][1]):
        for kind in ("cutouts", "harmonized"):
            items = []
            for n in ORDER:
                p = os.path.join(m, kind, n + ("@2x.png" if kind == "harmonized" else ".png"))
                items.append(fit(Image.open(p).convert("RGBA"), cell_h))
            rows.append((bg, kind, items))
    w = max(sum(i.width for i in r[2]) + pad * (len(r[2]) + 1) for r in rows)
    h = len(rows) * (cell_h + cap + pad) + pad
    sheet = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    y = 0
    for bg, kind, items in rows:
        d.rectangle([0, y, w, y + cell_h + cap + pad], fill=bg)
        x = pad
        light = sum(bg) > 400
        for n, i in zip(ORDER, items):
            sheet.paste(i, (x, y + pad // 2 + cell_h - i.height), i)
            d.text((x, y + cell_h + 4), n.replace("mascot_", ""), fill=INK if light else (0xE8, 0xD3, 0xBC), font=font(13))
            x += i.width + pad
        d.text((6, y + 2), "supplied cutout" if kind == "cutouts" else "harmonized", fill=(0x8A, 0x6B, 0x55) if light else (0xC9, 0xB0, 0x98), font=font(12))
        y += cell_h + cap + pad
    sheet.save(os.path.join(m, "contact-sheet.png"), optimize=True)


def before_after(m):
    sizes = [200, 96, 48]
    strips = []
    for label, bg in SURFACES:
        items = []
        for n in BEFORE_AFTER:
            o = Image.open(os.path.join(m, "cutouts", n + ".png")).convert("RGBA")
            h = Image.open(os.path.join(m, "harmonized", n + "@2x.png")).convert("RGBA")
            for s in sizes:
                items.append(fit(o, s))
                items.append(fit(h, s))
        w = sum(i.width for i in items) + 10 * (len(items) + 1)
        hm = max(i.height for i in items) + 40
        s = Image.new("RGB", (w, hm), bg)
        d = ImageDraw.Draw(s)
        d.text((8, 4), label + "   (each pair: supplied | harmonized, 200 / 96 / 48 px high)", fill=(0x8A, 0x6B, 0x55) if sum(bg) > 400 else (0xC9, 0xB0, 0x98), font=font(12))
        x = 10
        for i in items:
            s.paste(i, (x, hm - i.height - 8), i)
            x += i.width + 10
        strips.append(s)
    W = max(s.width for s in strips)
    sheet = Image.new("RGB", (W, sum(s.height for s in strips)), (255, 255, 255))
    y = 0
    for s in strips:
        sheet.paste(s, (0, y))
        y += s.height
    sheet.save(os.path.join(m, "before-after.png"), optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mascot", required=True)
    a = ap.parse_args()
    contact(a.mascot)
    before_after(a.mascot)
    print("wrote contact-sheet.png and before-after.png in", a.mascot)


if __name__ == "__main__":
    main()
