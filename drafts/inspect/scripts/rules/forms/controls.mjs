import { inputType, fieldName, has, str, inLibraryDir, optionsOf, isStatic, lineText, hits } from '../../lib/helpers.mjs';

const DATE_TYPES = new Set(['date', 'datetime-local', 'month', 'week', 'time']);
const DATE_INPUT_TAGS = new Set(['input', 'Input', 'InputGroupInput']);
export const INPUT_LIKE = new Set(['input', 'Input', 'InputGroupInput', 'TextField']);
const TEXT_ENTRY = new Set(['input', 'Input', 'InputGroupInput', 'TextField', 'textarea', 'Textarea']);
const SELECT_TAGS = new Set(['Select', 'NativeSelect']);
const CHOICE_TAGS = new Set(['RadioGroup', 'ToggleGroup', 'ToggleButtonGroup', 'RadioButtonGroup']);
const DOB = /dob|birth|bday/i;
export const CODE_NAMES = /phone|tel|zip|postal|post_?code|card|cc_?num|cvc|cvv|otp|code|pin|iban|account|ssn|jmbg|oib/i;
const QUANTITY_NAMES = /qty|quantity|count|guests|seats|adults|children|rooms|nights|items|amount_?of|number_?of/i;

function enumKeys(source) {
  const keys = new Set();
  const pattern = /(\w+)\s*:\s*z\.(?:enum|nativeEnum)\s*\(|(\w+)\s*:\s*z\.union\(\s*\[\s*z\.literal\(|(\w+)\??\s*:\s*(['"`])\s*\4\s*\|/g;
  for (const m of source.masked.matchAll(pattern)) keys.add(m[1] ?? m[2] ?? m[3]);
  return keys;
}

export default [
  {
    id: 'raw-date-input',
    severity: 'error',
    platform: 'web',
    when: (s) => s.hasDatePicker,
    why: 'A native date or time input is used where the UI library has a date picker.',
    fix: 'Use the library date picker for near-term dates, and three day, month, and year inputs (shadcn) or the segmented DateField (HeroUI) for memorable dates; see forms/field-map.md. shadcn has no time field, so its time recipe keeps Input type="time".',
    ref: 'craft forms brief, failure 2',
    check: ({ source, stack }) => source.elements
      .filter((el) => DATE_INPUT_TAGS.has(el.tag) && DATE_TYPES.has(inputType(el)) && !(inputType(el) === 'time' && stack.ui === 'shadcn'))
      .map((el) => ({ line: el.line, message: `<${el.tag} type="${inputType(el)}"> where the library has a date picker` })),
    good: [
      { code: 'const a = <Calendar mode="single" selected={date} onSelect={setDate} />;' },
      { code: 'const a = <input type="date" name="due" />;', stack: { ui: null, hasDatePicker: false } },
      { code: 'const a = <Input type="time" step="1" name="startsAt" />;' },
    ],
    bad: [
      { code: 'const a = <input type="date" name="dueDate" />;' },
      { code: ['const a = (', '  <Input', '    type="datetime-local"', '    {...register("startsAt")}', '  />', ');'].join('\n') },
    ],
  },
  {
    id: 'raw-select',
    severity: 'error',
    platform: 'web',
    when: (s) => s.hasSelect,
    why: 'A native <select> is used where the UI library has a Select.',
    fix: 'Use the library Select, or its NativeSelect component when a native control is wanted; for 5 or fewer options use RadioGroup or ToggleGroup, above 30 use Combobox (forms/field-map.md).',
    ref: 'craft forms brief, failure 1',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => el.tag === 'select')
      .map((el) => ({ line: el.line, message: `native <select name="${fieldName(el)}">` }))),
    good: [
      { code: 'const a = <NativeSelect name="country"><NativeSelectOption value="ba">Bosnia and Herzegovina</NativeSelectOption></NativeSelect>;' },
      { code: 'export const NativeSelect = (props) => <select {...props} />;', file: 'components/ui/native-select.tsx' },
    ],
    bad: [{ code: ['const a = (', '  <select name="status">', '    <option value="open">Open</option>', '  </select>', ');'].join('\n') }],
  },
  {
    id: 'enum-as-text',
    severity: 'error',
    platform: 'all',
    why: 'A field with a fixed set of values is a free-text input.',
    fix: 'Pick the control by option count: RadioGroup or ToggleGroup up to 5, Select from 6 to 30, Combobox above 30 (forms/field-map.md).',
    ref: 'craft forms brief, failure 1',
    check: ({ source }) => {
      const keys = enumKeys(source);
      if (!keys.size) return [];
      return source.elements
        .filter((el) => TEXT_ENTRY.has(el.tag) && ['text', 'search'].includes(inputType(el)) && keys.has(fieldName(el)))
        .map((el) => ({ line: el.line, message: `"${fieldName(el)}" has a fixed set of values but is a text input` }));
    },
    good: [{ code: ['const schema = z.object({ status: z.enum(["open", "closed"]) });', 'export const F = () => <Select name="status" />;'].join('\n') }],
    bad: [
      { code: ['const schema = z.object({ status: z.enum(["open", "closed"]) });', 'export function F() {', '  const { register } = useForm();', '  return <Input {...register("status")} />;', '}'].join('\n') },
      { code: ['type Values = { plan: "free" | "pro" };', 'export const F = () => <Controller name="plan" render={({ field }) => <Input {...field} />} />;'].join('\n') },
    ],
  },
  {
    id: 'raw-form-control',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.ui !== null,
    why: 'A raw HTML form control is used in a project with a UI library.',
    fix: 'Use the library component for this control (Input, Textarea, Checkbox, RadioGroup); the stack note names it.',
    ref: 'craft SKILL.md, component inventory',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => el.tag === 'textarea' || (el.tag === 'input' && !['hidden', 'file', 'submit', 'button', 'reset', 'image', ...DATE_TYPES].includes(inputType(el))))
      .map((el) => ({ line: el.line, message: `raw <${el.tag}${el.tag === 'input' ? ` type="${inputType(el)}"` : ''}>` }))),
    good: [
      { code: 'const a = <><input type="hidden" name="id" value={id} /><Input name="title" /></>;' },
      { code: 'const a = <input name="title" />;', stack: { ui: null } },
    ],
    bad: [
      { code: 'const a = <input name="title" />;' },
      { code: 'const a = <input type="checkbox" name="agree" />;' },
      { code: 'const a = <textarea name="bio" />;' },
    ],
  },
  {
    id: 'select-multiple',
    severity: 'warning',
    platform: 'web',
    why: 'A multi-select dropdown is used for a short list of options.',
    fix: 'Use a CheckboxGroup for several answers from a short list; keep a multiple Combobox for long or remote lists.',
    ref: 'GOV.UK Design System, select component',
    check: ({ source }) => source.elements
      .filter((el) => (el.tag === 'select' && has(el, 'multiple'))
        || (SELECT_TAGS.has(el.tag) && (has(el, 'multiple') || str(el, 'selectionMode') === 'multiple') && isStatic(el, source) && optionsOf(el).length > 0 && optionsOf(el).length <= 7))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <CheckboxGroup name="days"><Checkbox value="mon">Monday</Checkbox><Checkbox value="tue">Tuesday</Checkbox></CheckboxGroup>;' }],
    bad: [
      { code: 'const a = <select multiple name="days"><option>Mon</option></select>;' },
      { code: 'const a = <Select selectionMode="multiple" name="days"><ListBox.Item id="mon">Monday</ListBox.Item><ListBox.Item id="tue">Tuesday</ListBox.Item></Select>;' },
    ],
  },
  {
    id: 'option-count-mismatch',
    severity: 'warning',
    platform: 'all',
    why: 'The control does not fit the number of options.',
    fix: 'Use RadioGroup or ToggleGroup for 5 or fewer options and Select from 6 to 30; two options that mean on and off are a Checkbox or Switch.',
    ref: 'craft forms field map, option thresholds',
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        if (!isStatic(el, source)) continue;
        const count = optionsOf(el).length;
        if (SELECT_TAGS.has(el.tag) && count > 0 && count <= 5) out.push({ line: el.line, message: `<${el.tag}> with ${count} options; use RadioGroup or ToggleGroup` });
        if (CHOICE_TAGS.has(el.tag) && count > 5) out.push({ line: el.line, message: `<${el.tag}> with ${count} options; use Select` });
      }
      return out;
    },
    good: [
      { code: 'const a = <RadioGroup name="plan"><RadioGroupItem value="free" /><RadioGroupItem value="pro" /></RadioGroup>;' },
      { code: 'const a = <Select name="country">{countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</Select>;' },
    ],
    bad: [
      { code: 'const a = <Select name="size"><SelectContent><SelectItem value="s">S</SelectItem><SelectItem value="m">M</SelectItem><SelectItem value="l">L</SelectItem></SelectContent></Select>;' },
      { code: ['const a = (', '  <RadioGroup name="day">', ...['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => `    <RadioGroupItem value="${d}" />`), '  </RadioGroup>', ');'].join('\n') },
    ],
  },
  {
    id: 'calendar-only-dob',
    severity: 'warning',
    platform: 'all',
    why: 'A memorable date such as a date of birth is entered through a calendar.',
    fix: 'Use three day, month, and year inputs in a fieldset (shadcn) or the segmented DateField (HeroUI); calendars are for near-term dates.',
    ref: 'GOV.UK Design System, dates pattern',
    check: ({ source }) => source.elements
      .filter((el) => ['Calendar', 'DatePicker', 'RangeCalendar'].includes(el.tag) && DOB.test(fieldName(el)))
      .map((el) => ({ line: el.line, message: `<${el.tag}> for "${fieldName(el)}"` })),
    good: [{ code: 'const a = <Controller name="birthDate" render={({ field }) => <DateField {...field} />} />;' }],
    bad: [{ code: 'const a = <Controller name="dateOfBirth" render={({ field }) => <Popover><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></Popover>} />;' }],
  },
  {
    id: 'number-input-for-codes',
    severity: 'error',
    platform: 'all',
    why: 'A code, phone, postal, or card number uses type="number", which drops leading zeros and shows a spinner.',
    fix: 'Use a text input with inputmode="numeric" (and the right autocomplete token) for codes and numbers that are not quantities.',
    ref: 'GOV.UK Design System, text input; Vercel Web Interface Guidelines, forms',
    check: ({ source }) => source.elements
      .filter((el) => INPUT_LIKE.has(el.tag) && inputType(el) === 'number' && CODE_NAMES.test(fieldName(el)))
      .map((el) => ({ line: el.line, message: `type="number" on "${fieldName(el)}"` })),
    good: [{ code: 'const a = <Input name="postalCode" inputMode="numeric" autoComplete="postal-code" />;' }],
    bad: [
      { code: 'const a = <Input type="number" name="postalCode" />;' },
      { code: 'const a = <input type="number" {...register("otp")} />;' },
    ],
  },
  {
    id: 'number-input',
    severity: 'warning',
    platform: 'web',
    why: 'type="number" changes with the scroll wheel, mishandles decimal commas, and yields NaN when empty.',
    fix: 'Use a text input with inputmode="numeric" or "decimal" and coerce in the schema; keep type="number" for true quantities only.',
    ref: 'GOV.UK Design System, text input numbers',
    check: ({ source }) => source.elements
      .filter((el) => INPUT_LIKE.has(el.tag) && inputType(el) === 'number' && !CODE_NAMES.test(fieldName(el)) && !QUANTITY_NAMES.test(fieldName(el)))
      .map((el) => ({ line: el.line, message: `type="number" on "${fieldName(el)}"` })),
    good: [
      { code: 'const a = <Input type="number" name="guests" min={1} />;' },
      { code: 'const a = <Input name="price" inputMode="decimal" />;' },
    ],
    bad: [
      { code: 'const a = <Input type="number" name="price" />;' },
      { code: 'const a = <TextField type="number" name="age" />;' },
    ],
  },
  {
    id: 'money-tofixed',
    severity: 'warning',
    platform: 'all',
    why: 'Money is formatted with toFixed, which ignores currency and locale.',
    fix: 'Format with Intl.NumberFormat(locale, { style: "currency", currency }) using the record\'s currency.',
    ref: 'craft forms field map, money',
    check: ({ source }) => hits(source, /\.toFixed\(\s*2\s*\)/g).filter((h) => {
      const text = lineText(source, source.lineOf(h.index)).replace(/\$\{/g, '{');
      return /[$€£¥]|price|amount|total|cost|fee|balance/i.test(text);
    }),
    good: [{ code: 'const label = new Intl.NumberFormat(locale, { style: "currency", currency }).format(total);' }],
    bad: [
      { code: 'const label = "$" + total.toFixed(2);' },
      { code: 'const label = `Price: ${price.toFixed(2)}`;' },
    ],
  },
  {
    id: 'split-card-number',
    severity: 'info',
    platform: 'web',
    why: 'A card number is split across several inputs, which breaks paste and autofill.',
    fix: 'Use one cc-number input that accepts spaces, with inputmode="numeric" and autocomplete="cc-number".',
    ref: 'web.dev payment and address form best practices',
    check: ({ source }) => {
      const parts = source.elements.filter((el) => INPUT_LIKE.has(el.tag) && /(card|cc)[-_]?(number|num|part)?[-_]?[1-4]$/i.test(fieldName(el)));
      return parts.length >= 3 ? [{ line: parts[0].line, message: `card number split into ${parts.length} inputs` }] : [];
    },
    good: [{ code: 'const a = <Input name="cardNumber" inputMode="numeric" autoComplete="cc-number" />;' }],
    bad: [{ code: 'const a = <><Input name="card1" /><Input name="card2" /><Input name="card3" /><Input name="card4" /></>;' }],
  },
  {
    id: 'honorific-select',
    severity: 'info',
    platform: 'all',
    why: 'A title or honorific is chosen from a list.',
    fix: 'Avoid asking for a title; if the model needs it, use an optional text input with autocomplete="honorific-prefix".',
    ref: 'GOV.UK Design System, names pattern',
    check: ({ source }) => source.elements
      .filter((el) => ['Select', 'NativeSelect', 'RadioGroup', 'select'].includes(el.tag) && /^(title|honorific|salutation|prefix)$/i.test(fieldName(el)))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <Input name="honorific" autoComplete="honorific-prefix" />;' }],
    bad: [{ code: 'const a = <Select name="salutation"><SelectItem value="mr">Mr</SelectItem></Select>;' }],
  },
];
