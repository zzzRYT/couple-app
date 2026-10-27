import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
it('passes the design contrast matrix', () => {
  const output = execFileSync('node', [resolve(__dirname, '../../../../../design/tools/contrast-check.mjs')], { encoding: 'utf8' });
  expect(output).toContain('229 pairs checked, 0 failures');
});
