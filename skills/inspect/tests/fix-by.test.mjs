import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import rules from '../scripts/rules/forms/index.mjs';
import FIX_BY from '../scripts/rules/forms/fix-by.mjs';
import tablesRules from '../scripts/rules/tables/index.mjs';
import TABLES_FIX_BY from '../scripts/rules/tables/fix-by.mjs';
import { pointerProblem, slug } from './pointers.mjs';

test('slug turns headings into anchors', () => {
  assert.equal(slug('2. Inventory the components'), '2-inventory-the-components');
  assert.equal(slug('Step 3: Field inventory'), 'step-3-field-inventory');
  assert.equal(slug('Input help: free and keyless'), 'input-help-free-and-keyless');
});

test('the fix-by map covers exactly the forms rules', () => {
  const ids = rules.map((r) => r.id).sort();
  assert.deepEqual(Object.keys(FIX_BY).sort(), ids);
});

test('every forms rule carries a fix-by pointer that resolves to a craft heading', () => {
  const problems = rules.map((r) => (r.fixBy ? pointerProblem(r.fixBy) : `${r.id} has no fixBy`)).filter(Boolean);
  assert.deepEqual(problems, []);
});

test('fix texts name no document path; the fix-by pointer carries it', () => {
  assert.deepEqual(rules.filter((r) => /forms\/[a-z/-]+\.md/.test(r.fix)).map((r) => r.id), []);
});

test('every checklist item has a unique id and a fix-by pointer that resolves', () => {
  const checklist = join(dirname(fileURLToPath(import.meta.url)), '..', 'forms', 'checklist.md');
  const items = readFileSync(checklist, 'utf8').split('\n').filter((line) => line.startsWith('- [ ] '));
  assert.equal(items.length, 27);
  const ids = items.map((line) => /^- \[ \] `([a-z0-9-]+)` /.exec(line)?.[1]);
  assert.ok(ids.every(Boolean), 'every item starts with an id');
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  const problems = items.map((line) => pointerProblem(/ Fix by: (\S+)$/.exec(line)?.[1])).filter(Boolean);
  assert.deepEqual(problems, []);
});

test('the tables fix-by map covers exactly the tables rules', () => {
  assert.deepEqual(Object.keys(TABLES_FIX_BY).sort(), tablesRules.map((r) => r.id).sort());
});

test('every tables rule carries a fix-by pointer that resolves to a craft/tables heading', () => {
  const problems = tablesRules.map((r) => (r.fixBy ? pointerProblem(r.fixBy) : `${r.id} has no fixBy`)).filter(Boolean);
  assert.deepEqual(problems, []);
  assert.deepEqual(tablesRules.filter((r) => !/^craft\/(tables|kinds\.md)/.test(r.fixBy)).map((r) => r.id), []);
});

test('every tables checklist item has a unique id and a fix-by pointer that resolves', () => {
  const checklist = join(dirname(fileURLToPath(import.meta.url)), '..', 'tables', 'checklist.md');
  const items = readFileSync(checklist, 'utf8').split('\n').filter((line) => line.startsWith('- [ ] '));
  assert.equal(items.length, 34);
  const ids = items.map((line) => /^- \[ \] `([a-z0-9-]+)` /.exec(line)?.[1]);
  assert.ok(ids.every(Boolean), 'every item starts with an id');
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  const problems = items.map((line) => pointerProblem(/ Fix by: (\S+)$/.exec(line)?.[1])).filter(Boolean);
  assert.deepEqual(problems, []);
});

test('value kinds live in craft/kinds.md, not in the tables projection', () => {
  const moved = ['money-raw-or-tofixed', 'hardcoded-number-locale', 'placeholder-cell-glyph', 'truncate-without-full-value'];
  assert.deepEqual(moved.filter((id) => !TABLES_FIX_BY[id].startsWith('craft/kinds.md#')), []);
});
