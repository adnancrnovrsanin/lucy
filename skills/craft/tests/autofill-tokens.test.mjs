import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, ALL_FIELDS, checkAutocomplete } from '../scripts/rules/forms/autofill-tokens.mjs';

test('the WHATWG field-name list is complete', () => {
  const counts = Object.fromEntries(Object.entries(GROUPS).map(([group, names]) => [group, names.length]));
  assert.deepEqual(counts, { text: 36, multiline: 1, username: 2, password: 3, url: 3, tel: 1, numeric: 6, month: 1, date: 1 });
  assert.equal(ALL_FIELDS.size, 54);
});

test('accepts valid values with modifiers', () => {
  assert.deepEqual(checkAutocomplete('email', { tag: 'input', type: 'email' }), { ok: true, field: 'email' });
  assert.equal(checkAutocomplete('section-blue shipping postal-code', { tag: 'input', type: 'text' }).ok, true);
  assert.equal(checkAutocomplete('work tel', { tag: 'input', type: 'tel' }).ok, true);
  assert.equal(checkAutocomplete('shipping street-address', { tag: 'textarea', type: 'textarea' }).ok, true);
  assert.equal(checkAutocomplete('new-password', { tag: 'input', type: 'text' }).ok, true);
  assert.equal(checkAutocomplete('username webauthn', { tag: 'input', type: 'text' }).ok, true);
  assert.equal(checkAutocomplete('off', { tag: 'input', type: 'text' }).ok, true);
});

test('rejects unknown names, misplaced tokens, and wrong elements', () => {
  assert.match(checkAutocomplete('e-mail', { tag: 'input', type: 'email' }).reason, /not an autofill field name/);
  assert.match(checkAutocomplete('email', { tag: 'input', type: 'tel' }).reason, /not allowed on type="tel"/);
  assert.match(checkAutocomplete('street-address', { tag: 'input', type: 'text' }).reason, /not allowed/);
  assert.match(checkAutocomplete('home postal-code', { tag: 'input', type: 'text' }).reason, /can only precede a contact field/);
  assert.match(checkAutocomplete('billing work', { tag: 'input', type: 'text' }).reason, /not an autofill field name/);
  assert.match(checkAutocomplete('username webauthn', { tag: 'select', type: 'select' }).reason, /webauthn/);
  assert.match(checkAutocomplete('bday', { tag: 'input', type: 'time' }).reason, /accepts only on or off/);
  assert.match(checkAutocomplete('shipping section-a name', { tag: 'input', type: 'text' }).reason, /unexpected token "shipping"/);
});
