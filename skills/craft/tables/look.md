# Look and behaviour

This is the modern default for admin tables. Add an opt-in tier only when the table's job needs it.

## Page frame

- A title with a muted total count and one primary action.
- View tabs only when saved views exist; they collapse to a Select in narrow containers.

## Toolbar

- One row: search on the left (`/` focuses it, placeholder "Search {resources}"), the filter chips and "+ Filter", then Sort, Display, and Export on the right.
- Display holds density (Compact 32, Default 40, Comfortable 48), column visibility and order with "Reset columns", and optional Group by.
- Hidden columns show an indicator.
- Column order and size have a menu or keyboard path, never drag only.

## Table frame and header

- One 1px frame with an 8px radius and horizontal dividers only.
- No zebra stripes in selectable or hoverable tables.
- A sticky header 36 to 40px tall with an opaque background and a z-index above body cells, set at body size, weight 500, muted, sentence case.
- No scroll snap. `scroll-padding-top` equals the header height (36 to 40px) so focused rows are not hidden under it.
- Each header has a menu reachable by keyboard: sort with typed labels ("Oldest first", "Newest first", "A to Z", "Low to high"), filter, hide, and pin.

## Columns and cells

- An always-visible checkbox column 40px wide.
- The identifier is a real link, sticky on horizontal scroll with an edge shadow.
- Data columns follow their kind. Rows are 40px with hover and selected tints.
- Text and dates are left-aligned, numbers right-aligned, never centered. A full-width message cell (with `colSpan`) may be centered.
- Cells are read-only by default; editing is the grid mode tier.

## Row open and peek

- The identifier links to the detail page. A row click may delegate to that link.
- The peek is an opt-in tier for triage tables:
  - a right sheet about 480px wide with `?peek=<id>` in the URL;
  - previous and next buttons plus arrow keys;
  - "Open full page";
  - Esc closes it;
  - a bottom drawer on mobile.

## Row actions

- A trailing "..." menu column with a visually hidden "Actions" header, mirrored by right-click.
- At most two inline actions; otherwise an overflow menu with at most one action promoted.
- Every action name includes the row identity ("Edit invoice 1042").
- Actions stay visible, or appear on hover and focus-within together, and always on touch.
- After a delete, focus moves to the next row's matching control.

## Selection and bulk actions

- The header checkbox is tri-state for the page (check "all" first, then "some").
- Row checkboxes are named with the row identity.
- Shift-click selects a range.
- The bulk bar floats at the bottom center. It shows "{n} {resources} selected", "Select all N matching", up to 3 verb-labelled actions plus an overflow, and Clear (Esc). It is reachable by keyboard.
- Destructive actions come last and are confirmed or undoable.
- Selection is never shown by color alone. A plain table carries selection on the checkbox, not `aria-selected` on the row.

## Footer and pagination

- Left to right: the selection count, rows per page (20, 50, 100), "21-40 of 142", then Previous and Next as links when the page is in the URL.
- HeroUI keeps its Pagination with a router push (see the HeroUI note).
- Page controls are never divs or spans.
- Opt-in totals row: computed on the server over the whole filtered set and labelled "Total (all N)".

## States

- First load: skeleton rows in the real frame with the real column count.
- Refetch: the rows stay, a slim progress bar shows, and the table is `aria-busy`.
- No data: "No {resources} yet" with one sentence and the create action.
- No results: "No {resources} match these filters" with "Clear filters", and the toolbar stays.
- Error: a message, Retry, and the request id when one exists.
- A failure renders as an error, never an empty table, and the table keeps its frame while loading instead of giving way to a spinner.

## Keyboard

- Default: `/` for search; Esc clears search, then the selection, then closes the peek; `?` opens the shortcut sheet.
- The power mode tier adds j and k (or arrows) for row focus, x, Shift+x, Enter, Space for the peek, F to add a filter, and Shift+V for Display. Row focus is roving, with a visible focus ring.

## Mobile

- Below 640px, low-priority columns are hidden by mobile priority. Checkbox, identifier, and one status column stay.
- Filters move into a bottom drawer behind "Filters (n)".
- The bulk bar spans the full width with 44px targets.
- The peek becomes a bottom drawer.
- Rows are stacked as cards only when the table cannot fit.
- At 640px and above the full column set returns.

## Opt-in tiers

| Tier | Use when |
| --- | --- |
| Peek | Triage tables where users scan many rows and need detail without leaving the list |
| Power keyboard | Tables worked all day by the same people |
| Grouping | Rows fall into a few meaningful buckets; sticky group headers with counts, plus "Show empty groups" |
| Totals | Users read sums over the filtered set |
| Grid mode | Spreadsheet-style editing |
| Facet sidebar | Log and feed tables filtered by several categories |
| Saved views | People return to the same filtered slice (see [filtering.md](filtering.md#saved-views)) |
| AI filters | The project already has AI (see [filtering.md](filtering.md#ai-filters)) |

- Grid mode: full grid lines, cell focus, Enter to edit, Esc to cancel, a change queue with Review and Discard, and `role="grid"` with the APG grid keys.

## Accessibility

- A plain `<table>` by default; `role="grid"` only for grid mode or engines that render it.
- An accessible name: caption or `aria-labelledby`, not both.
- `th scope="col"`, and the identifier cell as `th scope="row"`.
- Keep the native table display on table, row group, and row; a display override needs explicit roles.
- No nested tables.
- Sorted state is `aria-sort` on the header cell (see Sort headers).
- The scroll container has `role="region"`, a name, `tabIndex={0}`, and a visible focus style.
- Every tabIndex is 0 or -1. Focus is never hidden under the sticky header.

## Sort headers

- Each sortable header cell holds a native button wrapping the visible label and an `aria-hidden` direction icon.
- `aria-sort` sits on the header cell of the sorted column only (ascending or descending), not as "none", and not on the button.
- The sortability hint is said once, in the caption or a described-by text.
- Load sorted by a meaningful default. Clicking the sorted column toggles direction; the first click on another column sorts ascending.
- The direction is shown by the icon as well as color.
- Sort header pattern from the WAI-ARIA Authoring Practices sortable table example.

## Live region

- One polite `role="status"` region outside the table, mounted from the first render.
- After a filter, search, size, or sort change settles, it says "{n} results", "No results", or "Sorted by {column}, {direction}".
- It skips loads under 750 ms and clears after about a second.
- Counts use the polite status region, and focus stays where it is.
