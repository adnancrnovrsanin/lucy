# Data flow

Processing decides where rows are sorted, filtered, and paged. Decide it before rendering: the rendering choice in [rendering.md](rendering.md) follows from it.

## Client or server

- Start on the client when the full dataset can be fetched and kept in memory; a few thousand rows is fine.
- Go server-side when fetching everything is slow or expensive, when the backend must enforce permissions or business rules, when data goes stale quickly, or when the database can index better. Measure payload size and wait time; no fixed row count decides it.
- Never mix scopes. When the server pages, it also sorts, filters, and computes facets. Sorting a server page on the client sorts one page only.

Adapted from TanStack Table's client-side vs server-side guide (MIT).

## Server checklist

1. Own the state.
2. Put every server-owned value in the query key.
3. Set every manual flag together: pagination, sorting, filtering.
4. Pass the server's rows straight to the table.
5. Pass `rowCount`, or `pageCount` (-1 when the total is unknown).
6. Reset the page index when filters, sort, or page size change.
7. Keep previous data while fetching, and drop stale responses.

## Stable references and row ids

- `getRowId` returns the backend id, never the index.
- Rows are keyed by `row.id`.
- `data` and `columns` keep stable references: columns at module level or in `useMemo`, and a module-level empty array as the fallback, never an inline `?? []`.
- Selection, expansion, and pinning survive refetches because they key on row ids.

## Query wiring

- Use TanStack Query, or the project's data layer.
- Set `placeholderData: keepPreviousData` or the equivalent.
- Pass `query.data?.rows ?? emptyRows` straight through; copying query data into state with an effect adds a render and a stale frame.
- Throw a typed error on non-2xx responses and forward the AbortSignal.

## Ordering and pagination

- Every ORDER BY ends with a unique tiebreaker.
- Offset pagination counts over the same filter.
- Cursor pagination orders by cursor, then the user's sort, then the tiebreaker, and fetches size plus one.
- The filtered count is authoritative, or rows become unreachable.

## URL state

- Use nuqs when present, otherwise the project router.
- Params are readable and allow-listed (`?status=open,closed&sort=createdAt.desc&page=2`); unknown ids are dropped.
- Replace history while typing and push on apply. Filter writes are debounced, and the page resets on change.
- Parse with a schema, never a bare `JSON.parse`.
- Over about 2,000 characters, save a view and put `?view=<id>` in the URL.
- nuqs pitfalls: a missing `NuqsAdapter` fails silently; a missing `Suspense` breaks the App Router build; `.default("")` creates phantom filters.

## Selection scope

- The header checkbox selects the current page.
- "Select all N matching" is a separate step, sent to the server as the filter plus exclusions.
- When filters change, state the policy: clear the selection, or keep it and act on visible rows only.
- Shift ranges never cross unloaded pages.

## Infinite loading

- Flatten pages in a memo and read the total from the first page.
- Fetch ahead within 500px of the end, or with a sentinel row.
- Guard against fetch storms with in-flight and has-next-page checks, and fetch again when a short first page does not fill the viewport.
- Scroll to the top when the sort or filter changes.
- `aria-rowcount` is -1 when the total is unknown.

## Backend rules

These hold for any ORM.

- Fields are mapped through the column registry; an own-property lookup means `__proto__` never resolves.
- Operators come from a server switch, where an unknown operator is a 400.
- Values are bound parameters.
- LIKE wildcards (`\`, `%`, `_`) are escaped.
- Empty groups are dropped.
- The query builder receives only values built on the server: no client object in `where`, no `sql.raw` field, no interpolated ORDER BY.
