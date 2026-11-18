const language = navigator.language.startsWith('ko') ? 'ko' : navigator.language.startsWith('ja') ? 'ja' : 'en';
const copy = {
  ko: ['앱에서 인증을 계속해 주세요', '앱에서 열기', '앱이 없다면 App Store에서 설치한 뒤 이메일 링크를 다시 열어 주세요.'],
  en: ['Continue verification in the app', 'Open app', 'If you do not have the app, install it from the App Store and open the email link again.'],
  ja: ['アプリで認証を続けてください', 'アプリを開く', 'アプリがない場合はApp Storeからインストールし、メールのリンクをもう一度開いてください。'],
}[language];
document.documentElement.lang = language;
document.getElementById('title').textContent = copy[0];
document.getElementById('open').textContent = copy[1];
document.getElementById('install').textContent = copy[2];
const params = new URLSearchParams(location.search);
const scheme = params.get('env') === 'dev' ? 'aroom-dev' : 'aroom';
document.getElementById('open').href = `${scheme}://auth-callback${location.search}${location.hash}`;
