// Disposable proof receiver: verifies and prints no payloads or credentials.
const http = require('node:http');
const { prepare } = require('./auth-mail-core.cjs');
http.createServer((req,res) => {
  let raw = ''; req.setEncoding('utf8'); req.on('data', chunk => { raw += chunk; });
  req.on('end', () => { try { prepare(raw, req.headers, process.env.AROOM_LOCAL_AUTH_HOOK_SECRET, 'http://127.0.0.1:55321/auth/v1'); res.writeHead(200, {'content-type':'application/json'}); res.end('{}'); console.log('Verified auth mail hook'); } catch { res.writeHead(401, {'content-type':'application/json'}); res.end(JSON.stringify({error:{http_code:401,message:'Invalid hook'}})); } });
}).listen(55339, '0.0.0.0', () => console.log('Local receiver listening'));
