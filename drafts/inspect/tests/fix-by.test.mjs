import { test } from 'node:test';
import assert from 'node:assert/strict';
import rules from '../scripts/rules/forms/index.mjs';
import FIX_BY from '../scripts/rules/forms/fix-by.mjs';
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
