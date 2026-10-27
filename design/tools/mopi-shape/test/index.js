// Entry point for `node --test design/tools/mopi-shape/test/`.
// Node 22 treats a directory argument as a module path (older versions scanned the directory), so this file
// loads every *.test.mjs next to it. Do not combine it with the glob form (`test/*.test.mjs`) in one run.
'use strict';
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  for (const f of readdirSync(__dirname).filter(name => name.endsWith('.test.mjs')).sort()) await import(pathToFileURL(join(__dirname, f)).href);
})();
