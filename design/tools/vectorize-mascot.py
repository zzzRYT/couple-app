#!/usr/bin/env python3
"""
vectorize-mascot.py — auto-trace Mopi's harmonized raster poses into SVG (and PDF) with the VectorCraft command-line tool.

Input : design/mascot/harmonized/mascot_{pose}@3x.png   (the 11 poses, direction-A look of the supplied AI-generated master)
Output: design/mascot/vector/**  (SVG per pose, the app-icon face crop, PDFs, vector-report.json, preview/vector-vs-raster.png)

What it does (and does not do)
  * runs `vectorcraft-cli run --in <png> --cmd select.all --cmd imageTrace.makeAndExpand --params {"preset": ...} --export <svg>`
    (raster-to-vector tracing, nothing else); it never redraws, recolours or edits the character
  * post-processes the CLI's SVG only for names: <title>/<desc>, one named group per pose, consecutive paths of the same fill
    grouped as `<role>-<hex>` (e.g. outline-4a3426). Path data and fills are not touched, z-order is unchanged
  * checks every SVG (viewBox, no embedded raster, no scripts / external references, fills inside the mascot token palette),
    renders it with an independent renderer (resvg) and measures it against the raster
  * exports a PDF of the main pose, the icon face crop and the icon, and a PDF-compatible .ai of the main pose and the icon
    (through the same CLI, so they are vector too)

Requires: Python 3.9+, Pillow, NumPy, resvg-py (`pip install pillow numpy resvg-py`; use MASCOT_LIBS=/path/to/site-packages if not on
the default path), and the VectorCraft CLI. Get the CLI only from the project's official release page
(https://github.com/storytold/vectorcraft/releases, file vectorcraft-cli-<ver>-macos-universal.zip), verify it against
SHA256SUMS.txt of the same release and keep it OUTSIDE the repo. Poppler's `pdfimages` is used when installed (PDF has no raster).

Usage: python3 design/tools/vectorize-mascot.py --cli /path/to/vectorcraft-cli [--preset "16 Colors"] [--out design/mascot/vector]
       python3 design/tools/vectorize-mascot.py --cli ... --check-only      # re-verify the files that are already there
"""
import argparse, hashlib, io, json, os, re, shutil, subprocess, sys, tempfile
import xml.etree.ElementTree as ET

if os.environ.get('MASCOT_LIBS'):
    sys.path.insert(0, os.environ['MASCOT_LIBS'])
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DES = os.path.dirname(HERE)
ART = os.path.join(DES, 'mascot', 'harmonized')
TOKENS = os.path.join(DES, 'tokens.json')

POSES = ['wave_main', 'cheer', 'lookup', 'walk', 'lie', 'sleep', 'star_sit', 'box', 'heart', 'phone', 'back']
ROOM = {'wave_main', 'cheer', 'lookup', 'walk', 'lie', 'sleep'}
PRESET = '16 Colors'            # chosen by overlay comparison, see design/mascot/vector/README.md
EXPECT_VERSION = '0.17.0'
NS = 'http://www.w3.org/2000/svg'
PAPER = (0xFB, 0xF1, 0xE3)
ACCENT = '#B24A24'              # same ground as the recommended icon (design/icon, candidate B)

# icon B = place(art, k=0.66, head centre x=512, eye line y=490) in design/tools/make-icon.py; this is the same window as a crop
HEAD_CX, EYE_MID_Y, K, HX, FY = 1179, 648.5, 0.66, 512, 490
ICON_SIDE = round(1024 / K)                                  # 1552 px of the source art
ICON_X0 = round(HEAD_CX - HX / K)                            # 403
ICON_Y0 = round(EYE_MID_Y - FY / K)                          # -94 (the window starts above the art: transparent)

REGION_ROLE = {'몸통': 'body', '볼': 'cheek', '어깨띠': 'sash', '별 핀·별': 'star', '하트': 'heart', '상자': 'box', '휴대폰': 'phone'}


