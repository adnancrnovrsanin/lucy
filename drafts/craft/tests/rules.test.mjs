import { test } from 'node:test';
import assert from 'node:assert/strict';
import rules from '../scripts/rules/forms/index.mjs';
import { validateRule, runExample } from '../scripts/lib/engine.mjs';

test('rule ids are unique', () => {
  const ids = rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
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
