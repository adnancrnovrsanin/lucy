import { str, has, expr, ancestors, importedName, importsFrom, hits, REACT_ARIA_FIELDS } from '../../lib/helpers.mjs';

const HEROUI = /^@heroui(-pro)?\/react$/;
const CONTROLLED = /<(Select|Checkbox|RadioGroup|Switch|Combobox|PopoverTrigger)\b/;
const LIST_ITEMS = new Set(['ListBox.Item', 'ListBoxItem', 'ComboBox.Item', 'Autocomplete.Item']);

export default [
  {
    id: 'heroui-errormessage-prop',
    severity: 'error',
    platform: 'web',
    when: (s) => s.ui === 'heroui',
    why: 'HeroUI v3 has no errorMessage prop, so the message never renders.',
    fix: 'Render the message as a FieldError child of the field; it shows when the field is invalid.',
    ref: 'HeroUI v3 migration guides (errorMessage removed, use FieldError)',
    check: ({ source }) => source.elements
      .filter((el) => has(el, 'errorMessage') && importedName(source, el.tag, HEROUI))
      .map((el) => ({ line: el.line, message: `errorMessage on <${el.tag}>` })),
    good: [{ code: 'import { TextField, FieldError } from "@heroui/react";\nconst a = <TextField isInvalid><FieldError>Enter your email</FieldError></TextField>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'import { TextField } from "@heroui/react";\nconst a = <TextField errorMessage="Enter your email" isInvalid />;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'heroui-rhf-validation-behavior',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.ui === 'heroui' && s.formLib === 'react-hook-form',
    why: 'A HeroUI field driven by React Hook Form keeps native validation, which blocks submit and shows browser messages.',
    fix: 'Set validationBehavior="aria" on the Form or the field when React Hook Form owns validation.',
    ref: 'React Aria forms guide, React Hook Form',
    check: ({ source }) => {
      if (source.elements.some((e) => e.tag === 'Form' && str(e, 'validationBehavior') === 'aria')) return [];
      return source.elements
        .filter((e) => REACT_ARIA_FIELDS.has(e.tag) && ancestors(e).some((a) => a.tag === 'Controller') && str(e, 'validationBehavior') !== 'aria')
        .map((e) => ({ line: e.line, message: `<${e.tag}> under a Controller without validationBehavior="aria"` }));
    },
    good: [{ code: 'const a = <Form validationBehavior="aria"><Controller name="email" control={control} render={({ field, fieldState }) => (<TextField {...field} isInvalid={fieldState.invalid}><Label>Email</Label><Input /></TextField>)} /></Form>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = <Form><Controller name="email" control={control} render={({ field, fieldState }) => (<TextField {...field} isInvalid={fieldState.invalid}><Label>Email</Label><Input /></TextField>)} /></Form>;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'heroui-react-stately-import',
    severity: 'error',
    platform: 'web',
    why: 'useAsyncList is imported from @react-stately/data, which the project does not depend on.',
    fix: 'Import useAsyncList from react-aria-components, which HeroUI already depends on.',
    ref: 'HeroUI web docs, ComboBox asynchronous loading',
    check: ({ source, stack }) => ('@react-stately/data' in stack.versions ? [] : importsFrom(source, /^@react-stately\/data$/).map((i) => ({ line: i.line }))),
    good: [
      { code: 'import { useAsyncList } from "react-aria-components";' },
      { code: 'import { useAsyncList } from "@react-stately/data";', stack: { versions: { '@react-stately/data': '^3.12.0' } } },
    ],
    bad: [{ code: 'import { useAsyncList } from "@react-stately/data";' }],
  },
  {
    id: 'heroui-listbox-name-id',
    severity: 'info',
    platform: 'web',
    when: (s) => s.ui === 'heroui',
    why: 'A list item id is taken from a display name, so the form submits the name instead of the record key.',
    fix: 'Use the record primary key as id and the name as textValue.',
    ref: 'HeroUI web docs, ComboBox form value',
    check: ({ source }) => source.elements
      .filter((el) => LIST_ITEMS.has(el.tag) && /\.(name|label|title)$/.test(expr(el, 'id') ?? ''))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <ComboBox name="owner">{(item) => <ListBox.Item id={item.id} textValue={item.name}>{item.name}</ListBox.Item>}</ComboBox>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = <ComboBox name="owner">{(item) => <ListBox.Item id={item.name} textValue={item.name}>{item.name}</ListBox.Item>}</ComboBox>;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'picker-value-through-date',
    severity: 'warning',
    platform: 'all',
    why: 'A picker value from @internationalized/date goes through JS Date, which can shift the day or drop the zone.',
    fix: 'Convert with the library: toString() for dates and wall-clock times, toAbsoluteString() for instants (forms/stacks/heroui.md, dates).',
    ref: 'React Aria internationalized date docs',
    check: ({ source }) => (importsFrom(source, /^@internationalized\/date$/).length ? hits(source, /\bnew Date\(|\.toISOString\(\)/g) : []),
    good: [{ code: 'import { parseDate } from "@internationalized/date";\nconst iso = value.toString();' }],
    bad: [{ code: 'import { parseDate } from "@internationalized/date";\nconst iso = value.toDate("UTC").toISOString();' }],
  },
  {
    id: 'native-daterange-unparsed',
    severity: 'info',
    platform: 'native',
    when: (s) => s.ui === 'heroui-native' && s.uiPro,
    why: 'The HeroUI Native Pro DateRangePicker value is a JSON string, used here without parsing.',
    fix: 'JSON.parse the option value to get { start, end }.',
    ref: 'HeroUI Native Pro DateRangePicker docs',
    check: ({ source }) => (/JSON\.parse/.test(source.text) ? [] : source.elements
      .filter((el) => el.tag === 'DateRangePicker' && importedName(source, el.tag, /^heroui-native-pro$/) && has(el, 'onValueChange'))
      .map((el) => ({ line: el.line }))),
    good: [{ code: 'import { DateRangePicker } from "heroui-native-pro";\nconst a = <DateRangePicker onValueChange={(o) => setRange(JSON.parse(o.value))} />;', stack: { uiPro: true } }],
    bad: [{ code: 'import { DateRangePicker } from "heroui-native-pro";\nconst a = <DateRangePicker onValueChange={(o) => setRange(o.value)} />;', stack: { uiPro: true } }],
  },
  {
    id: 'shadcn-controller-missing-ref',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.ui === 'shadcn' && s.formLib === 'react-hook-form',
    why: 'A Controller renders a shadcn control without forwarding ref and onBlur, so focus-on-error and blur validation skip it.',
    fix: 'Pass ref={field.ref} and onBlur={field.onBlur} to the control or its trigger.',
    ref: 'shadcn/ui forms docs (React Hook Form snippets drop ref and onBlur)',
    check: ({ source }) => source.elements
      .filter((el) => {
        if (el.tag !== 'Controller') return false;
        const render = expr(el, 'render') ?? '';
        return CONTROLLED.test(render) && !/\.\.\.field\b/.test(render) && !(/field\.ref/.test(render) && /onBlur/.test(render));
      })
      .map((el) => ({ line: el.line, message: `Controller "${str(el, 'name') ?? ''}" does not forward ref and onBlur` })),
    good: [{ code: 'const a = <Controller name="language" control={form.control} render={({ field, fieldState }) => (<Select name={field.name} value={field.value} onValueChange={field.onChange}><SelectTrigger id="language" ref={field.ref} onBlur={field.onBlur} aria-invalid={fieldState.invalid}><SelectValue /></SelectTrigger></Select>)} />;' }],
    bad: [{ code: 'const a = <Controller name="language" control={form.control} render={({ field, fieldState }) => (<Select name={field.name} value={field.value} onValueChange={field.onChange}><SelectTrigger id="language" aria-invalid={fieldState.invalid}><SelectValue /></SelectTrigger></Select>)} />;' }],
  },
  {
    id: 'shadcn-legacy-form-api',
    severity: 'info',
    platform: 'web',
    when: (s) => s.ui === 'shadcn' && s.components.has('field'),
    why: 'The legacy shadcn Form API is used where the Field component is installed.',
    fix: 'Build new forms with Field, FieldLabel, FieldDescription, and FieldError (forms/stacks/shadcn.md).',
    ref: 'shadcn/ui forms docs',
    check: ({ source }) => importsFrom(source, /components\/ui\/form$/)
      .filter((i) => /\bForm(Field|Item|Control)\b/.test(i.names))
      .map((i) => ({ line: i.line })),
    good: [{ code: 'import { Field, FieldLabel, FieldError } from "@/components/ui/field";' }],
    bad: [{ code: 'import { FormField, FormItem, FormControl } from "@/components/ui/form";' }],
  },
  {
    id: 'date-format-no-locale',
    severity: 'warning',
    platform: 'all',
    why: 'A date is formatted without a locale or with a hard-coded pattern.',
    fix: 'Format with Intl.DateTimeFormat(locale, ...) or pass the locale to date-fns format; never hard-code dd/MM/yyyy.',
    ref: 'Vercel Web Interface Guidelines, locale',
    check: ({ source }) => [
      ...hits(source, /\bformat\(\s*[^,()]+,\s*(['"])[^'"\n]*\1\s*\)/g, source.text),
      ...hits(source, /\.toLocale(?:Date|Time)String\(\s*\)/g),
      ...source.strings.filter((s) => /^(?:dd|DD|MM|mm)[./-](?:MM|mm|dd|DD)[./-](?:yyyy|YYYY|yy)$/.test(s.value)).map((s) => ({ line: s.line })),
    ],
    good: [
      { code: 'const label = format(date, "PPP", { locale });' },
      { code: 'const label = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);' },
      { code: 'const label = `${count.toLocaleString()} rows`;' },
    ],
    bad: [
      { code: 'const label = format(date, "PPP");' },
      { code: 'const label = new Date(v).toLocaleDateString();' },
      { code: 'const pattern = "dd/MM/yyyy";' },
    ],
  },
];
