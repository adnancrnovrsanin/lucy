# TanStack Table stack note

This note serves shadcn and HeroUI tables built on TanStack Table. It carries decisions and pitfalls; the column kinds live in [column-kinds.md](../column-kinds.md) and the data flow in [data-flow.md](../data-flow.md).

## Detect

Read the major from `package.json` and the lockfile, then put `table engine: tanstack, major N` on the stack line. The major decides which API to write.

## Intent skills

When `node_modules/@tanstack/table-core/skills/` exists, read the skill for each feature you use before writing code, and the installed `.d.ts` files for exact signatures. The package ships `core`, `table-features`, `table-state`, `custom-features`, and `migrate-v8-to-v9`. When the directory is missing, the installed `.d.ts` files are the API.

## v8 and v9

| v8 | v9 |
|---|---|
| `useReactTable` | `useTable` with `features: tableFeatures({...})` |
| `getCoreRowModel()`, `getSortedRowModel()`, and the other `get*RowModel()` factories passed as options | `createCoreRowModel`, `createSortedRowModel`, `createFilteredRowModel`, `createPaginatedRowModel`, `createFacetedRowModel`, registered as features; instance methods such as `table.getCoreRowModel()` exist in both |
| Pin sides `left` and `right` | Pin sides `start` and `end` |
| Column option `sortingFn` | Column option `sortFn` |
| Sizing and resizing in one feature | `columnSizingFeature` and `columnResizingFeature` |

Write for the installed major.

## Feature registration

- In v9 an API exists only after its feature is registered: `rowSortingFeature`, `columnFilteringFeature`, `rowPaginationFeature`, `rowSelectionFeature`, `columnFacetingFeature`, `columnPinningFeature`, `columnVisibilityFeature`.
- `columnResizingFeature` needs `columnSizingFeature`, and global filtering needs column filtering.
- Register explicit features. `stockFeatures` is a migration aid, used only while moving off v8 and followed by an explicit list.
- Registration rule from TanStack Table's bundled agent skills (MIT).

## Server mode

- Set `manualPagination`, `manualSorting`, and `manualFiltering` together.
- `rowCount` or `pageCount` goes with `manualPagination`. With a paginated row model registered and `manualPagination` off, every server page is cut to the client page size.
- Reset the page index in the sorting and filtering change handlers.
- Server facets come through the faceting factories (`createFacetedRowModel`, `createFacetedUniqueValues`, `createFacetedMinMaxValues`) reading `table.options.meta`, where the page passes the counts and ranges the backend returned.
- URL state with nuqs: `createLoader` on the server, `clearOnDefault` so defaults leave the URL, `limitUrlUpdates` to debounce typing.

## Selection

- Set `getRowId` from backend ids, so selection survives paging and refetch.
- The select-all checkbox tests `getIsAllPageRowsSelected()` before `getIsSomePageRowsSelected()`, because in v9 "some" stays true when all are selected. Checked: all, then indeterminate for some, then unchecked.
- Under manual pagination the loaded row model holds one page. Read the selection with `getSelectedRowIds()`.
- Shift ranges go through `row.getToggleSelectedHandler()` called from the click event.

## Virtualization

- Count `table.getRowModel().rows.length` and read `rows[virtualRow.index]`.
- Render `getVirtualItems()`, never every row.
- Put `data-index` on measured rows and pass the element to `measureElement`.
- Keep the virtualizer in the lowest component that renders the rows, so scrolling does not re-render the toolbar.
- Set `useFlushSync: false` on React 19 when it warns about flushSync during render.

## Pitfalls

- Memoize the options object, and the `columns` and `data` inside it.
- Pass a module-level empty array while data loads, never a fresh `[]` per render.
- Put `table.Subscribe` at row or cell level, so one changed row re-renders one row.
- Filter on accessor values. A `cell` renderer's output never reaches the filter.
- Column meta is typed per table in v9 (`columnMeta: metaHelper<T>()` inside `tableFeatures`) and through module augmentation in v8.

## Checked facts

- Feature exports (`rowSelectionFeature`, `rowSortingFeature`, `columnFilteringFeature`, `rowPaginationFeature`, `columnFacetingFeature`, `columnPinningFeature`, `columnSizingFeature`, `columnResizingFeature`, `columnVisibilityFeature`): `.lucy/notes/2026-10-27-tables-research/repos/table/packages/table-core/src`, commit c14e022.
- Row model factories `createCoreRowModel`, `createSortedRowModel`, `createFilteredRowModel`, `createPaginatedRowModel`, `createFacetedRowModel`, `createExpandedRowModel`, `createGroupedRowModel`: same path, commit c14e022.
- Pin positions `'start' | 'end'`: `repos/table/packages/table-core/src/features/column-pinning/columnPinningFeature.types.ts`, commit c14e022. `sortFn`, `manualPagination`, `rowCount`, `pageCount`, `getIsAllPageRowsSelected`, `getIsSomePageRowsSelected`, `getToggleSelectedHandler` appear in table-core src, commit c14e022.
- Meta helper `metaHelper`, `table.options.meta`, `column.columnDef.meta`: `repos/table/docs/guide/table-and-column-meta.md`, commit c14e022. Faceting factories and `getFacetedUniqueValues`: `repos/table/docs/framework/react/guide/column-faceting.md`, commit c14e022.
- Bundled Intent skills (`core`, `table-features`, `table-state`, `custom-features`, `migrate-v8-to-v9`) and the `stockFeatures` guidance: `repos/table/packages/table-core/skills/`, commit c14e022.
- `useFlushSync` option: `repos/virtual/docs/framework/react/react-virtual.md`, commit 18d0835.
- nuqs `createLoader` (server-side.mdx), `clearOnDefault` and `limitUrlUpdates` (options.mdx): `repos/nuqs/packages/docs/content/docs`, commit d9dc5c2.
