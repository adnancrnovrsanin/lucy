import { has, expr, isTrue, inputType, fieldName, isSubmitButton, hits, lineText, blocks } from '../../lib/helpers.mjs';

const VALIDITY = /\b(isValid|isDirty|canSubmit|isInvalid)\b/;
const PENDING = /\b(isSubmitting|isPending|pending|loading|submitting)\b/;
const CONFIRM_EMAIL = /\b(confirm_?email|email_?confirm(?:ation)?|repeat_?email|verify_?email|email_?again|email2)\b/i;
const CONSENT = /consent|terms|agree|marketing|newsletter|opt_?in|subscribe/i;
const CONSENT_KEY_TRUE = /\b\w*(?:consent|terms|agree|marketing|newsletter|opt_?in|subscribe)\w*\s*:\s*true\b/gi;
const CONSENT_ZOD_DEFAULT = /\b\w*(?:consent|terms|agree|marketing|newsletter|opt_?in|subscribe)\w*\s*:\s*z\.boolean\(\)[^,\n]*\.default\(\s*true\s*\)/gi;
const BAD_WORDING = /\b(please|sorry|oops|invalid)\b|is required|an error occurred|something went wrong/i;
const MESSAGE_CONTEXT = /z\.|\.min\(|\.max\(|\.regex\(|\.refine\(|message\s*:|error\s*:|setError\s*\(|errorMap/;
const disabledExpr = (el) => [expr(el, 'disabled'), expr(el, 'isDisabled'), expr(el, 'aria-disabled')].filter(Boolean).join(' ');

export default [
  {
    id: 'disabled-until-valid',
    severity: 'error',
    platform: 'all',
    why: 'Submit is disabled until the form is valid, so users get no list of what is wrong.',
    fix: 'Keep submit enabled; on submit, show inline errors and focus the first one or the error summary. Disable or mark pending only while the request runs.',
    ref: 'Vercel Web Interface Guidelines, forms; GOV.UK Design System, button',
    check: ({ source }) => source.elements
      .filter((el) => isSubmitButton(el) && VALIDITY.test(disabledExpr(el)))
      .map((el) => ({ line: el.line, message: `submit disabled by "${disabledExpr(el)}"` })),
    good: [{ code: 'const a = <Button type="submit" disabled={form.formState.isSubmitting}>Save</Button>;' }],
    bad: [
      { code: 'const a = <Button type="submit" disabled={!form.formState.isValid}>Save</Button>;' },
      { code: 'const a = <Button type="submit" isDisabled={!value || isInvalid}>Book</Button>;' },
    ],
  },
  {
    id: 'pending-native-disabled',
    severity: 'info',
    platform: 'web',
    why: 'Native disabled on the focused submit button drops focus to the page body while the request runs.',
    fix: 'Use the library pending prop (isPending) or aria-disabled="true" with repeat clicks ignored in the handler, and keep the label beside a spinner.',
    ref: 'better-accessibility forms',
    check: ({ source }) => source.elements
      .filter((el) => isSubmitButton(el) && !has(el, 'isPending') && PENDING.test(expr(el, 'disabled') ?? '') && !VALIDITY.test(expr(el, 'disabled') ?? ''))
      .map((el) => ({ line: el.line })),
    good: [
      { code: 'const a = <Button type="submit" aria-disabled={isSubmitting}>Save</Button>;' },
      { code: 'const a = <Button type="submit" isPending={isSubmitting}>Save</Button>;' },
    ],
    bad: [{ code: 'const a = <Button type="submit" disabled={isSubmitting}>Save</Button>;' }],
  },
  {
    id: 'coerce-boolean',
    severity: 'warning',
    platform: 'all',
    why: 'z.coerce.boolean() turns the string "false" into true.',
    fix: 'Use z.stringbool() (Zod 4) or map "true" and "false" explicitly.',
    ref: 'craft forms field map, value rules',
    check: ({ source }) => hits(source, /z\.coerce\.boolean\(/g),
    good: [{ code: 'const s = z.object({ active: z.stringbool() });' }],
    bad: [{ code: 'const s = z.object({ active: z.coerce.boolean() });' }],
  },
  {
    id: 'coerce-number-optional',
    severity: 'warning',
    platform: 'all',
    why: 'z.coerce.number() turns an empty input into 0, so an optional number is never empty.',
    fix: 'Map "" to undefined (or null for a nullable column) with z.preprocess before the number schema.',
    ref: 'craft forms field map, value rules',
    check: ({ source }) => hits(source, /z\.coerce\.number\(\)[^,;\n]*?\.(?:optional|nullable|nullish)\(/g),
    good: [{ code: 'const s = z.object({ price: z.coerce.number().positive() });' }],
    bad: [{ code: 'const s = z.object({ price: z.coerce.number().positive().optional() });' }],
  },
  {
    id: 'latin-only-name-pattern',
    severity: 'warning',
    platform: 'all',
    why: 'A name field only accepts ASCII letters, rejecting accents, apostrophes, and non-Latin names.',
    fix: 'Validate names by length after trimming; allow any letters, marks, spaces, apostrophes, and hyphens.',
    ref: 'GOV.UK Design System, names pattern; web.dev address form best practices',
    check: ({ source }) => hits(source, /\/\^?\[(?:a-zA-Z|A-Za-z)[^\]]*\][^/\n]*\/|\/\^?\\w[^/\n]*\//g)
      .filter((h) => /\b\w*name\w*\s*:/i.test(lineText(source, source.lineOf(h.index)))),
    good: [{ code: 'const s = z.object({ firstName: z.string().trim().min(1) });' }],
    bad: [{ code: 'const s = z.object({ firstName: z.string().regex(/^[a-zA-Z ]+$/, "Letters only") });' }],
  },
  {
    id: 'password-composition',
    severity: 'info',
    platform: 'all',
    why: 'The password schema demands character classes; NIST SP 800-63B advises length and a blocklist instead.',
    fix: 'Require a minimum length (8 or more), no maximum, and reject common or breached passwords; confirm the backend enforces the same policy.',
    ref: 'NIST SP 800-63B; GOV.UK Design System, passwords',
    check: ({ source }) => hits(source, /\/(?:\[A-Z\]|\[a-z\]|\[0-9\]|\\d|\[\^A-Za-z0-9\]|\[\^a-zA-Z0-9\])[^/\n]*\//g)
      .filter((h) => /password/i.test(lineText(source, source.lineOf(h.index)))),
    good: [{ code: 'const s = z.object({ password: z.string().min(8) });' }],
    bad: [{ code: 'const s = z.object({ password: z.string().min(8).regex(/[A-Z]/, "One uppercase letter") });' }],
  },
  {
    id: 'confirm-email-field',
    severity: 'warning',
    platform: 'all',
    why: 'The form asks for the email twice.',
    fix: 'Drop the confirmation field; show the email back on the review step or send a verification link.',
    ref: 'marketingskills cro form reference; web.dev sign-up form best practices',
    check: ({ source }) => {
      const lines = new Set([
        ...source.elements.filter((el) => CONFIRM_EMAIL.test(fieldName(el))).map((el) => el.line),
        ...hits(source, new RegExp(`${CONFIRM_EMAIL.source}\\s*:`, 'gi')).map((h) => source.lineOf(h.index)),
      ]);
      return [...lines].map((line) => ({ line }));
    },
    good: [{ code: 'const schema = z.object({ email: z.email(), password: z.string(), confirmPassword: z.string() });' }],
    bad: [
      { code: 'const schema = z.object({ email: z.email(), confirmEmail: z.email() });' },
      { code: 'const a = <Input name="email_confirmation" type="email" />;' },
    ],
  },
  {
    id: 'preselected-consent',
    severity: 'error',
    platform: 'all',
    why: 'A consent, terms, or marketing choice starts checked; a pre-ticked box is not consent.',
    fix: 'Start the box unchecked and let the user tick it.',
    ref: 'GDPR Recital 32; designer-skills form-design',
    check: ({ source, path }) => (/\.(test|spec|stories)\.[jt]sx?$/.test(path) ? [] : [
      ...source.elements
        .filter((el) => ['Checkbox', 'Switch', 'CheckboxGroupItem', 'input'].includes(el.tag) && (el.tag !== 'input' || inputType(el) === 'checkbox')
          && CONSENT.test(fieldName(el)) && ['defaultChecked', 'checked', 'defaultSelected', 'isSelected'].some((n) => isTrue(el, n)))
        .map((el) => ({ line: el.line, message: `"${fieldName(el)}" starts checked` })),
      ...blocks(source, /\bdefaultValues\s*[:=]\s*\{/g)
        .flatMap((b) => [...b.body.matchAll(CONSENT_KEY_TRUE)].map((m) => ({ index: b.open + 1 + m.index }))),
      ...hits(source, CONSENT_ZOD_DEFAULT),
    ]),
    good: [
      { code: 'const a = <Checkbox id="newsletter" name="newsletter" />;' },
      { code: 'const form = useForm({ defaultValues: { acceptTerms: false } });' },
      { code: 'const record = { consumerConsent: true, reason: "Repair" };' },
      { code: 'const a = <Checkbox name="terms" defaultChecked />;', file: 'consent.test.tsx' },
    ],
    bad: [
      { code: 'const a = <Checkbox id="newsletter" name="newsletter" defaultChecked />;' },
      { code: 'const form = useForm({ defaultValues: { acceptTerms: true } });' },
      { code: 'const s = z.object({ marketingOptIn: z.boolean().default(true) });' },
    ],
  },
  {
    id: 'quoted-template-placeholder',
    severity: 'error',
    platform: 'all',
    why: 'A ${...} placeholder sits inside a quoted string, so it is never interpolated.',
    fix: 'Use a template literal (backticks) for the string.',
    ref: 'omer-metin forms-validation patterns',
    check: ({ source }) => source.strings
      .filter((s) => (s.quote === '"' || s.quote === "'") && /\$\{[^}]+\}/.test(s.value) && !/^\$\{[A-Z_]+\}$/.test(s.value))
      .map((s) => ({ line: s.line, message: `"${s.value}" is a quoted string, not a template literal` })),
    good: [{ code: 'const a = register(`items.${index}.name`);' }],
    bad: [{ code: 'const a = register("items.${index}.name");' }],
  },
  {
    id: 'error-message-wording',
    severity: 'info',
    platform: 'all',
    why: 'A validation message is generic or apologetic instead of saying how to fix the problem.',
    fix: 'Say what to do, reusing the label: "Enter your email address", "Postcode must be 8 characters or less".',
    ref: 'GOV.UK Design System, error message',
    check: ({ source }) => source.strings
      .filter((s) => BAD_WORDING.test(s.value) && MESSAGE_CONTEXT.test(lineText(source, s.line)))
      .map((s) => ({ line: s.line, message: `message "${s.value}"` })),
    good: [{ code: 'const s = z.object({ email: z.email({ error: "Enter an email address in the correct format, like name@example.com" }) });' }],
    bad: [{ code: 'const s = z.object({ email: z.email({ message: "Invalid email" }) });' }],
  },
  {
    id: 'index-key-field-array',
    severity: 'warning',
    platform: 'all',
    why: 'Field-array rows are keyed by index, so state moves to the wrong row after a remove or reorder.',
    fix: 'Key each row by the library\'s stable id (field.id in React Hook Form).',
    ref: 'shadcn/ui forms docs, array fields',
    check: ({ source }) => {
      const arrayFile = /\buseFieldArray\s*\(/.test(source.masked) || /mode=["']array["']/.test(source.text);
      if (!arrayFile) return [];
      return source.elements.filter((el) => /^(index|i|idx)$/.test(expr(el, 'key') ?? '')).map((el) => ({ line: el.line }));
    },
    good: [{ code: 'export function F() {\n  const { fields } = useFieldArray({ name: "contacts" });\n  return fields.map((f, index) => <Input key={f.id} {...register(`contacts.${index}.email`)} />);\n}' }],
    bad: [{ code: 'export function F() {\n  const { fields } = useFieldArray({ name: "contacts" });\n  return fields.map((f, index) => <Input key={index} {...register(`contacts.${index}.email`)} />);\n}' }],
  },
];
