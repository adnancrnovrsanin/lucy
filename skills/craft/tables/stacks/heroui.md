# HeroUI tables stack note

HeroUI v3 Table wraps react-aria-components (RAC) one to one and does no data processing. This note maps the kinds of [column-kinds.md](../column-kinds.md) to HeroUI components, shows how TanStack drives the table, and lists where HeroUI departs from the defaults in [look.md](../look.md). The engine rules are in [tanstack.md](tanstack.md).

## Detect

- v3 uses `Table.Content`, `@heroui/styles`, and Tailwind v4.
- v2 uses separate `TableHeader` and `TableColumn` imports from `@heroui/react` or `@heroui/table`.
- Pro means `@heroui-pro/react` is a dependency.
- Read Table and Pagination docs through the HeroUI MCP `get_component_docs` when it is available.
- Put `table engine: heroui v3` (or `v2`) on the stack line, plus the TanStack major when TanStack drives state.

## Slots

| Role | Component |
|---|---|
| Table | Table, Table.ScrollContainer, Table.Content, Table.Header, Table.Column, Table.Body, Table.Row, Table.Cell, Table.Footer |
| Sort header | Table.SortableColumnHeader |
| Status and tags | Chip |
| Person | Avatar |
| Row menu | Dropdown |
| Selection | Checkbox with `slot="selection"` |
| Peek | Drawer or Sheet |
| Pager | Pagination |
| Load more | Table.LoadMore |
| Empty state | `renderEmptyState` on Table.Body |

## Composition with TanStack

Adapted from the HeroUI v3 TanStack table demo (Apache-2.0). TanStack v9 owns sort, page, selection, filters, and visibility; HeroUI renders. Feature names follow [tanstack.md](tanstack.md); confirm them against the installed table-core.

```tsx
const ROW_HEADER_ID = "number"; // the id of the identifier column
const skeletonRowIds = Array.from({ length: 10 }, (_, i) => `skeleton-${i}`);

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature, rowSelectionFeature });
const table = useTable(useMemo(() => ({
  features, columns, data: query.data?.rows ?? emptyRows,
  getRowId: (r) => String(r.id),
  manualSorting: true, manualPagination: true, rowCount: query.data?.total,
  state: { sorting, pagination, rowSelection },
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
  onRowSelectionChange: setRowSelection,
}), [columns, query.data, sorting, pagination, rowSelection]));

const toDescriptor = (s: SortingState): SortDescriptor | undefined =>
  s[0] && { column: s[0].id, direction: s[0].desc ? "descending" : "ascending" };
const toSorting = (d: SortDescriptor): SortingState =>
  [{ id: String(d.column), desc: d.direction === "descending" }];
const toKeys = (sel: RowSelectionState): Selection =>
  new Set(Object.keys(sel).filter((k) => sel[k]));
const fromKeys = (keys: Selection, pageIds: string[]): RowSelectionState =>
  Object.fromEntries((keys === "all" ? pageIds : [...keys].map(String)).map((id) => [id, true]));

<Table.Content
  aria-label="Invoices"
  sortDescriptor={toDescriptor(sorting)}
  onSortChange={(d) => setSorting(toSorting(d))}
  selectionMode="multiple"
  selectedKeys={toKeys(rowSelection)}
  onSelectionChange={(k) =>
    setRowSelection(fromKeys(k, table.getRowModel().rows.map((r) => r.id)))}
>
  <Table.Header>{/* select-all <Checkbox slot="selection"> first */}
    {table.getLeafHeaders().map((h) => (
      <Table.Column key={h.id} id={h.id}
        allowsSorting={h.column.getCanSort()} isRowHeader={h.id === ROW_HEADER_ID}>
        {({ sortDirection }) => (
          <Table.SortableColumnHeader sortDirection={sortDirection}>
            {flexRender(h.column.columnDef.header, h.getContext())}
          </Table.SortableColumnHeader>
        )}
      </Table.Column>
    ))}
  </Table.Header>
  <Table.Body renderEmptyState={() => (query.isError ? <ErrorState /> : <NoResults />)}>
    {query.isPending
      ? skeletonRowIds.map((id) => (
          <Table.Row key={id} id={id}>{/* first load: skeleton rows in the real frame */}
            {table.getVisibleLeafColumns().map((col) => (
              <Table.Cell key={col.id}><Skeleton className="h-4 w-full rounded" /></Table.Cell>
            ))}
          </Table.Row>
        ))
      : table.getRowModel().rows.map((row) => (
          <Table.Row key={row.id} id={row.id}>{/* row <Checkbox slot="selection"> first */}
            {row.getVisibleCells().map((c) => (
              <Table.Cell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</Table.Cell>
            ))}
          </Table.Row>
        ))}
  </Table.Body>
</Table.Content>
```

The selection bridge and the manual flags are a restatement; run them before relying on them.

