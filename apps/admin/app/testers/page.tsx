import Link from 'next/link';
import { redirect } from 'next/navigation';
import { allowedSession } from '../../lib/session';
import { listTesters } from '../../lib/testers';
import { updateTester } from './actions';
export const dynamic = 'force-dynamic';
export default async function Testers({searchParams}:{searchParams:Promise<{error?:string}>}) {
  if (!await allowedSession()) redirect('/');
  const testers = await listTesters();
  const {error} = await searchParams;
  return <main><p><Link href="/">← 운영 현황</Link></p><h1>테스트 계정</h1>
    <p>가입된 계정의 이메일을 입력하세요.</p>
    {error && <p role="alert">처리하지 못했습니다. 이메일과 연결 상태를 확인하세요.</p>}
    <form action={updateTester}><label>이메일 <input name="email" type="email" maxLength={320} required /></label> <button name="action" value="add">추가</button></form>
    {testers === null ? <p>목록을 불러올 수 없습니다.</p> : <div className="rows">{testers.map(({email, added_at}) => <div className="row" key={email}><span>{email} · {new Date(added_at).toLocaleDateString('ko-KR')}</span><form action={updateTester}><input type="hidden" name="email" value={email}/><button name="action" value="remove">삭제</button></form></div>)}</div>}
  </main>;
}
