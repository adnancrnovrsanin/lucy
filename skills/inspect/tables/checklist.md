# Tables checklist

Answer each check yes or no. `[static]` means reading the code settles it; `[browser]` means it needs the running app. Each item starts with its id and ends with the craft section that fixes a failure.

A failed item is an error when it shows a column against its kind (raw money, a foreign-key id, a raw enum value), mixes client and server processing, lets a client value reach a query unchecked, or is a WCAG 2.2 A or AA failure. Every other failed item is a warning.

## Model and kinds

- [ ] `columns-from-model` Every column comes from a field of the named model, and the column inventory has a row for each. [static] Fix by: craft/tables.md#step-3-column-inventory
- [ ] `kind-per-column` Every column has a kind from the kind table, chosen by the resolution order, and no unclear kind was guessed. [static] Fix by: craft/tables/column-kinds.md#how-to-choose-a-kind
- [ ] `money-as-money` Money shows in currency style with the app locale and the record currency, from minor units or a decimal string. [static] Fix by: craft/tables/column-kinds.md#numbers-and-money
- [ ] `relation-display-field` Relations show the related record's display field as a link, never a foreign-key id, and the server returns it in the same query. [static] Fix by: craft/tables/column-kinds.md#relations-and-display-fields
- [ ] `enum-presentation` Enums show a badge with an icon or dot and a label from a label map, sorted by declared order. [static] Fix by: craft/tables/column-kinds.md#enums-and-booleans
- [ ] `dates-zoned` Dates and timestamps follow the date rules, and the time zone decision is stated. [static] Fix by: craft/tables/column-kinds.md#dates-and-durations
- [ ] `kind-layer-reused` Cells and filter controls come from the project's kind layer, and no kind is inlined in one table. [static] Fix by: craft/tables/column-kinds.md#kind-layer-and-column-registry
- [ ] `registry-shared` One column registry per table is read by the table and by the server allow-list. [static] Fix by: craft/tables/column-kinds.md#kind-layer-and-column-registry

## Data flow

- [ ] `scope-not-mixed` Client or server is chosen by the rule, and a server table sets every manual flag together. [static] Fix by: craft/tables/data-flow.md#client-or-server
- [ ] `server-checklist` A server table follows the seven steps of the server checklist. [static] Fix by: craft/tables/data-flow.md#server-checklist
- [ ] `stable-row-ids` Row ids are backend ids, and data and columns keep stable references. [static] Fix by: craft/tables/data-flow.md#stable-references-and-row-ids
- [ ] `url-state` Sort, filter, and page state live in the URL and are parsed with a schema. [static] Fix by: craft/tables/data-flow.md#url-state
- [ ] `selection-scope` "Select all matching" is a separate step, sent as the filter plus exclusions. [static] Fix by: craft/tables/data-flow.md#selection-scope
- [ ] `registry-parity-test` A server table has a test that the column registry and the server agree. [static] Fix by: craft/tables.md#step-9-prove

## Rendering

- [ ] `render-choice` Pagination or virtualization follows the decision table, and admin tables paginate at 20 rows by default. [static] Fix by: craft/tables/rendering.md#when-to-virtualize
- [ ] `virtual-markup` A virtualized table keeps the accessible virtual markup: spacer rows, aria-rowcount, and aria-rowindex. [static] Fix by: craft/tables/rendering.md#accessible-virtual-markup

## Filtering

- [ ] `filter-per-kind` Each filterable column uses the control and operators of its kind. [static] Fix by: craft/tables/filtering.md#operators-by-kind
- [ ] `filter-surface` The filter surface fits the table's job, and filters live outside the header row. [static] Fix by: craft/tables/filtering.md#filter-surfaces
- [ ] `server-revalidates` The server re-validates the filter tree against the registry and binds every value. [static] Fix by: craft/tables/filtering.md#server-translation
- [ ] `facet-counts` Server facet counts exclude their own filter and never come from one page. [static] Fix by: craft/tables/filtering.md#facet-counts

## Look and states

- [ ] `modern-default` The toolbar, frame, header, columns, and footer follow the look reference. [static] Fix by: craft/tables/look.md#table-frame-and-header
- [ ] `opt-in-justified` Every opt-in tier in the table has a stated reason. [static] Fix by: craft/tables/look.md#opt-in-tiers
- [ ] `five-states` First load, refetch, no data, no results, and error each render as the look reference says. [browser] Fix by: craft/tables/look.md#states
- [ ] `bulk-bar` The bulk bar floats at the bottom center with the count, "Select all N matching", verb-labelled actions, and Clear. [browser] Fix by: craft/tables/look.md#selection-and-bulk-actions
- [ ] `mobile-layout` Below 640px the priority columns stay, filters move into a drawer, and targets are 44px. [browser] Fix by: craft/tables/look.md#mobile

## Accessibility

- [ ] `named-table` The table has one accessible name, and its header cells have scope. [static] Fix by: craft/tables/look.md#accessibility
- [ ] `sort-semantics` Sort headers are buttons, and aria-sort sits only on the sorted column's header cell. [static] Fix by: craft/tables/look.md#sort-headers
- [ ] `named-actions` Row checkboxes and actions are named with the row identity and are reachable without hover. [static] Fix by: craft/tables/look.md#row-actions
- [ ] `keyboard-only` The toolbar, table, and bulk bar work by keyboard, and focus is visible and never hidden under the sticky header. [browser] Fix by: craft/tables/look.md#keyboard
- [ ] `results-announced` Result counts and sort changes are announced through the polite status region. [browser] Fix by: craft/tables/look.md#live-region

## Real data

- [ ] `longest-values` The longest value each column allows fits, or truncates with a path to the full value. [browser] Fix by: craft/tables/column-kinds.md#text-and-identifiers
- [ ] `large-numbers` The largest amounts and counts stay aligned and formatted. [browser] Fix by: craft/tables/column-kinds.md#numbers-and-money
- [ ] `empty-values` Empty and null values render blank, and an empty relation shows nothing rather than an id. [browser] Fix by: craft/tables/column-kinds.md#value-rules
- [ ] `slow-network` A slow network shows the first-load and refetch states. [browser] Fix by: craft/tables/look.md#states

Every check you could not run is reported as "Not verified", never assumed. Report the scan summary only when its `files N` counts the table's files; otherwise pass the table paths explicitly and run it again.
