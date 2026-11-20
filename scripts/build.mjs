import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TUNING } from '../src/tuning.mjs';
assert.ok(Number(process.versions.node.split('.')[0])>=22,'Node.js >=22 required');
const contract=JSON.parse(await readFile(new URL('../game.contract.json',import.meta.url),'utf8'));
assert.deepEqual(contract.tuning,TUNING,'manifest tuning must match gameplay');
console.log('Build ready: native ES modules, no external dependencies. Contract tuning matches.');
