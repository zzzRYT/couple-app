// Replace these placeholders once the store listings exist.
const stores = { ios: null, android: null };
const language = navigator.language.startsWith('ko') ? 'ko' : navigator.language.startsWith('ja') ? 'ja' : 'en';
const copy = {
  ko: ['초대받았어요', '코드를 복사하고 앱을 설치한 뒤, 앱을 열어 초대 코드에 붙여넣어 주세요.', '복사', '복사했어요', '스토어 출시 예정', '유효하지 않은 링크예요', '복사할 수 없어요. 코드를 직접 선택해 복사해 주세요.'],
  en: ['You are invited', 'Copy the code, install and open the app, then paste it into the invite screen.', 'Copy', 'Copied', 'Coming soon to the stores', 'Invalid invite link', 'Could not copy. Select the code and copy it manually.'],
  ja: ['招待が届きました', 'コードをコピーしてアプリをインストールし、開いて招待画面に貼り付けてください。', 'コピー', 'コピーしました', 'ストアで近日公開', '無効な招待リンクです', 'コピーできませんでした。コードを選択してコピーしてください。'],
}[language];
document.documentElement.lang = language;
const match = location.pathname.match(/^\/i\/([a-z0-9]{4}-[a-z0-9]{4})\/?$/i);
const code = match ? match[1].toUpperCase() : '';
const el = (id) => document.getElementById(id);
el('title').textContent = copy[0]; el('instructions').textContent = copy[1]; el('code').textContent = code || copy[5]; el('copy').textContent = copy[2]; el('copy').disabled = !code; el('soon').textContent = copy[4];
el('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); el('status').textContent = copy[3]; } catch { el('status').textContent = copy[6]; } });
for (const key of ['ios', 'android']) if (stores[key]) { el(key).href = stores[key]; el(key).hidden = false; el(`${key}-soon`).hidden = true; }
