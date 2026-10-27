#!/usr/bin/env python3
"""
cutout-mascot.py — cut the eleven mascot figures (and the small floating marks) out of the supplied character sheet.

Input : design/mascot/source/mascot-source.png  (1536 x 1024 sheet, cream background, soft floor shadows)
Output: design/mascot/cutouts/<id>.png          (one transparent PNG per figure, native resolution, no resampling)
        design/mascot/cutouts-fx/<id>.png       (floating marks: stars, hearts, motion lines, zzz)
        design/mascot/cutouts/cutout-report.json (parameters, source boxes, sha256 of every file)

Method
  1. A pixel belongs to the character when it is clearly coloured (chroma >= 29 and a warm/blue/red hue ratio) or dark.
     The cream paper (chroma ~8) and the soft pink-grey floor shadows (chroma 22-28, low green-blue gap) are not.
  2. Soft edges are unmixed instead of thresholded: for every edge pixel the nearest sure-foreground colour F and the
     nearest sure-background colour B are looked up and alpha = projection of (pixel - B) on (F - B). The colour is
     then decontaminated (F estimate) so no cream halo is left on dark backgrounds.
  3. Every figure is cropped by connected component; neighbours and shadows are excluded.
The figure boxes below were read from a connected-component analysis of this exact sheet. If the sheet is replaced,
re-run the analysis (see --list-components) and update FIG / FX.

Requirements: Python 3.9+, numpy, scipy, Pillow.   Usage:
  python3 design/tools/cutout-mascot.py --sheet design/mascot/source/mascot-source.png --out design/mascot
Optional: MASCOT_LIBS=/path/to/site-packages
"""
import argparse, hashlib, json, os, sys

if os.environ.get("MASCOT_LIBS"):
    sys.path.insert(0, os.environ["MASCOT_LIBS"])
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

