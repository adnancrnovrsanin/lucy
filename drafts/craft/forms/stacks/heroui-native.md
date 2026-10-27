# HeroUI Native stack note

The open-source package has no Form, date, number, or combobox controls; Pro adds them. Validation belongs to the form library: there is no `validate` or `validationBehavior`, and `isRequired` only shows the required marker. This note resolves the roles of [field-map.md](../field-map.md) to HeroUI Native components. Rows marked "Pro" need `heroui-native-pro`.

## Detect

- `heroui-native` and `heroui-native-pro` in package.json; `HeroUINativeProvider` at the app root.
- Versions of `react-hook-form` or `@tanstack/react-form` and `zod`.

Done when the stack line names HeroUI Native, whether Pro is installed, and the form library.

## Slots and controls

Each control sits inside a field wrapper of Label, the control, Description, and FieldError. `isInvalid` on the wrapper drives the error styling of the label, input, description, and FieldError through context.

| Role | Component |
|---|---|
| Text input | TextField with Input |
| Long text | TextField with TextArea |
| Select | Select (popover, bottom sheet, or dialog presentation) |
| Boolean | Checkbox; Switch for settings |
| Few options | RadioGroup; Pro Segment or ToggleButtonGroup |
| Range value | Slider |
| One-time code | InputOTP |
| Tags | TagGroup |
| Number | Pro NumberField, NumberStepper, NumberPad |
| Combobox | Pro ComboBox, Autocomplete |
| Date | Pro DateField, DatePicker |
| Date range | Pro DateRangePicker |
| Time | Pro TimePicker |
| Date and time | Pro DateTimePicker |
| Phone | Pro PhoneNumberField |
| Submit | Button |

Without Pro, a date, number, or combobox field is a decision to take to the user, not a text input.

## React Hook Form

Wrap each field in Controller, forward `onBlur`, and show errors through FieldError with `isInvalid={fieldState.invalid}`.

| Control | Value prop | Change handler |
|---|---|---|
| Input, TextArea | `value` | `onChangeText(string)` |
| Checkbox, Switch | `isSelected` | `onSelectedChange(boolean)` |
| RadioGroup | `value` | `onValueChange(string)` |
| Select | `value` | `onValueChange({ value, label })` |
| Pro date controls | `value` | `onValueChange({ value, label })` |
| PhoneNumberField | see Pitfalls | `onValueChange(details)` |

Timing follows the form size from [feedback.md](../feedback.md): small forms use `mode: "onTouched"`; medium forms use `mode: "onSubmit"` with `reValidateMode: "onChange"`; large forms use `mode: "onChange"` and show a field's error only once its section is finished or after a submit attempt, with Continue calling `trigger(sectionFields, { shouldFocus: true })`.

## Values

- Pro date controls exchange `{ value, label }` with ISO strings: a date is "2026-06-15", a time is "14:30:00", and a date-time is "2026-06-01T14:30:00". The date-time is wall-clock time; attach a zone before storing it as an instant.
- The DateRangePicker `value` is a JSON string. Parse it into `{ start, end }` before validating or storing (scan rule `native-daterange-unparsed`).
- A controlled picker needs the `label` too. Build it with the locale, for example with `Intl.DateTimeFormat`.
- DateTimePicker defaults to today through one year ahead, the en-US locale, and a 12-hour clock. Birthdays and past dates need explicit minimum and maximum bounds.
- WheelTimePicker fires its change handler while the wheel scrolls. Commit the value when the picker closes.
- Calendar, RangeCalendar, and the wheel date-time pickers exchange `@internationalized/date` objects instead; convert with the table in [heroui.md](heroui.md).

## Autofill and keyboards

- `autoComplete` and `textContentType` per field come from the React Native table in [autofill.md](../autofill.md).
- `keyboardType` per kind: `email-address` for email, `phone-pad` for phone, `number-pad` for integers and codes, `decimal-pad` for decimals.
- Passwords use `secureTextEntry` with `textContentType` of `newPassword` or `password`.

## Pitfalls

- Select inside a native modal on iOS shifts up. Offset it by the top safe-area inset.
- PhoneNumberField clears the number when the country changes. Store `details.e164` and set `isInvalid` from `details.isValid`, not from the display text.
- Native ComboBox drops custom text on close. Do not use it to collect free text.
- Async options are controlled through `onInputChange`: fetch, render the results as items, and keep the component's own filter permissive so it does not hide them. Load the selected record by id on edit.
- `isRequired` without a form library rule validates nothing.
- Scan rules for this stack: `native-daterange-unparsed`, `native-autofill-missing`.

## Checked facts

All read 2026-10-27.

1. Component list: https://heroui.com/native/llms.txt and https://heroui.com/docs/native list accordion, alert, avatar, bottom-sheet, button, card, checkbox, chip, close-button, control-field, description, dialog, field-error, input, input-group, input-otp, label, link-button, list-group, menu, popover, pressable-feedback, radio-group, scroll-shadow, search-field, select, separator, skeleton, slider, spinner, surface, switch, tabs, tag-group, text, text-area, text-field, and toast. There is no Form, date, number, or combobox component, so the open-source claim above holds.
2. Pro components, handler names, value shapes, and defaults come from the same-day study in report-heroui.md (`heroui-native` 1.0.11 at heroui-inc/heroui-native commit dc6833e906f36cb0f11283df0c7fdda2170a6413; `heroui-native-pro` 1.0.0-beta.11). The Pro docs were not re-read for this note and their text is not reproduced; a Pro beta can change a handler or value shape, so read the installed package's types before relying on a row.
3. React Native `autoComplete`, `textContentType`, and `keyboardType` values: https://reactnative.dev/docs/textinput, as recorded in autofill.md.
