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

const EXPECTED = {
  'tanstack-v8-api-in-v9': 'error all',
  'tanstack-v9-api-in-v8': 'error all',
  'table-unstable-data': 'warning all',
  'manual-flags-mixed': 'error all',
  'manual-pagination-without-count': 'warning all',
  'row-count-without-manual-pagination': 'error all',
  'selection-without-row-id': 'warning all',
  'row-id-from-index': 'warning all',
  'index-key-on-rows': 'warning web',
  'virtualizer-counts-data': 'warning all',
  'measure-without-data-index': 'warning web',
  'rows-mapped-beside-virtualizer': 'warning web',
  'sortable-th-without-button': 'error web',
  'aria-sort-misuse': 'warning web',
  'table-without-name': 'error web',
  'th-without-scope': 'warning web',
  'grid-role-without-keyboard': 'error web',
  'aria-selected-on-table-row': 'warning web',
  'table-display-override': 'warning web',
  'nested-table': 'warning web',
  'numeric-cell-alignment': 'warning web',
  'money-raw-or-tofixed': 'warning all',
  'hardcoded-number-locale': 'warning all',
  'placeholder-cell-glyph': 'warning all',
  'centered-data-cell': 'warning web',
  'truncate-without-full-value': 'warning web',
  'row-click-navigation-without-link': 'warning web',
  'hover-only-row-actions': 'warning web',
  'icon-action-without-name': 'error web',
  'constant-row-checkbox-label': 'warning web',
  'select-all-without-indeterminate': 'warning web',
  'zebra-with-selection': 'warning web',
  'pagination-div-onclick': 'warning web',
  'table-scroll-snap': 'warning web',
  'scroll-container-without-region': 'warning web',
  'sticky-header-without-background': 'warning web',
  'filter-input-in-thead': 'warning web',
  'spinner-instead-of-table': 'warning web',
  'error-as-empty-rows': 'warning all',
  'query-without-error-branch': 'warning web',
  'raw-sql-filter-field': 'error all',
  'like-pattern-unescaped': 'warning all',
  'search-params-json-unvalidated': 'warning all',
  'order-by-interpolated': 'error all',
  'dynamic-code-in-filter': 'error all',
  'query-data-copied-to-state': 'warning all',
  'constant-query-key-with-table-state': 'warning all',
  'heroui-table-without-name': 'error web',
  'heroui-table-without-row-header': 'error web',
  'rac-header-groups-first': 'warning web',
  'sort-descriptor-without-handler': 'warning web',
  'heroui-selection-without-checkbox': 'warning web',
  'ag-grid-container-without-height': 'warning web',
  'ag-grid-enterprise-import': 'info all',
  'rdg-rows-recreated': 'warning all',
};

test('the tables table holds exactly the 55 rules of the plan', () => {
  assert.equal(Object.keys(EXPECTED).length, 55);
  assert.equal(rules.length, 55);
  assert.deepEqual(Object.fromEntries(rules.map((r) => [r.id, `${r.severity} ${r.platform}`])), EXPECTED);
});
