import { str, has, expr, attr, inputType, fieldName, controlKind, hits, importsFrom } from '../../lib/helpers.mjs';
import { INPUT_LIKE } from './controls.mjs';
import { checkAutocomplete } from './autofill-tokens.mjs';

export const PERSONAL = /^(full_?name|name|first_?name|last_?name|given_?name|family_?name|surname|email|e_?mail|phone|tel|mobile|address|street|city|town|zip|postal|post_?code|country|username|user_?name|password|organi[sz]ation|company|bday|birth|dob)/i;
const HOSTS = new Set(['form', 'input', 'textarea', 'select', 'Input', 'InputGroupInput', 'Textarea', 'TextArea', 'InputGroupTextarea', 'TextField', 'Select', 'NativeSelect', 'ComboBox', 'Autocomplete', 'SearchField', 'InputOTP']);
const SKIP_TYPES = new Set(['hidden', 'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image']);
const PERSONAL_TYPES = new Set(['email', 'tel', 'password']);
const LENGTH_HOSTS = new Set(['input', 'Input', 'InputGroupInput', 'TextField', 'textarea', 'Textarea', 'TextArea']);
const LENGTH_TYPES = new Set(['text', 'email', 'password', 'search', 'url', 'tel']);
const NATIVE_INPUTS = new Set(['TextInput', 'Input', 'TextField']);
const STRIP = /\.replace\(\s*\/(?:\\D|\[\^[^\]]*\])[^/]*\/[a-z]*\s*,\s*(['"`])\1\s*\)/;
const MASK_LIBS = /^(react-input-mask|imask|react-imask|cleave\.js|maska|react-text-mask)(\/|$)/;
const autocompleteOf = (el) => str(el, 'autoComplete', 'autocomplete');

export default [
  {
    id: 'autocomplete-invalid',
    severity: 'error',
    platform: 'web',
    why: 'The autocomplete value is not valid for this element, so browsers ignore it.',
    fix: 'Use a token from the WHATWG list that fits the input type, with optional section-, shipping or billing, and home, work, or mobile before contact fields.',
    ref: 'WCAG 2.2 1.3.5 Identify Input Purpose; WHATWG HTML autofill',
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        if (!HOSTS.has(el.tag)) continue;
        const value = autocompleteOf(el);
        if (value === undefined) continue;
        const kind = controlKind(el);
        if (kind === 'form') {
          if (!['on', 'off'].includes(value.trim().toLowerCase())) out.push({ line: el.line, message: `<form autocomplete="${value}"> accepts only on or off` });
          continue;
        }
        const result = checkAutocomplete(value, { tag: kind, type: kind === 'input' ? inputType(el) : kind });
        if (!result.ok) out.push({ line: el.line, message: `autocomplete="${value}": ${result.reason}` });
      }
      return out;
    },
    good: [
      { code: 'const a = <Input type="email" autoComplete="email" />;' },
      { code: 'const a = <textarea autoComplete="shipping street-address" />;' },
      { code: 'const a = <input autoComplete="section-blue shipping postal-code" />;' },
      { code: 'const a = <input type="tel" autoComplete="work tel" />;' },
      { code: 'const a = <form autoComplete="off"><Input name="q" /></form>;' },
    ],
    bad: [
      { code: 'const a = <Input type="email" autoComplete="e-mail" />;' },
      { code: 'const a = <input type="tel" autoComplete="email" />;' },
      { code: 'const a = <input autoComplete="street-address" />;' },
    ],
  },
  {
    id: 'autocomplete-off-personal',
    severity: 'error',
    platform: 'web',
    why: 'Autofill is turned off on a personal-data field.',
    fix: 'Set the matching token (name, email, tel, street-address, username, new-password, and so on); keep autocomplete="off" for fields like search where saved values mislead.',
    ref: 'WCAG 2.2 1.3.5 Identify Input Purpose; Vercel Web Interface Guidelines, forms',
    check: ({ source }) => source.elements
      .filter((el) => HOSTS.has(el.tag) && el.tag !== 'form' && autocompleteOf(el)?.trim().toLowerCase() === 'off'
        && (PERSONAL.test(fieldName(el)) || PERSONAL_TYPES.has(inputType(el))))
      .map((el) => ({ line: el.line, message: `autocomplete="off" on "${fieldName(el) || inputType(el)}"` })),
    good: [{ code: 'const a = <Input name="bugTitle" autoComplete="off" />;' }],
    bad: [
      { code: 'const a = <Input id="name" name="fullName" autoComplete="off" />;' },
      { code: 'const a = <Input type="email" name="contact" autoComplete="off" />;' },
    ],
  },
  {
    id: 'missing-autocomplete',
    severity: 'warning',
    platform: 'web',
    why: 'A personal-data field has no autocomplete token.',
    fix: 'Add the WHATWG token for the field, for example email, tel, given-name, or current-password.',
    ref: 'WCAG 2.2 1.3.5 Identify Input Purpose',
    check: ({ source }) => source.elements
      .filter((el) => INPUT_LIKE.has(el.tag) && !has(el, 'autoComplete', 'autocomplete') && !SKIP_TYPES.has(inputType(el))
        && (PERSONAL_TYPES.has(inputType(el)) || PERSONAL.test(fieldName(el))))
      .map((el) => ({ line: el.line, message: `"${fieldName(el) || inputType(el)}" has no autocomplete token` })),
    good: [{ code: 'const a = <Input type="email" name="email" autoComplete="email" />;' }],
    bad: [
      { code: 'const a = <Input type="email" name="email" />;' },
      { code: 'const a = <Input name="firstName" />;' },
    ],
  },
  {
    id: 'native-autofill-missing',
    severity: 'warning',
    platform: 'native',
    why: 'A React Native field for personal data has no autoComplete or textContentType, so the OS cannot fill it.',
    fix: 'Set autoComplete (Android) and textContentType (iOS), for example email and emailAddress.',
    ref: 'craft forms autofill reference, React Native',
    check: ({ source }) => source.elements
      .filter((el) => NATIVE_INPUTS.has(el.tag) && !has(el, 'autoComplete', 'textContentType')
        && (has(el, 'secureTextEntry') || ['email-address', 'phone-pad'].includes(str(el, 'keyboardType') ?? '') || PERSONAL.test(fieldName(el))))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <Input keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} />;' }],
    bad: [
      { code: 'const a = <Input keyboardType="email-address" value={email} onChangeText={setEmail} />;' },
      { code: 'const a = <TextInput secureTextEntry value={pw} onChangeText={setPw} />;' },
    ],
  },
  {
    id: 'spellcheck-on-identifiers',
    severity: 'info',
    platform: 'web',
    why: 'Spellcheck runs on an email, username, or code field.',
    fix: 'Add spellCheck={false} (and autoCapitalize="off" where it applies).',
    ref: 'Vercel Web Interface Guidelines, forms',
    check: ({ source }) => source.elements
      .filter((el) => INPUT_LIKE.has(el.tag) && !has(el, 'spellCheck', 'spellcheck')
        && (inputType(el) === 'email' || /user_?name|code|otp|coupon|promo|sku|iban/i.test(fieldName(el)) || ['username', 'email', 'one-time-code'].includes(autocompleteOf(el) ?? '')))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <Input type="email" name="email" autoComplete="email" spellCheck={false} />;' }],
    bad: [{ code: 'const a = <Input type="email" name="email" autoComplete="email" />;' }],
  },
  {
    id: 'maxlength-on-text',
    severity: 'warning',
    platform: 'web',
    why: 'maxLength on a text field silently cuts off pasted or typed input.',
    fix: 'Drop maxLength, show a character count, and validate the length after trimming.',
    ref: 'GOV.UK Design System, text input and character count',
    check: ({ source }) => source.elements
      .filter((el) => LENGTH_HOSTS.has(el.tag) && has(el, 'maxLength', 'maxlength') && LENGTH_TYPES.has(inputType(el))
        && autocompleteOf(el) !== 'one-time-code' && !/otp|code|pin/i.test(fieldName(el)))
      .map((el) => ({ line: el.line, message: `maxLength on "${fieldName(el)}"` })),
    good: [
      { code: 'const a = <Input name="otp" autoComplete="one-time-code" maxLength={6} />;' },
      { code: 'const a = <InputOTP maxLength={6} />;' },
    ],
    bad: [
      { code: 'const a = <Input name="bio" maxLength={160} />;' },
      { code: 'const a = <Textarea name="message" maxLength={500} />;' },
    ],
  },
  {
    id: 'paste-blocked',
    severity: 'error',
    platform: 'all',
    why: 'Paste is blocked, which breaks password managers and assistive tools.',
    fix: 'Remove the preventDefault from the paste handler; validate the pasted value instead.',
    ref: 'WCAG 2.2 3.3.8 Accessible Authentication; Vercel Web Interface Guidelines, forms',
    check: ({ source }) => [
      ...source.elements.filter((el) => /preventDefault/.test(expr(el, 'onPaste') ?? '')).map((el) => ({ line: el.line })),
      ...hits(source, /addEventListener\(\s*['"]paste['"][\s\S]{0,200}?preventDefault/g, source.text),
    ],
    good: [{ code: 'const a = <Input onPaste={(e) => track(e)} />;' }],
    bad: [
      { code: 'const a = <Input onPaste={(e) => e.preventDefault()} />;' },
      { code: 'el.addEventListener("paste", (e) => e.preventDefault());' },
    ],
  },
  {
    id: 'input-keystroke-filter',
    severity: 'warning',
    platform: 'all',
    why: 'Keystrokes are stripped or masked as the user types.',
    fix: 'Accept what the user types, normalize on blur or in the schema, and show an error for what cannot be normalized.',
    ref: 'Vercel Web Interface Guidelines, forms; better-accessibility forms',
    check: ({ source }) => [
      ...source.elements.filter((el) => STRIP.test(expr(el, 'onChange') ?? '') || STRIP.test(expr(el, 'onChangeText') ?? '')).map((el) => ({ line: el.line })),
      ...importsFrom(source, MASK_LIBS).map((i) => ({ line: i.line, message: `input mask library ${i.from}` })),
    ],
    good: [{ code: 'const a = <Input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => setV(normalize(v))} />;' }],
    bad: [
      { code: 'const a = <Input value={v} onChange={(e) => setV(e.target.value.replace(/\\D/g, ""))} />;' },
      { code: 'import IMask from "imask";' },
    ],
  },
  {
    id: 'autofocus',
    severity: 'warning',
    platform: 'web',
    why: 'autoFocus moves focus on load, which disorients screen reader users and opens the keyboard on mobile.',
    fix: 'Remove autoFocus, or keep it only for a single primary input on a desktop-only page.',
    ref: 'Vercel Web Interface Guidelines, forms',
    check: ({ source }) => source.elements.filter((el) => has(el, 'autoFocus', 'autofocus')).map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <Input name="q" />;' }],
    bad: [{ code: 'const a = <Input autoFocus name="q" />;' }],
  },
  {
    id: 'viewport-zoom-blocked',
    severity: 'error',
    platform: 'web',
    why: 'The viewport blocks zoom.',
    fix: 'Remove maximum-scale and user-scalable; use a 16px input font to avoid iOS zoom on focus.',
    ref: 'WCAG 2.2 1.4.4 Resize Text',
    check: ({ source }) => hits(source, /maximum-scale\s*=\s*1(?:\.0+)?(?![\d.])|user-scalable\s*=\s*(?:no|0)\b|maximumScale\s*:\s*1(?![\d.])|userScalable\s*:\s*false\b/g, source.text),
    good: [{ code: 'const a = <meta name="viewport" content="width=device-width, initial-scale=1" />;' }],
    bad: [
      { code: 'const a = <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />;' },
      { code: 'export const viewport = { width: "device-width", maximumScale: 1 };' },
    ],
  },
  {
    id: 'placeholder-ellipsis',
    severity: 'info',
    platform: 'all',
    why: 'A placeholder ends in three periods.',
    fix: 'Use the ellipsis character, or better, move the example into hint text.',
    ref: 'Vercel Web Interface Guidelines, forms',
    check: ({ source }) => source.strings.filter((s) => s.attr === 'placeholder' && /\.\.\.$/.test(s.value)).map((s) => ({ line: s.line })),
    good: [{ code: 'const a = <Input placeholder="Search…" />;' }],
    bad: [{ code: 'const a = <Input placeholder="Search..." />;' }],
  },
];
