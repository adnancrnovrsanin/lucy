import { str, has, isTrue, isFormFile, catchBlocks, errorCallbacks, hits } from '../../lib/helpers.mjs';

const TOAST_ERROR = /\btoast(?:\.error|\.destructive)?\s*\(|variant\s*:\s*['"]destructive['"]/;
const FORM_STATE = /setError|setFormError|setServerError|setErrors|formError|serverError|\broot\b/;
const SIGN_IN_FILE = /sign-?in|log-?in|reset|forgot|recover/i;
const SIGN_UP_FILE = /sign-?up|register/i;
const ENUMERATION = /already (?:registered|exists|in use|taken)|no account|account (?:does not|doesn't) exist|user not found|email not found/i;
const GUARDS = /beforeunload|useBlocker|usePrompt|useBeforeUnload|beforeRemove|usePreventRemove|onBeforeUnload|isDirty/;

export default [
  {
    id: 'swallowed-submit-error',
    severity: 'warning',
    platform: 'all',
    why: 'A submit failure is caught and only logged, so the user sees nothing.',
    fix: 'Map the failure onto the fields it concerns and show a form-level message with a way to retry.',
    ref: 'craft forms feedback reference; aj-geddes form-validation exhibits',
    check: ({ source }) => (isFormFile(source)
      ? catchBlocks(source).filter((b) => b.body.replace(/console\.\w+\s*\([^;]*\)\s*;?/g, '').trim() === '').map((b) => ({ line: b.line }))
      : []),
    good: [{ code: 'const form = useForm();\nasync function onSubmit(v) {\n  try {\n    await save(v);\n  } catch (error) {\n    form.setError("root", { message: "We could not save your changes. Try again." });\n  }\n}' }],
    bad: [{ code: 'const form = useForm();\nasync function onSubmit(v) {\n  try {\n    await save(v);\n  } catch (error) {\n    console.error(error);\n  }\n}' }],
  },
  {
    id: 'toast-only-submit-error',
    severity: 'warning',
    platform: 'all',
    why: 'A submit failure appears only in a toast, which disappears and is not tied to the form.',
    fix: 'Put the failure on the form (field errors and a form-level message); a toast may repeat it but never carries it alone.',
    ref: 'better-accessibility screen readers and motion',
    check: ({ source }) => (isFormFile(source)
      ? [...catchBlocks(source), ...errorCallbacks(source)].filter((b) => TOAST_ERROR.test(b.raw) && !FORM_STATE.test(b.raw)).map((b) => ({ line: b.line }))
      : []),
    good: [{ code: 'const form = useForm();\nasync function onSubmit(v) {\n  try { await save(v); } catch (e) {\n    form.setError("root", { message: "Could not save. Try again." });\n    toast.error("Could not save");\n  }\n}' }],
    bad: [
      { code: 'const form = useForm();\nasync function onSubmit(v) {\n  try { await save(v); } catch (e) { toast.error("Could not save"); }\n}' },
      { code: 'const form = useForm();\nconst m = useMutation({ mutationFn: save, onError: (e) => { toast.error("Could not save"); } });' },
    ],
  },
  {
    id: 'alert-for-errors',
    severity: 'warning',
    platform: 'web',
    why: 'A form reports a problem with alert(), which blocks the page and is not tied to a field.',
    fix: 'Show the message inline on the field or as a form-level message.',
    ref: 'omer-metin forms-validation validations',
    check: ({ source }) => (isFormFile(source) ? hits(source, /(?<![\w.])alert\s*\(|\bwindow\.alert\s*\(/g) : []),
    good: [{ code: 'const form = useForm();\nasync function onSubmit(v) {\n  const res = await save(v);\n  if (!res.ok) form.setError("root", { message: "Save failed. Try again." });\n}' }],
    bad: [{ code: 'const form = useForm();\nasync function onSubmit(v) {\n  const res = await save(v);\n  if (!res.ok) alert("Save failed");\n}' }],
  },
  {
    id: 'reset-in-catch',
    severity: 'warning',
    platform: 'all',
    why: 'The form is reset when submission fails, throwing away what the user typed.',
    fix: 'Keep the values on failure; reset only after success.',
    ref: 'omer-metin forms-validation sharp edges',
    check: ({ source }) => catchBlocks(source).filter((b) => /\breset\s*\(/.test(b.body)).map((b) => ({ line: b.line })),
    good: [{ code: 'try { await save(); reset(); } catch { setError("root", { message: "Try again." }); }' }],
    bad: [{ code: 'try { await save(); } catch { reset(); }' }],
  },
  {
    id: 'live-region-mount-with-text',
    severity: 'warning',
    platform: 'web',
    why: 'A status region is mounted together with its message, so screen readers often miss it.',
    fix: 'Render the status region empty from the start and change only its text.',
    ref: 'better-accessibility screen readers',
    check: ({ source }) => source.elements
      .filter((el) => el.tag !== 'Toaster'
        && (str(el, 'role') === 'status' || (has(el, 'aria-live') && str(el, 'aria-live') !== 'off'))
        && /(&&|\?|:)\s*\(?\s*$/.test(source.masked.slice(Math.max(0, el.start - 60), el.start)))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <form><p role="status">{saved ? "Saved" : ""}</p></form>;' }],
    bad: [{ code: 'const a = <form>{saved && <p role="status">Saved</p>}</form>;' }],
  },
  {
    id: 'assertive-live-region',
    severity: 'info',
    platform: 'web',
    why: 'An assertive live region interrupts whatever the screen reader is saying.',
    fix: 'Use role="status" for non-urgent messages, or move focus to the error summary after a failed submit.',
    ref: 'better-accessibility screen readers',
    check: ({ source }) => (isFormFile(source)
      ? source.elements.filter((el) => str(el, 'aria-live') === 'assertive').map((el) => ({ line: el.line }))
      : []),
    good: [{ code: 'const a = <form><div aria-live="polite">{error}</div></form>;' }],
    bad: [{ code: 'const a = <form><div aria-live="assertive">{error}</div></form>;' }],
  },
  {
    id: 'aria-invalid-literal',
    severity: 'info',
    platform: 'web',
    why: 'aria-invalid is set to a constant, so the field always reads as invalid.',
    fix: 'Bind aria-invalid to the field state, for example aria-invalid={fieldState.invalid}.',
    ref: 'better-accessibility forms',
    check: ({ source, path }) => (/\.(stories|fixture|fixtures|test|spec)\./.test(path)
      ? []
      : source.elements.filter((el) => isTrue(el, 'aria-invalid')).map((el) => ({ line: el.line }))),
    good: [
      { code: 'const a = <Input aria-invalid={!!errors.email} />;' },
      { code: 'const a = <Input aria-invalid />;', file: 'field.stories.tsx' },
    ],
    bad: [{ code: 'const a = <Input aria-invalid="true" />;' }],
  },
  {
    id: 'no-unsaved-guard',
    severity: 'info',
    platform: 'all',
    why: 'The form has no warning before navigation throws away unsaved changes.',
    fix: 'Guard on the form library\'s dirty state with a beforeunload listener and the router\'s blocker.',
    ref: 'Vercel Web Interface Guidelines, forms',
    check: ({ source }) => {
      const use = /\buse(?:App)?Form\s*\(/.exec(source.masked);
      if (!use || GUARDS.test(source.text)) return [];
      return [{ index: use.index }];
    },
    good: [{ code: 'export function F() {\n  const form = useForm({ defaultValues });\n  useEffect(() => {\n    const warn = (e) => { if (form.formState.isDirty) e.preventDefault(); };\n    window.addEventListener("beforeunload", warn);\n    return () => window.removeEventListener("beforeunload", warn);\n  }, [form]);\n  return <form onSubmit={form.handleSubmit(save)} />;\n}' }],
    bad: [{ code: 'export function F() {\n  const form = useForm({ defaultValues });\n  return <form onSubmit={form.handleSubmit(save)} />;\n}' }],
  },
  {
    id: 'retry-on-mutation',
    severity: 'info',
    platform: 'all',
    why: 'A submit retries on its own without an idempotency key, which can create duplicates.',
    fix: 'Send an Idempotency-Key header with retried submits, or let the user retry by hand.',
    ref: 'Vercel Web Interface Guidelines, forms; designer-skills error-handling-ux',
    check: ({ source }) => (/idempotency-key/i.test(source.text)
      ? []
      : hits(source, /useMutation\s*\(\s*\{[\s\S]{0,400}?\bretry\s*:\s*(?:[1-9]|true)/g)),
    good: [{ code: 'const m = useMutation({ mutationFn: save });' }],
    bad: [{ code: 'const m = useMutation({ mutationFn: save, retry: 3 });' }],
  },
  {
    id: 'unencoded-url-param',
    severity: 'warning',
    platform: 'all',
    why: 'A value from the form goes into a query string without encoding.',
    fix: 'Wrap the value in encodeURIComponent or build the query with URLSearchParams.',
    ref: 'vibeeval form-validation; aj-geddes form-validation',
    check: ({ source }) => hits(source, /`[^`]*[?&][\w.-]+=\$\{(?!\s*encodeURIComponent\()[^}]+\}/g, source.text),
    good: [{ code: 'fetch(`/api/users/check?email=${encodeURIComponent(email)}`);' }],
    bad: [{ code: 'fetch(`/api/users/check?email=${email}`);' }],
  },
  {
    id: 'account-enumeration-message',
    severity: 'warning',
    platform: 'all',
    why: 'A sign-in or reset form says whether an account exists.',
    fix: 'Use one message for every failure, such as "The email or password is not right"; on reset, confirm that an email was sent if the account exists.',
    ref: 'ancoleman building-forms validation concepts; GOV.UK Design System, passwords',
    check: ({ source, path }) => (!SIGN_IN_FILE.test(path) || SIGN_UP_FILE.test(path) ? [] : [
      ...source.strings.filter((s) => ENUMERATION.test(s.value)).map((s) => ({ line: s.line })),
      ...source.elements.filter((el) => ENUMERATION.test(el.text)).map((el) => ({ line: el.line })),
    ]),
    good: [
      { code: 'form.setError("email", { message: "This email is already registered" });', file: 'app/signup/page.tsx' },
      { code: 'form.setError("root", { message: "The email or password is not right" });', file: 'app/login/page.tsx' },
    ],
    bad: [{ code: 'form.setError("email", { message: "No account found for this email" });', file: 'app/login/page.tsx' }],
  },
  {
    id: 'nested-useform',
    severity: 'warning',
    platform: 'all',
    why: 'A component inside a form creates its own form with useForm, so its value never reaches the parent submit.',
    fix: 'Use useFormContext (or the parent form passed in) instead of a second useForm.',
    ref: 'vibeeval form-validation exhibits',
    check: ({ source }) => {
      const use = /\buseForm\s*\(/.exec(source.masked);
      if (!use) return [];
      if (/\bfunction\s+use\w+|\bconst\s+use\w+\s*=/.test(source.masked)) return [];
      const hasForm = source.elements.some((e) => e.tag === 'form' || e.tag === 'Form')
        || /\bhandleSubmit\b|\bonSubmit\b|FormProvider|\.Provider\b/.test(source.masked);
      return hasForm ? [] : [{ index: use.index }];
    },
    good: [{ code: 'export function UsernameField() {\n  const { register } = useFormContext();\n  return <Input {...register("username")} />;\n}' }],
    bad: [{ code: 'export function UsernameField() {\n  const { register } = useForm();\n  return <Input {...register("username")} />;\n}' }],
  },
  {
    id: 'object-url-leak',
    severity: 'info',
    platform: 'web',
    why: 'A preview URL is created with createObjectURL and never revoked.',
    fix: 'Revoke the URL when the preview changes or unmounts.',
    ref: 'vibeeval form-validation file upload',
    check: ({ source }) => (/revokeObjectURL/.test(source.masked) ? [] : hits(source, /createObjectURL\s*\(/g)),
    good: [{ code: 'const url = URL.createObjectURL(file);\nuseEffect(() => () => URL.revokeObjectURL(url), [url]);' }],
    bad: [{ code: 'const url = URL.createObjectURL(file);' }],
  },
];
