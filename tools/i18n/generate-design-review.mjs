import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadCopies } from './copy-library.mjs';
const root = 'design/pages';
const { all: merged, proposals } = await loadCopies();
const artifact = await readFile('design/ARTIFACT.md', 'utf8');
const version = artifact.match(/^버전: (.+)$/m)?.[1] ?? '미동기화';
const canvas = JSON.parse(await readFile('design/canvas/project/canvas.json', 'utf8'));
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const html = (title, body) => `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title><style>body{font:16px/1.55 system-ui,sans-serif;max-width:1100px;margin:auto;padding:24px;color:#352a2d;background:#fbf8f5}a{color:#804052}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:1em;border-radius:10px}img{max-width:300px;max-height:600px;object-fit:contain;border:1px solid #ddd;border-radius:8px}figure{display:inline-block;vertical-align:top;margin:8px}figcaption{max-width:300px;overflow-wrap:anywhere}table{border-collapse:collapse;background:white;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}td{overflow-wrap:anywhere}nav{margin-bottom:1em}</style><body><p><strong>아티팩트 정본의 저장소 미러 · 버전 ${esc(version)} · 생성 파일은 수정하지 마세요. 상태 명세와 PNG는 아티팩트에 비해 오래되었을 수 있습니다.</strong> <a href="https://claude.ai/artifact/M2WFQCFnVzoWbHNhJPCz5X">아티팩트</a></p>${body}</body></html>\n`;
const table = (keys) => `<table><thead><tr><th>Key</th><th>한국어</th><th>English · draft G4</th><th>日本語 · draft G4</th></tr></thead><tbody>${keys.map((k) => `<tr><th>${esc(k)}${proposals.includes(k) ? " (proposal · 미승인)" : ""}</th>${['ko','en','ja'].map((l) => `<td>${esc(merged[l][k] ?? 'MISSING')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const folders = (await readdir(root, {withFileTypes:true})).filter((e) => e.isDirectory() && e.name !== 'common').map((e) => e.name).sort((a,b) => ['auth','space','home','room','settings','system','foundations','later-history'].indexOf(a)-['auth','space','home','room','settings','system','foundations','later-history'].indexOf(b));
let index = '<h1>디자인 검토 순서</h1><p>승인은 각 Markdown 문서의 승인자와 승인일에 기록합니다.</p>';
if (Array.isArray(canvas.pages)) { index += '<h2>아티팩트 페이지와 보드</h2>'; for (const page of canvas.pages) { index += `<h3>${esc(page.name)}</h3><ul>`; for (const [name, meta] of Object.entries(canvas.boards)) if (meta.page === page.id) index += `<li><a href="../canvas/project/${encodeURIComponent(name)}">${esc(meta.title || name)}</a></li>`; index += '</ul>'; } }
for (const feature of folders) {
  const dir = join(root, feature); const doc = await readFile(join(dir,'feature.md'),'utf8');
  const pages = (await readdir(dir,{withFileTypes:true})).filter((e) => e.isDirectory() && e.name !== 'copy').map((e) => e.name).sort((a,b) => doc.indexOf(`(${a}/page.md)`) - doc.indexOf(`(${b}/page.md)`));
  index += `<h2><a href="${esc(feature)}/review.html">${esc(feature)}</a></h2><p>${esc(doc.match(/승인자:.*|승인일:.*/g)?.join(' · ') ?? '미승인')}</p><ul>`;
  let allKeys = new Set(); let pageLinks = ''; let pageDetails = '';
  for (const page of pages) {
    const pd = join(dir,page); const md = await readFile(join(pd,'page.md'),'utf8'); const title = md.split('\n')[0].replace(/^# /,''); const keys = JSON.parse(await readFile(join(pd,'copy-keys.json'),'utf8')); keys.forEach((k)=>allKeys.add(k));
    const scenarios = [...md.matchAll(/^- \[ \] (.+)$/gm)].map((m) => `<li>☐ ${esc(m[1])}</li>`).join('');
    const images = [...md.matchAll(/\[([^\]]+\.png)\]\(([^)]+)\)/g)].map((m)=>`<figure><img loading="lazy" src="${esc(m[2])}" alt="${esc(m[1])}"><figcaption>${esc(m[1])}</figcaption></figure>`).join('');
    const out = `<nav><a href="../../index.html">전체</a> · <a href="../review.html">${esc(feature)}</a> · <a href="page.md">명세 편집</a></nav><h1>${esc(title)}</h1><h2>이미지</h2>${images || '<p>내보낸 이미지 없음</p>'}<h2>수락 시나리오</h2><ul>${scenarios}</ul><h2>상태 · 흐름 · 원본 명세</h2><pre>${esc(md)}</pre><h2>번역</h2>${table(keys)}`;
    await writeFile(join(pd,'review.html'),html(title,out));
    const approval = md.match(/승인자:.*|승인일:.*/g)?.join(' · ') ?? '미승인';
    index += `<li><a href="${esc(feature)}/${esc(page)}/review.html">${esc(title)}</a> — ${esc(approval)}</li>`;
    pageDetails += `<section><h2>${esc(title)}</h2>${images.replaceAll('../../../exports/', '../../exports/')}<pre>${esc(md)}</pre></section>`;
    pageLinks += `<li><a href="${esc(page)}/review.html">${esc(title)}</a> — ${esc(approval)}</li>`;
  }
  index += '</ul>';
  await writeFile(join(dir,'review.html'),html(feature,`<nav><a href="../index.html">전체</a> · <a href="feature.md">기능 편집</a></nav><h1>${esc(feature)}</h1><pre>${esc(doc)}</pre><ul>${pageLinks}</ul>${pageDetails}<h2>페이지별 번역 모음</h2>${table([...allKeys].sort())}`));
}
await writeFile(join(root,'index.html'),html('디자인 검토',index));
