# HeroUI web stack note

HeroUI v3 wraps React Aria Components and Tailwind v4. Use version 3.2.2 or later: earlier clear buttons submitted the form. Install `@internationalized/date` explicitly (a peer dependency since 3.2.6, with `react-aria-components` ^1.21.1). This note resolves the roles of [field-map.md](../field-map.md) to HeroUI components.

## Detect

- `@heroui/react` and `@heroui-pro/react` in package.json; `@import "@heroui/styles"` in the global CSS.
- The HeroUI MCP when configured: ask `list_components` for what exists. Never trust a hard-coded component list, including the matrix below.
- Versions of `@internationalized/date`, `react-hook-form` or `@tanstack/react-form`, and `zod`.

Done when the stack line names HeroUI, whether Pro is installed, and the form library.

## Slots

| Role | Component |
|---|---|
| Form | Form (React Aria Form) |
| Field wrapper | the field component with Label, Description, and FieldError as children |
| Group | Fieldset |
| Array | one Fieldset per item plus a Button to add and a named Button to remove |
| Submit | Button with `isPending` |

## Controls by role

Rows marked "Pro" need `@heroui-pro/react`.

| Role | Component |
|---|---|
| Text input | TextField with Input; SearchField for search |
| Long text | TextField with TextArea |
| Number | NumberField; Pro NumberStepper |
| Select | Select with ListBox |
| Combobox | ComboBox (selection from a list, optionally typed); Autocomplete (search inside a popover) |
| Few options | RadioGroup, ToggleButtonGroup; Pro RadioButtonGroup |
| Several answers | CheckboxGroup with Checkbox; Pro CheckboxButtonGroup |
| Boolean | Checkbox; Switch for settings |
| Memorable date | DateField (segments take typing and arrow keys) |
| Near-term date | DatePicker |
| Date range | DateRangePicker |
| Time | TimeField |
| Date and time | DateField or DatePicker with `granularity` hour, minute, or second |
| Range value | Slider |
| One-time code | InputOTP |
| Tags | TagGroup; ComboBox or Autocomplete with `selectionMode="multiple"` |
| Files | Pro DropZone (the app enforces type and size) |
| Steps | Pro Stepper (an indicator only; gating and validation are app code) |

Rating, Segment, ToggleButtonGroup, and RichTextEditor have no `name`: their value never reaches FormData. Keep the value in the form library and write it to a hidden input when the form submits natively.

## Validation

- `validationBehavior` is `"native"` by default: the browser blocks submit and shows its own messages. `"aria"` shows errors live and does not block. Set it on the Form or per field.
- Field props: `isRequired`, `isInvalid`, `validate(value)` returning a string, an array, `true`, or null, and `minValue` and `maxValue` on numbers and dates. Constraints are checked on commit (blur) or submit.
- Server errors: Form `validationErrors`, an object keyed by field `name` with a string or an array. Each clears when its field changes. Zod 4 supplies them through `z.flattenError(result.error).fieldErrors`.
- Error summary: Form `onInvalid` runs when native validation fails and focuses the first invalid field by default. Call `event.preventDefault()` there to focus the error summary instead.
- Errors render through a FieldError child. v3 has no `errorMessage` prop (scan rule `heroui-errormessage-prop`).
- Browser messages ignore I18nProvider. A custom message goes through the FieldError render function, which receives the validation result.

## React Hook Form

- Wrap each field in Controller and pass `name`, `value`, `onChange`, `onBlur`, and `ref` to the HeroUI component.
- Set `validationBehavior="aria"` on the Form or the field so the library owns validation and submit is not blocked by the browser (scan rule `heroui-rhf-validation-behavior`).
- `isInvalid={fieldState.invalid}` and `<FieldError>{fieldState.error?.message}</FieldError>`.
- Timing follows the form size from [feedback.md](../feedback.md): small forms use `mode: "onTouched"`; medium forms use `mode: "onSubmit"` with `reValidateMode: "onChange"`; large forms use `mode: "onChange"` and show a field's error only once its section is finished or after a submit attempt, with Continue calling `trigger(sectionFields, { shouldFocus: true })`.

| Control | Value prop | Change handler |
|---|---|---|
| TextField | `value` | `onChange(string)` |
| Checkbox, Switch | `isSelected` | `onChange(boolean)` |
| RadioGroup | `value` | `onChange(string)` |
| Select | `value` | `onChange(key)` |
| NumberField | `value` | `onChange(number or undefined)`, fired on commit (blur, stepper), not per keystroke |
| Date controls | `value` | `onChange(DateValue or null)` |

```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <TextField
      name={field.name}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      isRequired
      type="email"
      autoComplete="email"
      isInvalid={fieldState.invalid}
      validationBehavior="aria"
    >
      <Label>Email</Label>
      <Input ref={field.ref} />
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  )}
/>
```

Neither HeroUI nor React Aria documents TanStack Form. Wire it the same way: `value` from `field.state.value`, the change handler from the table calling `field.handleChange`, `onBlur={field.handleBlur}`, `isInvalid` from `field.state.meta.isTouched && !field.state.meta.isValid`, and the first message in FieldError. Its timing is the equivalent given in the shadcn note.

## Dates

`@internationalized/date` objects go in and out of the controls. The output type follows the input type.

