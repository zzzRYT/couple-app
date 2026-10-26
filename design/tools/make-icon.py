#!/usr/bin/env python3
"""
make-icon.py — build the Mopiru app icon candidates and the production set from the EXISTING mascot art.

Input : design/mascot/harmonized/mascot_wave_main@3x.png (the direction-A look of the supplied, AI-generated master)
Output: design/icon/** (candidates, iOS/Android/Expo files, legibility previews, legibility report)

What it does (and does not do)
  * crops, scales and places Mopi's head/face from the existing pose and puts it on a flat ground colour from tokens.json
  * never redraws or generates art; the only derived art is a grayscale copy (iOS tinted), a single-colour line layer
    made from the art's own dark pixels (Android monochrome) and flat colour grounds; no text in any icon
  * all store icons are opaque RGB PNGs (no alpha channel, no pre-rounded corners)

Requires: Python 3, Pillow, NumPy.   Usage: python3 make-icon.py [--rec B]
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
DES = os.path.dirname(HERE)
ART = os.path.join(DES, 'mascot', 'harmonized')
OUT = os.path.join(DES, 'icon')

PAPER, ACCENT, NIGHT = '#FBF1E3', '#B24A24', '#2B2320'   # tokens.json: app.light.bg, app.light.primary, app.dark.bg
OUTLINE, RIM = '#4A3426', '#FFF4DF'

# --- geometry of the source art (mascot_wave_main@3x.png, 2173x1913), measured from the art's own face features
HEAD_CX = 1179                 # horizontal centre of the head silhouette
EYES = ((1060, 690), (1486, 607))   # eye centres
SMILE = (1297, 721)
EYE_MID = ((EYES[0][0] + EYES[1][0]) / 2, (EYES[0][1] + EYES[1][1]) / 2)
SASH_Y = 1000                  # top of the sash (below the face)
HEAD_TOP = 65

CANDIDATES = {
    # id: (name, ground, scale, face_y, art)
    'A': dict(name='종이색 바탕 · 머리와 어깨띠', ground=PAPER, k=0.60, hx=512, fy=480, art='wave_main'),
    'B': dict(name='브랜드 강조색 바탕 · 얼굴 가까이', ground=ACCENT, k=0.66, hx=512, fy=490, art='wave_main'),
    'C': dict(name='밤색 바탕 · 전신', ground=NIGHT, k=0.40, hx=512, fy=380, art='wave_main'),
}


def load(name):
    return Image.open(os.path.join(ART, f'mascot_{name}@3x.png')).convert('RGBA')


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def place(art, k, hx, fy, size=1024, ground=None):
    """scale the art by k and place it so that the head centre is at x=hx and the eye line at y=fy"""
    w, h = art.size
    a = art.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    ox, oy = round(hx - k * HEAD_CX), round(fy - k * EYE_MID[1])
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    layer.paste(a, (ox, oy), a)
    if ground is None:
        return layer
    base = Image.new('RGBA', (size, size), rgb(ground) + (255,))
    base.alpha_composite(layer)
    return base


def opaque(im):
    return im.convert('RGB')


def save(im, path, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, optimize=True, **kw)


def downscale(im, s):
    return im.resize((s, s), Image.LANCZOS)


def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ---------------------------------------------------------------- legibility
def feature_points(cfg, size=1024):
    """positions (in the 1024 icon) of the two eyes and the smile"""
    k, hx, fy = cfg['k'], cfg['hx'], cfg['fy']
    def m(p):
        return ((p[0] - HEAD_CX) * k + hx, (p[1] - EYE_MID[1]) * k + fy)
    return m(EYES[0]), m(EYES[1]), m(SMILE)


def legibility(cfg, icon, sizes=(1024, 180, 120, 60, 40, 29)):
    """Objective proxy for 'the face is recognisable': after downscaling, are two separate dark eye dots and a smile still
    visible against the surrounding skin?  Returns per-size numbers (never claims more than it measures)."""
    e1, e2, sm = feature_points(cfg)
    k = cfg['k']
    res = {}
    for s in sizes:
        im = np.array(downscale(icon, s).convert('RGB')).astype(float)
        f = s / 1024
        def patch(p, r):
            x, y = int(round(p[0] * f)), int(round(p[1] * f))
            r = max(1, int(round(r * f)))
            return im[max(0, y - r):y + r + 1, max(0, x - r):x + r + 1].reshape(-1, 3)
        def darkest(p, r):
            pts = patch(p, r)
            idx = np.argmin(pts.sum(axis=1))
            return tuple(pts[idx])
        def skin(p):   # ring of skin colour 2.2x the eye radius away, towards the nose
            x = p[0] + (sm[0] - p[0]) * 0.0
            return tuple(np.median(patch((p[0], p[1] + 70 * k * 1.0), int(110 * k)), axis=0))
        eye_r = 70 * k
        c1 = ratio(darkest(e1, eye_r), skin(e1))
        c2 = ratio(darkest(e2, eye_r), skin(e2))
        cs = ratio(darkest(sm, 75 * k), skin(sm))
        eye_dot_px = 2 * 58 * k * f          # eye blob width in px at this size (blob measured ~116 src px wide)
        eye_gap_px = abs(e2[0] - e1[0]) * f
        res[s] = dict(eye_contrast=round(min(c1, c2), 2), smile_contrast=round(cs, 2), eye_dot_px=round(eye_dot_px, 1),
                      eye_gap_px=round(eye_gap_px, 1))
    return res


def verdict(r, size):
    ok_contrast = r['eye_contrast'] >= 3.0 and r['smile_contrast'] >= 2.0
    ok_geom = r['eye_dot_px'] >= 1.4 and r['eye_gap_px'] >= 4.0
    return 'pass' if ok_contrast and ok_geom else ('borderline' if ok_contrast or ok_geom else 'fail')


# ---------------------------------------------------------------- masks and mockups
def squircle_mask(s, n=4.0, scale=4):
    S = s * scale
    ys, xs = np.mgrid[0:S, 0:S]
    x = (xs + 0.5 - S / 2) / (S / 2); y = (ys + 0.5 - S / 2) / (S / 2)
    m = (np.abs(x) ** n + np.abs(y) ** n) <= 1
    return Image.fromarray((m * 255).astype('uint8')).resize((s, s), Image.LANCZOS)


def round_mask(s, radius_frac, scale=4):
    S = s * scale
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * radius_frac), fill=255)
    return m.resize((s, s), Image.LANCZOS)


def circle_mask(s, scale=4):
    S = s * scale
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).ellipse((0, 0, S - 1, S - 1), fill=255)
    return m.resize((s, s), Image.LANCZOS)


MASKS = {'ios': lambda s: round_mask(s, 0.2237), 'circle': circle_mask, 'squircle': squircle_mask,
         'rounded': lambda s: round_mask(s, 0.28)}


def masked(icon_rgb, kind, s):
    im = downscale(icon_rgb, s).convert('RGBA')
    im.putalpha(MASKS[kind](s))
    return im


def android_visible(fg, bg, kind, s):
    """the launcher shows the centre 72/108 of the 108dp layers through the mask"""
    comp = Image.alpha_composite(bg.convert('RGBA'), fg)
    c = int(round(1024 * 72 / 108)); o = (1024 - c) // 2
    im = comp.crop((o, o, o + c, o + c)).resize((s, s), Image.LANCZOS)
    im.putalpha(MASKS[kind](s))
    return im


def wallpaper(w, h, dark):
    top, bot = ((38, 34, 52), (66, 50, 44)) if dark else ((247, 222, 214), (214, 228, 238))
    a = np.zeros((h, w, 3), 'float')
    for i in range(3):
        a[..., i] = np.linspace(top[i], bot[i], h)[:, None]
    return Image.fromarray(a.astype('uint8')).convert('RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--rec', default='B', help='recommended candidate id (A/B/C)')
    args = ap.parse_args()
    rec = args.rec
    arts = {}
    report = {'generated_from': 'design/mascot/harmonized/mascot_wave_main@3x.png', 'candidates': {}}

    # 1) candidates (opaque 1024 PNG, no alpha)
    cand = {}
    for cid, cfg in CANDIDATES.items():
        a = arts.setdefault(cfg['art'], load(cfg['art']))
        icon = opaque(place(a, cfg['k'], cfg['hx'], cfg['fy'], ground=cfg['ground']))
        cand[cid] = icon
        save(icon, os.path.join(OUT, 'candidates', f'icon-candidate-{cid}-1024.png'))
        lg = legibility(cfg, icon)
        report['candidates'][cid] = dict(name=cfg['name'], ground=cfg['ground'], scale=cfg['k'], legibility=lg,
                                         verdict={str(s): verdict(lg[s], s) for s in lg})

    # 2) recommended set
    cfg = CANDIDATES[rec]
    art = arts[cfg['art']]
    light = cand[rec]
    ios = os.path.join(OUT, 'expo')
    save(light, os.path.join(ios, 'icon.png'))                       # iOS 1024 + default Expo icon
    dark = opaque(place(art, cfg['k'], cfg['hx'], cfg['fy'], ground=NIGHT))
    save(dark, os.path.join(ios, 'icon-dark.png'))
    gray = place(art, cfg['k'], cfg['hx'], cfg['fy'], ground='#000000').convert('L')
    gray = gray.point(lambda v: min(255, int(v * 1.15)))            # a little lift so the outline stays readable under tint
    save(Image.merge('RGB', (gray, gray, gray)), os.path.join(ios, 'icon-tinted.png'))

    sizes = [1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20]
    for s in sizes:
        save(downscale(light, s), os.path.join(OUT, 'ios-sizes', f'icon-{s}.png'))
    for s in (1024, 180, 120, 60, 40, 29):
        save(downscale(dark, s), os.path.join(OUT, 'ios-sizes', f'icon-dark-{s}.png'))
        save(downscale(Image.merge('RGB', (gray, gray, gray)), s), os.path.join(OUT, 'ios-sizes', f'icon-tinted-{s}.png'))

    # Android adaptive layers: 1024 px = 108 dp. Safe zone = 66 dp circle (= 61% = 626 px); the head and face are placed inside it,
    # the body bleeds below (the launcher mask crops it). The requested "66%" (676 px) is therefore also satisfied.
    k_fg = 0.45
    fg = place(art, k_fg, 512, 512 - (EYE_MID[1] - (HEAD_TOP + SASH_Y) / 2) * k_fg)
    save(fg, os.path.join(ios, 'adaptive-icon-foreground.png'))
    bg = Image.new('RGBA', (1024, 1024), rgb(cfg['ground']) + (255,))
    save(bg.convert('RGB'), os.path.join(ios, 'adaptive-icon-background.png'))
    # monochrome (themed icon): the art's own dark pixels (outline, eyes, smile, sash lines) as one opaque colour on transparent
    a = np.array(fg).astype(float)
    not_blue = (a[..., 2] - a[..., 0]) < 45          # leave the blue sash out so the layer stays a light line drawing
    dark_px = ((a[..., :3].mean(axis=2) < 105) & (a[..., 3] > 200) & not_blue)
    mono = np.zeros((1024, 1024, 4), 'uint8'); mono[..., :3] = 255; mono[..., 3] = (dark_px * 255).astype('uint8')
    mono_im = Image.fromarray(mono, 'RGBA').filter(ImageFilter.GaussianBlur(0.0))
    save(mono_im, os.path.join(ios, 'adaptive-icon-monochrome.png'))

    # splash (the whole existing pose on transparent; background colour comes from app.json) and favicon / store versions
    w, h = art.size
    sp = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    k = 0.86 * 1024 / max(w, h)
    sa = art.resize((round(w * k), round(h * k)), Image.LANCZOS)
    sp.paste(sa, ((1024 - sa.size[0]) // 2, (1024 - sa.size[1]) // 2), sa)
    save(sp, os.path.join(ios, 'splash-icon.png'))
    save(downscale(light, 48), os.path.join(ios, 'favicon.png'))
    save(downscale(light, 512), os.path.join(OUT, 'store', 'play-store-512.png'))
    save(downscale(light, 192), os.path.join(OUT, 'store', 'web-192.png'))

    # 3) previews: legibility sheet (light / dark home-screen tiles, iOS mask + Android masks), candidate size strips, Android layers
    from PIL import ImageFont
    try:
        font = ImageFont.load_default(size=18)
    except TypeError:
        font = ImageFont.load_default()

    def text(t, xy, dark_mode, im):
        ImageDraw.Draw(im).text(xy, t, fill=(255, 244, 223, 255) if dark_mode else (63, 45, 34, 255), font=font)

    def tile(dark_mode, w=1500, h=640):
        t = wallpaper(w, h, dark_mode)
        icon = dark if dark_mode else light
        x = 30
        for s in (180, 120, 60, 40, 29):          # real pixel sizes
            t.alpha_composite(masked(icon, 'ios', s), (x, 40)); text(str(s), (x, 40 + s + 6), dark_mode, t); x += s + 30
        x = 30
        for s in (60, 40, 29):                    # 4x nearest-neighbour zoom of the small sizes
            t.alpha_composite(masked(icon, 'ios', s).resize((s * 4, s * 4), Image.NEAREST), (x, 300)); text(f'{s} x4', (x, 300 + s * 4 + 6), dark_mode, t); x += s * 4 + 30
        x = 760
        for kind in ('circle', 'squircle', 'rounded'):
            t.alpha_composite(android_visible(fg, bg, kind, 192), (x, 40)); text(kind, (x, 240), dark_mode, t)
            t.alpha_composite(android_visible(fg, bg, kind, 96), (x, 300)); x += 222
        text('iOS (rounded mask) real size / zoom', (30, 600), dark_mode, t)
        text('Android adaptive visible window', (760, 600), dark_mode, t)
        return t
    sheet = Image.new('RGB', (1500, 1300), '#FFFFFF')
    sheet.paste(tile(False).convert('RGB'), (0, 0)); sheet.paste(tile(True).convert('RGB'), (0, 660))
    save(sheet, os.path.join(OUT, 'preview', 'legibility-sheet.png'))

    strip = wallpaper(1500, 3 * 250, False)
    for i, cid in enumerate('ABC'):
        x = 30
        for s in (180, 120, 60, 40, 29):
            strip.alpha_composite(masked(cand[cid], 'ios', s), (x, i * 250 + 25)); text(f'{cid} {s}', (x, i * 250 + 25 + s + 6), False, strip); x += s + 30
        for s in (60, 29):
            strip.alpha_composite(masked(cand[cid], 'ios', s).resize((s * 4, s * 4), Image.NEAREST), (x + 40, i * 250 + 25)); x += s * 4 + 30
    save(strip.convert('RGB'), os.path.join(OUT, 'preview', 'candidates-sizes.png'))

    lay = Image.new('RGB', (3 * 540, 540), '#D9D0C6')
    chk = Image.new('RGBA', (512, 512), (255, 255, 255, 255))
    for yy in range(0, 512, 32):
        for xx in range(0, 512, 32):
            if (xx // 32 + yy // 32) % 2:
                ImageDraw.Draw(chk).rectangle((xx, yy, xx + 31, yy + 31), fill=(204, 204, 204, 255))
    for i, (im, onchk) in enumerate(((fg, True), (bg, False), (mono_im, True))):
        base = chk.copy() if onchk else Image.new('RGBA', (512, 512), (255, 255, 255, 255))
        m2 = im.resize((512, 512), Image.LANCZOS)
        if i == 2:
            tmp = Image.new('RGBA', (512, 512), (0, 0, 0, 0)); tmp.paste(Image.new('RGBA', (512, 512), (63, 45, 34, 255)), (0, 0), m2.split()[3]); m2 = tmp
        base.alpha_composite(m2) if m2.mode == 'RGBA' else base.paste(m2, (0, 0))
        d = ImageDraw.Draw(base)
        c = 626 / 1024 * 512 / 2
        d.ellipse((256 - c, 256 - c, 256 + c, 256 + c), outline=(0, 120, 255, 255), width=2)
        lay.paste(base.convert('RGB'), (i * 540 + 14, 14))
    save(lay, os.path.join(OUT, 'preview', 'android-layers.png'))

    # report
    report['recommended'] = rec
    report['android'] = dict(layer_px=1024, layer_dp=108, safe_zone_dp=66, safe_zone_px=round(1024 * 66 / 108),
                             requested_safe_zone_px=676, foreground_scale=k_fg)
    with open(os.path.join(OUT, 'legibility-report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps({c: report['candidates'][c]['verdict'] for c in report['candidates']}, ensure_ascii=False))
    for c in 'ABC':
        print(c, {s: (v['eye_contrast'], v['smile_contrast'], v['eye_dot_px'], v['eye_gap_px']) for s, v in report['candidates'][c]['legibility'].items()})


if __name__ == '__main__':
    main()
