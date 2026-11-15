const fs = require('fs');
const path = require('path');
const dir = __dirname;
const core = fs.readFileSync(path.join(dir, 'auth-mail-core.cjs'), 'utf8');
const verifyCode = `${core}\ntry {\n const raw = (await this.helpers.getBinaryDataBuffer(0, 'data')).toString('utf8');\n const config = $('Config').first().json;\n prepare(raw, $json.headers, config.hookSecret, config.supabaseAuthUrl);\n const id = JSON.parse(raw).user.id;\n if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw Error('Invalid user');\n return [{json: {valid: true, raw, headers: $json.headers, userId: id}}];\n} catch (_) { return [{json: {valid: false}}]; }`;
const renderCode = `${core}\nconst verified = $('Verify and prepare').first().json, config = $('Config').first().json;\nreturn prepare(verified.raw, verified.headers, config.hookSecret, config.supabaseAuthUrl, Date.now(), $json.locale).map(json => ({json}));`;

const config = { hookSecret:'PASTE_SUPABASE_SEND_EMAIL_HOOK_SECRET', supabaseAuthUrl:'PASTE_https://PROJECT_REF.supabase.co/auth/v1', mailFrom:'aroom20261024@gmail.com' };

const nodes = [
  { parameters: { httpMethod:'POST', path:'aroom-auth-mail', responseMode:'responseNode', options:{rawBody:true} }, id:'hook', name:'Webhook', type:'n8n-nodes-base.webhook', typeVersion:2, position:[0,0], webhookId:'aroom-auth-mail' },
  { parameters:{mode:'manual',assignments:{assignments:Object.entries(config).map(([name,value]) => ({id:name,name,value,type:'string'}))},includeOtherFields:true,include:'all',options:{}}, id:'config', name:'Config', type:'n8n-nodes-base.set', typeVersion:3.4, position:[110,0] },
  { parameters:{jsCode:verifyCode}, id:'verify', name:'Verify and prepare', type:'n8n-nodes-base.code', typeVersion:2, position:[220,0] },
  { parameters:{conditions:{options:{caseSensitive:true, typeValidation:'strict'}, conditions:[{id:'valid',leftValue:'={{ $json.valid }}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}, id:'if',name:'Valid',type:'n8n-nodes-base.if',typeVersion:2.2,position:[440,0] },
  { parameters:{operation:'executeQuery',query:'SELECT (SELECT locale FROM public.user_profile WHERE user_id = $1::uuid) AS locale',options:{queryReplacement:'={{ $(\"Verify and prepare\").first().json.userId }}'}},id:'locale',name:'Read profile locale',type:'n8n-nodes-base.postgres',typeVersion:2.6,position:[630,-100],onError:'continueErrorOutput' },
  { parameters:{jsCode:renderCode},id:'render',name:'Render mail',type:'n8n-nodes-base.code',typeVersion:2,position:[800,-100] },
  { parameters:{fromEmail:'={{ $("Config").first().json.mailFrom }}',toEmail:'={{ $json.to }}',subject:'={{ $json.subject }}',emailFormat:'text',text:'={{ $json.text }}',options:{appendAttribution:false}},id:'send',name:'Send email',type:'n8n-nodes-base.emailSend',typeVersion:2.1,position:[660,-100],onError:'continueRegularOutput' },
  { parameters:{jsCode:"return [{json: {failed: $input.all().some(item => !!item.json.error)}}];"},id:'result',name:'Check delivery',type:'n8n-nodes-base.code',typeVersion:2,position:[860,-100] },
  { parameters:{conditions:{options:{typeValidation:'strict'},conditions:[{id:'failed',leftValue:'={{ $json.failed }}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}},id:'sentif',name:'Delivery error',type:'n8n-nodes-base.if',typeVersion:2.2,position:[1060,-100] },
  { parameters:{respondWith:'json',responseBody:'={{ {} }}',options:{responseCode:200}},id:'ok',name:'Success',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[900,-180],executeOnce:true },
  { parameters:{respondWith:'json',responseBody:'={{ { "error": { "http_code": 500, "message": "Email delivery failed" } } }}',options:{responseCode:500}},id:'fail',name:'Delivery failed',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[900,-20],executeOnce:true },
  { parameters:{respondWith:'json',responseBody:'={{ { "error": { "http_code": 401, "message": "Invalid webhook" } } }}',options:{responseCode:401}},id:'reject',name:'Reject',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[660,130] }
];
const main = (...names) => names.map(name => [{node:name,type:'main',index:0}]);
const workflow = {name:'Aroom auth mail',nodes,connections:{Webhook:{main:main('Config')},Config:{main:main('Verify and prepare')},'Verify and prepare':{main:main('Valid')},Valid:{main:main('Read profile locale','Reject')},'Read profile locale':{main:main('Render mail','Delivery failed')},'Render mail':{main:main('Send email')},'Send email':{main:main('Check delivery')},'Check delivery':{main:main('Delivery error')},'Delivery error':{main:main('Delivery failed','Success')}},settings:{executionOrder:'v1',saveDataSuccessExecution:'none',saveDataErrorExecution:'none',saveManualExecutions:false},active:false};
fs.writeFileSync(path.join(dir,'aroom-auth-mail.json'),JSON.stringify(workflow,null,2)+'\n');