- React Aria owns column widths through `ResizableTableContainer` and `onResizeEnd`, which resize by keyboard. Persist the width map and leave TanStack sizing off.
- Build headers from `getLeafHeaders()`, never `getHeaderGroups()[0]`.
- Mark exactly one column `isRowHeader`.
- Give `items` render functions `dependencies` for every outside value they read. `.map` children re-render on each render.
- React Aria's `"all"` selection means the loaded rows only. Offer "select all N matching" as a separate control.
- Pass `onSortChange` with every `sortDescriptor`. One descriptor means single-column sort in the header.
- Infinite lists: `useInfiniteQuery` plus `Table.LoadMore` with `onLoadMore={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}`, rendered while `hasNextPage`.
- On refetch keep the previous data, show progress outside the body, and set `aria-busy` yourself.

## Where HeroUI departs from the defaults

- HeroUI tables are always `role="grid"`, with `aria-sort` and sort announcements built in. Leave the role alone, and the scan does not flag `Table.Column allowsSorting`.
- The keyboard default is `"tab"`. Keep it when cells hold controls, and set `keyboardNavigationBehavior="arrow"` for read-only tables.
- Pagination items are buttons carrying `aria-current="page"`. Use HeroUI Pagination with a router push to keep the page in the URL. The links rule of [look.md](../look.md) does not apply here.
- Virtualize with React Aria's `Virtualizer` and `TableLayout` inside a fixed-height scroll container. Rows become divs with `aria-rowcount`. Never add a second virtualizer on top.
- Under `TableLayout`, pin the identifier column with sticky positioning only after checking in the running app that it sticks. If it does not, keep the identifier as the first column, unpinned.
- Set `aria-busy` on the table during a refetch yourself (see Checked facts).
- If the sort cannot return to unsorted, offer a Clear sort control.

## HeroUI v2

- Keep `@heroui/table` in v2 projects, with TanStack for state.
- `isVirtualized` needs `rowHeight` and `maxTableHeight`. The documented automatic virtualization above 50 rows does not happen.
- Migrate to v3 only when asked.
- v2 to v3 mapping: `TableHeader` to `Table.Header`, `TableColumn` to `Table.Column`, `TableBody` to `Table.Body`, `TableRow` to `Table.Row`, `TableCell` to `Table.Cell`.
- `loadingState` becomes `Table.LoadMore` plus your own refetch indicator.
- `emptyContent` becomes `renderEmptyState` on `Table.Body`.
- `isVirtualized` becomes React Aria's `Virtualizer` with `TableLayout`.

## Pro DataGrid

- Use it only when `@heroui-pro/react` is already a dependency. Never add it.
- It has no filtering, pagination, or editing API, so the toolbar, pager, and URL state are built around it.
- For server filters and pagination, prefer TanStack with `Table.*`.
- No Pro text or code is copied into this note.

## Pitfalls

- `Table.Content` without `aria-label` or `aria-labelledby`.
- No `isRowHeader` column. React Aria throws at runtime.
- `selectionMode` without a `Checkbox slot="selection"`. v3 renders no selection column on its own.
- `localeCompare` over `String(value)` for numbers and dates. Sort by the typed value, as the kind table says.
- `useAsyncList` where TanStack Query already holds the data.
- `sortDescriptor` without `onSortChange`.
- `Table.LoadMore` without a loading guard.

## Checked facts

HeroUI at commit 70a11531, react-spectrum at commit 3280ed4b, both under `.lucy/notes/2026-10-27-tables-research/repos/`.

- Default `keyboardNavigationBehavior = "tab"` on `Table.Content`: `heroui/packages/react/src/components/table/table.tsx:104-118`.
- Pagination links render a `ButtonPrimitive` with `aria-current="page"`: `heroui/packages/react/src/components/pagination/pagination.tsx:162-180`.
- A table with columns and no `isRowHeader` column throws: `react-spectrum/packages/react-aria-components/src/Table.tsx:246-250`.
- `aria-sort` is the direction on the sorted column and `none` on other sortable columns, skipped on Android, where sort details go through `aria-describedby`: `react-spectrum/packages/react-aria/src/table/useTableColumnHeader.ts:89-101`.
- `aria-busy` is not forwarded: no match for it in `react-aria-components/src/Table.tsx`, `react-aria/src/table`, or `react-aria/src/grid`. Set it yourself.
- Whether the sort cycle returns to unsorted: Not verified. The header calls `state.sort(node.key)` (`useTableColumnHeader.ts:81`), and the stately table package is not in the clone. The Clear sort rule does not depend on it.
- Sticky pinning under `TableLayout`: Not verified. The pinning rule above checks it in the running app and falls back to an unpinned first column, so it does not depend on this.
- v2 `isVirtualized` needs `rowHeight` and `maxTableHeight`, v2 and Pro DataGrid details: taken from `.lucy/notes/2026-10-27-tables-research/report-engines-extra.md`, section 2, not re-read in code.
