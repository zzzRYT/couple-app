import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validTesterChange } from '../lib/tester-input.mjs';
import { isAllowed } from '../lib/access.mjs';
test('tester changes accept only valid actions and email addresses', () => {
  assert.equal(validTesterChange('add', 'person@example.com'), true);
  assert.equal(validTesterChange('remove', 'person@example.com'), true);
  assert.equal(validTesterChange('delete', 'person@example.com'), false);
  assert.equal(validTesterChange('add', 'bad'), false);
  assert.equal(validTesterChange('add', 'a'.repeat(321)), false);
});
test('the allowlist rejects a removed or unverified administrator', () => {
  const session = {user:{email:'admin@example.com', emailVerified:true}};
  assert.equal(isAllowed(session, 'admin@example.com'), true);
  assert.equal(isAllowed(session, 'other@example.com'), false);
  assert.equal(isAllowed({user:{...session.user, emailVerified:false}}, 'admin@example.com'), false);
});
