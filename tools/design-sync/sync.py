#!/usr/bin/env python3
"""Sync a complete Claude Design export into a temporary candidate, then publish it."""
import argparse
import datetime
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ARTIFACT = 'https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X'
LANGS = ('ko', 'en', 'ja')
ROOT = Path(__file__).resolve().parents[2]
V0_COPY = Path('specs/002-couple-dday-v0/handoffs/design/copy-v0.md')
# The boards note status in Korean: in a key cell such as "(제안 · 오너 승인 필요)", or in a 상태 column such as "재사용 · 기존 키 auth.apple".
STATUS_WORDS = (('제안', 'proposal'), ('변경', 'changed'), ('바뀐', 'changed'), ('신규', 'new'), ('새 키', 'new'), ('재사용', 'approved'))

def board_status(text):
    plain = text.strip().lower()
    return next((status for word, status in STATUS_WORDS if word in plain), plain)

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self.table = None
        self.row = None
        self.cell = None
        self.text = []
        self.paragraphs = []
        self.paragraph = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'p': self.paragraph = ''
        if tag == 'table':
            if self.table is not None: raise ValueError('Nested tables are unsupported')
            self.table = []
        elif tag == 'tr' and self.table is not None:
            self.row = {'cells': [], 'status': attrs.get('data-status', '')}
        elif tag in ('td', 'th') and self.row is not None:
            self.cell = {'tag': tag, 'lang': attrs.get('lang', ''), 'text': '', 'status': attrs.get('data-status', '')}
        elif tag == 'br' and self.cell is not None: self.cell['text'] += '\n'
    def handle_endtag(self, tag):
        if tag == 'p' and self.paragraph is not None:
            self.paragraphs.append(self.paragraph); self.paragraph = None
        if tag in ('td', 'th') and self.cell is not None:
            self.cell['text'] = self.cell['text'].strip()
            self.row['cells'].append(self.cell); self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.table.append(self.row); self.row = None
        elif tag == 'table' and self.table is not None:
            self.tables.append(self.table); self.table = None
    def handle_data(self, data):
        self.text.append(data)
        if self.paragraph is not None: self.paragraph += data
        if self.cell is not None: self.cell['text'] += data


def parse_board(source, name, same_placeholders=True):
    parser = Tables(); parser.feed(source); parser.close()
    # Preserve each language's review status from the board, rather than inferring approval.
    lines = next((p for p in parser.paragraphs if re.search(r'\bKO\s*:', p, re.I) and re.search(r'\bEN\s*:', p, re.I) and re.search(r'\bJA\s*:', p, re.I)), '')
    statuses = {}
    for lang in LANGS:
        m = re.search(rf'\b{lang.upper()}\s*:\s*([^·\n]+)', lines, re.I)
        if not m: raise ValueError(f'{name}: missing {lang} status line')
        statuses[lang] = m.group(1).strip()
    entries = []
    for table in parser.tables:
        header = None
        for row in table:
            cells = row['cells']
            if not cells: continue
            if all(c['tag'] == 'th' for c in cells):
                header = [c['text'].strip().lower() for c in cells]
                continue
            if all(c['tag'] != 'td' for c in cells): continue
            if header is None: raise ValueError(f'{name}: table lacks header')
            if len(cells) != len(header): raise ValueError(f'{name}: malformed row or missing language')
            aliases = {'key':'key', '키':'key', 'ko':'ko', '한국어':'ko', 'en':'en', 'english':'en', 'ja':'ja', '日本語':'ja', 'status':'status', '상태':'status'}
            columns = [aliases.get(h, '') for h in header]
            if not all(k in columns for k in ('key', *LANGS)): raise ValueError(f'{name}: unsupported table columns {header}')
            item = {k: cells[columns.index(k)]['text'] for k in ('key', *LANGS)}
            item['key'], _, note = item['key'].partition('\n')
            item['note'] = (cells[columns.index('status')]['text'] if 'status' in columns else row['status'] or cells[0]['status'] or note).strip()
            item['status'] = board_status(item['note'] or 'approved')
            if not re.fullmatch(r'[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+', item['key']): raise ValueError(f'{name}: invalid key {item["key"]!r}')
            if item['status'] not in ('approved', 'new', 'changed', 'proposal'): raise ValueError(f'{name}: unknown key status {item["status"]!r}')
            if any(not item[l] for l in LANGS): raise ValueError(f'{name}: missing translation for {item["key"]}')
            variables = lambda value: sorted(re.findall(r'\{(\w+)\}', value))
            if same_placeholders and any(variables(item[l]) != variables(item['ko']) for l in LANGS): raise ValueError(f'{name}: placeholder mismatch for {item["key"]}')
            # A "(바뀐 문구 · 같은 키를 대신해요)" row replaces the earlier row of the same key on this board.
            if '대신' in item['note']: entries = [e for e in entries if e['key'] != item['key']]
            entries.append(item)
    if not parser.tables: raise ValueError(f'{name}: no copy table')
    return statuses, entries


