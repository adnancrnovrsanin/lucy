# Column kinds

A column kind is a column's technical type plus what it means. The kind decides presentation, alignment, format, sort, filter and operators, export value, and what the server must send. The project's kind layer implements each kind once.

## How to choose a kind

Resolve a column's kind in this order:

1. How the project already shows that field: existing formatters, display components, other tables.
2. The schema: type, constraints, annotations, name.
3. Otherwise stop and ask the user.

- No column falls back to raw text or a raw number.
- An integer column could be cents, a count, or a year; never guess which.
- Money stored as a float is reported to the user.
- A field with no row in the kind table stops the agent for a decision.

## Relations and display fields

- Pick the display field in this order: how the app already shows the related record; then a `name`, `title`, `label`, or `displayName` field; then an email; then a human number or code; otherwise ask.
- The cell links to the related record's page when one exists.
- The server returns the display field in the same query, with no extra request per row.
- The server sorts by the display field.
- The filter searches the display field and stores the related id.

## Kind table

| Kind | Presentation | Align | Sort | Filter (default operator) | Export |
| --- | --- | --- | --- | --- | --- |
| text | Plain text that wraps | Left | Locale collation | Contains | Raw string |
| long text | Two-line clamp, hidden by default, full value in the peek or detail page | Left | None | Contains, or full-text search where the backend has it | Raw string |
| identifier or code | Monospace with a copy action | Left | Locale collation | Exact match, or a pasted list (is any of) | Raw string |
| internal id | Not a column by default; if shown, monospace, shortened, copy action, never first | Left | None | Exact match | Full id |
| quantity or count | `Intl.NumberFormat`, tabular figures | Right | Numeric | Range (eq, between, gt, lt) | Plain number |
| money | `Intl.NumberFormat` currency style, fixed fraction digits, tabular figures | Right | Numeric | Range in major units (between) | Decimal string plus a currency code column |
| percent | `Intl` percent style over a stated scale (0 to 1 or 0 to 100) | Right | Numeric | Range (between) | Plain number with the scale in the header |
| duration | Compact form ("2h 5m"), exact value in a tooltip | Right | Numeric | Range with unit presets | Seconds as a number |
| date | Locale short date, never shifted by time zone | Left | Chronological | Presets plus custom range (between) | ISO 8601 date |
| timestamp | Relative within 7 days, then absolute, absolute value in a tooltip | Left | Chronological | Presets plus custom range (between) | ISO 8601 with offset |
| enum or status | Badge with icon or dot plus a label from a label map | Left | Declared order | Faceted multi-select with counts (is any of) | Label text |
| multi-enum or tags | At most two badges plus "+N" | Left | None | Has any of, has all of, has none of | Labels joined by a delimiter |
| boolean | Domain words ("Active", "Archived"), never a checkbox | Left | False before true | Any, yes, or no | true or false |
| relation to-one | Display field as a link | Left | Display field | Async combobox over the display field (is any of, is empty) | Display field |
| relation to-many | Count ("3 projects") or at most two chips plus "+N" | Right for a count | Count | Has any of, async combobox | Display fields joined by a delimiter |
| person or user | 20px avatar plus the name | Left | Name | Async combobox, "Me" first (is any of) | Name |
| email | Text, mailto link only when the app sends mail that way | Left | Locale collation | Contains | Address |
| URL | Hostname, full URL in the link, external marker | Left | Locale collation | Contains | Full URL |
| phone | Project phone library format when it has one, `tel:` link | Left | Locale collation | Contains | E.164 |
| file or image | 24 to 32px thumbnail or file icon plus the name | Left | None | Has file or no file | File name or URL |
| JSON or object | Not a column by default; shown in the peek or detail page | Left | None | None | Serialized JSON |

Operators per filter control are in the filtering reference; components per kind are in the stack notes.

## Text and identifiers

- Text wraps by default.
- Truncate only in a column with a fixed width, with the full value in a tooltip on a focusable trigger, the peek, or the detail page. A `title` attribute alone is not enough. A flex child needs `min-w-0` for truncation to work.
- Long text is clamped to two lines and hidden by default.
- Identifiers and codes are monospace with a copy action.
- An internal id is not a column by default, and never the first column. The first column is the strongest human identifier.

## Numbers and money

- Right-align with `tabular-nums`, header included.
- Create `Intl.NumberFormat` once per kind with the app locale.
- Money uses currency style with the record's or app's currency and fixed fraction digits. Store it as minor units or a decimal string; never parse it with `parseFloat` and never round it with `toFixed`. The range filter is in major units. Export is a decimal string plus a currency code column.
- Percent states its scale (0 to 1 or 0 to 100).
- Units go in the header, not in every cell.

## Dates and durations

- A date-only value is shown as a locale short date and never passes through a JS `Date` that could shift it by time zone.
- A timestamp shows relative time within 7 days, then an absolute date. The absolute value is in an accessible tooltip.
- The table plan states the time zone decision.
- Date filters offer presets (today, last 7 days, last 30 days, this month) and a custom range.
- A duration shows a compact human form ("2h 5m") with the exact value in a tooltip.
- Export uses ISO 8601 with offset.

## Enums and booleans

- An enum shows a badge with an icon or dot plus a label from a label map, never color alone. Options and order come from the schema, and sorting follows declared order.
- The enum filter is a faceted multi-select with counts ("is any of"). On server tables the counts come from the server and exclude the column's own filter.
- Tags show at most two badges plus "+N", and filter with has any of, has all of, or has none of.
- A boolean shows domain words ("Active", "Archived"), never a checkbox control in a read-only cell. It filters with any, yes, or no.

## Relations and people

- A to-one relation shows its display field as a link.
- A to-many relation shows a count ("3 projects", right-aligned) or at most two chips plus "+N", sorted by count.
- A person or user shows a 20px avatar plus the name, with "Me" first in its filter.
- All three filter through an async combobox over the display field, debounced, with the previous request aborted.

## Contact, files, and objects

- Email is text, with a mailto link only when the app sends mail that way.
- A URL shows its hostname, with the full URL in the link and an external marker.
- A phone number is formatted with the project's phone library when it has one, and is a `tel:` link.
- A file shows a 24 to 32px thumbnail or a file icon plus the name, never a raw path.
- JSON is shown only in the peek or the detail page.

## Value rules

- Empty cells stay blank: never "-", "N/A", or a dash glyph. One data point per column.
- The locale and currency come from the app, never a hardcoded "en-US" or "USD".
- Formatters are created once per kind, never per cell.
- Filters compare accessor values, never the rendered output.

## Kind layer and column registry

- The kind layer is the project's shared set: one cell presentation and one filter control per kind. It lives where the project keeps shared components. Every table reuses it, and a new kind is added to it, never inlined in one table.
- The column registry is one per table. It holds each column's source field, kind, label, flags (sortable, filterable, hideable, mobile priority), and for relations the display field.
- The table derives its column definitions from the registry, and the server derives its filter and sort allow-list from the same registry.
- A server table has a test that the two agree.