# ------------------------------------------------------------------ palette
def token_roles():
    """hex -> role name, from design/tokens.json (mascot.sampledPalette). The traced fills must all be in this set."""
    def find(d):
        if isinstance(d, dict):
            if 'sampledPalette' in d:
                return d
            for v in d.values():
                r = find(v)
                if r:
                    return r
        return None
    node = find(json.load(open(TOKENS, encoding='utf-8')))
    roles = {}
    for reg in node['sampledPalette']:
        name = reg['region']
        if name in REGION_ROLE:
            for i, h in enumerate(reg['harmonizedTones'], 1):
                roles[h.lower()] = f'{REGION_ROLE[name]}-{i}'
        elif name == '얼굴 선':
            roles[reg['harmonizedTones'][0].lower()] = 'face-line'
        elif name.startswith('윤곽선'):
            roles[reg['harmonizedTones'][0].lower()] = 'outline'
            roles[reg['harmonizedTones'][1].lower()] = 'rim'
    return roles


# ------------------------------------------------------------------ CLI
def cli_version(cli):
    out = subprocess.run([cli, '--version'], capture_output=True, text=True, check=True).stdout.strip()
    return out.split()[-1]


def trace(cli, png, svg, preset):
    cmd = [cli, 'run', '--in', png, '--cmd', 'select.all', '--cmd', 'imageTrace.makeAndExpand',
           '--params', json.dumps({'preset': preset}), '--export', svg]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit(f'vectorcraft-cli failed on {png}:\n{p.stdout}\n{p.stderr}')
    info = None
    for line in p.stdout.splitlines():
        j = json.loads(line)
        if j.get('command') == 'imageTrace.makeAndExpand':
            info = j['result']
    if info is None:
        sys.exit(f'no trace result for {png}')
    return info


