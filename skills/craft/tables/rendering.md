# Rendering

Rendering is decided after the data flow in [data-flow.md](data-flow.md). Processing picks the rows; this file picks how they reach the screen.

## Pagination by default

- Admin tables paginate with 20 rows per page and options 20, 50, and 100.
- The footer shows the range and the total, written with a plain hyphen: "21-40 of 142".
- Previous and Next are links when the page is in the URL.
- "Load more" is for feeds that need the footer. Infinite scroll is only for browsing homogeneous items, with a visible total and scroll restored on Back.

## When to virtualize

| Dataset | Processing | Rendering |
| --- | --- | --- |
| Fits in the browser; up to about 50 rows on screen, or a page size up to 50 | Client | Plain table |
| Fits (a few thousand to about 100k rows); one long scroll, or pages above about 50 rows | Client | Row virtualization |
| More than about 100k client rows, or sort and filter that are expensive | Server; workers only as a last resort | Virtualize what is loaded |
| Too big, slow, permission-scoped, or volatile; page numbers and a total are needed | Server, offset, with `rowCount` and previous data kept | Plain per page; virtualize if the page is above about 50 rows |
| Server; the total is expensive, or no page jumps | Server, cursor, `pageCount` -1, Next from has-next-page | Plain per page |
| Server feed or log with continuous scroll | Server, infinite, pages flattened, manual sort and filter | Row virtualization with fetch-ahead |
| More than about 12 visible columns, or very wide | Any | Column virtualization with spacer cells |
| Many rows and many columns | Any | Both, indexing the same rows and visible columns |
| Millions of rows, spreadsheet editing, live updates | A data source behind the grid | A canvas grid (spreadsheet scale only); accessibility is weaker |
| Accessibility, printing, or in-page find comes first | Pagination | No virtualization |

## Accessible virtual markup

- Use a real `<table>` with `aria-hidden` spacer rows above and below.
- Set `table-layout: fixed` with a `colgroup`.
- `aria-rowcount` on the table: the total plus the header rows, or -1 when unknown.
- `aria-rowindex` on each row, with the header row as 1.
- `scroll-padding-top` equal to the header height, so a scrolled-to row clears the sticky header.
- Measured row heights force a grid or flex layout with absolute rows; then add explicit table roles.
- React Aria and HeroUI use React Aria's Virtualizer, which renders grid roles on divs.

## Row height and overscan

- Fixed row height by default, from the density (32, 40, or 48).
- Measure only when the content needs it, with `data-index` on each measured row.
- Overscan 5 to 10 rows and 2 to 3 columns.
- Pinned columns stay in the range extractor.
- Keep the focused or dragged row mounted.

## Performance

- The virtualizer lives in the lowest component that renders rows.
- Formatters are hoisted out of cells.
- Column resizing uses on-end mode or CSS variables.
- Item components are defined outside render.
- react-data-grid: replace only changed row objects.
- `useDeferredValue` for filter-as-you-type over large client sets.
- Profile production builds before reaching for experimental options.

Virtualization rules adapted from TanStack Table and TanStack Virtual docs (MIT).
