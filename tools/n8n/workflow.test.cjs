const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const workflow = JSON.parse(fs.readFileSync(__dirname + '/aroom-auth-mail.json'));
const node = name => workflow.nodes.find(n => n.name === name);
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const secret = 'v1,whsec_' + Buffer.from('test key for workflow').toString('base64');
const env = {AROOM_AUTH_HOOK_SECRET:secret, AROOM_SUPABASE_AUTH_URL:'https://example.supabase.co/auth/v1'};
const payload = {user:{id:'11111111-1111-4111-8111-111111111111',email:'test@example.test'},email_data:{email_action_type:'recovery',token_hash:'xyz',redirect_to:'aroom://auth-callback',site_url:'https://example.com'}};
function sign(raw) { const timestamp = String(Math.floor(Date.now()/1000)), id = 'test'; return {'webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':'v1,' + crypto.createHmac('sha256',Buffer.from(secret.slice(9),'base64')).update(`${id}.${timestamp}.${raw}`).digest('base64')}; }
async function code(name, json, extras = {}) { const fn = new AsyncFunction('require','Buffer','$json','$env','$','module', node(name).parameters.jsCode); return fn.call({helpers:{getBinaryDataBuffer:async()=>Buffer.from(extras.raw || '')}},require,Buffer,json,env,extras.lookup || (()=>{}),undefined); }
test('import JSON routes verification before profile lookup and delivery, with explicit response codes', () => { assert.equal(node('Webhook').parameters.options.rawBody,true); assert.equal(workflow.connections.Valid.main[0][0].node,'Read profile locale'); assert.equal(workflow.connections['Read profile locale'].main[0][0].node,'Render mail'); assert.equal(workflow.connections['Render mail'].main[0][0].node,'Send email'); assert.equal(node('Reject').parameters.options.responseCode,401); assert.equal(node('Delivery failed').parameters.options.responseCode,500); assert.equal(node('Success').parameters.options.responseCode,200); assert.match(node('Read profile locale').parameters.query,/\$1::uuid/); });
test('embedded workflow code rejects tampering and renders profile language', async () => { const raw=JSON.stringify(payload), headers=sign(raw); const [valid]=await code('Verify and prepare',{headers},{raw}); assert.equal(valid.json.valid,true); const [invalid]=await code('Verify and prepare',{headers},{raw:raw+' '}); assert.equal(invalid.json.valid,false); const [mail]=await code('Render mail',{locale:'ja-JP'},{lookup:()=>({first:()=>valid})}); assert.match(mail.json.subject,/再設定/); const link=new URL(mail.json.text.split('\n\n')[1]); assert.equal(link.searchParams.get('redirect_to'),'aroom://auth-callback'); });
