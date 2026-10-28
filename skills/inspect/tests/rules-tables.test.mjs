import { test } from 'node:test';
import assert from 'node:assert/strict';
import rules from '../scripts/rules/tables/index.mjs';
import formsRules from '../scripts/rules/forms/index.mjs';
import { validateRule, runExample } from '../scripts/lib/engine.mjs';

test('tables rule ids are unique and never reuse a forms id', () => {
  const ids = rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  const forms = new Set(formsRules.map((r) => r.id));
  assert.deepEqual(ids.filter((id) => forms.has(id)), []);
});

for (const rule of rules) {
  test(`${rule.id} has a valid shape`, () => {
    assert.deepEqual(validateRule(rule), []);
  });

  test(`${rule.id} fires on every bad example`, () => {
    for (const example of rule.bad) {
      const result = runExample(rule, example);
      assert.equal(result.unreadable, undefined, `unreadable example:\n${example.code}`);
      assert.ok(result.findings.some((f) => f.rule === rule.id), `did not fire on:\n${example.code}`);
    }
  });

  test(`${rule.id} stays quiet on every good example`, () => {
    for (const example of rule.good) {
      const result = runExample(rule, example);
      assert.equal(result.unreadable, undefined, `unreadable example:\n${example.code}`);
      assert.ok(!result.findings.some((f) => f.rule === rule.id), `fired on:\n${example.code}`);
    }
  });
}
