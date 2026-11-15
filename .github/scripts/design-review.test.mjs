import assert from 'node:assert/strict';
import test from 'node:test';
import { buildResult, evaluate } from './design-review-check.mjs';
import { MARKER, findComment, parseResult, renderComment } from './design-review-comment.mjs';

const BASE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const EVIDENCE = 'c'.repeat(40);

// changed maps a "from" commit to the files `git diff from...HEAD` would list.
function fakeGit({ changed = {}, files = [], ancestors = [EVIDENCE] } = {}) {
  return {
    changedSince: (from) => changed[from] ?? [],
    fileExists: (commit, path) => commit === HEAD && files.includes(path),
    isAncestor: (ancestor, commit) => commit === HEAD && ancestors.includes(ancestor),
  };
}

const block = (fields) =>
  ['요약', '', '```design-change', ...Object.entries(fields).map(([k, v]) => `${k}: ${v}`), '```'].join('\r\n');

const changedFields = {
  ui: 'changed',
  classification: 'app-local',
  reason: '버튼 모양만 앱에서 바꿈',
  screens: 'home',
  states: 'default, pressed',
  tokens: 'none',
  components: 'Button',
  design: 'https://claude.ai/artifact/123',
  'design-version': 'v3',
  'design-approval': '소유자 2026-11-15',
  'evidence-commit': EVIDENCE,
  evidence: 'design/evidence/button-before.png, design/evidence/button-after.png',
  conditions: 'iPhone 16, iOS 18.2, light',
};
const evidenceFiles = ['design/evidence/button-before.png', 'design/evidence/button-after.png'];

const check = (body, git = fakeGit()) => evaluate({ body, base: BASE, head: HEAD, git });

test('a PR body without a design-change block fails', () => {
  const verdict = check('그냥 설명만 있는 PR');
  assert.equal(verdict.ok, false);
  assert.match(verdict.problems.join('\n'), /선언이 없어요/);
});

test('a complete changed declaration with fresh evidence passes', () => {
  const git = fakeGit({ files: evidenceFiles, changed: { [EVIDENCE]: ['design/evidence/button-after.png'] } });
  const verdict = check(block(changedFields), git);
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.ok, true);
});

test('ui: none fails when the PR touches UI paths and passes when it does not', () => {
  const body = block({ ui: 'none', reason: '서버 코드만 바꿈' });
  const touched = fakeGit({ changed: { [BASE]: ['supabase/x.sql', 'apps/mobile/src/Home.tsx'] } });
  const verdict = check(body, touched);
  assert.equal(verdict.ok, false);
  assert.match(verdict.problems.join('\n'), /apps\/mobile\/src\/Home\.tsx/);

  const untouched = fakeGit({ changed: { [BASE]: ['supabase/x.sql', 'apps/mobile/src/__tests__/a.test.ts', 'design/evidence/a.png'] } });
  assert.equal(check(body, untouched).ok, true);
});

test('an unknown classification fails instead of counting as app-local', () => {
  const git = fakeGit({ files: evidenceFiles });
  const verdict = check(block({ ...changedFields, classification: 'app-local, unknown' }), git);
  assert.equal(verdict.ok, false);
  assert.match(verdict.problems.join('\n'), /unknown/);
});

test('evidence is stale when a UI file changed after the evidence commit', () => {
  const git = fakeGit({ files: evidenceFiles, changed: { [EVIDENCE]: ['apps/mobile/src/ui/Button.tsx'] } });
  const verdict = check(block(changedFields), git);
  assert.equal(verdict.ok, false);
  assert.match(verdict.problems.join('\n'), /증거가 오래됐어요.*apps\/mobile\/src\/ui\/Button\.tsx/);
});

test('evidence paths that escape design/evidence are rejected even if the file exists', () => {
  const path = 'design/evidence/../../apps/mobile/secret.png';
  const git = fakeGit({ files: [path] });
  const verdict = check(block({ ...changedFields, evidence: path }), git);
  assert.equal(verdict.ok, false);
  assert.match(verdict.problems.join('\n'), /design\/evidence\/ 아래 PNG/);
});

const run = { id: 99, head_sha: HEAD, conclusion: 'failure' };
const render = (declaration, problems = []) => {
  const result = parseResult(JSON.stringify(buildResult({ pr: 7, base: BASE, head: HEAD, ok: false, problems, declaration })));
  return renderComment({ result, run, repo: 'o/r', serverUrl: 'https://github.com', now: '2026-11-15T00:00:00.000Z' });
};

test('the comment neutralizes HTML and @mentions from the artifact', () => {
  const body = render({ ...changedFields, reason: '<script>alert(1)</script> ping @owner' }, ['@team 확인\n<img src=x>']);
  assert.ok(body.startsWith(MARKER));
  assert.ok(!body.includes('<script>'));
  assert.ok(!body.includes('<img'));
  assert.ok(!/@owner|@team/.test(body));
});

test('the comment never carries a URL from the artifact, only evidence links it builds', () => {
  const body = render({
    ...changedFields,
    design: 'https://evil.example/design',
    'design-approval': '[ok](https://evil.example/a) ![x](http://evil.example/t.png) [r](//evil.example/r) www.evil.example',
    evidence: 'https://evil.example/x.png, design/evidence/button-after.png',
  });
  assert.ok(!/https?:\/\/evil|www\.evil/.test(body));
  const linkTargets = [...body.matchAll(/\]\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(linkTargets.length >= 2);
  for (const target of linkTargets) assert.ok(target.startsWith('https://github.com/o/r/'), target);
  assert.ok(body.includes(`https://github.com/o/r/blob/${HEAD}/design/evidence/button-after.png?raw=true`));
});

test('the comment links the design source only when it is a Claude Design artifact address', () => {
  assert.ok(render({ ...changedFields, design: 'https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X' }).includes('[정본 열기](https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X)'));
  for (const design of ['https://claude.ai/artifact/x)[y](https://evil.example', 'https://claude.ai.evil.example/artifact/x', 'http://claude.ai/artifact/x']) {
    assert.ok(!render({ ...changedFields, design }).includes('[정본 열기]'), design);
  }
});

test('a malformed or oversized result is not trusted', () => {
  const good = buildResult({ pr: 7, base: BASE, head: HEAD, ok: true, problems: [], declaration: {} });
  assert.ok(parseResult(JSON.stringify(good)));
  assert.equal(parseResult(JSON.stringify({ ...good, schema: 2 })), null);
  assert.equal(parseResult(JSON.stringify({ ...good, head: 'main' })), null);
  assert.equal(parseResult(JSON.stringify({ ...good, problems: [{ html: '<b>' }] })), null);
  assert.equal(parseResult(JSON.stringify({ ...good, problems: ['x'.repeat(70 * 1024)] })), null);
  assert.equal(parseResult('not json'), null);
});

test('only the bot comment carrying the marker is updated', () => {
  const comments = [
    { id: 1, user: { login: 'someone' }, body: `${MARKER} copied` },
    { id: 2, user: { login: 'github-actions[bot]' }, body: 'other bot note' },
    { id: 3, user: { login: 'github-actions[bot]' }, body: `${MARKER}\n## 디자인 리뷰` },
  ];
  assert.equal(findComment(comments, 'github-actions[bot]')?.id, 3);
  assert.equal(findComment(comments.slice(0, 2), 'github-actions[bot]'), undefined);
});
