import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('design_sync', HERE/'sync.py')
sync = importlib.util.module_from_spec(spec); spec.loader.exec_module(sync)
FIXTURE = (HERE/'fixtures/copy-auth-login.dc.html').read_text()

class SyncTests(unittest.TestCase):
    def test_original_export_fixture(self):
        fixture = (HERE/'fixtures/exported-login-row.dc.html').read_text()
        status, rows = sync.parse_board(fixture, 'exported-login-row')
        self.assertEqual(status['ko'], '원본')
        self.assertEqual(rows[0]['key'], 'login.redirect.title')
        self.assertEqual(rows[0]['en'], 'Opening Kakao')
    def test_export_format_and_proposal(self):
        status, rows = sync.parse_board(FIXTURE, 'fixture')
        self.assertIn('초안', status['en'])
        self.assertEqual(rows[0]['key'], 'login.quick.title')
        self.assertEqual(rows[1]['status'], 'proposal')
        self.assertIn('{email}', rows[1]['ja'])
    def test_old_export_table_shape_and_html_entities(self):
        fixture = FIXTURE.replace('<th>상태</th>', '').replace('<td>new</td>', '').replace('<td>proposal</td>', '').replace('Enter with a test account', 'You&#x27;ll enter')
        _, rows = sync.parse_board(fixture, 'fixture')
        self.assertEqual(rows[0]['en'], "DEV · You'll enter")
        self.assertEqual(rows[1]['status'], 'approved')
    def test_korean_status_notes_and_replacement_rows(self):
        row = lambda key, ko: f'<tr><td>{key}</td><td lang="ko">{ko}</td><td lang="en">e</td><td lang="ja">j</td></tr>'
        table = '<p>KO: 원본 · EN: 초안 · JA: 초안</p><table><tr><th>키</th><th>한국어</th><th>English</th><th>日本語</th></tr>' + row('a.old', '옛') + row('a.old<br>(바뀐 문구 · 같은 키를 대신해요)', '새') + row('a.new<br>(새 키 · 제안 · 오너 승인 필요)', '안') + row('a.fresh<br>(새 키)', '신') + '</table>'
        _, rows = sync.parse_board(table, 'notes')
        self.assertEqual([(r['key'], r['status'], r['ko']) for r in rows], [('a.old', 'changed', '새'), ('a.new', 'proposal', '안'), ('a.fresh', 'new', '신')])
    def test_v0_boards_render_the_overlay_extract(self):
        with tempfile.TemporaryDirectory() as temp:
            project=Path(temp)
            head='<p>KO: 원본 · EN: 초안 · JA: 초안</p><table><tr><th>키</th><th>한국어</th><th>English</th><th>日本語</th><th>상태</th></tr>'
            (project/'copy-v0-a.dc.html').write_text(head+'<tr><td>x.one</td><td>하나<br>둘</td><td>a|b</td><td>j</td><td>신규 · EN·JA 초안</td></tr></table>')
            (project/'copy-v0-b.dc.html').write_text(head+'<tr><td>x.one</td><td>하나<br>둘</td><td>a|b</td><td>j</td><td>재사용 · 기존 키 x.one</td></tr><tr><td>x.two</td><td>{y}</td><td>{M}</td><td>{y}</td><td>신규</td></tr></table>')
            (project/'canvas.json').write_text(json.dumps({'pages':[], 'boards':{'copy-v0-b.dc.html':{'title':'문구 · V0-02 B'}, 'copy-v0-a.dc.html':{'title':'문구 · V0-01 A'}}}))
            sections=sync.v0_sections(project)
            self.assertEqual([(t, [r['key'] for r in rows]) for t, _, rows in sections], [('V0-01 A', ['x.one']), ('V0-02 B', ['x.two'])])
            text=sync.render_v0_copy(sections, 'intro (version `old`)\n\n## old\n', 'new')
            self.assertIn('intro (version `new`)', text)
            self.assertIn('| `x.one` | 하나⏎둘 | a\\|b | j | 신규 · EN·JA 초안 |', text)
            (project/'copy-v0-b.dc.html').write_text(head+'<tr><td>x.one</td><td>다름</td><td>a|b</td><td>j</td><td>신규</td></tr></table>')
            with self.assertRaisesRegex(ValueError, 'conflicting V0 copy'): sync.v0_sections(project)
    def test_rejects_missing_and_placeholder_mismatch(self):
        for broken in (FIXTURE.replace('DEV · テストアカウントでログイン', ''), FIXTURE.replace('{email}に送った', '{wrong}に送った')):
            with self.assertRaises(ValueError): sync.parse_board(broken, 'broken')
    def test_duplicate_and_incomplete_export_rejected_before_write(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); project=root/'export'; project.mkdir(); (root/'design/pages/auth/login').mkdir(parents=True)
            names=['copy-auth-login.dc.html', 'copy-auth-shared.dc.html']
            for name in names: (project/name).write_text(FIXTURE)
            canvas={'pages':[{'id':'auth','name':'Auth'}], 'boards':{name:{'page':'auth','title':name} for name in names}}
            (project/'canvas.json').write_text(json.dumps(canvas))
            with self.assertRaisesRegex(ValueError, 'Duplicate key'): list(sync.load_export(project,root))
            (project/names[1]).unlink()
            with self.assertRaisesRegex(ValueError, 'missing board'): list(sync.load_export(project,root))
    def test_complete_sync_on_disposable_fixture_only(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); project=root/'export'; project.mkdir()
            name='copy-auth-login.dc.html'; (project/name).write_text(FIXTURE)
            canvas={'pages':[{'id':'auth','name':'Auth'}], 'boards':{name:{'page':'auth','title':'Login copy'}}}
            (project/'canvas.json').write_text(json.dumps(canvas))
            (root/'design/pages/auth/login/copy').mkdir(parents=True)
            (root/'design/canvas/project').mkdir(parents=True)
            (root/'design/ARTIFACT.md').write_text('버전: baseline\n')
            (root/'design/pages/auth/feature.md').write_text('# auth\n\n- [login](login/page.md)\n')
            (root/'design/pages/auth/login/page.md').write_text('# S02 Login\n\n승인자: 미승인\n승인일: 미정\n')
            (root/'design/pages/auth/login/copy-keys.json').write_text('[]\n')
            for lang in sync.LANGS:
                (root/f'design/pages/auth/login/copy/{lang}.json').write_text(json.dumps({'status':'source','strings':{}}))
            (root/'apps/mobile/src/i18n/locales').mkdir(parents=True)
            repo = HERE.parents[1]
            shutil.copytree(repo/'apps/mobile/src/i18n/locales/v0', root/'apps/mobile/src/i18n/locales/v0')
            shutil.copyfile(repo/'apps/mobile/src/i18n/v0Keys.d.ts', root/'apps/mobile/src/i18n/v0Keys.d.ts')
            v0_copy = Path('specs/002-couple-dday-v0/handoffs/design/copy-v0.md')
            (root/v0_copy).parent.mkdir(parents=True)
            shutil.copyfile(repo/v0_copy, root/v0_copy)
            (root/'tools').mkdir()
            shutil.copytree(HERE.parent/'i18n', root/'tools/i18n')
            (root/'node_modules').symlink_to(HERE.parents[1]/'node_modules', target_is_directory=True)
            previous=sync.ROOT
            try:
                sync.ROOT=root
                with contextlib.redirect_stdout(io.StringIO()) as output: sync.sync(project,'fixture-v1')
                self.assertIn('proposal (not imported): 1', output.getvalue())
                saved=json.loads((root/'design/pages/auth/login/copy/en.json').read_text())
                self.assertEqual(saved['keyStatus']['login.signup.sent.body'],'proposal')
                self.assertIn('fixture-v1', saved['generated'])
                locale=json.loads((root/'apps/mobile/src/i18n/locales/en-US.json').read_text())
                self.assertIn('login.quick.title',locale)
                self.assertNotIn('login.signup.sent.body',locale)
                self.assertEqual((root/'design/canvas/project'/name).read_bytes(),(project/name).read_bytes())
                review=(root/'design/pages/auth/login/review.html').read_text()
                self.assertIn('fixture-v1',review)
                self.assertIn('login.signup.sent.body (proposal',review)
                self.assertNotIn('login.signup.sent.body',(root/'apps/mobile/src/i18n/keys.d.ts').read_text())
                # A removed key still used by the app must fail without publishing the candidate.
                before = (root/'design/ARTIFACT.md').read_bytes()
                (root/'apps/mobile/src/usage.ts').write_text("t('login.quick.title');\n")
                revised = FIXTURE.replace('<tr><td>login.quick.title</td><td>new</td><td>DEV · 테스트 계정으로 바로 입장</td><td>DEV · Enter with a test account</td><td>DEV · テストアカウントでログイン</td></tr>', '')
                (project/name).write_text(revised)
                with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(subprocess.CalledProcessError):
                    sync.sync(project,'fixture-v2')
                self.assertEqual((root/'design/ARTIFACT.md').read_bytes(), before)
            finally: sync.ROOT=previous

if __name__ == '__main__': unittest.main()
