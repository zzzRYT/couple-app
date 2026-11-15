import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { isAllowed, testSession } from '../lib/access.mjs';
import { getStats } from '../lib/database';
import { SignIn, SignOut } from './login';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ota() {
  try {
    const r = await fetch('https://aroom-hot-updater.jinjinstar3.workers.dev/version', {cache:'no-store', signal:AbortSignal.timeout(5000)});
    if (!r.ok) return null;
    const body: unknown = await r.json();
    const version = (body as {version?:unknown})?.version;
    return typeof version === 'string' && /^[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}(?:[-+][a-zA-Z0-9.-]{1,32})?$/.test(version) ? version : null;
  } catch { return null; }
}
const links = [
  ['Supabase','https://supabase.com/dashboard'], ['Cloudflare','https://dash.cloudflare.com/'],
  ['GitHub Actions','https://github.com/zzzRYT/couple-app/actions'], ['EAS','https://expo.dev/'],
  ['App Store Connect','https://appstoreconnect.apple.com/'], ['PostHog','https://app.posthog.com/'],
  ['지원 메일','mailto:jinjinstar3@gmail.com'],
];
function NumberValue({value}:{value:unknown}) { return <strong>{typeof value === 'number' && value >= 5 ? value.toLocaleString('ko-KR') : value === undefined ? '확인 불가' : '숨김'}</strong>; }
function Breakdown({value, fields}:{value:unknown;fields:string[]}) {
 if (!value || typeof value !== 'object') return <p>{value === undefined ? '확인 불가' : '숨김'}</p>;
 const rows: Record<string, unknown>[] = Array.isArray(value) ? value as Record<string, unknown>[] : Object.entries(value).map(([key,count])=>({key,count}));
 return <div className="rows">{rows.map((row,index)=><div className="row" key={index}><span>{fields.map(f=>String(row[f] ?? '')).join(' · ')}</span><NumberValue value={row.count}/></div>)}</div>;
}
export default async function Page() {
 const token = await getToken({req:new NextRequest('http://localhost/', {headers:await headers()}), secret:process.env.NEXTAUTH_SECRET, secureCookie:process.env.NODE_ENV === 'production'});
 const session = testSession(process.env) ?? (token ? {user:{email:token.email, emailVerified:token.emailVerified}} : null);
 if (!session) return <main className="auth"><h1>Aroom 관리자</h1><p>관리자 Google 계정으로 로그인하세요.</p><SignIn/></main>;
 if (!isAllowed(session, process.env.ADMIN_ALLOWLIST_EMAILS)) return <main className="auth"><h1>접근할 수 없습니다</h1><p>관리자 계정을 확인하세요.</p><SignOut/></main>;
 const data = await getStats() ?? {};
 const version = await ota();
 const checked = new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date());
 return <main><header><div><p className="eyebrow">AROOM / ADMIN</p><h1>운영 현황</h1><p>현재 남아 있는 데이터의 스냅샷입니다. 5 미만의 집계는 숨깁니다.</p></div><SignOut/></header>
 <section><h2>사용 현황</h2><p>마지막 확인: {checked} (서울)</p><div className="grid"><article><h3>활성 프로필</h3><NumberValue value={data.active_profiles}/><p>활성 사용자나 DAU와 다릅니다.</p></article><article><h3>활성 커스텀 기념일</h3><NumberValue value={data.active_anniversaries}/></article><article><h3>공간 상태별</h3><Breakdown value={data.spaces} fields={['key']}/></article></div></section>
 <section><h2>서버 · 배포</h2><div className="grid"><article><h3>OTA Worker 버전</h3><strong>{version ?? '확인 불가'}</strong><p>마지막 확인: {checked} (서울)</p><p>Worker 응답이며 사용자 체감 건강이나 배포 번들 상태는 아닙니다.</p></article><article><h3>배포 상태</h3><strong>확인 불가</strong><p>마지막 확인: {checked} (서울) · 콘솔에서 확인</p></article></div></section>
 <section><h2>앱 심사 · 릴리스</h2><article><strong>확인 불가</strong><p>마지막 확인: {checked} (서울) · 각 콘솔에서 확인</p></article></section>
 <section><h2>오류 · 신고</h2><div className="grid"><article><h3>잔존 신고 · 대상 / 사유 / 상태</h3><Breakdown value={data.reports} fields={['target','reason','status']}/></article><article><h3>계정 삭제 시 보존된 신고 지문 · 대상 / 사유</h3><Breakdown value={data.fingerprints} fields={['target','reason']}/><p>처리 상태를 나타내지 않습니다.</p></article><article><h3>계정 삭제 진행 상태</h3><Breakdown value={data.deletions} fields={['key']}/></article><article><h3>앱 오류</h3><strong>확인 불가</strong><p>마지막 확인: {checked} (서울)</p></article></div></section>
 <section><h2>운영 콘솔</h2><div className="links">{links.map(([label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div></section></main>;
}