def load_export(project, target):
    canvas = json.loads((project/'canvas.json').read_text())
    boards = canvas.get('boards'); pages = canvas.get('pages')
    if not isinstance(boards, dict) or not isinstance(pages, list): raise ValueError('canvas.json needs boards and pages')
    for name in boards:
        if Path(name).name != name or not name.endswith('.dc.html'): raise ValueError(f'Invalid board name: {name}')
        if not (project/name).is_file(): raise ValueError(f'Export missing board: {name}')
    extra = {p.name for p in project.glob('*.dc.html')} - set(boards)
    if extra: raise ValueError(f'Boards missing from canvas index: {sorted(extra)}')
    copy = [n for n in boards if n.startswith('copy-') and not n.startswith('copy-v0-')]
    if not copy: raise ValueError('Export contains no copy boards')
    allkeys = {}; locations = {}; locale_status = {}
    known = {p.name for p in (target/'design/pages').iterdir() if p.is_dir()} | {p.get('id', '') for p in pages}
    for name in copy:
        stem = name[len('copy-'):-len('.dc.html')]
        if re.fullmatch(r'common-\d+', stem): dest = 'common/copy'
        else:
            candidates = sorted((x for x in known if stem.startswith(x+'-')), key=len, reverse=True)
            if not candidates: raise ValueError(f'{name}: cannot determine feature')
            feature = candidates[0]; page = stem[len(feature)+1:]
            if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', page): raise ValueError(f'{name}: invalid page')
            dest = f'{feature}/copy' if page == 'shared' else f'{feature}/{page}/copy'
        statuses, entries = parse_board((project/name).read_text(), name)
        if dest in locale_status and locale_status[dest] != statuses: raise ValueError(f'{name}: conflicting language statuses for {dest}')
        locale_status[dest] = statuses
        for item in entries:
            key = item['key']
            if key in allkeys: raise ValueError(f'Duplicate key {key}: {locations[key]} and {name}')
            allkeys[key] = item; locations[key] = name
        locale_status.setdefault(dest, statuses)
        yield name, dest, statuses, entries


def v0_sections(project):
    """The copy-v0-* boards feed the V0 overlay, not design/pages. A key may repeat across them only with identical text."""
    canvas = json.loads((project/'canvas.json').read_text())
    sections = []; seen = {}
    for name, meta in sorted(canvas['boards'].items(), key=lambda item: item[1].get('title', item[0])):
        if not name.startswith('copy-v0-'): continue
        # Date formats differ per language on purpose (`{M}` is a month name in English), so these boards skip the placeholder check.
        _, entries = parse_board((project/name).read_text(), name, same_placeholders=False)
        rows = []
        # Proposals wait for the owner, so the app does not ship them (design/README.md).
        for item in (e for e in entries if e['status'] != 'proposal'):
            text = tuple(item[l] for l in LANGS)
            if seen.setdefault(item['key'], text) != text: raise ValueError(f'{name}: conflicting V0 copy for {item["key"]}')
            if not any(r['key'] == item['key'] for _, _, other in sections for r in other) and not any(r['key'] == item['key'] for r in rows): rows.append(item)
        sections.append((meta.get('title', name).removeprefix('문구 · '), name, rows))
    return sections


def render_v0_copy(sections, previous, version):
    cell = lambda value: value.replace('|', '\\|').replace('\n', '⏎')
    header = re.sub(r'\(version `[^`]+`\)', f'(version `{version}`)', previous[:previous.index('## ')])
    parts = [header.rstrip()+'\n']
    for title, name, rows in sections:
        parts.append(f'\n## {title} (`{name}`)\nsections: 이 화면의 문구\n\n| key | ko | en | ja | status |\n|---|---|---|---|---|\n')
        parts.extend(f'| `{r["key"]}` | {cell(r["ko"])} | {cell(r["en"])} | {cell(r["ja"])} | {cell(r["note"])} |\n' for r in rows)
    return ''.join(parts)


