// Shared with the n8n Code node; regenerate the workflow after editing.
// Pure JS so the Code node needs no NODE_FUNCTION_ALLOW_BUILTIN; the Crypto node only takes a text HMAC key.
function sha256(data) {
  const primes = []; for (let n = 2; primes.length < 64; n++) if (primes.every(p => n % p)) primes.push(n);
  const frac = x => (x - Math.floor(x)) * 2 ** 32 >>> 0, rotr = (x, n) => x >>> n | x << 32 - n;
  const k = primes.map(p => frac(Math.cbrt(p))), h = primes.slice(0, 8).map(p => frac(Math.sqrt(p)));
  const m = new Uint8Array((data.length + 72) & ~63), view = new DataView(m.buffer), w = new Uint32Array(64);
  m.set(data); m[data.length] = 0x80;
  view.setUint32(m.length - 8, Math.floor(data.length / 2 ** 29)); view.setUint32(m.length - 4, data.length * 8 >>> 0);
  for (let i = 0; i < m.length; i += 64) {
    for (let t = 0; t < 64; t++) w[t] = t < 16 ? view.getUint32(i + t * 4) : w[t - 16] + (rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ w[t - 15] >>> 3) + w[t - 7] + (rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ w[t - 2] >>> 10);
    let [a, b, c, d, e, f, g, j] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = j + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + (e & f ^ ~e & g) + k[t] + w[t] | 0, t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + (a & b ^ a & c ^ b & c) | 0;
      [a, b, c, d, e, f, g, j] = [t1 + t2 | 0, a, b, c, d + t1 | 0, e, f, g];
    }
    [a, b, c, d, e, f, g, j].forEach((x, n) => { h[n] = h[n] + x | 0; });
  }
  const out = Buffer.alloc(32); h.forEach((x, n) => out.writeUInt32BE(x >>> 0, n * 4)); return out;
}
function hmacSha256(key, message) {
  const block = Buffer.alloc(64); (key.length > 64 ? sha256(key) : key).copy(block);
  return sha256(Buffer.concat([block.map(b => b ^ 0x5c), sha256(Buffer.concat([block.map(b => b ^ 0x36), message]))]));
}
function prepare(raw, headers, secret, authUrl, now = Date.now(), profileLocale = null) {
  const id = headers['webhook-id'], timestamp = headers['webhook-timestamp'], signatures = headers['webhook-signature'];
  if (!id || !/^\d+$/.test(timestamp || '') || !signatures || Math.abs(now / 1000 - Number(timestamp)) > 300 || !/^v1,whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret || '')) throw Error('Invalid webhook');
  const key = Buffer.from(secret.slice(9), 'base64');
  if (!key.length) throw Error('Invalid webhook');
  const expected = hmacSha256(key, Buffer.from(`${id}.${timestamp}.${raw}`));
  const valid = signatures.split(' ').some(s => { const [v, b] = s.split(','); if (v !== 'v1' || !b) return false; const value = Buffer.from(b, 'base64'); return value.length === expected.length && value.reduce((diff, byte, i) => diff | byte ^ expected[i], 0) === 0; });
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
      if (!/^https?:\/\/[^\s/?#]+[^\s?#]*$/i.test(authUrl || '')) throw Error('Invalid auth URL');
      const query = { token: hash, type: action, redirect_to: data.redirect_to || data.site_url };
      content = `${authUrl.replace(/\/$/, '')}/verify?` + Object.entries(query).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&');
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
