#!/usr/bin/env python3
"""
harmonize-mascot.py — turn the supplied soft-3D mascot cutouts into the app's direction-A look.

Input : transparent PNG cutouts (design/mascot/cutouts/*.png, produced by cutout-mascot.py)
Output: harmonized PNGs (design/mascot/harmonized/<id>.png, @2x and @3x) + a parameters JSON.

What it does (and does not do)
  * keeps the silhouette, proportions, face, palette family, sash and star pin of the supplied character
    (the silhouette comes from the cutout's own alpha; nothing is redrawn)
  * flattens the soft shading into a few calm tones per colour region (3-4 tones) with smooth, clean edges;
    the cheek blush stays as a flat pink region
  * draws the direction-A brown outline (centred on the silhouette edge) whose weight is a fixed ratio of the
    figure's longest edge, so it holds at small sizes; inner lines between colour regions use ~65% of that weight
  * shifts the pastel fill a little towards the lower right (the "slightly offset fill" of direction A)
  * adds the cream rim (sticker edge) around the outline so the figure also reads on the dark night room
  * adds a faint, smooth unevenness to the line weight (never moves the outline off the silhouette)
Everything is derived from the cutout pixels; run it again after replacing a cutout (for example by the
illustrator's final art) and the same look is applied.

Requirements: Python 3.9+, numpy, scipy, Pillow, opencv-python(-headless).
Usage:
  python3 design/tools/harmonize-mascot.py --in design/mascot/cutouts --out design/mascot/harmonized
Optional: MASCOT_LIBS=/path/to/site-packages to import the libraries from a non-default location.
"""
import argparse, glob, hashlib, json, os, sys

if os.environ.get("MASCOT_LIBS"):
    sys.path.insert(0, os.environ["MASCOT_LIBS"])
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

TOOL_VERSION = "1.0.0"

# ---- direction-A constants (see design/assets-spec.md, section "style guide") ----
INK = (0x4A, 0x34, 0x26)       # outline colour
RIM = (0xFF, 0xF4, 0xDF)       # cream rim
DEFAULTS = dict(
    line=0.0375,       # outline weight = 3.75% of the longest edge (centred on the silhouette edge)
    inner=0.65,        # inner line weight relative to the outline
    rim=0.027,         # cream rim width, 2.7% of the longest edge
    offset=(0.010, 0.008),  # fill shift towards lower right (fraction of the longest edge)
    wobble=0.10,       # +-10% smooth variation of the line weight
    min_line_px=1.6,   # never thinner than this at 1x display (keeps small sizes legible)
    tones=dict(body=3, sash=4, star=3, heart=3, box=3, phone=3),
    smooth=2.2,        # sigma (native px) used to smooth the region masks -> clean tone edges
    shade_sigma=4.0,   # sigma (native px) used to smooth the lightness before it is split into tones
    island=0.01,      # remove tone islands smaller than this fraction of the figure area
    box_ids="mascot_box",  # only these cutouts contain a cardboard box (brown, treated as its own colour family)
    prop_smooth=0.9,   # sigma for props / sash / star (keeps their shape)
    form_lines=1,      # 1 = draw thin ink lines along dark narrow valleys of the original shading (arms, legs)
    valley=7.0,        # a valley region needs at least one response this strong (lightness units)
    valley_lo=3.0,     # ... and counts from this response on (hysteresis)
    valley_min=0.0010, # drop valley regions smaller than this fraction of the figure area
    line_min_len=0.09, # drop skeleton fragments shorter than this fraction of the longest edge
    sp=5, sr=14,       # mean-shift spatial / colour radius (native px / colour units)
)

# ---- curated flat tones (dark -> light is reversed below: lists are light -> dark) ----
TONES = {
    "body":  ["#F8DFBB", "#ECC9A2", "#D9AD86", "#C39772"],
    "cheek": ["#F2A99B"],
    "sash":  ["#7081DC", "#5263BD", "#3F4E9E", "#2E3C82"],
    "star":  ["#FFE4A6", "#FCCF7B", "#F0A650"],
    "heart": ["#EE8A7B", "#DB6D5C", "#BB5242"],
    "box":   ["#D0A173", "#BC8A5E", "#9D6C4F", "#7C5340"],
    "phone": ["#4A5568", "#2E3646", "#1F2532"],
    "ink":   ["#3A261C"],
}
FAMILIES = ["body", "cheek", "sash", "star", "heart", "box", "phone", "ink"]


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def body_like(h, s):
    return (h >= 8) & (h <= 44) & (s < 0.7)