def snapshot(root):
    result = {}
    for path in (root/'design/pages').rglob('ko.json'):
        if path.parent.name != 'copy': continue
        copies = {l: json.loads((path.parent/f'{l}.json').read_text()) for l in LANGS}
        for key in copies['ko']['strings']:
            if key in result: raise ValueError(f'existing duplicate key: {key}')
            result[key] = tuple(copies[l]['strings'][key] for l in LANGS) + (copies['ko'].get('keyStatus', {}).get(key, 'approved'),)
    return result


def generate_indexes(root, canvas):
    pagesroot = root/'design/pages'
    page_ids = {p['id']: p.get('name', p['id']) for p in canvas['pages']}
    # Retain independent unit specs; the inventory always lists the actual exported board titles.
    index = ['# 디자인 검토 순서', '', '아티팩트 순서와 보드 제목 기준입니다. 페이지 상세 문서는 미러입니다.', '']
    inventory = ['# 아티팩트 보드 목록', '', '| 아티팩트 페이지 | 보드 | 제목 |', '|---|---|---|']
    for pid, title in page_ids.items():
        index += [f'## {title} ({pid})', '']
        feature = pagesroot/pid
        if feature.is_dir() and (feature/'feature.md').exists():
            index.append(f'- [기능 검토]({pid}/review.html)')
            for spec in sorted(feature.glob('*/page.md')):
                heading = spec.read_text().splitlines()[0].removeprefix('# ')
                index.append(f'- [{heading}]({pid}/{spec.parent.name}/review.html)')
        for board, meta in canvas['boards'].items():
            if meta.get('page') != pid: continue
            label = meta.get('title', board).replace('|', '\\|')
            link = f'../canvas/project/{board}'
            index.append(f'- [{label}]({link})')
            inventory.append(f'| {title} | [{board}]({link}) | {label} |')
        index.append('')
    (pagesroot/'index.md').write_text('\n'.join(index).rstrip()+'\n')
    (pagesroot/'inventory.md').write_text('\n'.join(inventory)+'\n')


def prepare(project, version, target=ROOT):
    if not version.strip() or '\n' in version: raise ValueError('Version must be a nonempty single line')
    project = Path(project).resolve(); target = Path(target).resolve()
    boards = list(load_export(project, target))
    old = snapshot(target)
    new = {x['key']: tuple(x[l] for l in LANGS)+(x['status'],) for _, _, _, entries in boards for x in entries}
    for label, keys in [('added', new.keys()-old.keys()), ('changed', {k for k in new.keys() & old.keys() if new[k] != old[k]}), ('removed', old.keys()-new.keys()), ('proposal (not imported)', {k for k in new if new[k][3] == 'proposal'})]:
        print(f'{label}: {len(keys)}', flush=True)
        for key in sorted(keys): print(f'  {key}', flush=True)
    return boards


