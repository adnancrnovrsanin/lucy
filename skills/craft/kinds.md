# Value kinds

A value kind is a field's technical type plus what it means. The kind decides how the value is shown, entered, sorted and filtered. Forms, tables and details pages all read this file; each playbook keeps its own projection: the field map for forms, the table columns for tables, the field groups for details pages. The project's kind layer implements each kind once.

## How to choose a kind

Resolve a field's kind in this order:

1. How the project already shows that field: existing formatters, display components, other screens.
2. The schema: type, constraints, annotations, name.
3. Otherwise stop and ask the user.

- No field falls back to raw text or a raw number.
- An integer field could be cents, a count, or a year; never guess which.
- Money stored as a float is reported to the user.
- A field with no row in the kind table stops the agent for a decision.

## Relations and display fields

- Pick the display field in this order: how the app already shows the related record; then a `name`, `title`, `label`, or `displayName` field; then an email; then a human number or code; otherwise ask.
- The value links to the related record's page when one exists.
- The server returns the display field in the same query, with no extra request per value.
- Never a foreign-key id as the visible value.

## Kind table

| Kind | Presentation | Format and notes |
| --- | --- | --- |
| text | Plain text that wraps | Locale collation when sorted |
| long text | Two-line clamp with a way to the full value | Full text on demand |
| identifier or code | Monospace with a copy action | Exact match when searched |
| internal id | Monospace, shortened, copy action; not shown unless the viewer needs it | Never the first or most prominent value |
| quantity or count | `Intl.NumberFormat`, tabular figures | Plain number |
| money | `Intl.NumberFormat` currency style, fixed fraction digits, tabular figures | Minor units or a decimal string |
| percent | `Intl` percent style over a stated scale (0 to 1 or 0 to 100) | The scale is stated |
| duration | Compact form ("2h 5m"), exact value available | Stored as seconds or another stated unit |
| date | Locale short date, never shifted by time zone | Date-only, no JS `Date` |
| timestamp | Relative within 7 days, then absolute, absolute value available as text | Time zone stated |
| enum or status | Badge with icon or dot plus a label from a label map | Options and order from the schema |
| multi-enum or tags | At most two badges plus "+N" in tight spaces | All of them where there is room |
| boolean | Domain words ("Active", "Archived"), never a checkbox | A nullable value has three states: yes, no, and empty |
| relation to-one | Display field as a link | Display field from the same query |
| relation to-many | Count ("3 projects") or at most two chips plus "+N" | Display fields from the same query |
| person or user | 20px avatar plus the name | Name is the display field |
| email | Text, mailto link only when the app sends mail that way | Address as stored |
| URL | Hostname, full URL in the link, external marker | Full URL as stored |
| phone | Project phone library format when it has one, otherwise as stored, `tel:` link | E.164 when stored |
| file or image | 24 to 32px thumbnail or file icon plus the name | Never a raw path |
| JSON or object | A code block in the Inspect section of a details page, never inline | Serialized JSON |

Tables add alignment, sort, filter, export and server columns in tables/column-kinds.md; forms add controls in forms/field-map.md; details pages add placement in details/anatomy.md.

## Text and identifiers

- Text wraps by default.
- Identifiers and codes are monospace with a copy action.
- An internal id is never the first or most prominent value.
- The strongest human identifier comes first.

## Numbers and money

- Create `Intl.NumberFormat` once per kind with the app locale.
- Use `tabular-nums` wherever numbers line up.
- Money uses currency style with the record's or app's currency and fixed fraction digits. Store it as minor units or a decimal string; never parse it with `parseFloat` and never round it with `toFixed`.
- Percent states its scale (0 to 1 or 0 to 100).
- Units are shown once (a column header, a field label), not with every value.

## Dates and durations

- A date-only value is shown as a locale short date and never passes through a JS `Date` that could shift it by time zone.
- A timestamp shows relative time within 7 days, then an absolute date. The absolute value is available as text, not only on hover. In a table cell a tooltip on a focusable trigger satisfies this.
- The plan states the time zone decision.
- Audit views always show absolute, zoned time.
- A duration shows a compact human form ("2h 5m") with the exact value available.

## Enums and booleans

- An enum shows a badge with an icon or dot plus a label from a label map, never color alone. Options and order come from the schema.
- Tags show at most two badges plus "+N" in tight spaces, and all of them in a details field group.
- A boolean shows domain words ("Active", "Archived"), never a checkbox control in a read-only view.

## Relations and people

- A to-one relation shows its display field as a link.
- A to-many relation shows a count ("3 projects") or chips. On a details page, a to-many relation with more than a handful of items becomes a related-records section.
- A person or user shows an avatar plus the name.

## Contact, files, and objects

- Email is text, with a mailto link only when the app sends mail that way.
- A URL shows its hostname, with the full URL in the link and an external marker.
- A phone number is formatted with the project's phone library when it has one, otherwise shown as stored, and is a `tel:` link.
- A file shows a 24 to 32px thumbnail or a file icon plus the name, never a raw path.
- JSON is shown only in the Inspect section of a details page.

## Value rules

- The locale and currency come from the app, never a hardcoded "en-US" or "USD".
- Formatters are created once per kind, never per value.
- Values are formatted through the kind layer, never inline (`toLocaleString`, `toFixed`, template strings).

## Empty values

Two rules, one per surface.

- In a table cell an empty value stays blank: never "-", "N/A", or a dash glyph (the tables decision).
- On a details page and in a form's review step an empty value is words. Field-specific words come first ("No milestone", "Unassigned", "None yet"); otherwise "Not provided" for a field and "None" for a collection. An "Add <field>" link replaces them when the viewer may edit. A visual dash, if a design insists, carries a text alternative.

## Copy and long values

- Identifiers have a copy action with a stable accessible name ("Copy order ID") and an announced "Copied".
- Long values wrap. Truncate only where width is fixed, with the full value reachable on focus: a tooltip on a focusable trigger, an expand control, or the details page.
- A `title` attribute alone is not enough.
- A flex child needs `min-w-0` for truncation to work.

## Kind layer

The kind layer is the project's shared set: one presentation, one filter control and one input per kind, kept where the project keeps shared components. Every table, form and details page reuses it; a new kind is added to it, never inlined in one place.
