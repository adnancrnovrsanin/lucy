# Filtering

Every filter surface is a view of one filter tree, and the server is the authority: the client builds the tree, the server validates and runs it.

## Filter tree

- A group has one join (and or or) and an optional not, and holds conditions of field, operator, and value. A group may hold groups.
- Caps: depth 3, 50 conditions, 10 values per list.
- Field ids come from the column registry, never database identifiers.

```ts
type FilterCondition = { field: string; operator: string; value?: unknown };
type FilterGroup = {
  join: "and" | "or";
  not?: boolean;
  items: (FilterCondition | FilterGroup)[];
};
type FilterState = { version: 1; root: FilterGroup };
```

- The typed query language (GitHub-style `status:open -assignee:me`) is not part of this playbook yet. The tree is shaped so a parser can produce it later.

## Operators by kind

Columns take their control from the kind table in [column-kinds.md](column-kinds.md); this table gives the operators each control offers.

| Filter control | Operators | Default |
| --- | --- | --- |
| text | contains, does not contain, is, is not, is empty, is not empty | contains |
| number range | is, is not, less than, at most, greater than, at least, between, is empty | is |
| date presets and range | on, before, after, between, relative presets, is empty | between |
| facet multi-select | is any of, is none of, is empty | is any of |
| tags | has any of, has all of, has none of | has any of |
| boolean | any, yes, no | yes |
| relation async combobox | is any of, is none of, is empty | is any of |

- The default operator always takes a value, so a new filter is never active empty. "Any" on a boolean clears the filter.
- The operator list follows the number of values: "is" becomes "is any of" when a second value is added.

## Filter surfaces

- A chips bar with a "+ Filter" button and a searchable field list is the default.
- A facet sidebar with counts is for log and feed tables.
- The builder with nested groups opens from "Advanced filter".
- Filters live in the toolbar or the column header menu, never as inputs inside the table header row.

## Chips

- Each chip shows field, operator, and value, and every segment is clickable to edit.
- The remove button is named "Remove filter <field>".
- "Clear filters" appears when any filter is active.
- Chips are buttons, not divs.

## Facet counts

- On server tables, counts come from the server over the other active filters, excluding the facet's own filter.
- Counts from the current page are never shown as totals.

## Saved views

Opt-in tier.

- Views are stored in the backend, personal or shared, and versioned.
- A view holds the filter tree, sort, columns (visibility, order, sizing, pinning), and density.
- A changed view shows Reset, Save, and Save as new view.
- On load, unknown fields are dropped with a notice.

## AI filters

Opt-in tier, only where the project already has AI.

- The natural-language input compiles to the filter tree, and the result appears as chips for review before it applies.

## Server translation

- Validate the tree again on the server against the registry: field allowed, operator fits the kind, value coerced, caps held.
- Translate by walking the tree with a switch over known operators, binding every value.
- Build the query from registry columns only: no `new Function` or `eval`, no `sql.raw` on a field, no client-supplied `where` object.
- An invalid query returns diagnostics (field, operator, value, message), never an empty result.
- Diagnostic codes and the allow-list rule adapted from react-querybuilder (MIT).
