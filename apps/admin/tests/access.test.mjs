import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { isAllowed, testSession } from '../lib/access.mjs';
const list = 'admin@example.invalid,other@example.invalid';
test('requires a session',()=>assert.equal(isAllowed(null,list),false));
test('rejects non-allowlisted and unverified sessions',()=>{
 assert.equal(isAllowed({user:{email:'outsider@example.invalid',emailVerified:true}},list),false);
 assert.equal(isAllowed({user:{email:'admin@example.invalid',emailVerified:false}},list),false);
 assert.equal(isAllowed({user:{email:'admin@example.invalid'}},list),false);
});
test('accepts only verified allowlisted addresses',()=>assert.equal(isAllowed({user:{email:'ADMIN@example.invalid',emailVerified:true}},list),true));
test('test bypass cannot be enabled in production or against a remote database',()=>{
 const base={ADMIN_TEST_BYPASS:'1',ADMIN_TEST_EMAIL:'admin@example.invalid',ADMIN_DATABASE_URL:'postgres://localhost/test'};
 assert.equal(testSession({...base,NODE_ENV:'production'}),null);
 assert.equal(testSession({...base,NODE_ENV:'development',VERCEL_ENV:'production'}),null);
 assert.equal(testSession({...base,NODE_ENV:'development',ADMIN_DATABASE_URL:'postgres://localhost/test?host=remote.example'}),null);
 assert.equal(testSession({...base,NODE_ENV:'test'}),null);
 assert.equal(testSession({...base,NODE_ENV:'development',ADMIN_DATABASE_URL:'postgres://remote.example/test'}),null);
 assert.equal(isAllowed(testSession({...base,NODE_ENV:'development'}),list),true);
 assert.equal(testSession({...base,NODE_ENV:'development',ADMIN_TEST_BYPASS:'0'}),null);
});

test('signed session tokens are verified before the allowlist is consulted', async()=>{
 const require = createRequire(import.meta.url);
 const { encode, getToken } = require('next-auth/jwt');
 const { NextRequest } = require('next/server');
 const secret='local-test-secret-with-at-least-32-characters';
 const issue = (claims,maxAge=3600)=>encode({secret,token:claims,maxAge});
 async function read(raw) {
   const request=new NextRequest('http://localhost/',{headers:{cookie:`next-auth.session-token=${raw}`}});
   const token=await getToken({req:request,secret,secureCookie:false});
   return token ? isAllowed({user:{email:token.email,emailVerified:token.emailVerified}},list) : false;
 }
 assert.equal(await read(await issue({email:'admin@example.invalid',emailVerified:true})),true);
 assert.equal(await read(await issue({email:'outsider@example.invalid',emailVerified:true})),false);
 assert.equal(await read(await issue({email:'admin@example.invalid',emailVerified:false})),false);
 assert.equal(await read(await issue({email:'admin@example.invalid',emailVerified:true},-60)),false);
 assert.equal(await read('tampered.invalid.token'),false);
});