def classify(rgb8, alpha_hi, fig_area, allow_box):
    """Per-pixel colour family from a smoothed 8-bit RGB image (hue / saturation / lightness rules)."""
    hsv = cv2.cvtColor(rgb8, cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2.0, hsv[..., 1] / 255.0, hsv[..., 2] / 255.0
    lab = cv2.cvtColor(rgb8, cv2.COLOR_RGB2LAB).astype(np.float32)
    L, a = lab[..., 0], lab[..., 1]
    fam = np.full(h.shape, -1, np.int8)
    idx = {n: i for i, n in enumerate(FAMILIES)}
    blue = (h >= 195) & (h <= 265) & (s > 0.28) & (v > 0.30)
    # props (star, heart): a strict core, then a relaxed colour range that only counts next to the core, so the pale
    # highlight of a star / heart joins it without catching the body's own warm highlights
    star_core = (h >= 30) & (h <= 52) & (s > 0.42) & (v > 0.88)
    star_core = ndi.binary_opening(star_core, iterations=1)
    star_rel = (h >= 34) & (h <= 58) & (s > 0.27) & (v > 0.90)
    star = star_core | (star_rel & ndi.binary_dilation(star_core, iterations=9))
    heart_core = ((h < 16) | (h > 340)) & (s > 0.42)
    heart_core = ndi.binary_opening(heart_core, iterations=1)
    heart_rel = ((h <= 14) | (h > 340)) & (s > 0.32)
    heart = heart_core | (heart_rel & ndi.binary_dilation(heart_core, iterations=9))
    dark = (v < 0.34)
    very_dark = (v < 0.27)
    box = (h >= 18) & (h <= 36) & (s >= 0.44) & (v < 0.80) & allow_box
    body = (h >= 14) & (h <= 44) & (s >= 0.08) & (s < 0.46)
    cheek = body & (a >= 143) & (L >= 170) & (v > 0.84)
    fam[body] = idx["body"]
    fam[box] = idx["box"]
    fam[cheek] = idx["cheek"]
    fam[star] = idx["star"]
    fam[heart] = idx["heart"]
    fam[blue] = idx["sash"]
    fam[dark] = idx["ink"]
    # dark shadow creases (not as dark as eyes / mouth) join the body tones instead of becoming ink
    crease = dark & ~very_dark
    fam[crease & body_like(h, s)] = idx["body"]
    # large dark regions (a phone) are not ink: only small dark marks (eyes, mouth) stay ink
    dk = fam == idx["ink"]
    lab_, n_ = ndi.label(dk)
    fam[dk] = -1                       # small dark marks are re-added later as an ink overlay
    if n_:
        sizes = ndi.sum(dk, lab_, range(1, n_ + 1))
        for i, sz in enumerate(sizes, 1):
            if sz > 0.015 * fig_area:   # a large dark object (the phone); eyes and mouth are far smaller
                fam[lab_ == i] = idx["phone"]
    return fam, v


def nearest_fill(label, valid):
    """fill label==-1 pixels with the nearest valid label."""
    inv = ~valid
    if not inv.any():
        return label
    _, (iy, ix) = ndi.distance_transform_edt(inv, return_indices=True)
    return label[iy, ix]


def smooth_argmax(onehots, sigma, scale):
    """blur every class mask (sigma may be a list, one per class), upsample (bicubic) and take the argmax:
    smooth, clean region boundaries."""
    probs = []
    sig = sigma if isinstance(sigma, (list, tuple)) else [sigma] * len(onehots)
    for m, sg in zip(onehots, sig):
        p = ndi.gaussian_filter(m.astype(np.float32), sg)
        if scale != 1:
            p = cv2.resize(p, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        probs.append(p)
    return np.argmax(np.stack(probs), axis=0)


def thin(mask, max_iter=40):
    """Zhang-Suen thinning (vectorised) -> 1px skeleton of a boolean mask."""
    img = mask.astype(np.uint8)
    for _ in range(max_iter):
        changed = False
        for step in (0, 1):
            p = np.pad(img, 1)
            P2, P3, P4, P5 = p[:-2, 1:-1], p[:-2, 2:], p[1:-1, 2:], p[2:, 2:]
            P6, P7, P8, P9 = p[2:, 1:-1], p[2:, :-2], p[1:-1, :-2], p[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(np.int16) for n in nb)
            seq = nb + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(np.int16) for i in range(8))
            if step == 0:
                c1 = (P2 * P4 * P6) == 0
                c2 = (P4 * P6 * P8) == 0
            else:
                c1 = (P2 * P4 * P8) == 0
                c2 = (P2 * P6 * P8) == 0
            rm = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c1 & c2
            if rm.any():
                img[rm] = 0
                changed = True
        if not changed:
            break
    return img.astype(bool)


def noise_field(shape, period, seed):
    rng = np.random.RandomState(seed)
    gh, gw = max(2, int(shape[0] / period) + 2), max(2, int(shape[1] / period) + 2)
    g = rng.rand(gh, gw).astype(np.float32)
    return cv2.resize(g, (shape[1], shape[0]), interpolation=cv2.INTER_CUBIC)


def process(path, out_scale, P, seed=1):
    im = Image.open(path).convert("RGBA")
    EDGE0 = max(im.size)                           # longest edge of the supplied cutout (all weights are ratios of this)
    # transparent border wide enough for the outer half of the outline, the cream rim and the fill offset, so nothing is clipped
    pad0 = int(np.ceil((P["line"] / 2.0 + P["rim"] + abs(P["offset"][0]) + abs(P["offset"][1])) * EDGE0)) + 3
    padded = Image.new("RGBA", (im.width + 2 * pad0, im.height + 2 * pad0), (0, 0, 0, 0))
    padded.paste(im, (pad0, pad0))
    im = padded
    W0, H0 = im.size
    rgba = np.array(im)
    alpha0 = rgba[..., 3].astype(np.float32) / 255.0
    rgb = rgba[..., :3].copy()
    # fill transparent pixels with the nearest opaque colour (no dark/halo contamination in the smoothing)
    valid = alpha0 > 0.5
    _, (iy, ix) = ndi.distance_transform_edt(~valid, return_indices=True)
    rgb = rgb[iy, ix]
    rgb0 = rgb.copy()
    # edge-preserving smoothing, then flat patches
    rgb = cv2.bilateralFilter(rgb, 7, 22, 5)
    rgb = cv2.pyrMeanShiftFiltering(rgb, P["sp"], P["sr"], maxLevel=1)
    fig_area0 = float((alpha0 > 0.5).sum())
    fam, v = classify(rgb, alpha0 > 0.98, fig_area0, os.path.splitext(os.path.basename(path))[0] in P["box_ids"].split(","))
    fam[~valid] = -1
    cls_valid = (fam >= 0) & valid
    # classes lacking pixels are fine; unclassified opaque pixels take the nearest class
    fam = nearest_fill(fam, cls_valid)
    # tone quantisation inside each family: smooth the lightness (normalised convolution inside the family so the
    # colours of neighbouring families do not bleed in), split it into a few levels, then drop small islands
    L = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[..., 0].astype(np.float32)
    class_of = np.full(fam.shape, -1, np.int16)
    palette = []   # (family name, tone number)
    fig_area = float(valid.sum())
    for fi, fname in enumerate(FAMILIES):
        m = (fam == fi) & valid
        if m.sum() < 30:
            continue
        n_tones = len(TONES[fname]) if fname in ("cheek", "ink") else min(P["tones"].get(fname, 3), len(TONES[fname]))
        if n_tones == 1:
            palette.append((fname, 0))
            class_of[m] = len(palette) - 1
            continue
        mf = m.astype(np.float32)
        small = m.sum() < 0.04 * fig_area
        sig = 1.0 if small else P["shade_sigma"]
        Ls = ndi.gaussian_filter(L * mf, sig) / np.maximum(ndi.gaussian_filter(mf, sig), 1e-3)
        vals = Ls[m].reshape(-1, 1).astype(np.float32)
        k = min(n_tones, max(1, int(m.sum() // 120)))
        crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.3)
        _, lab_, cen = cv2.kmeans(vals, k, None, crit, 4, cv2.KMEANS_PP_CENTERS)
        order = np.argsort(-cen.ravel())
        rank = np.empty(k, np.int32)
        rank[order] = np.arange(k)
        tl = len(TONES[fname])
        tone_map = np.zeros(m.shape, np.int16)
        tone_map[m] = rank[lab_.ravel()]
        # remove small islands of every tone (merge them into the surrounding tone)
        for r in range(k):
            tm = tone_map == r
            tm &= m
            lbl, nn = ndi.label(tm)
            if nn:
                sz = ndi.sum(tm, lbl, range(1, nn + 1))
                for i, z in enumerate(sz, 1):
                    if z < (0.0015 * fig_area if small else P["island"] * fig_area):
                        tone_map[lbl == i] = -1
        holes = m & (tone_map < 0)
        if holes.any():
            _, (iy, ix) = ndi.distance_transform_edt(~(m & (tone_map >= 0)), return_indices=True)
            tone_map = np.where(holes, tone_map[iy, ix], tone_map)
        for r in range(k):
            ti = min(r, tl - 1)
            palette.append((fname, ti))
            pid = len(palette) - 1
            class_of[m & (tone_map == r)] = pid
    class_of = nearest_fill(class_of, (class_of >= 0) & valid)
    onehots = [(class_of == i) & valid for i in range(len(palette))]
    S = out_scale
    sigmas = [P["smooth"] if palette[i][0] in ("body", "cheek") else P["prop_smooth"] for i in range(len(palette))]
    cls = smooth_argmax(onehots, sigmas, S)
    # small dark marks (eyes, mouth) found in the original pixels: darker than their surroundings and small
    L0 = cv2.cvtColor(rgb0, cv2.COLOR_RGB2LAB)[..., 0].astype(np.float32)
    v0 = cv2.cvtColor(rgb0, cv2.COLOR_RGB2HSV)[..., 2].astype(np.float32) / 255.0
    loc = ndi.gaussian_filter(L0, 6)
    feat = ((L0 < loc - 28) & (v0 < 0.52)) | (v0 < 0.25)
    feat &= valid
    fl, fn = ndi.label(feat)
    for i, sz in enumerate(ndi.sum(feat, fl, range(1, fn + 1)), 1):
        if sz > 0.006 * fig_area or sz < 5:
            feat[fl == i] = False
    # marks must sit inside the face area: drop dark creases that touch the figure's edge (feet, armpits)
    dist_edge = ndi.distance_transform_edt(valid)
    fl, fn = ndi.label(feat)
    for i in range(1, fn + 1):
        mk = fl == i
        if dist_edge[mk].max() < 0.045 * EDGE0:
            feat[mk] = False
    # the big dark phone is already a family; remove it from the marks
    feat &= ~np.isin(class_of, [i for i, (f_, t_) in enumerate(palette) if f_ == "phone"])
    # ---- silhouette (from the cutout's own alpha), smooth at the output scale ----
    a_s = ndi.gaussian_filter(alpha0, 0.8)
    a_big = cv2.resize(a_s, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC) if S != 1 else a_s
    sil = a_big > 0.5
    H, W = sil.shape
    edge = EDGE0 * S                         # longest edge at the output scale
    T = max(P["line"] * edge, P["min_line_px"] * S)
    Tin = T * P["inner"]
    R = P["rim"] * edge
    off = (int(round(P["offset"][0] * edge)), int(round(P["offset"][1] * edge)))
    # ---- colour layer from class ids ----
    color = np.zeros((H, W, 3), np.float32)
    for pid, (fname, ti) in enumerate(palette):
        color[cls == pid] = hex2rgb(TONES[fname][ti])
    famgrid = np.zeros((H, W), np.int16)
    for pid, (fname, ti) in enumerate(palette):
        famgrid[cls == pid] = FAMILIES.index(fname)
    # ---- signed distance & line-weight unevenness ----
    din = ndi.distance_transform_edt(sil)          # distance to the edge, inside
    dout = ndi.distance_transform_edt(~sil)        # distance to the edge, outside
    sd = np.where(sil, din, -dout)
    nz = noise_field((H, W), period=max(24, edge / 9), seed=seed)
    wob = 1.0 + P["wobble"] * (nz - 0.5) * 2.0
    outline = np.abs(sd) <= (T * wob) / 2.0
    # ---- inner lines: boundaries between different families (sash / star / box / heart / phone vs body) ----
    inner = np.zeros((H, W), bool)
    fam_ink = FAMILIES.index("ink")
    for fi, fname in enumerate(FAMILIES):
        if fname in ("body", "cheek", "ink"):
            continue
        mk = (famgrid == fi) & sil
        if mk.sum() < 40:
            continue
        mk8 = mk.astype(np.uint8)
        grad = cv2.morphologyEx(mk8, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (max(3, int(Tin) | 1),) * 2)) > 0
        inner |= grad & sil
    # form lines: narrow dark valleys of the original shading (under an arm, between legs, under the hands) become
    # thin ink lines, so limbs stay readable after the shading is flattened
    if P["form_lines"]:
        Lb = L0
        edge_n = EDGE0
        inside = ndi.binary_erosion(valid, iterations=max(2, int(0.02 * edge_n)))
        valley = ndi.gaussian_filter(Lb, 5.0) - ndi.gaussian_filter(Lb, 1.3)
        valley = np.where(valid, valley, 0)
        lo = valley > P["valley_lo"]
        lo &= inside
        # hysteresis: keep connected valley regions that contain at least one strong response
        lbl_, nn_ = ndi.label(lo)
        vm = np.zeros_like(lo)
        if nn_:
            mx = ndi.maximum(valley, lbl_, range(1, nn_ + 1))
            szs = ndi.sum(lo, lbl_, range(1, nn_ + 1))
            for i_, (m_, z_) in enumerate(zip(mx, szs), 1):
                if m_ >= P["valley"] and z_ >= P["valley_min"] * fig_area0:
                    vm[lbl_ == i_] = True
        # not on the face, and not where a family boundary line (sash, star, heart, phone) is already drawn
        vm &= ~ndi.binary_dilation(feat, iterations=max(3, int(0.035 * edge_n)))
        famsmall = cv2.resize(famgrid.astype(np.float32), (W0, H0), interpolation=cv2.INTER_NEAREST)
        fb = np.zeros((H0, W0), bool)
        for fi, fname in enumerate(FAMILIES):
            if fname in ("body", "cheek", "ink"):
                continue
            mk8 = (famsmall == fi).astype(np.uint8)
            if mk8.sum() > 20:
                fb |= cv2.morphologyEx(mk8, cv2.MORPH_GRADIENT, np.ones((5, 5), np.uint8)) > 0
        vm &= ~ndi.binary_dilation(fb, iterations=3)
        sk = thin(vm)
        # drop short skeleton fragments
        lbs, ns = ndi.label(sk, structure=np.ones((3, 3)))
        if ns:
            for i_, z_ in enumerate(ndi.sum(sk, lbs, range(1, ns + 1)), 1):
                if z_ < P["line_min_len"] * edge_n:
                    sk[lbs == i_] = False
        if sk.any():
            skf = cv2.resize(ndi.gaussian_filter(sk.astype(np.float32), 0.7), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC) if S != 1 else ndi.gaussian_filter(sk.astype(np.float32), 0.7)
            wline = max(0.9 * S, Tin * 0.55 / 2.0)
            lines = ndi.distance_transform_edt(~(skf > 0.25)) <= wline
            inner |= lines & sil
    inner &= ~((famgrid == fam_ink))
    # ---- ink features (eyes, mouth): small dark regions stay as ink, not shifted ----
    f_big = cv2.resize(ndi.gaussian_filter(feat.astype(np.float32), 0.6), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC) if S != 1 else ndi.gaussian_filter(feat.astype(np.float32), 0.6)
    ink = (f_big > 0.30) & sil
    ink = ndi.binary_closing(ink, iterations=max(1, S))
    # ---- compose at the output scale ----
    out = np.zeros((H + 0, W + 0, 4), np.float32)
    pad = int(R + abs(off[0]) + abs(off[1]) + T) + 2
    Hp, Wp = H + 2 * pad, W + 2 * pad
    canvas = np.zeros((Hp, Wp, 4), np.float32)
    def put(mask, rgb, shift=(0, 0)):
        m = np.zeros((Hp, Wp), bool)
        m[pad:pad + H, pad:pad + W] = mask
        if shift != (0, 0):
            m = np.roll(np.roll(m, shift[1], axis=0), shift[0], axis=1)
        canvas[m, :3] = rgb if np.ndim(rgb) == 1 else rgb
        canvas[m, 3] = 255
        return m
    # rim = silhouette dilated by (T/2 + R)
    rim_mask = (np.where(sil, 0, ndi.distance_transform_edt(~sil)) <= (T / 2.0 + R))
    put(rim_mask, np.array(RIM, np.float32))
    # paper (cream) inside the silhouette: shows where the shifted fill leaves a gap
    put(sil, np.array(RIM, np.float32))
    # shifted fill
    fill_full = np.zeros((Hp, Wp, 3), np.float32)
    fill_full[pad:pad + H, pad:pad + W] = color
    fm = np.zeros((Hp, Wp), bool)
    fm[pad:pad + H, pad:pad + W] = sil
    fill_full = np.roll(np.roll(fill_full, off[1], axis=0), off[0], axis=1)
    fm = np.roll(np.roll(fm, off[1], axis=0), off[0], axis=1)
    canvas[fm, :3] = fill_full[fm]
    canvas[fm, 3] = 255
    # inner lines, outline, ink features (never shifted)
    def put_ink(mask):
        m = np.zeros((Hp, Wp), bool)
        m[pad:pad + H, pad:pad + W] = mask
        canvas[m, :3] = np.array(INK, np.float32)
        canvas[m, 3] = 255
    put_ink(inner)
    put_ink(outline)
    ink_col = np.array(hex2rgb(TONES["ink"][0]), np.float32)
    m_ink = np.zeros((Hp, Wp), bool)
    m_ink[pad:pad + H, pad:pad + W] = ink
    canvas[m_ink, :3] = ink_col
    canvas[m_ink, 3] = 255
    # soft anti-aliasing: compose at 2x extra resolution is overkill here; blur the alpha by half a pixel
    canvas[..., 3] = np.clip(ndi.gaussian_filter(canvas[..., 3], 0.6 * max(1, S / 2)), 0, 255)
    res = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGBA")
    # crop to content
    bbox = res.getchannel("A").point(lambda x: 255 if x > 6 else 0).getbbox()
    res = res.crop(bbox)
    info = dict(line_px=round(float(T), 2), inner_px=round(float(Tin), 2), rim_px=round(float(R), 2), offset_px=list(off),
                tones={f: sum(1 for p in palette if p[0] == f) for f in set(p[0] for p in palette)},
                size=list(res.size))
    return res, info


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--scales", default="1,2,3", help="comma separated output scales relative to the cutout's native size")
    ap.add_argument("--only", default="", help="comma separated ids to process")
    for k, v in DEFAULTS.items():
        if k in ("tones", "offset"):
            continue
        ap.add_argument("--" + k.replace("_", "-"), type=type(v), default=v)
    args = ap.parse_args()
    P = dict(DEFAULTS)
    for k in DEFAULTS:
        if k in ("tones", "offset"):
            continue
        P[k] = getattr(args, k.replace("-", "_"))
    os.makedirs(args.out, exist_ok=True)
    only = [s for s in args.only.split(",") if s]
    report = {"tool": "harmonize-mascot.py", "version": TOOL_VERSION, "opencv": cv2.__version__, "numpy": np.__version__,
              "parameters": {k: P[k] for k in P}, "files": {}}
    for path in sorted(glob.glob(os.path.join(args.inp, "*.png"))):
        pid = os.path.splitext(os.path.basename(path))[0]
        if only and pid not in only:
            continue
        for s in [int(x) for x in args.scales.split(",")]:
            res, info = process(path, s, P, seed=sum(map(ord, pid)) % 97)
            name = pid + ("" if s == 1 else f"@{s}x") + ".png"
            dst = os.path.join(args.out, name)
            res.save(dst, optimize=True)
            report["files"][name] = dict(info, source=os.path.basename(path), source_sha256=sha256(path), sha256=sha256(dst), scale=s)
    json.dump(report, open(os.path.join(args.out, "harmonize-report.json"), "w"), indent=1)
    print("processed", len(report["files"]), "files ->", args.out)


if __name__ == "__main__":
    main()
