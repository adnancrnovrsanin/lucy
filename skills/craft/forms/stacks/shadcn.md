# shadcn/ui stack note

shadcn components are copied into the project, so the installed files are the API. The CLI and the `shadcn` skill describe them; when a docs snippet and the installed file disagree, the installed file wins. This note resolves the roles of [field-map.md](../field-map.md) to shadcn components and binds them to a form library.

## Detect

- `components.json`: `style` and `aliases.ui` (where the components live).
- `npx shadcn@latest info --json`: the base (Radix or Base UI) and the installed components.
- The base decides the API of Select, Combobox, triggers, and `asChild` versus `render`. Read the base before reusing any docs snippet.
- When the base is neither Radix nor Base UI (for example `aria`), this note's snippets do not apply as written. Read the installed component files and the shadcn docs for that base before reusing any of them.

Done when the stack line names the base and the form library.

## Slots

| Role | Component | Wiring |
|---|---|---|
| Form | `<form>` with FieldGroup | `onSubmit` from the form library |
| Field wrapper | Field with FieldLabel, the control, FieldDescription, FieldError | `data-invalid` on Field and `aria-invalid` on the control, both from the field's invalid state |
| Group | FieldSet with FieldLegend | `variant="label"` when nested |
| Array | FieldSet with FieldLegend and FieldDescription | one item per row, a `type="button"` add Button, remove buttons named for their row |
| Submit | Button | Spinner beside the label while pending |

Field does not connect the control to FieldDescription or FieldError. Give the description and error elements ids and list them in the control's `aria-describedby`.

## Controls by role

| Role | Component |
|---|---|
| Text input | Input; InputGroup with InputGroupInput when it has addons |
| Long text | Textarea |
| Select | Select; NativeSelect when a native control is wanted |
| Combobox | Combobox (see below) |
| Few options | RadioGroup or ToggleGroup |
| Several answers | Checkbox group in a FieldSet |
| Boolean | Checkbox; Switch for settings |
| Near-term date | Popover with Calendar (the Basic recipe); the Input recipe when typing matters |
| Memorable date | three Inputs in a FieldSet |
| Date range | Calendar with `mode="range"` |
| Time | the Time Picker recipe, `Input type="time"` |
| Natural-language date | the chrono-node recipe |
| One-time code | InputOTP |
| Choice cards | Field inside FieldLabel |

Combobox is built on Base UI even in a Radix project. Read the installed `combobox.tsx` before coding against it. Records use `itemToStringValue` for their label; many-to-many uses `multiple` with chips. Relations follow field-map.md: item id is the primary key.

## Async combobox

For relations (field-map.md), use the Combobox with its own state:

- Control the input text with `onInputValueChange` and debounce the fetch (300 to 500 ms), with the query passed through `encodeURIComponent` and an `AbortController` that cancels the previous request.
- Pass `filter={null}` to the Combobox so Base UI keeps the server results instead of filtering them again on the client.
- Items are the fetched records. The form value is the record's primary key and the label comes from `itemToStringValue`; keep the selected record in state, or load it by id on edit, so its label shows when it is not in the current results.
- Bind it through Controller like the other controlled components, with `ref={field.ref}` and `onBlur={field.onBlur}` on `ComboboxInput`.

## React Hook Form

- Plain inputs use `register` or spread the Controller field.
- Every controlled component (Select, Checkbox, RadioGroup, Switch, Combobox, the date trigger) goes through Controller and forwards `field.ref` and `field.onBlur` to the element that takes focus. The shadcn docs snippets drop both; without them focus-on-error and blur validation skip the control (scan rule `shadcn-controller-missing-ref`).
- Errors: `<FieldError errors={[fieldState.error]} />`, shown when `fieldState.invalid`.
- Resolver: `import { zodResolver } from "@hookform/resolvers/zod"` and `resolver: zodResolver(schema)`. The call is the same on 5.x and 6.x.
- A schema with defaults or transforms types the form with both sides: `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`.
- Timing follows the form size from [feedback.md](../feedback.md): small forms use `mode: "onTouched"`; medium forms use `mode: "onSubmit"` with `reValidateMode: "onChange"`; large forms use `mode: "onChange"` and show a field's error only once its section is finished (a step's Continue, or focus leaving its fieldset) or after a submit attempt. Continue calls `trigger(sectionFields, { shouldFocus: true })`. `reValidateMode` applies only after a submit, which is why large forms do not use `onSubmit`.

```tsx
<Controller
  name="country"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="country">Country</FieldLabel>
      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
        <SelectTrigger
          id="country"
          ref={field.ref}
          onBlur={field.onBlur}
          aria-invalid={fieldState.invalid}
          aria-describedby={fieldState.invalid ? "country-error" : undefined}
        >
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldState.invalid && (
        <FieldError id="country-error" errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
```

The example is the Radix shape. Base UI needs the changes in the Base UI and Radix section.

## TanStack Form

- `form.Field` with `children`; the render function gets `field`.
- Every control gets `onBlur={field.handleBlur}` and `onChange` or `onValueChange` calling `field.handleChange`.
- Arrays: `mode="array"` on the Field, `field.pushValue` to add, `field.removeValue(index)` to remove.
- Error visibility: `const invalid = field.state.meta.isBlurred && !field.state.meta.isValid` (`isTouched` is set by a change, so it would show errors while the user types); then `data-invalid={invalid}`, `aria-invalid={invalid}`, and `<FieldError errors={field.state.meta.errors} />`.
- Timing: `validators` keyed by event. Small forms use `validationLogic: revalidateLogic({ mode: "blur", modeAfterSubmission: "change" })` with `validators: { onDynamic: schema }`, so the first check runs on blur and later checks run on change. Medium forms use `validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" })` with `validators: { onDynamic: schema }`. Large forms validate on change and show a field's error, and set `data-invalid` and `aria-invalid`, only once its section is finished or after a submit attempt (this gate replaces the blur rule above); the section's Continue calls `form.validateField` for each of its fields.

