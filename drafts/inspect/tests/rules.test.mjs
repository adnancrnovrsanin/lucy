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

const EXPECTED = {
  'raw-date-input': 'error web', 'raw-select': 'error web', 'enum-as-text': 'error all', 'raw-form-control': 'warning web',
  'select-multiple': 'warning web', 'option-count-mismatch': 'warning all', 'calendar-only-dob': 'warning all',
  'number-input-for-codes': 'error all', 'number-input': 'warning web', 'money-tofixed': 'warning all',
  'split-card-number': 'info web', 'honorific-select': 'info all',
  'placeholder-as-label': 'error all', 'unlabeled-control': 'error web', 'orphan-label': 'warning web',
  'aria-ref-missing-id': 'warning web', 'label-not-in-name': 'warning all', 'required-marker-announced': 'info web',
  'manual-aria-in-library-field': 'warning web',
  'autocomplete-invalid': 'error web', 'autocomplete-off-personal': 'error web', 'missing-autocomplete': 'warning web',
  'native-autofill-missing': 'warning native', 'spellcheck-on-identifiers': 'info web', 'maxlength-on-text': 'warning web',
  'paste-blocked': 'error all', 'input-keystroke-filter': 'warning all', 'autofocus': 'warning web',
  'viewport-zoom-blocked': 'error web', 'placeholder-ellipsis': 'info all',
  'disabled-until-valid': 'error all', 'pending-native-disabled': 'info web', 'coerce-boolean': 'warning all',
  'coerce-number-optional': 'warning all', 'latin-only-name-pattern': 'warning all', 'password-composition': 'info all',
  'confirm-email-field': 'warning all', 'preselected-consent': 'error all', 'quoted-template-placeholder': 'error all',
  'error-message-wording': 'info all', 'index-key-field-array': 'warning all',
  'swallowed-submit-error': 'warning all', 'toast-only-submit-error': 'warning all', 'alert-for-errors': 'warning web',
  'reset-in-catch': 'warning all', 'live-region-mount-with-text': 'warning web', 'assertive-live-region': 'info web',
  'aria-invalid-literal': 'info web', 'no-unsaved-guard': 'info all', 'retry-on-mutation': 'info all',
  'unencoded-url-param': 'warning all', 'account-enumeration-message': 'warning all', 'nested-useform': 'warning all',
  'object-url-leak': 'info web',
  'positive-tabindex': 'warning web', 'div-onclick': 'warning web', 'role-without-keys': 'warning web',
  'outline-none-no-focus-visible': 'warning web', 'tooltip-on-disabled': 'warning web', 'drag-without-alternative': 'warning all',
  'sticky-submit-no-scroll-padding': 'info web',
  'heroui-errormessage-prop': 'error web', 'heroui-rhf-validation-behavior': 'warning web', 'heroui-react-stately-import': 'error web',
  'heroui-listbox-name-id': 'info web', 'picker-value-through-date': 'warning all', 'native-daterange-unparsed': 'info native',
  'shadcn-controller-missing-ref': 'warning web', 'shadcn-legacy-form-api': 'info web', 'date-format-no-locale': 'warning all',
};

test('the forms table holds exactly the 70 rules of the spec', () => {
  assert.equal(Object.keys(EXPECTED).length, 70);
  assert.equal(rules.length, 70);
  assert.deepEqual(Object.fromEntries(rules.map((r) => [r.id, `${r.severity} ${r.platform}`])), EXPECTED);
});