TOOL_VERSION = "1.0.0"
# id -> (x0, y0, x1, y1) of the figure in the sheet (component bounding boxes)
FIG = {
    "mascot_wave_main": (38, 237, 705, 822),   # the large standing pose, waving
    "mascot_star_sit": (720, 184, 904, 387),   # sitting, holding a star
    "mascot_lie": (944, 243, 1199, 375),       # lying down
    "mascot_cheer": (1236, 176, 1476, 389),    # happy wave
    "mascot_box": (718, 461, 961, 641),        # peeking out of a cardboard box
    "mascot_heart": (1008, 436, 1196, 653),    # holding a heart, winking
    "mascot_walk": (1269, 455, 1503, 657),     # walking, side view
    "mascot_back": (647, 718, 821, 918),       # back view with the sash knot
    "mascot_phone": (839, 718, 1007, 918),     # sitting with a phone
    "mascot_sleep": (1024, 788, 1266, 913),    # sleeping
    "mascot_lookup": (1293, 736, 1482, 923),   # looking up
}
FX = {
    "fx_star_a": [(1024, 190, 1059, 223)],
    "fx_cheer_rays": [(1256, 173, 1272, 197), (1238, 192, 1261, 209), (1236, 215, 1257, 225), (1451, 232, 1473, 244), (1445, 212, 1464, 230), (1450, 250, 1469, 262)],
    "fx_hearts": [(985, 449, 1017, 479), (976, 490, 1001, 514), (1193, 471, 1218, 495), (1192, 506, 1210, 525)],
    "fx_phone_lines": [(989, 712, 1000, 730), (1005, 732, 1022, 744), (999, 718, 1014, 734)],
    "fx_zzz": [(1218, 733, 1242, 761), (1191, 758, 1216, 785)],
    "fx_star_b": [(1430, 690, 1470, 732)],
}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--list-components", action="store_true")
    a = ap.parse_args()
    im = np.array(Image.open(a.sheet).convert("RGB")).astype(float)
    H, W, _ = im.shape
    c = im.max(2) - im.min(2)
    lum = im @ np.array([0.299, 0.587, 0.114])
    gb = im[..., 1] - im[..., 2]
    M0 = ((c >= 29) & ((gb >= 16) | (c >= 90))) | (lum < 130)
    holes = ndi.binary_fill_holes(M0) & ~M0
    hl, hn = ndi.label(holes)
    for i, sz in enumerate(ndi.sum(holes, hl, range(1, hn + 1)), 1):
        if sz < 150:
            M0[hl == i] = True
    lab0, n0 = ndi.label(M0)
    for i, s in enumerate(ndi.sum(M0, lab0, range(1, n0 + 1)), 1):
        if s < 60:
            M0[lab0 == i] = False
    if a.list_components:
        lab, n = ndi.label(ndi.binary_dilation(M0, iterations=2))
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            area = int((lab[sl] == i).sum())
            if area >= 30:
                print(f"area {area:6d}  x {sl[1].start:4d}-{sl[1].stop:4d}  y {sl[0].start:4d}-{sl[0].stop:4d}")
        return
    S = ndi.binary_erosion(M0, iterations=3)
    Bg = ~ndi.binary_dilation(M0, iterations=3)
    _, iF = ndi.distance_transform_edt(~S, return_indices=True)
    _, iB = ndi.distance_transform_edt(~Bg, return_indices=True)
    F = im[iF[0], iF[1]]
    B = im[iB[0], iB[1]]
    d = F - B
    den = (d * d).sum(2) + 1e-6
    alpha = np.clip(((im - B) * d).sum(2) / den, 0, 1)
    alpha[S] = 1
    alpha[Bg] = 0
    alpha = np.clip((alpha - 0.10) / 0.90, 0, 1)
    Fd = np.clip(np.where(alpha[..., None] > 0.02, (im - (1 - alpha[..., None]) * B) / np.maximum(alpha[..., None], 0.02), F), 0, 255)
    col = np.where(S[..., None], im, np.where(alpha[..., None] > 0.02, 0.5 * Fd + 0.5 * F, F))
    rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
    lab, n = ndi.label(ndi.binary_dilation(M0, iterations=2))

    def comp_ids(box):
        x0, y0, x1, y1 = box
        x0, y0, x1, y1 = max(x0 - 6, 0), max(y0 - 6, 0), min(x1 + 6, W), min(y1 + 6, H)
        sub = lab[y0:y1, x0:x1]
        keep = []
        for i in np.unique(sub):
            if i > 0 and (sub == i).sum() / (lab == i).sum() > 0.8:
                keep.append(i)
        return keep

    os.makedirs(os.path.join(a.out, "cutouts"), exist_ok=True)
    os.makedirs(os.path.join(a.out, "cutouts-fx"), exist_ok=True)
    report = {"tool": "cutout-mascot.py", "version": TOOL_VERSION, "sheet": os.path.basename(a.sheet), "sheet_sha256": sha256(a.sheet), "files": {}}

    def save(arr, name, folder, pad):
        ys, xs = np.where(arr[..., 3] > 8)
        x0, x1, y0, y1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, W), max(ys.min() - pad, 0), min(ys.max() + pad + 1, H)
        img = Image.fromarray(arr[y0:y1, x0:x1], "RGBA")
        p = os.path.join(a.out, folder, name + ".png")
        img.save(p, optimize=True)
        report["files"][name] = {"folder": folder, "size": list(img.size), "sheet_box": [int(x0), int(y0), int(x1), int(y1)], "sha256": sha256(p)}

    for k, box in FIG.items():
        ids = comp_ids(box)
        keep = ndi.binary_dilation(np.isin(lab, ids), iterations=5)
        arr = rgba.copy()
        arr[..., 3] = np.where(keep, arr[..., 3], 0)
        save(arr, k, "cutouts", 6)
    # thin floating marks: alpha from a lightly blurred mask, colour decontaminated against the paper
    paper = np.array([249.0, 246.0, 240.0])
    for k, boxes in FX.items():
        reg = np.zeros((H, W), bool)
        for (x0, y0, x1, y1) in boxes:
            reg[max(y0 - 4, 0):y1 + 4, max(x0 - 4, 0):x1 + 4] = True
        m = reg & ((c >= 40) | (lum < 150))
        lm, nm = ndi.label(ndi.binary_dilation(m, iterations=1))
        for i in range(1, nm + 1):
            if (lm == i).sum() > 3000:
                m[lm == i] = False
        al = np.clip(ndi.gaussian_filter(m.astype(float), 0.9) * 1.15, 0, 1)
        colr = np.clip((im - (1 - al[..., None]) * paper) / np.maximum(al[..., None], 0.05), 0, 255)
        arr = np.dstack([np.where(al[..., None] > 0.05, colr, im), al * 255]).astype(np.uint8)
        save(arr, k, "cutouts-fx", 3)
    json.dump(report, open(os.path.join(a.out, "cutouts", "cutout-report.json"), "w"), indent=1)
    print("cut", len(FIG), "figures and", len(FX), "marks ->", a.out)


if __name__ == "__main__":
    main()
