import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { KEYS, isEvidencePath, isSha, splitList } from './design-review-check.mjs';

export const MARKER = '<!-- aroom-design-review -->';
const MAX_RESULT_BYTES = 64 * 1024;

// result.json comes from a run of PR code, so it is attacker-controlled. Only a value that
// passes this shape check reaches the renderer, and only the known declaration keys survive.
export function parseResult(text) {
  if (Buffer.byteLength(text) > MAX_RESULT_BYTES) return null;
  let r;
  try {
    r = JSON.parse(text);
  } catch {
    return null;
  }
  const isText = (v) => typeof v === 'string' && v.length <= 500;
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const valid =
    isObject(r) && r.schema === 1 && typeof r.ok === 'boolean' &&
    Number.isInteger(r.pr) && r.pr > 0 && isSha(r.base) && isSha(r.head) &&
    Array.isArray(r.problems) && r.problems.length <= 40 && r.problems.every(isText) &&
    isObject(r.declaration) && Object.values(r.declaration).every(isText);
  if (!valid) return null;
  const declaration = Object.fromEntries(KEYS.filter((k) => Object.hasOwn(r.declaration, k)).map((k) => [k, r.declaration[k]]));
  return { ok: r.ok, pr: r.pr, base: r.base, head: r.head, problems: r.problems, declaration };
}

// Entities stop raw HTML, backslashes stop markdown links and images, and a zero-width space
// after @, #, :// and www. stops mentions, cross-repo references and autolinks.
export function escapeText(value, max = 300) {
  let text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length > max) text = `${text.slice(0, max)}…`;
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_[\]()!|~]/g, '\\$&')
    .replace(/[@#]/g, '$&​')
    .replace(/:\/\//g, ':​//')
    .replace(/www\./gi, (m) => `${m.slice(0, 3)}​.`);
}

// The one outside link the comment renders: a Claude Design artifact address, matched whole.
const ARTIFACT_LINK = /^https:\/\/claude\.ai\/artifact\/[A-Za-z0-9_-]+$/;

function reviewNeed(d) {
  const classes = splitList(d.classification);
  if (classes.includes('shared-proposed') || classes.includes('exception')) return '디자인 시스템 검토 필요';
  if (classes.includes('app-local') || classes.includes('product-theme')) return '앱 정본만 검토';
  if (d.ui === 'none') return 'UI 변경 없음으로 선언';
  return '소유자 분류 필요';
}

export function renderComment({ result, problem, run, repo, serverUrl, now }) {
  const short = (sha) => sha.slice(0, 7);
  const footer = `[검사 실행](${serverUrl}/${repo}/actions/runs/${run.id}) · 생성 ${now}`;
  if (!result) {
    return [MARKER, '## 디자인 리뷰: 확인 필요', '', problem, '', `head \`${short(run.head_sha)}\``, '', footer].join('\n');
  }

  const d = result.declaration;
  const field = (label, key) => `- ${label}: ${d[key] ? escapeText(d[key]) : '(선언 없음)'}`;
  const passed = result.ok && run.conclusion === 'success';
  const evidenceCommit = isSha(d['evidence-commit']) ? `\`${short(d['evidence-commit'])}\`` : '(없음)';
  const images = splitList(d.evidence)
    .filter(isEvidencePath)
    .map((path) => `![${path}](${serverUrl}/${repo}/blob/${result.head}/${path}?raw=true)`);

  const lines = [
    MARKER,
    `## 디자인 리뷰: ${passed ? '통과' : '확인 필요'}`,
    '',
    field('UI 변경', 'ui'),
    field('분류', 'classification'),
    field('이유', 'reason'),
    `- 검토: ${reviewNeed(d)}`,
    field('화면', 'screens'),
    field('상태', 'states'),
    field('토큰', 'tokens'),
    field('컴포넌트', 'components'),
    `- base \`${short(result.base)}\` · head \`${short(result.head)}\` · 증거 커밋 ${evidenceCommit}`,
  ];
  if (d.ui === 'changed') {
    lines.push(
      '',
      '### 디자인 정본',
      ARTIFACT_LINK.test(d.design ?? '') ? `- 링크: [정본 열기](${d.design})` : field('링크', 'design'),
      field('버전', 'design-version'),
      field('선언된 승인 기록', 'design-approval'),
      '',
      '### 증거',
      field('캡처 조건', 'conditions'),
      '',
      ...(images.length ? images : ['(표시할 증거 이미지가 없어요)']),
    );
  }
  if (d.unverified) lines.push('', `미검증: ${escapeText(d.unverified)}`);
  if (result.problems.length) lines.push('', '### 문제', ...result.problems.map((p) => `- ${escapeText(p)}`));
  lines.push('', footer);
  return lines.join('\n');
}

export const findComment = (comments, author) =>
  comments.find((c) => c.user?.login === author && c.body?.includes(MARKER));

function loadResult(path, run, prNumbers) {
  if (!existsSync(path)) {
    const problem = run.conclusion === 'success' ? '검사 결과를 읽지 못했어요. 결과 파일이 없어요.' : '검사가 끝나지 않았어요. 결과 파일이 없어요.';
    return { result: null, problem };
  }
  const result = statSync(path).size <= MAX_RESULT_BYTES ? parseResult(readFileSync(path, 'utf8')) : null;
  if (!result || !prNumbers.includes(result.pr) || result.head !== run.head_sha) {
    console.log('result.json failed the size, shape, PR or head check; posting a could-not-read comment');
    return { result: null, problem: '검사 결과를 읽지 못했어요.' };
  }
  return { result };
}

function github(token) {
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  return async (method, path, body) => {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'aroom-design-review',
      },
      body: body && JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    return res.json();
  };
}

async function listComments(api, repo, pr) {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await api('GET', `/repos/${repo}/issues/${pr}/comments?per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

async function main() {
  const run = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).workflow_run;
  const repo = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  if (run.conclusion === 'cancelled') {
    console.log('cancelled run; the run that replaced it will update the comment');
    return;
  }
  const prNumbers = (run.pull_requests ?? []).map((p) => p.number);
  const { result, problem } = loadResult(process.env.DESIGN_REVIEW_OUT || 'design-review/result.json', run, prNumbers);
  const pr = result?.pr ?? prNumbers[0];
  if (!pr) {
    console.log('no pull request is linked to this run; nothing to post');
    return;
  }

  const api = github(process.env.GITHUB_TOKEN);
  const current = await api('GET', `/repos/${repo}/pulls/${pr}`);
  if (current.head.sha !== run.head_sha) {
    console.log('stale run; a newer run will update the comment');
    return;
  }

  const body = renderComment({ result, problem, run, repo, serverUrl, now: new Date().toISOString() });
  // COMMENT_AUTHOR lets the lead run this locally under their own account to prove update-in-place before the workflow reaches the default branch.
  const author = process.env.COMMENT_AUTHOR || 'github-actions[bot]';
  const existing = findComment(await listComments(api, repo, pr), author);
  if (existing) await api('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, { body });
  else await api('POST', `/repos/${repo}/issues/${pr}/comments`, { body });
  console.log(`${existing ? 'updated' : 'created'} design review comment on #${pr}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