def convert(cli, src, dst):
    p = subprocess.run([cli, 'convert', src, dst], capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit(f'vectorcraft-cli convert failed: {p.stdout}{p.stderr}')


# ------------------------------------------------------------------ SVG clean-up (names only)
def tidy(raw_svg, pose_id, title, desc, roles):
    root = ET.fromstring(raw_svg)
    paths = [(e.get('d'), e.get('fill').lower()) for e in root.iter('{%s}path' % NS)]
    ET.register_namespace('', NS)
    out = ET.Element('{%s}svg' % NS, {'width': root.get('width'), 'height': root.get('height'), 'viewBox': root.get('viewBox')})
    ET.SubElement(out, '{%s}title' % NS).text = title
    ET.SubElement(out, '{%s}desc' % NS).text = desc
    top = ET.SubElement(out, '{%s}g' % NS, {'id': pose_id})
    run, cur = None, None
    for d, fill in paths:
        if fill != cur:
            role = roles.get(fill, 'color')
            run = ET.SubElement(top, '{%s}g' % NS, {'id': f'{pose_id}-{role}-{fill[1:]}'})
            cur = fill
        ET.SubElement(run, '{%s}path' % NS, {'d': d, 'fill': fill})
    ET.indent(out, space='  ')
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(out, encoding='unicode') + '\n'


def inner(svg_text):
    """the <g> content of a tidy() SVG, to embed in another SVG"""
    root = ET.fromstring(svg_text)
    g = root.find('{%s}g' % NS)
    return ET.tostring(g, encoding='unicode').replace(' xmlns="%s"' % NS, '')


# ------------------------------------------------------------------ checks
def check_svg(path, roles):
    s = open(path, encoding='utf-8').read()
    problems = []
    root = ET.fromstring(s)
    vb = (root.get('viewBox') or '').split()
    if len(vb) != 4 or float(vb[2]) <= 0 or float(vb[3]) <= 0:
        problems.append('no usable viewBox')
    tags = {e.tag.split('}')[-1] for e in root.iter()}
    for bad in ('image', 'script', 'foreignObject', 'style', 'use', 'a', 'filter', 'mask', 'clipPath', 'pattern', 'symbol'):
        if bad in tags:
            problems.append(f'<{bad}> present')
    if re.search(r'(?i)xlink:href|\shref=|url\(|data:|javascript:|\bon[a-z]+=', s):
        problems.append('reference / data URI / event handler present')
    urls = re.findall(r'https?://[^"\s<]+', s)
    if [u for u in urls if u != NS]:
        problems.append('external URL: ' + ', '.join(u for u in urls if u != NS))
    fills = {e.get('fill').lower() for e in root.iter('{%s}path' % NS)}
    off = sorted(f for f in fills if f != ACCENT.lower() and f not in roles)
    if off:
        problems.append('fills outside the token palette: ' + ' '.join(off))
    npaths = len(list(root.iter('{%s}path' % NS)))
    if npaths == 0:
        problems.append('no <path>')
    return dict(viewBox=' '.join(vb), paths=npaths, colors=len(fills), bytes=len(s.encode()), problems=problems, fills=sorted(fills))


def render(svg_path, w, h):
    import resvg_py
    png = resvg_py.svg_to_bytes(svg_path=svg_path, width=w, height=h)
    return Image.open(io.BytesIO(bytes(png))).convert('RGBA')


def over(im, bg=PAPER):
    base = Image.new('RGBA', im.size, bg + (255,))
    base.alpha_composite(im)
    return base.convert('RGB')


def measure(svg_path, ref):
    """vector (rendered by resvg at the raster's size) vs the raster: silhouette IoU and colour difference over paper"""
    w, h = ref.size
    v = render(svg_path, w, h)
    ra = np.asarray(ref)[..., 3] > 127
    va = np.asarray(v)[..., 3] > 127
    iou = float((ra & va).sum()) / float((ra | va).sum())
    d = np.abs(np.asarray(over(ref)).astype(int) - np.asarray(over(v)).astype(int)).max(axis=2)
    cov = ra | va
    return dict(iou=round(iou, 4), mean_abs_diff=round(float(d[cov].mean()), 2), pct_pixels_off_by_more_than_48=round(float((d[cov] > 48).mean() * 100), 2)), d, v


def raster_palette(ref):
    a = np.asarray(ref)
    opaque = a[..., 3] == 255
    return {'#%02x%02x%02x' % tuple(c) for c in np.unique(a[opaque][:, :3], axis=0)}


# ------------------------------------------------------------------ preview sheet
def font(size):
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def fit(im, w, h):
    s = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def sheet(out_dir, report, icon_files):
    INK, MUTE = (63, 45, 34), (138, 107, 85)
    cw, ch = 270, 250
    cols, gap = 3, 18
    W = cols * (2 * cw + gap) + (cols + 1) * gap
    rows = (len(POSES) + cols - 1) // cols
    top = 56
    H1 = top + rows * (ch + 52 + gap)
    # section B (zoom) and C (1024 / 29 px)
    ref_main = Image.open(os.path.join(ART, 'mascot_wave_main@3x.png')).convert('RGBA')
    mw, mh = ref_main.size
    box = (1000, 520, 1440, 780)              # eye + mouth area of the main pose, 440x260 source px
    zoom = 2
    H2 = 40 + (box[3] - box[1]) * zoom + 60
    H3 = 40 + 1024 * mh // mw + 60
    img = Image.new('RGB', (W, H1 + H2 + H3 + 60), PAPER)
    d = ImageDraw.Draw(img)
    d.text((gap, 14), 'Mopi - raster (left) vs auto-traced vector (right), rendered by resvg; vector is not redrawn', fill=INK, font=font(20))
    for i, p in enumerate(POSES):
        r, c = divmod(i, cols)
        x = gap + c * (2 * cw + 2 * gap)
        y = top + r * (ch + 52 + gap)
        ref = Image.open(os.path.join(ART, f'mascot_{p}@3x.png')).convert('RGBA')
        vec = render(os.path.join(out_dir, f'mascot_{p}.svg'), *ref.size)
        for j, im in enumerate((ref, vec)):
            t = fit(over(im), cw, ch)
            img.paste(t, (x + j * (cw + gap // 2) + (cw - t.width) // 2, y + (ch - t.height) // 2))
        rp = report['poses'][p]
        d.text((x, y + ch + 4), f"{p}{' (room)' if p in ROOM else ''}", fill=INK, font=font(15))
        d.text((x, y + ch + 24), f"{rp['paths']} paths · {rp['colors']} colours · {rp['bytes'] // 1024} KB · mean diff {rp['mean_abs_diff']}",
               fill=MUTE, font=font(13))
    # B: zoom
    y0 = H1
    d.text((gap, y0 + 6), f'Zoom x{zoom} on the main pose (eye + mouth): raster upscaled (bicubic) | vector rendered at that size', fill=INK, font=font(17))
    crop = ref_main.crop(box)
    ras = over(crop).resize((crop.width * zoom, crop.height * zoom), Image.BICUBIC)
    vfull = render(os.path.join(out_dir, 'mascot_wave_main.svg'), mw * zoom, mh * zoom)
    vec = over(vfull.crop(tuple(v * zoom for v in box)))
    img.paste(ras, (gap, y0 + 40))
    img.paste(vec, (gap + ras.width + gap, y0 + 40))
    # C: 1024 and 29 px
    y1 = y0 + H2
    d.text((gap, y1 + 6), 'Vector rendered at 1024 px wide', fill=INK, font=font(17))
    big = over(render(os.path.join(out_dir, 'mascot_wave_main.svg'), 1024, 1024 * mh // mw))
    img.paste(big, (gap, y1 + 40))
    x2 = gap + 1024 + 2 * gap
    d.text((x2, y1 + 6), 'At 29 px high (actual size, then x6): raster downscale | vector', fill=INK, font=font(17))
    s29 = 29
    rs = over(ref_main.resize((round(mw * s29 / mh), s29), Image.LANCZOS))
    vs = over(render(os.path.join(out_dir, 'mascot_wave_main.svg'), round(mw * s29 / mh), s29))
    img.paste(rs, (x2, y1 + 40)); img.paste(vs, (x2 + rs.width + 12, y1 + 40))
    ys = y1 + 40 + s29 + 16
    img.paste(rs.resize((rs.width * 6, rs.height * 6), Image.NEAREST), (x2, ys))
    img.paste(vs.resize((vs.width * 6, vs.height * 6), Image.NEAREST), (x2 + rs.width * 6 + 12, ys))
    # icon face tile
    yi = ys + vs.height * 6 + 24
    d.text((x2, yi), 'App-icon face (vector, on the icon B ground)', fill=INK, font=font(17))
    ic = over(render(os.path.join(out_dir, icon_files['icon']), 360, 360))
    img.paste(ic, (x2, yi + 28))
    img.save(os.path.join(out_dir, 'preview', 'vector-vs-raster.png'), optimize=True)


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--cli', default=os.environ.get('VECTORCRAFT_CLI'), help='path to vectorcraft-cli (or env VECTORCRAFT_CLI)')
    ap.add_argument('--preset', default=PRESET)
    ap.add_argument('--out', default=os.path.join(DES, 'mascot', 'vector'))
    ap.add_argument('--check-only', action='store_true', help='do not trace; verify the files already in --out')
    a = ap.parse_args()
    if not a.cli or not os.path.isfile(a.cli):
        sys.exit('give the VectorCraft CLI with --cli (see the header of this file for where to get it)')
    out = a.out
    os.makedirs(os.path.join(out, 'preview'), exist_ok=True)
    version = cli_version(a.cli)
    if version != EXPECT_VERSION:
        print(f'warning: tested with vectorcraft-cli {EXPECT_VERSION}, this is {version}; results may differ', file=sys.stderr)
    roles = token_roles()
    desc = ('Auto-traced from design/mascot/harmonized (raster) with VectorCraft ' + version + ' preset "' + a.preset + '". '
            'Not redrawn. Derived from the AI-generated mascot master; same rights status as the mascot.')
    report = dict(tool='vectorize-mascot.py', vectorcraft_cli=version, preset=a.preset, poses={}, icon={}, pdf={}, problems=[])
    icon_files = dict(face='icon_face.svg', icon='icon_B_1024.svg')

    tmp = tempfile.mkdtemp(prefix='mopi-vec-')
    try:
        if not a.check_only:
            for p in POSES:
                raw = os.path.join(tmp, f'{p}.svg')
                info = trace(a.cli, os.path.join(ART, f'mascot_{p}@3x.png'), raw, a.preset)
                text = tidy(open(raw, encoding='utf-8').read(), f'mopi-{p}', f'Mopi - {p} (traced vector)', desc, roles)
                open(os.path.join(out, f'mascot_{p}.svg'), 'w', encoding='utf-8').write(text)
                report['poses'][p] = dict(anchors=info['anchors'], trace_warnings=info.get('warnings', []))
            # icon face crop (the same window as icon B, built from the main pose; the window starts above the art)
            src = Image.open(os.path.join(ART, 'mascot_wave_main@3x.png')).convert('RGBA')
            crop = src.crop((ICON_X0, ICON_Y0, ICON_X0 + ICON_SIDE, ICON_Y0 + ICON_SIDE))
            cpng = os.path.join(tmp, 'icon_face.png')
            crop.save(cpng)
            raw = os.path.join(tmp, 'icon_face.svg')
            info = trace(a.cli, cpng, raw, a.preset)
            face = tidy(open(raw, encoding='utf-8').read(), 'mopi-icon-face', 'Mopi - app icon face (traced vector)', desc, roles)
            open(os.path.join(out, icon_files['face']), 'w', encoding='utf-8').write(face)
            report['icon']['face'] = dict(anchors=info['anchors'], window=[ICON_X0, ICON_Y0, ICON_SIDE, ICON_SIDE])
            # icon B: ground colour + the face, 1024 x 1024, no rounded corners, no alpha needed
            s = 1024 / ICON_SIDE
            icon = ('<?xml version="1.0" encoding="UTF-8"?>\n'
                    '<svg xmlns="%s" width="1024" height="1024" viewBox="0 0 1024 1024">\n'
                    '  <title>Mopi - app icon B (traced vector)</title>\n  <desc>%s</desc>\n'
                    '  <rect id="ground" width="1024" height="1024" fill="%s"/>\n'
                    '  <g id="face" transform="scale(%.6f)">\n%s\n  </g>\n</svg>\n') % (NS, desc, ACCENT, s, inner(face))
            open(os.path.join(out, icon_files['icon']), 'w', encoding='utf-8').write(icon)
            # PDF and PDF-compatible .ai through the same CLI (vector, no embedded image)
            for name, dst in (('mascot_wave_main.svg', 'mascot_wave_main.pdf'), (icon_files['face'], 'icon_face.pdf'), (icon_files['icon'], 'icon_B_1024.pdf'),
                              ('mascot_wave_main.svg', 'mascot_wave_main.ai'), (icon_files['icon'], 'icon_B_1024.ai')):
                convert(a.cli, os.path.join(out, name), os.path.join(out, dst))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    # --- verification of whatever is in `out`
    try:
        import resvg_py  # noqa: F401
        have_resvg = True
    except ImportError:
        have_resvg = False
        print('warning: resvg-py not installed, skipping the independent render check and the preview sheet', file=sys.stderr)
    for p in POSES:
        path = os.path.join(out, f'mascot_{p}.svg')
        r = report['poses'].setdefault(p, {})
        r.update(check_svg(path, roles))
        ref = Image.open(os.path.join(ART, f'mascot_{p}@3x.png')).convert('RGBA')
        pal = raster_palette(ref)
        r['raster_colors'] = len(pal)
        r['raster_colors_not_in_svg'] = sorted(pal - set(r['fills']))
        if have_resvg:
            m, _, _ = measure(path, ref)
            r.update(m)
        r['sha256'] = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:16]
        for pr in r['problems']:
            report['problems'].append(f'{p}: {pr}')
    for key, name in icon_files.items():
        path = os.path.join(out, name)
        c = check_svg(path, roles)
        c.pop('fills')
        report['icon'].setdefault(key, {}).update(c)
        for pr in c['problems']:
            report['problems'].append(f'{name}: {pr}')
    for name in ('mascot_wave_main.pdf', 'icon_face.pdf', 'icon_B_1024.pdf', 'mascot_wave_main.ai', 'icon_B_1024.ai'):   # .ai = PDF-compatible Illustrator file
        path = os.path.join(out, name)
        entry = dict(bytes=os.path.getsize(path), header=open(path, 'rb').read(5).decode('latin1'))
        if shutil.which('pdfimages'):
            lines = subprocess.run(['pdfimages', '-list', path], capture_output=True, text=True).stdout.strip().splitlines()
            entry['embedded_images'] = max(0, len(lines) - 2)
            if entry['embedded_images']:
                report['problems'].append(f'{name}: {entry["embedded_images"]} embedded image(s)')
        report['pdf'][name] = entry
    if have_resvg and not a.check_only:
        sheet(out, report, icon_files)
    if not a.check_only:                      # --check-only only verifies and prints; it never rewrites the report
        json.dump(report, open(os.path.join(out, 'vector-report.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(json.dumps({k: v for k, v in report.items() if k != 'poses'}, indent=1, ensure_ascii=False))
    for p in POSES:
        r = report['poses'][p]
        print(p, {k: r.get(k) for k in ('paths', 'colors', 'bytes', 'iou', 'mean_abs_diff', 'pct_pixels_off_by_more_than_48')})
    if report['problems']:
        sys.exit('PROBLEMS: ' + '; '.join(report['problems']))


if __name__ == '__main__':
    main()
