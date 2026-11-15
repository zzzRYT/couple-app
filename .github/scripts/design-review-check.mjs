import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const KEYS = [
  'ui', 'classification', 'reason',
  'screens', 'states', 'tokens', 'components',
  'design', 'design-version', 'design-approval',
  'evidence-commit', 'evidence', 'conditions', 'unverified',
];
const REQUIRED_WHEN_CHANGED = [
  'screens', 'states', 'tokens', 'components',
  'design', 'design-version', 'design-approval',
  'evidence-commit', 'evidence', 'conditions',
];
const UI_VALUES = ['changed', 'none', 'unknown'];
const CLASSIFICATIONS = ['app-local', 'product-theme', 'shared-proposed', 'exception', 'unknown'];
const UI_DIRS = ['apps/mobile/src/', 'apps/mobile/assets/', 'design/'];
const MAX_STRING = 500;
const MAX_PROBLEMS = 40;

export const isSha = (value) => /^[0-9a-f]{40}$/.test(value ?? '');
export const isEvidencePath = (path) =>
  /^design\/evidence\/[A-Za-z0-9._/-]+\.png$/.test(path) && !path.includes('..');
export const isUiPath = (path) =>
  UI_DIRS.some((dir) => path.startsWith(dir)) &&
  !path.startsWith('design/evidence/') &&
  !path.includes('__tests__/');
export const splitList = (value) => (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const listPaths = (paths) =>
  paths.slice(0, 10).join(', ') + (paths.length > 10 ? ` 외 ${paths.length - 10}개` : '');

export function parseDeclaration(body) {
  const block = /^```design-change[ \t]*\r?\n([\s\S]*?)^```/m.exec(body ?? '');
  if (!block) return null;
  const declaration = {};
  for (const line of block[1].split(/\r?\n/)) {
    const text = line.trim();
    const colon = text.indexOf(':');
    if (!text || text.startsWith('#') || colon < 1) continue;
    const value = text.slice(colon + 1).trim();
    if (value) declaration[text.slice(0, colon).trim().toLowerCase()] = value;
  }
  return declaration;
}

export function checkDeclaration(d) {
  const problems = Object.keys(d).filter((k) => !KEYS.includes(k)).map((k) => `알 수 없는 키예요: ${k}`);
  const need = (key) => { if (!d[key]) problems.push(`${key} 값이 없어요`); };

  need('ui');
  if (d.ui && !UI_VALUES.includes(d.ui)) problems.push(`ui는 changed, none, unknown 중 하나예요: ${d.ui}`);
  if (d.ui === 'unknown') problems.push('ui가 unknown이에요. 소유자가 changed 또는 none으로 분류해야 해요');
  need('reason');

  if (d.ui === 'changed' || d.ui === 'unknown') need('classification');
  const classes = splitList(d.classification);
  for (const c of classes) if (!CLASSIFICATIONS.includes(c)) problems.push(`모르는 분류예요: ${c}`);
  if (classes.includes('unknown')) problems.push('분류가 unknown이에요. app-local로 간주하지 않아요. 소유자가 분류해야 해요');

  if (d.ui === 'changed') {
    REQUIRED_WHEN_CHANGED.forEach(need);
    if (d['evidence-commit'] && !isSha(d['evidence-commit'])) problems.push('evidence-commit은 40자리 커밋 SHA여야 해요');
    for (const p of splitList(d.evidence)) {
      if (!isEvidencePath(p)) problems.push(`증거 경로는 design/evidence/ 아래 PNG여야 해요: ${p}`);
    }
  }
  return problems;
}

export function checkAgainstGit(d, { base, head, git }) {
  const problems = [];
  if (d.ui === 'none') {
    const touched = git.changedSince(base, head).filter(isUiPath);
    if (touched.length) problems.push(`ui: none인데 UI 파일이 바뀌었어요: ${listPaths(touched)}`);
  }
  if (d.ui === 'changed') {
    for (const p of splitList(d.evidence).filter(isEvidencePath)) {
      if (!git.fileExists(head, p)) problems.push(`증거 파일이 head에 없어요: ${p}`);
    }
    const commit = d['evidence-commit'];
    if (isSha(commit)) {
      if (!git.isAncestor(commit, head)) {
        problems.push(`evidence-commit ${commit}이 head의 조상이 아니에요`);
      } else {
        const touched = git.changedSince(commit, head).filter(isUiPath);
        if (touched.length) problems.push(`증거가 오래됐어요: ${commit} 이후 UI 파일이 바뀌었어요: ${listPaths(touched)}`);
      }
    }
  }
  return problems;
}

export function evaluate({ body, base, head, git }) {
  const declaration = parseDeclaration(body);
  if (!declaration) {
    return { ok: false, problems: ['선언이 없어요: PR 본문에 design-change 블록을 넣어 주세요'], declaration: {} };
  }
  const problems = [...checkDeclaration(declaration), ...checkAgainstGit(declaration, { base, head, git })];
  return { ok: problems.length === 0, problems, declaration };
}

export function buildResult({ pr, base, head, ok, problems, declaration }) {
  const cap = (s) => String(s).slice(0, MAX_STRING);
  return {
    schema: 1,
    ok,
    problems: problems.slice(0, MAX_PROBLEMS).map(cap),
    pr,
    base: cap(base),
    head: cap(head),
    declaration: Object.fromEntries(KEYS.filter((k) => k in declaration).map((k) => [k, cap(declaration[k])])),
  };
}

// Arguments go to git without a shell. Every ref is a validated 40-hex SHA and every
// path matches the evidence regex, so nothing here can be read as a git option.
export const realGit = {
  changedSince: (from, to) =>
    execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${from}...${to}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }).split('\0').filter(Boolean),
  fileExists: (commit, path) => spawnSync('git', ['cat-file', '-e', `${commit}:${path}`]).status === 0,
  isAncestor: (ancestor, commit) => spawnSync('git', ['merge-base', '--is-ancestor', ancestor, commit]).status === 0,
};

function main() {
  const { pull_request: pr } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const base = pr.base.sha;
  const head = pr.head.sha;
  if (!isSha(base) || !isSha(head)) throw new Error(`event base/head are not commit SHAs: ${base} ${head}`);

  const result = buildResult({ pr: pr.number, base, head, ...evaluate({ body: pr.body, base, head, git: realGit }) });
  const out = process.env.DESIGN_REVIEW_OUT || 'design-review/result.json';
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);

  if (result.ok) {
    console.log('디자인 리뷰 검사 통과');
    return;
  }
  console.log('디자인 리뷰 검사 확인 필요:');
  for (const problem of result.problems) console.log(`- ${problem}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