def sync(project, version):
    boards = prepare(project, version)
    project = Path(project).resolve()
    with tempfile.TemporaryDirectory(prefix='aroom-design-sync-') as temp:
        candidate = Path(temp)
        shutil.copytree(ROOT/'design', candidate/'design')
        shutil.copytree(ROOT/'apps/mobile/src', candidate/'apps/mobile/src')
        (candidate/'tools/i18n').mkdir(parents=True)
        shutil.copyfile(ROOT/'tools/i18n/build-v0-overlay.mjs', candidate/'tools/i18n/build-v0-overlay.mjs')
        (candidate/V0_COPY).parent.mkdir(parents=True)
        shutil.copyfile(ROOT/V0_COPY, candidate/V0_COPY)
        sections = v0_sections(project)
        if sections:
            rendered = render_v0_copy(sections, (ROOT/V0_COPY).read_text(), version)
            (candidate/V0_COPY).write_text(rendered)
            (candidate/'apps/mobile/src/i18n/locales/v0/copy-v0.md').write_text(rendered)
            subprocess.run(['node', 'tools/i18n/build-v0-overlay.mjs'], cwd=candidate, check=True)
        pages = candidate/'design/pages'
        for path in pages.rglob('copy'):
            if path.is_dir():
                for lang in LANGS: (path/f'{lang}.json').unlink(missing_ok=True)
        by_dest = {}
        for _, dest, statuses, entries in boards:
            group = by_dest.setdefault(dest, {'statuses': statuses, 'entries': []}); group['entries'].extend(entries)
        for dest, group in by_dest.items():
            folder = pages/dest; folder.mkdir(parents=True, exist_ok=True)
            unit = folder.parent
            if unit.parent != pages and unit.name != 'common' and unit.parent.name != 'pages':
                spec = unit/'page.md'
                if not spec.exists():
                    spec.write_text(f'# {unit.name}\n\n승인자: 미승인\n승인일: 미정\n\nTODO: 아티팩트 보드의 상태와 흐름을 검토하세요.\n')
                feature = unit.parent/'feature.md'
                if not feature.exists(): feature.write_text(f'# {unit.parent.name}\n\n승인자: 미승인\n승인일: 미정\n')
                content = feature.read_text()
                link = f'({unit.name}/page.md)'
                if link not in content: feature.write_text(content + f'\n- [{unit.name}]{link}\n')
            for lang in LANGS:
                obj = {'status': group['statuses'][lang], 'generated': f'Artifact {version}; do not edit', 'keyStatus': {e['key']: e['status'] for e in group['entries']}, 'strings': {e['key']: e[lang] for e in group['entries']}}
                (folder/f'{lang}.json').write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
        # Existing owners without a board get empty copy files so stale keys are removed.
        for spec in pages.glob('*/*/page.md'):
            (spec.parent/'copy').mkdir(exist_ok=True)
        for folder in pages.rglob('copy'):
            if not folder.is_dir(): continue
            for lang in LANGS:
                path = folder/f'{lang}.json'
                if not path.exists(): path.write_text(json.dumps({'status': 'no copy board', 'generated': f'Artifact {version}; do not edit', 'keyStatus': {}, 'strings': {}}, ensure_ascii=False, indent=2)+'\n')
        all_keys = {e['key'] for _, _, _, entries in boards for e in entries}
        for spec in pages.glob('*/*/page.md'):
            keyfile = spec.parent/'copy-keys.json'
            old_keys = json.loads(keyfile.read_text()) if keyfile.exists() else []
            owned = json.loads((spec.parent/'copy/ko.json').read_text())['strings']
            keyfile.write_text(json.dumps(sorted((set(old_keys) & all_keys) | set(owned)), ensure_ascii=False, indent=2)+'\n')
        canvas = json.loads((project/'canvas.json').read_text())
        dest = candidate/'design/canvas/project'; shutil.rmtree(dest); dest.mkdir(parents=True)
        shutil.copyfile(project/'canvas.json', dest/'canvas.json')
        for name in canvas['boards']: shutil.copyfile(project/name, dest/name)
        generate_indexes(candidate, canvas)
        date = datetime.date.today().isoformat()
        (candidate/'design/ARTIFACT.md').write_text(f'# 디자인 아티팩트\n\n정본: {ARTIFACT}\n\n버전: {version}\n\n동기화 날짜: {date}\n\n이 디렉터리는 아티팩트의 미러이며 아티팩트가 정본입니다. copy 파일은 생성된 파일이므로 편집하지 마세요.\n')
        for script in ('import-design-copy.mjs', 'check-design-copy.mjs', 'generate-design-review.mjs'):
            subprocess.run(['node', str(ROOT/'tools/i18n'/script)], cwd=candidate, check=True)
        # Publish only after the complete candidate passes the consistency check.
        for rel in ('design/pages', 'design/canvas/project', 'design/ARTIFACT.md', 'apps/mobile/src/i18n/locales', 'apps/mobile/src/i18n/keys.d.ts', 'apps/mobile/src/i18n/v0Keys.d.ts', V0_COPY):
            source = candidate/rel; dest = ROOT/rel
            if dest.is_dir(): shutil.rmtree(dest)
            elif dest.exists(): dest.unlink()
            if source.is_dir(): shutil.copytree(source, dest)
            else: shutil.copyfile(source, dest)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--from', dest='project', required=True); parser.add_argument('--version', required=True)
    args = parser.parse_args()
    try: sync(args.project, args.version)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc: parser.exit(1, f'design-sync: {exc}\n')

if __name__ == '__main__': main()
