import { has, expr, importsFrom, hits, tableOptions, ROW_TAGS } from '../../lib/helpers.mjs';

const TANSTACK = /^@tanstack\/react-table$/;
const V8_FACTORIES = /get(?:Core|Sorted|Filtered|Paginated|Faceted\w*|Grouped|Expanded)RowModel/;
const optionHas = (body, name) => new RegExp(`(^|[\\s,{])${name}\\s*[:,}]|(^|[\\s,{])${name}\\s*$`, 'm').test(body);
const at = (source, block, pattern) => {
  const m = pattern.exec(block.body);
  return { line: source.lineOf(block.open + 1 + (m ? m.index : 0)) };
};

export default [
  {
    id: 'tanstack-v8-api-in-v9',
    severity: 'error',
    platform: 'all',
    when: (s) => s.tableEngine === 'tanstack' && s.tableEngineMajor === 9,
    why: 'TanStack Table v8 API is used in a project on v9, where it does not exist.',
    fix: 'Use the v9 API: useTable with a tableFeatures() object, create*RowModel factories registered as features, and pinning sides start and end.',
    ref: 'TanStack Table v9 migration guide',
    check: ({ source }) => [
      ...importsFrom(source, TANSTACK)
        .filter((i) => new RegExp(`\\b(useReactTable|${V8_FACTORIES.source})\\b`).test(i.names))
        .map((i) => ({ line: i.line, message: 'v8 table API imported in a v9 project' })),
      ...hits(source, /\.pin\(\s*['"`](?:left|right)['"`]|\bcolumnPinning\s*:\s*\{\s*(?:left|right)\b/g, source.text)
        .map((h) => ({ index: h.index, message: 'v8 pinning side (left or right) in a v9 project' })),
    ],
    good: [
      { code: ['import { useTable, tableFeatures } from "@tanstack/react-table";', 'const table = useTable({ features, columns, data });', 'const total = table.getCoreRowModel().rows.length;'].join('\n') },
      { code: 'column.pin("start");' },
    ],
    bad: [
      { code: ['import { useReactTable, getCoreRowModel } from "@tanstack/react-table";', 'const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });'].join('\n') },
      { code: 'column.pin("left");' },
    ],
  },
  {
    id: 'tanstack-v9-api-in-v8',
    severity: 'error',
    platform: 'all',
    when: (s) => s.tableEngine === 'tanstack' && s.tableEngineMajor === 8,
    why: 'TanStack Table v9 API is used in a project on v8, where it does not exist.',
    fix: 'Write v8 code (useReactTable with getCoreRowModel and the get*RowModel factories), or ask before upgrading to v9.',
    ref: 'TanStack Table v9 migration guide',
    check: ({ source }) => {
      const fromTanstack = importsFrom(source, TANSTACK).some((i) => /\b(useTable|tableFeatures)\b/.test(i.names));
      if (!fromTanstack) return [];
      return hits(source, /\b(?:useTable|tableFeatures)\s*\(/g).map((h) => ({ index: h.index, message: 'v9 table API in a v8 project' }));
    },
    good: [
      { code: ['import { useReactTable, getCoreRowModel } from "@tanstack/react-table";', 'const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });'].join('\n'), stack: { tableEngineMajor: 8 } },
      { code: ['import { useTable } from "react-table";', 'const t = useTable({ columns, data });'].join('\n'), stack: { tableEngineMajor: 8 } },
    ],
    bad: [{ code: ['import { useTable, tableFeatures } from "@tanstack/react-table";', 'const features = tableFeatures({});', 'const table = useTable({ features, columns, data });'].join('\n'), stack: { tableEngineMajor: 8 } }],
  },
  {
    id: 'table-unstable-data',
    severity: 'warning',
    platform: 'all',
    why: 'The table gets data or columns as a new array on every render, which rebuilds every row and can loop page resets.',
    fix: 'Pass data and columns with stable references: columns at module level or in useMemo, and a module-level empty array as the fallback instead of an inline [].',
    ref: 'TanStack Table data guide, stable references',
    check: ({ source }) => tableOptions(source).flatMap((block) => {
      const out = [];
      for (const m of block.body.matchAll(/\b(data|columns)\s*:\s*(?:\[|[\w$.?]+(?:\(\))?\s*(?:\?\?|\|\|)\s*\[\s*\])/g)) {
        out.push({ line: source.lineOf(block.open + 1 + m.index), message: `${m[1]} is a new array on every render` });
      }
      return out;
    }),
    good: [
      { code: ['const emptyRows = [];', 'const table = useTable({ features, columns, data: query.data?.rows ?? emptyRows });'].join('\n') },
    ],
    bad: [
      { code: 'const table = useTable({ features, columns, data: query.data ?? [] });' },
      { code: 'const table = useReactTable({ columns: [{ accessorKey: "name" }], data, getCoreRowModel: getCoreRowModel() });' },
    ],
  },
  {
    id: 'manual-flags-mixed',
    severity: 'error',
    platform: 'all',
    why: 'The server pages the table but sorting or filtering still runs on the client, so it sorts or filters one page only.',
    fix: 'When the server pages, it also sorts and filters: set manualSorting and manualFiltering with manualPagination and send that state to the server.',
    ref: 'TanStack Table client-side vs server-side guide, never mix scopes',
    check: ({ source }) => tableOptions(source).flatMap((block) => {
      if (!optionHas(block.body, 'manualPagination')) return [];
      const out = [];
      const sorts = /\b(onSortingChange|sortedRowModel|getSortedRowModel|rowSortingFeature)\b|\bsorting\s*[:,}]/.test(block.body);
      const filters = /\b(onColumnFiltersChange|filteredRowModel|getFilteredRowModel|columnFilteringFeature|onGlobalFilterChange)\b|\bcolumnFilters\s*[:,}]/.test(block.body);
      if (sorts && !optionHas(block.body, 'manualSorting')) out.push({ ...at(source, block, /manualPagination/), message: 'manualPagination without manualSorting' });
      if (filters && !optionHas(block.body, 'manualFiltering')) out.push({ ...at(source, block, /manualPagination/), message: 'manualPagination without manualFiltering' });
      return out;
    }),
    good: [
      { code: 'const table = useTable({ features, columns, data, manualPagination: true, manualSorting: true, rowCount, state: { sorting, pagination }, onSortingChange: setSorting });' },
      { code: 'const table = useTable({ features, columns, data, manualPagination: true, rowCount });' },
    ],
    bad: [{ code: 'const table = useTable({ features, columns, data, manualPagination: true, rowCount, state: { sorting, pagination }, onSortingChange: setSorting });' }],
  },
  {
    id: 'manual-pagination-without-count',
    severity: 'warning',
    platform: 'all',
    why: 'The table pages on the server but is not told how many rows or pages exist, so page controls cannot work.',
    fix: 'Pass rowCount (or pageCount) from the server response, or pageCount: -1 for cursor pagination with an unknown total.',
    ref: 'TanStack Table pagination guide',
    check: ({ source }) => tableOptions(source)
      .filter((block) => optionHas(block.body, 'manualPagination') && !optionHas(block.body, 'rowCount') && !optionHas(block.body, 'pageCount'))
      .map((block) => ({ ...at(source, block, /manualPagination/), message: 'manualPagination without rowCount or pageCount' })),
    good: [{ code: 'const table = useTable({ features, columns, data, manualPagination: true, rowCount: query.data?.total });' }],
    bad: [{ code: 'const table = useTable({ features, columns, data, manualPagination: true });' }],
  },
  {
    id: 'row-count-without-manual-pagination',
    severity: 'error',
    platform: 'all',
    why: 'A server row or page count is passed without manualPagination, so the table pages the server rows again on the client and cuts each page.',
    fix: 'Set manualPagination: true whenever the server pages the data and rowCount or pageCount comes from it.',
    ref: 'TanStack Table pagination guide; data-table-filters paginated row model trap',
    check: ({ source }) => tableOptions(source)
      .filter((block) => (optionHas(block.body, 'rowCount') || optionHas(block.body, 'pageCount')) && !optionHas(block.body, 'manualPagination'))
      .map((block) => ({ ...at(source, block, /rowCount|pageCount/), message: 'rowCount or pageCount without manualPagination' })),
    good: [{ code: 'const table = useTable({ features, columns, data, manualPagination: true, rowCount });' }],
    bad: [{ code: 'const table = useTable({ features, columns, data, rowCount: query.data?.total });' }],
  },
  {
    id: 'selection-without-row-id',
    severity: 'warning',
    platform: 'all',
    why: 'Rows can be selected but have no getRowId, so selection is keyed by index and lands on the wrong rows after a sort, filter, or page change.',
    fix: 'Pass getRowId that returns the backend id of the row.',
    ref: 'TanStack Table row selection guide',
    check: ({ source }) => tableOptions(source)
      .filter((block) => /\b(enableRowSelection|onRowSelectionChange|rowSelectionFeature|enableMultiRowSelection)\b|\browSelection\s*[:,}]/.test(block.body) && !optionHas(block.body, 'getRowId'))
      .map((block) => ({ ...at(source, block, /enableRowSelection|onRowSelectionChange|rowSelectionFeature|enableMultiRowSelection|rowSelection/), message: 'row selection without getRowId' })),
    good: [{ code: 'const table = useTable({ features, columns, data, getRowId: (row) => row.id, state: { rowSelection }, onRowSelectionChange: setRowSelection });' }],
    bad: [{ code: 'const table = useTable({ features, columns, data, state: { rowSelection }, onRowSelectionChange: setRowSelection });' }],
  },
  {
    id: 'row-id-from-index',
    severity: 'warning',
    platform: 'all',
    why: 'getRowId returns the row index, which is not stable across sorting, filtering, and pages.',
    fix: 'Return the backend id of the row from getRowId.',
    ref: 'TanStack Table row selection guide',
    check: ({ source }) => hits(source, /\bgetRowId\s*:\s*\(\s*[\w$]*\s*,\s*([\w$]+)[^)]*\)\s*=>\s*(?:String\(\s*|`\$\{\s*)?([\w$]+)\b/g)
      .filter((h) => {
        const m = /\bgetRowId\s*:\s*\(\s*[\w$]*\s*,\s*([\w$]+)[^)]*\)\s*=>\s*(?:String\(\s*|`\$\{\s*)?([\w$]+)\b/.exec(source.text.slice(h.index));
        return m && m[1] === m[2];
      })
      .map((h) => ({ index: h.index, message: 'getRowId returns the index' })),
    good: [{ code: 'const table = useTable({ getRowId: (row) => String(row.id), columns, data, features });' }],
    bad: [{ code: 'const table = useTable({ getRowId: (_, index) => String(index), columns, data, features });' }],
  },
  {
    id: 'index-key-on-rows',
    severity: 'warning',
    platform: 'web',
    why: 'Table rows are keyed by their index, so React reuses the wrong row after sorting, filtering, or prepending.',
    fix: 'Key rows by row.id (the backend id through getRowId) or the virtualizer getItemKey.',
    ref: 'TanStack Virtual API, getItemKey; React keys',
    check: ({ source }) => source.elements
      .filter((el) => ROW_TAGS.has(el.tag) && /^(i|idx|index|rowIndex|[\w$]+\.index)$/.test(expr(el, 'key') ?? ''))
      .filter((el) => !/Array\.from\s*\(|\[\s*\.\.\.\s*Array\s*\(|new Array\s*\(/.test(source.masked.slice(Math.max(0, el.start - 200), el.start)))
      .map((el) => ({ line: el.line, message: `<${el.tag} key={${expr(el, 'key')}}>` })),
    good: [
      { code: 'const a = rows.map((row) => <TableRow key={row.id}>{row.id}</TableRow>);' },
      { code: 'const a = Array.from({ length: 10 }).map((_, i) => <TableRow key={i}><TableCell><Skeleton /></TableCell></TableRow>);' },
    ],
    bad: [
      { code: 'const a = rows.map((row, index) => <TableRow key={index}>{row.id}</TableRow>);' },
      { code: 'const a = items.map((virtualRow) => <tr key={virtualRow.index} />);' },
    ],
  },
  {
    id: 'virtualizer-counts-data',
    severity: 'warning',
    platform: 'all',
    why: 'The virtualizer counts the raw data instead of the table row model, so it indexes the wrong rows after sorting or filtering.',
    fix: 'Set count to table.getRowModel().rows.length and read rows from the same list.',
    ref: 'TanStack Table virtualization guide',
    check: ({ source }) => hits(source, /\bcount\s*:\s*(?:props\.)?data\??\.length\b/g)
      .filter(() => /\buse(?:Window)?Virtualizer\s*\(/.test(source.masked))
      .map((h) => ({ index: h.index, message: 'virtualizer count from data.length' })),
    good: [{ code: 'const v = useVirtualizer({ count: rows.length, getScrollElement: () => ref.current, estimateSize: () => 40 });' }],
    bad: [{ code: 'const v = useVirtualizer({ count: data.length, getScrollElement: () => ref.current, estimateSize: () => 40 });' }],
  },
  {
    id: 'measure-without-data-index',
    severity: 'warning',
    platform: 'web',
    why: 'A row is measured by the virtualizer without data-index, so its measured size is never matched to its item.',
    fix: 'Put data-index={virtualRow.index} on every element passed to measureElement.',
    ref: 'TanStack Virtual API, measureElement',
    check: ({ source }) => source.elements
      .filter((el) => /measureElement/.test(expr(el, 'ref') ?? '') && !has(el, 'data-index'))
      .map((el) => ({ line: el.line, message: `<${el.tag}> measured without data-index` })),
    good: [{ code: 'const a = <tr data-index={virtualRow.index} ref={virtualizer.measureElement} />;' }],
    bad: [{ code: 'const a = <tr ref={virtualizer.measureElement} />;' }],
  },
  {
    id: 'rows-mapped-beside-virtualizer',
    severity: 'warning',
    platform: 'web',
    why: 'The file creates a virtualizer but still renders every row of the row model.',
    fix: 'Render virtualizer.getVirtualItems() and read each row as rows[virtualRow.index].',
    ref: 'TanStack Table virtualization guide',
    check: ({ source }) => (/\buse(?:Window)?Virtualizer\s*\(/.test(source.masked)
      ? hits(source, /\bgetRowModel\(\)\s*\.rows\s*\.map\s*\(/g).map((h) => ({ index: h.index, message: 'every row rendered beside a virtualizer' }))
      : []),
    good: [{ code: ['const v = useVirtualizer({ count: rows.length, getScrollElement, estimateSize });', 'const a = v.getVirtualItems().map((vi) => <Row key={rows[vi.index].id} row={rows[vi.index]} />);'].join('\n') }],
    bad: [{ code: ['const v = useVirtualizer({ count: rows.length, getScrollElement, estimateSize });', 'const a = table.getRowModel().rows.map((row) => <Row key={row.id} row={row} />);'].join('\n') }],
  },
];
