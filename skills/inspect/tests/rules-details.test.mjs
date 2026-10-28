import { test } from 'node:test';
import assert from 'node:assert/strict';
import rules from '../scripts/rules/details/index.mjs';
import formsRules from '../scripts/rules/forms/index.mjs';
import tablesRules from '../scripts/rules/tables/index.mjs';
import { validateRule, runExample } from '../scripts/lib/engine.mjs';

test('details rule ids are unique and never reuse a forms or tables id', () => {
  const ids = rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  const taken = new Set([...formsRules, ...tablesRules].map((r) => r.id));
  assert.deepEqual(ids.filter((id) => taken.has(id)), []);
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

// The full details rule table: id, severity, platform, and whether a version or stack gate applies.
const EXPECTED = {
  'record-guard-returns-null': 'error all',
  'loading-as-only-fallback': 'error all',
  'error-checked-after-missing-data': 'error all',
  'not-found-from-any-error': 'error all',
  'no-access-branch-missing': 'warning all',
  'effect-fetch-record': 'warning web',
  'header-before-record': 'warning all',
  'record-title-not-h1': 'warning web',
  'label-value-without-dl': 'warning web',
  'form-label-for-display': 'warning web',
  'heading-as-field-label': 'warning web',
  'disabled-input-for-display': 'error web',
  'raw-foreign-id-value': 'error web',
  'inline-date-format': 'warning web',
  'badge-color-from-data': 'warning web',
  'details-icon-button-without-name': 'error web',
  'overlay-without-title': 'error web',
  'view-page-is-form': 'error web',
  'deprecated-query-prefetch': 'warning all gated',
  'query-suspense-flag': 'warning all gated',
  'inline-key-in-prefetch': 'warning all',
  'retry-on-client-errors': 'warning all',
  'record-loader-swallows-error': 'warning all',
  'optimistic-without-cancel': 'warning all',
  'invalidation-not-returned': 'warning all',
  'cache-mutated-in-place': 'warning all',
  'optimistic-setter-outside-transition': 'warning web',
  'write-without-precondition': 'warning all',
  'effect-sets-title': 'warning web',
  'next-reset-as-retry': 'warning all gated',
  'return-not-found': 'warning all gated',
  'not-found-in-try': 'error all gated',
  'sync-params-next': 'warning all gated',
  'react-router-dom-import': 'error all gated',
  'background-location-modal': 'warning all gated',
  'deprecated-rr-view-transition': 'warning all gated',
  'manual-start-view-transition': 'warning web gated',
  'tanstack-scroll-restoration-component': 'warning all gated',
  'tab-default-from-url': 'warning web',
  'tab-param-unvalidated': 'warning web',
  'tab-state-pushes-history': 'warning web',
  'tab-path-by-index': 'warning web',
  'too-many-tabs': 'warning web',
  'disabled-tab': 'warning web',
  'back-link-history-back': 'warning web',
  'list-link-drops-query': 'warning web',
  'open-redirect-from-param': 'error all',
  'peek-in-component-state': 'warning web',
  'overlay-without-dialog-semantics': 'warning web',
  'mobile-tree-swap': 'warning web',
  'multiple-save-buttons': 'warning web',
  'save-button-disabled-when-pristine': 'warning web',
  'native-global-params-in-record': 'warning native',
  'native-params-untyped': 'warning native',
  'native-record-no-error-boundary': 'warning native',
  'native-record-no-title': 'warning native',
  'native-alert-destructive-ok': 'warning native',
  'native-chevron-without-press': 'warning native',
  'native-heading-without-role': 'warning native',
  'native-set-accessibility-focus': 'warning native',
  'native-font-scaling-off': 'warning native',
  'native-focus-effect-without-callback': 'warning native',
  'native-undo-toast-short': 'warning native',
  'native-menu-presentation-mismatch': 'warning native',
  'native-divider-import': 'error native',
  'native-flashlist-estimate': 'warning native gated',
  'native-list-in-scrollview': 'warning native',
  'native-formsheet-header-android': 'warning native',
};

test('the details rule table is exactly the planned rules', () => {
  const actual = Object.fromEntries(rules.map((r) => [r.id, `${r.severity} ${r.platform}${r.when ? ' gated' : ''}`]));
  assert.deepEqual(actual, EXPECTED);
  assert.equal(rules.length, 68);
});

test('every details rule has at least two bad and three good examples', () => {
  assert.deepEqual(rules.filter((r) => r.bad.length < 2 || r.good.length < 3).map((r) => r.id), []);
});
