# Column kinds

This file is the table projection of the value kinds in [../kinds.md](../kinds.md): for each kind, how a table column aligns, sorts, filters, exports and what the server must send. Identification, presentation and value rules are in kinds.md.

## Table columns by kind

| Kind | Align | Sort | Filter (default operator) | Export | Server |
| --- | --- | --- | --- | --- | --- |
| text | Left | Locale collation | Contains | Raw string | Escaped contains; an index or collation that matches the sort |
| long text | Left | None | Contains, or full-text search where the backend has it | Raw string | Full-text index when the column is filtered |
| identifier or code | Left | Locale collation | Exact match, or a pasted list (is any of) | Raw string | Exact match on an indexed column |
| internal id | Left | None | Exact match | Full id | Never filterable from the URL unless by exact match |
| quantity or count | Right | Numeric | Range (eq, between, gt, lt) | Plain number | Numeric compare on the stored unit |
| money | Right | Numeric | Range in major units (between) | Decimal string plus a currency code column | Numeric compare on the stored unit, in minor units |
| percent | Right | Numeric | Range (between) | Plain number with the scale in the header | Numeric compare on the stored unit and scale |
| duration | Right | Numeric | Range with unit presets | Seconds as a number | Numeric compare on the stored unit |
| date | Left | Chronological | Presets plus custom range (between) | ISO 8601 date | Compare as a date, with no time zone shift |
| timestamp | Left | Chronological | Presets plus custom range (between) | ISO 8601 with offset | Time zone stated; a range end is inclusive to the end of that day in that zone |
| enum or status | Left | Declared order | Faceted multi-select with counts (is any of) | Label text | Facet counts from the server, excluding the column's own filter |
| multi-enum or tags | Left | None | Has any of, has all of, has none of | Labels joined by a delimiter | Array operators (overlap, contains, not overlap) |
| boolean | Left | False before true | Any, yes, or no | true or false | A nullable column means three states: yes, no, and empty |
| relation to-one | Left | Display field | Async combobox over the display field (is any of, is empty) | Display field | Display field joined in the same query; sort by it |
| relation to-many | Right for a count | Count | Async combobox: has any of, has none of, is empty (has any of) | Display fields joined by a delimiter | Count subquery for sort; has any of through a join or exists |
| person or user | Left | Name | Async combobox, "Me" first (is any of) | Name | "Me" resolved on the server from the session |
| email | Left | Locale collation | Contains | Address | Plain contains or exact match |
| URL | Left | Locale collation | Contains | Full URL | Plain contains or exact match |
| phone | Left | Locale collation | Contains | E.164 | Plain contains or exact match |
| file or image | Left | None | Has file or no file | File name or URL | Exists check |
| JSON or object | Left | None | None | Serialized JSON | Not filterable |

Operators per filter control are in the filtering reference; components per kind are in the stack notes.

## Alignment and sorting

- Right-align numbers with `tabular-nums`, header included. Never center a data cell.
- Units go in the header, not in every cell.
- Long text is clamped to two lines and hidden by default.
- An internal id is not a column by default, and never the first column. JSON is not a column.
- Date filters offer presets (today, last 7 days, last 30 days, this month) and a custom range.
- Export uses ISO 8601 with offset, and money as a decimal string plus a currency code column.
- The enum filter is a faceted multi-select with counts ("is any of"). On server tables the counts come from the server and exclude the column's own filter.
- Filters compare accessor values, never the rendered output.
- One data point per column.

## Column registry

- The column registry is one per table. It holds each column's source field, kind, label, flags (sortable, filterable, hideable, mobile priority), and for relations the display field.
- The table derives its column definitions from the registry, and the server derives its filter and sort allow-list from the same registry.
- A server table has a test that the two agree.
