// Shared with the n8n Code node; regenerate the workflow after editing.
const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');
function prepare(raw, headers, secret, authUrl, now = Date.now(), profileLocale = null) {
  const id = headers['webhook-id'], timestamp = headers['webhook-timestamp'], signatures = headers['webhook-signature'];
  if (!id || !/^\d+$/.test(timestamp || '') || !signatures || Math.abs(now / 1000 - Number(timestamp)) > 300 || !/^v1,whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret || '')) throw Error('Invalid webhook');
  const key = Buffer.from(secret.slice(9), 'base64');
  if (!key.length) throw Error('Invalid webhook');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${raw}`).digest();
  const valid = signatures.split(' ').some(s => { const [v, b] = s.split(','); if (v !== 'v1' || !b) return false; const value = Buffer.from(b, 'base64'); return value.length === expected.length && crypto.timingSafeEqual(value, expected); });
  if (!valid) throw Error('Invalid webhook');
  const { user, email_data: data } = JSON.parse(raw);
  const action = data.email_action_type;
  const copy = {
    ko: { signup: ['이메일을 확인해 주세요', '아룸 가입을 마치려면 링크를 열어 주세요.'], recovery: ['비밀번호 재설정', '아룸 비밀번호를 재설정하려면 링크를 열어 주세요.'], email_change: ['이메일 변경 확인', '이메일 변경을 확인하려면 링크를 열어 주세요.'], reauthentication: ['본인 확인 코드', '아룸 본인 확인 코드입니다:'], magiclink: ['로그인 링크', '아룸에 로그인하려면 링크를 열어 주세요.'], invite: ['아룸 초대', '초대를 수락하려면 링크를 열어 주세요.'] },
    en: { signup: ['Confirm your email', 'Open the link to finish signing up for Aroom.'], recovery: ['Reset your password', 'Open the link to reset your Aroom password.'], email_change: ['Confirm your email change', 'Open the link to confirm your email change.'], reauthentication: ['Your verification code', 'Your Aroom verification code:'], magiclink: ['Sign in to Aroom', 'Open the link to sign in to Aroom.'], invite: ['Your Aroom invitation', 'Open the link to accept your invitation.'] },
    ja: { signup: ['メールアドレスの確認', 'リンクを開いてアルームの登録を完了してください。'], recovery: ['パスワードの再設定', 'リンクを開いてアルームのパスワードを再設定してください。'], email_change: ['メールアドレス変更の確認', 'リンクを開いてメールアドレスの変更を確認してください。'], reauthentication: ['本人確認コード', 'アルームの本人確認コードです：'], magiclink: ['ログインリンク', 'リンクを開いてアルームにログインしてください。'], invite: ['アルームへの招待', 'リンクを開いて招待を承認してください。'] }
  };
  const language = String(profileLocale || user.user_metadata?.locale || user.user_metadata?.i18n || 'ko').toLowerCase().split(/[-_]/)[0];
  const template = (copy[language] || copy.ko)[action];
  if (!template) throw Error('Unsupported email action');
  const make = (to, hash, token) => {
    if (!to) throw Error('Missing recipient');
    let content;
    if (action === 'reauthentication') { if (!token) throw Error('Missing code'); content = token; }
    else {
      if (!hash) throw Error('Missing token');
      const base = new URL(authUrl); if (!['https:', 'http:'].includes(base.protocol)) throw Error('Invalid auth URL');
      const url = new URL(base.toString().replace(/\/$/, '') + '/verify');
      url.search = new URLSearchParams({ token: hash, type: action, redirect_to: data.redirect_to || data.site_url }).toString();
      content = url.toString();
    }
    return { to, subject: template[0], text: `${template[1]}\n\n${content}` };
  };
  if (action === 'email_change') {
    const messages = [];
    if (data.token_hash_new) messages.push(make(user.email, data.token_hash_new, data.token));
    messages.push(make(user.new_email, data.token_hash, data.token_new || data.token));
    return messages;
  }
  return [make(user.email, data.token_hash, data.token)];
}
if (typeof module !== 'undefined') module.exports = { prepare };