## Base UI and Radix

- Select: Base needs an `items` prop, a null-valued placeholder item, and `alignItemWithTrigger` in place of Radix's `position="item-aligned"`.
- Triggers: `asChild` on Radix becomes `render` on Base, with `nativeButton={false}` when the rendered element is not a button.
- Combobox brings `@base-ui/react` into a Radix project.
- The forms guides in the shadcn docs show Radix APIs only. On a Base project, translate each snippet.

## Dates

- Pass `timeZone` to Calendar, detected with `Intl.DateTimeFormat().resolvedOptions().timeZone` inside an effect. Server-rendered calendars otherwise mismatch on hydration and picking the 20th highlights the 19th.
- Pass `locale` from `react-day-picker/locale`, and `dir` for right-to-left languages. A `calendar.tsx` copied before the locale prop existed needs the upgrade from the shadcn calendar changelog.
- Format labels with the same locale: date-fns `format(date, "PPP", { locale })` or `Intl.DateTimeFormat(locale, ...)`.
- Convert to the backend type: a date-only column takes `yyyy-MM-dd` built from the local year, month, and day parts. `toISOString()` converts to UTC and can move the day.
- Memorable dates: three Inputs with `inputmode="numeric"` and the `bday-*` tokens, assembled into a date-only string after validation.

## Pitfalls

- Errors render in FieldError, not FieldDescription.
- The legacy Form, FormField, FormItem, and FormControl API is for old code only (scan rule `shadcn-legacy-form-api`).
- Docs examples set `autoComplete="off"` on name fields; use the real tokens from autofill.md (`autocomplete-off-personal`).
- The date picker docs snippet imports `cn` from a bare `"cn"` module; use the project's alias.
- Native date inputs next to an installed Calendar are replaced with the Calendar recipes (`raw-date-input`).
- Docs snippets format dates without a locale (`date-format-no-locale`).
- No `maxLength` on text inputs (`maxlength-on-text`).
- A literal `aria-invalid="true"` is wrong in a form; bind it to the field state (`aria-invalid-literal`).
- Switch is for settings that read as on or off; Checkbox is for form answers.

## Checked facts

All read 2026-10-27.

1. Recipe code: shadcn-ui/ui at 96da9cc7f1aa10580a3741664e2a77c721206c00, `apps/v4/examples/radix/` `date-picker-basic.tsx`, `date-picker-dob.tsx`, `date-picker-input.tsx`, `date-picker-time.tsx`, `date-picker-range.tsx`, `combobox-basic.tsx`, `combobox-invalid.tsx`, `combobox-multiple.tsx`, `field-select.tsx`. They use `useState` rather than a form library, set no `ref` or `onBlur`, and Basic and Time import `format` from date-fns without a locale. The DOB recipe uses `captionLayout="dropdown"`. The Time recipe pairs the Popover Calendar with `<Input type="time" step="1">`. The Range recipe uses `mode="range"` and `numberOfMonths={2}`. Combobox multiple uses `ComboboxChips`, `ComboboxChip`, and `useComboboxAnchor`. The docs page `apps/v4/content/docs/components/radix/date-picker.mdx` line 22 imports `cn` from `"cn"`.
2. `field.tsx` does not wire `aria-describedby`: `apps/v4/registry/new-york-v4/ui/field.tsx` at the same commit has no `aria-describedby`, no `useId`, and no id props. FieldError renders `<div role="alert" data-slot="field-error">` and dedupes `errors` by message; Field sets only `data-invalid` styling. The recipe therefore sets ids and `aria-describedby`.
3. Bases: `npx shadcn@latest init --help` (run 2026-10-27) lists `-b, --base <base>  the component library to use. (base, radix, aria)`. The components.json page (`apps/v4/content/docs/(root)/components-json.mdx` at the same commit) documents `style`, `tailwind`, and `aliases` and does not mention `aria`. Today the CLI accepts a third value, `aria`, that the docs do not describe; the note treats Radix and Base UI as the documented bases and tells the agent to read the installed files when `info` reports anything else.
4. `@hookform/resolvers`: release notes at https://github.com/react-hook-form/resolvers/releases (v6.0.0 on 2026-10-19, v6.0.1 on 2026-10-27). 6.0.0's only breaking change is the effect-ts resolver requiring `effect@^4.0.0`; 6.0.1 drops a typeschema peer dependency. `zodResolver` is unchanged: import from `@hookform/resolvers/zod`, and the README at v6.0.1 shows `useForm<z.input<typeof schema>, any, z.output<typeof schema>>({ resolver: zodResolver(schema) })` to force the output type.
5. Async Combobox: the installed `combobox.tsx` is `const Combobox = ComboboxPrimitive.Root` (`apps/v4/registry/bases/base/ui/combobox.tsx` at 96da9cc, read 2026-10-27), so Base UI props pass through. https://base-ui.com/react/components/combobox.md (read 2026-10-27) documents `filter` as a function or `null`, `filter={null}` in its async search example, and `onInputValueChange`; `filteredItems` is the alternative when the app keeps source items separately. The same commit also has `apps/v4/registry/bases/aria/ui/combobox.tsx`, which supports the `aria` base finding in fact 3.
6. TanStack Form dynamic validation: https://github.com/TanStack/form docs `framework/react/guides/dynamic-validation.md` (main, 2026-10-27): `revalidateLogic({ mode, modeAfterSubmission })` is required for `onDynamic` to run.