| Backend type | Into the control | Back to the backend |
|---|---|---|
| Date column ("2024-01-05") | `parseDate(s)` gives CalendarDate | `value.toString()` |
| Timestamp with zone ("...Z" or "+02:00") | `parseAbsolute(s, zone)` or `parseAbsoluteToLocal(s)` gives ZonedDateTime | `value.toAbsoluteString()` |
| Instant plus a stored IANA zone | `parseZonedDateTime("...[America/Los_Angeles]")` | `toAbsoluteString()` for the instant, and keep `value.timeZone` in its own column |
| Wall-clock timestamp (no zone) | `parseDateTime(s)` gives CalendarDateTime | `value.toString()` |
| Time ("09:00") | `parseTime(s)` gives Time | `value.toString()` |
| JS Date or epoch milliseconds | `fromDate(d, zone)` or `fromAbsolute(ms, zone)` | `value.toDate(zone)` (the zone is required) |
| Today and now | `today(getLocalTimeZone())`, `now(getLocalTimeZone())` | not applicable |

- A date-only value never goes through JS Date: `toDate` plus `toISOString` can move the day (scan rule `picker-value-through-date`).
- `ZonedDateTime.toString()` ends in a bracketed zone name and does not belong in an instant column. Use `toAbsoluteString()`.
- A wall-clock value becomes an instant only through `toZoned(dt, zone, disambiguation)`, with a DST choice: `"compatible"`, `"earlier"`, `"later"`, or `"reject"`.
- `parseDate` accepts only an ISO date. Normalize an API timestamp to a date at the boundary (scan rule `picker-value-through-date` also flags `parseDate` fed a timestamp).
- Compare with `value.compare(other)`. `isDateUnavailable`, `minValue`, and `maxValue` constrain the picker.
- `placeholderValue={new CalendarDate(1980, 1, 1)}` opens birth dates near a plausible year.
- Dates clamp to the allowed range on blur since React Aria Components 1.15.
- `getLocalTimeZone` is cached; tests call `setLocalTimeZone`.
- Segments move focus to the next segment by themselves once one is filled. GOV.UK forbids auto-advance for memorable dates. DateField is still the HeroUI choice for them, because segments accept typing and arrow keys and the user can correct a segment without a mouse.
- The DatePicker submits an ISO string by granularity when it has a `name`; the range picker uses `startName` and `endName`.

## Async options

- Import `useAsyncList` from `react-aria-components`, not `@react-stately/data`, which the project may not depend on (scan rule `heroui-react-stately-import`).
- The ComboBox binds `inputValue={list.filterText}` and `onInputChange={list.setFilterText}`; set `allowsEmptyCollection` and render an empty state.
- Paging: `ListBoxLoadMoreItem` with `isLoading` and `onLoadMore` from the list.
- The item `id` is the record's primary key and `textValue` is its label (scan rule `heroui-listbox-name-id`). With `formValue="key"` the form submits the id.
- Encode the filter text in the request URL with `encodeURIComponent`.
- The `signal` passed to `load` aborts stale requests; add a debounce yourself when requests are costly.
- An edit form loads the selected record by id, so the label shows even when the record is not on the first page.

## Pitfalls

1. Install `@internationalized/date` explicitly.
2. Stay on 3.2.2 or later.
3. Browser messages ignore I18nProvider; pass custom text through the FieldError render function.
4. The default `validationBehavior="native"` blocks submit; use `"aria"` when a library owns validation (`heroui-rhf-validation-behavior`).
5. NumberField `onChange` fires on commit, and `commitBehavior` `"snap"` (default) clamps while `"validate"` keeps the value and flags it. An empty field is `undefined`; map it before validation.
6. `formatOptions` restrict which characters can be typed.
7. Calendar week and first-day settings need care in non-Gregorian locales.
8. 3.2.6 renamed a Fieldset class from `fieldset__field_group` to `fieldset__field-group`; custom CSS targeting the old name breaks.
9. Pro Stepper is an indicator, and Pro DropZone has no name, size, or validation props.
10. Rating, Segment, ToggleButtonGroup, and RichTextEditor never reach FormData.
11. `errorMessage` on a HeroUI component does nothing in v3 (`heroui-errormessage-prop`).

## Checked facts

All read 2026-10-27.

1. Auto-advance: React Aria's `useDateSegment` (https://github.com/adobe/react-spectrum, `packages/react-aria/src/datepicker/useDateSegment.ts`, main) calls `focusManager.focusNext()` when a numeric segment has received as many digits as its maximum allows, and after a day-period or era match. The DateField page (https://react-aria.adobe.com/DateField) does not describe it. So DateField and DatePicker auto-advance.
2. Component lists: https://heroui.com/react/llms.txt lists the web components, and https://heroui.com/native/llms.txt and https://heroui.com/docs/native list the Native ones. The web list has Form, Fieldset, Label, Description, FieldError, ErrorMessage, TextField, Input, TextArea, InputGroup, NumberField, SearchField, Select, ListBox, ComboBox, Autocomplete, DateField, DatePicker, DateRangePicker, Calendar, RangeCalendar, TimeField, CheckboxGroup, Checkbox, RadioGroup, Switch, ToggleButtonGroup, Slider, InputOTP, TagGroup, and the Color components, which matches the matrix in report-heroui.md. The Native list has no Form, date, number, or combobox component. The HeroUI MCP was not available, and the Pro indexes were not re-read: the Pro rows come from the same-day study in report-heroui.md.
3. Version facts come from that study: `@heroui/react` 3.2.6 (Apache-2.0) at heroui-inc/heroui commit 70a11531fedfb39b6a0748ca49766266108362ae, `react-aria-components` 1.21.1 at adobe/react-spectrum commit 06891def3e7488f4e598debb8418bf17cf060279, and the React Aria forms page (https://react-aria.adobe.com/forms) for the validation model.
