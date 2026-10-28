# Field map

## How to use this map

Identify each field's value kind with [../kinds.md](../kinds.md). Then resolve its control in this order: a convention the project already follows, then the section below for its kind, then stop and decide with the user. A field with no section never becomes a text input. Role names here (RadioGroup, Select, Combobox, DatePicker, DateField) resolve to components in the stack note.

| Value kind | Control |
| --- | --- |
| enum or status | RadioGroup or ToggleGroup up to 5, Select 6 to 30, Combobox above 30 or from data |
| multi-enum or tags | CheckboxGroup; a multi-select dropdown for long lists only |
| boolean | Checkbox in a form, Switch for a setting |
| relation to-one, person | Async Combobox storing the primary key |
| relation to-many | Async Combobox with `multiple` and chips |
| date | Library date picker, or three inputs for memorable dates |
| timestamp, duration | Library date and time fields |
| quantity or count | `type="number"` |
| money, percent | Text with `inputmode="decimal"`, unit outside the input |
| identifier or code | Text, spellcheck off, `inputmode="numeric"` for digits |
| text, long text | Input or Textarea with a character count |
| email, phone, URL | `type="email"`, `type="tel"`, `type="url"` with their autocomplete tokens |
| file or image | Library drop zone or file input |
| internal id, JSON or object | Not a form field; never shown as an input |

## Enums and booleans

- RadioGroup or ToggleGroup up to 5 options, Select from 6 to 30, Combobox above 30 or whenever options come from data.
- Two values that mean on and off: Checkbox in a form, Switch for a setting that reads as on or off.
- Several answers from a short list: CheckboxGroup, with an exclusive "None" option last when "none" is a valid answer. A multi-select dropdown is for long lists only.
- Option order is alphabetical unless the model or research gives a frequency order. Nothing is preselected in a question; preselection belongs to settings and sorts.
- An "Other" choice exists only when the model has the enum value and a nullable text column for the free text.
- Free strings with common values: a text input with suggestions from the app's own distinct values ([autofill.md](autofill.md), input help).

## Relations and people

- Use an async Combobox. The item id is the record's primary key; the label is the text value.
- Options load from the app's own data, with the query encoded.
- An existing value loads its record by id, so the label shows on edit.
- The form stores the primary key and never the label.
- A dependent field (country then region) resets when its parent changes.

## Arrays and nested objects

- A field array keys its items by the library's stable id.
- Add and remove disable at the model's max and min, with an array-level message.
- Remove buttons are named for their row ("Remove guest 2").
- Add move up and move down buttons when order matters; drag is never the only way.
- A nested object is a fieldset with a legend, in the same form: a child component reads the form through the library's context (`useFormContext`), never through a second `useForm`.

## Dates and durations

- Near-term dates (bookings, deadlines): the library date picker, which also accepts typed entry.
- Memorable dates (date of birth, dates copied from a document): three day, month, and year inputs in a fieldset on shadcn (`inputmode="numeric"`, autocomplete `bday-day`, `bday-month`, `bday-year`, no auto-advance between inputs, an example hint with a day of 13 or more and a month of 9 or less), the segmented DateField on HeroUI. Never a calendar.
- Approximate dates: month and year only. Card expiry: month and year as the card prints them.
- Time only: the library time field (HeroUI TimeField); shadcn's time recipe is `Input type="time"`.
- Date ranges: start and end columns map to the library range picker.
- Dates shown to the user are formatted with the user's locale (`Intl.DateTimeFormat(locale, ...)` or the date library's locale option), never a hard-coded pattern such as `dd/MM/yyyy`.
- Conversion between control values and the backend type lives in the stack note. A date-only value never goes through a JS `Date`.

## Numbers and money

- Numbers that are not quantities (codes, phone, postal, card, account): text with `inputmode="numeric"`.
- Decimals: text with `inputmode="decimal"`, accepting a decimal comma, coerced in the schema. Trim the string and replace the comma with a point first, and map `""` away, before `z.coerce.number()` or the schema's number parse, or "1,5" becomes NaN.
- `type="number"` only for true quantities (guests, items).
- Money: stored as the model stores it (integer minor units or a decimal string). The unit sits outside the input and in the label. Display with `Intl.NumberFormat(locale, { style: "currency", currency })` using the record's currency.

## Text and identifiers

- Name: one full-name field unless the model splits it; autocomplete `name`, or `given-name` and `family-name`. Any letters, marks, spaces, apostrophes, and hyphens are valid; validate the length after trimming.
- Password: the library password field with a show and hide toggle (`type="button"`), no confirm field unless the product insists, a minimum of 8 and no maximum, no character-class rules (reject common or breached passwords instead), paste allowed, `new-password` or `current-password`.
- Card number: one text field that accepts spaces, with `inputmode="numeric"` and `cc-number`, never split into groups.
- One-time code: text with `inputmode="numeric"` and `one-time-code`, not a password field.
- Reference codes: text, spellcheck off.
- Placeholders hold short examples only, and one that trails off ends in the ellipsis character; an example the user needs belongs in the hint.
- Long free text: Textarea with a character count when the model has a limit.
- Title or honorific: avoided; if the model needs it, an optional text input with `honorific-prefix`.

## Contact, files, and objects

- Email: `type="email"`, autocomplete `email` (or `username` when it is the sign-in id), spellcheck off, paste allowed, no confirmation field.
- Phone: one `type="tel"` field, autocomplete `tel`, any format accepted, parsed with libphonenumber-js, no input mask. The label says why it is needed.
- Address: line 1, line 2, town, postcode, country, with only the needed ones required and county optional; or one textarea with `street-address` for international addresses. A lookup service is ask-first and always keeps the manual fields.

Use the library drop zone or file input. `accept` and the size check mirror the model's constraints. Previews revoke their object URLs.

## Value rules

- Text inputs produce `""`: map it to undefined for optional fields and to null for nullable columns before validation.
- `z.coerce.number()` turns `""` into 0 and `z.coerce.boolean()` turns `"false"` into true; use `z.preprocess` or `z.stringbool()`.
- Editable prefill belongs in the form's default values, not in the schema's `.default()`.
- An edit form resets once when its record arrives.
- Values are trimmed before validation.
- Input is never filtered or masked as it is typed: accept it, normalize it on blur or in the schema, and show an error for what cannot be normalized.
- Text lengths get a character count and a validation message, never a `maxLength` attribute, which cuts input silently.
- Money and decimals use `Intl.NumberFormat` for display and a parser for entry; the stored value stays untouched. Other constraints are mirrored into `required`, `type`, `min`, and `max`.
- A schema with defaults or transforms has different input and output types: type the form with both.
