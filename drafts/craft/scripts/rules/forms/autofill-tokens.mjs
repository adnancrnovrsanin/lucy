// Autofill field names, control groups, and grammar from the WHATWG HTML Living Standard,
// section 4.10.19.7 "Autofill" (https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill),
// commit snapshot 939677714df7379fee3667040113b41c91c851e7, read 2026-10-27.
// Copyright WHATWG (Apple, Google, Mozilla, Microsoft). Portions of the standard incorporated
// into source code are licensed under the BSD 3-Clause License; the notice is in this skill's LICENSE.

export const GROUPS = {
  text: [
    'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix', 'nickname',
    'organization-title', 'organization', 'address-line1', 'address-line2', 'address-line3', 'address-level4',
    'address-level3', 'address-level2', 'address-level1', 'country', 'country-name', 'postal-code', 'cc-name',
    'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-csc', 'cc-type', 'transaction-currency',
    'language', 'sex', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix',
    'tel-local-suffix', 'tel-extension',
  ],
  multiline: ['street-address'],
  username: ['username', 'email'],
  password: ['new-password', 'current-password', 'one-time-code'],
  url: ['url', 'photo', 'impp'],
  tel: ['tel'],
  numeric: ['cc-exp-month', 'cc-exp-year', 'transaction-amount', 'bday-day', 'bday-month', 'bday-year'],
  month: ['cc-exp'],
  date: ['bday'],
};

export const ALL_FIELDS = new Set(Object.values(GROUPS).flat());
export const CONTACT_FIELDS = new Set(['tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix', 'tel-local-suffix', 'tel-extension', 'email', 'impp']);
const CONTACT_TYPES = new Set(['home', 'work', 'mobile', 'fax', 'pager']);
const TYPE_GROUP = { password: 'password', url: 'url', email: 'username', tel: 'tel', number: 'numeric', month: 'month', date: 'date' };
const ON_OFF_ONLY = new Set(['week', 'time', 'datetime-local', 'range', 'color']);

function allowedFields(tag, type) {
  if (tag === 'textarea' || tag === 'select' || type === 'hidden') return ALL_FIELDS;
  if (type === 'text' || type === 'search') return new Set([...ALL_FIELDS].filter((f) => f !== 'street-address'));
  if (TYPE_GROUP[type]) return new Set(GROUPS[TYPE_GROUP[type]]);
  if (ON_OFF_ONLY.has(type)) return 'on-off';
  return null;
}

export function checkAutocomplete(value, { tag = 'input', type = 'text' } = {}) {
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, reason: 'empty autocomplete value' };
  if (tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')) {
    return type === 'hidden' ? { ok: false, reason: 'on and off are not allowed on hidden inputs' } : { ok: true };
  }
  const rest = [...tokens];
  if (rest[rest.length - 1] === 'webauthn') {
    if (tag === 'select') return { ok: false, reason: 'webauthn is not allowed on select' };
    rest.pop();
  }
  const field = rest.pop();
  if (!field || !ALL_FIELDS.has(field)) return { ok: false, reason: `"${field ?? ''}" is not an autofill field name` };
  if (rest.length && CONTACT_TYPES.has(rest[rest.length - 1])) {
    if (!CONTACT_FIELDS.has(field)) return { ok: false, reason: `"${rest[rest.length - 1]}" can only precede a contact field` };
    rest.pop();
  }
  if (rest.length && (rest[rest.length - 1] === 'shipping' || rest[rest.length - 1] === 'billing')) rest.pop();
  if (rest.length && rest[rest.length - 1].startsWith('section-')) rest.pop();
  if (rest.length) return { ok: false, reason: `unexpected token "${rest[rest.length - 1]}"` };
  const allowed = allowedFields(tag, type);
  if (allowed === 'on-off') return { ok: false, reason: `type="${type}" accepts only on or off` };
  if (allowed && !allowed.has(field)) {
    return { ok: false, reason: `"${field}" is not allowed on ${tag === 'input' ? `type="${type}"` : `<${tag}>`}` };
  }
  return { ok: true, field };
}
