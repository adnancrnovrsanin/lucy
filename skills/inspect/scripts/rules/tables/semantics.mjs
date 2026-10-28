import { has, str, attr, isTrue, ancestors, descendants, inLibraryDir, classOf, HEAD_TAGS, ROW_TAGS } from '../../lib/helpers.mjs';

const BUTTONS = new Set(['button', 'Button']);
const NAMED_TABLES = new Set(['table', 'Table']);
const STRUCTURE = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'Table', 'TableHeader', 'TableBody', 'TableFooter', 'TableRow']);
const isTable = (el) => el.tag === 'table' || el.tag === 'Table';

export default [
  {
    id: 'sortable-th-without-button',
    severity: 'error',
    platform: 'web',
    why: 'A header cell sorts on click but holds no button, so keyboard users cannot sort.',
    fix: 'Put a native button inside the header cell, wrapping the label and the direction icon, and keep aria-sort on the cell.',
    ref: 'WCAG 2.1.1 Keyboard; WAI-ARIA APG sortable table',
    check: ({ source }) => source.elements
      .filter((el) => (el.tag === 'th' || el.tag === 'TableHead') && has(el, 'onClick') && !descendants(el).some((d) => BUTTONS.has(d.tag)))
      .map((el) => ({ line: el.line, message: `<${el.tag} onClick> without a button` })),
    good: [{ code: 'const a = <TableHead aria-sort={sort}><button type="button" onClick={toggle}>Name</button></TableHead>;' }],
    bad: [{ code: 'const a = <th onClick={() => column.toggleSorting()}>Name</th>;' }],
  },
  {
    id: 'aria-sort-misuse',
    severity: 'warning',
    platform: 'web',
    why: 'aria-sort is set to none, or sits on a button instead of the header cell, so screen readers announce the wrong sort state.',
    fix: 'Put aria-sort only on the header cell of the sorted column, as ascending or descending, and leave it off every other column.',
    ref: 'WAI-ARIA APG sortable table; WCAG 4.1.2',
    check: ({ source }) => source.elements.flatMap((el) => {
      const a = attr(el, 'aria-sort');
      if (!a) return [];
      if (BUTTONS.has(el.tag)) return [{ line: el.line, message: `aria-sort on <${el.tag}>` }];
      if (/(^|['"`])none(['"`]|$)/.test(a.value)) return [{ line: el.line, message: 'aria-sort set to none' }];
      return [];
    }),
    good: [{ code: 'const a = <th aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}><button type="button">Name</button></th>;' }],
    bad: [
      { code: 'const a = <th aria-sort={sorted ? "ascending" : "none"}><button type="button">Name</button></th>;' },
      { code: 'const a = <th><button type="button" aria-sort="ascending">Name</button></th>;' },
    ],
  },
  {
    id: 'table-without-name',
    severity: 'error',
    platform: 'web',
    why: 'The table has no accessible name, so screen-reader users cannot tell tables apart.',
    fix: 'Name the table with a caption (TableCaption) or aria-labelledby pointing at the page or card heading; use one, not both.',
    ref: 'WCAG 1.3.1 Info and Relationships; GOV.UK table',
    check: ({ source, stack, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => NAMED_TABLES.has(el.tag) && !(el.tag === 'Table' && stack.ui === 'heroui'))
      .filter((el) => el.spreads.length === 0 && !has(el, 'aria-label', 'aria-labelledby') && !el.children.some((c) => c.tag === 'caption' || c.tag === 'TableCaption'))
      .filter((el) => !ancestors(el).some((a) => isTrue(a, 'aria-hidden')))
      .map((el) => ({ line: el.line, message: `<${el.tag}> without a caption or label` }))),
    good: [
      { code: 'const a = <Table aria-labelledby="invoices-heading"><TableBody /></Table>;' },
      { code: 'const a = <table><caption>Invoices</caption><tbody /></table>;' },
      { code: 'export const Table = (p) => <table {...p} />;', file: 'components/ui/table.tsx' },
      { code: 'export const DataTable = (props) => <Table {...props} />;', file: 'app/invoices/data-table.tsx' },
      { code: 'const a = <div aria-hidden="true"><Table><TableBody /></Table></div>;' },
      { code: 'const a = <div aria-hidden><table><tbody /></table></div>;' },
    ],
    bad: [{ code: 'const a = <Table><TableHeader /><TableBody /></Table>;' }],
  },
  {
    id: 'th-without-scope',
    severity: 'warning',
    platform: 'web',
    why: 'A native header cell has no scope, so the cells it labels are left to inference.',
    fix: 'Give column headers scope="col" and the row identifier cell scope="row".',
    ref: 'WCAG 1.3.1; WAI-ARIA APG table',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => el.tag === 'th' && !has(el, 'scope'))
      .map((el) => ({ line: el.line, message: '<th> without scope' }))),
    good: [{ code: 'const a = <tr><th scope="col">Name</th></tr>;' }],
    bad: [{ code: 'const a = <tr><th>Name</th></tr>;' }],
  },
  {
    id: 'grid-role-without-keyboard',
    severity: 'error',
    platform: 'web',
    why: 'role="grid" promises arrow-key navigation, but the file has no key handling for it.',
    fix: 'Use a plain table unless the table is in grid mode; a grid needs one tab stop with roving tabIndex and the APG grid keys.',
    ref: 'WAI-ARIA APG grid pattern; WCAG 2.1.1',
    check: ({ source }) => (/\bonKeyDown\b|\bkeyboardNavigation|\buseGrid\b/.test(source.masked) ? [] : source.elements
      .filter((el) => str(el, 'role') === 'grid')
      .map((el) => ({ line: el.line, message: `<${el.tag} role="grid"> without key handling` }))),
    good: [{ code: 'const a = <div role="grid" onKeyDown={onGridKeyDown} tabIndex={0} />;' }],
    bad: [{ code: 'const a = <table role="grid"><tbody /></table>;' }],
  },
  {
    id: 'aria-selected-on-table-row',
    severity: 'warning',
    platform: 'web',
    why: 'aria-selected is set on a row of a plain table, where it is not supported; selection is not announced.',
    fix: 'Let the row checkbox carry the selection state, and style the row with data-state; aria-selected belongs to grid rows.',
    ref: 'WAI-ARIA 1.2, aria-selected',
    check: ({ source }) => source.elements
      .filter((el) => ROW_TAGS.has(el.tag) && el.tag !== 'Table.Row' && has(el, 'aria-selected') && !ancestors(el).some((a) => str(a, 'role') === 'grid' || str(a, 'role') === 'treegrid'))
      .map((el) => ({ line: el.line, message: `aria-selected on <${el.tag}>` })),
    good: [{ code: 'const a = <TableRow data-state={row.getIsSelected() ? "selected" : undefined} />;' }],
    bad: [{ code: 'const a = <TableRow aria-selected={row.getIsSelected()} />;' }],
  },
  {
    id: 'table-display-override',
    severity: 'warning',
    platform: 'web',
    why: 'A display utility on a table, row group, or row can drop its table semantics in some browsers and screen readers.',
    fix: 'Keep native table display, or add role="table", "rowgroup", and "row" explicitly when a virtualized layout needs grid or flex.',
    ref: 'Adrian Roselli, tables and CSS display; WCAG 1.3.1',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => STRUCTURE.has(el.tag) && !has(el, 'role') && /(^|[\s'"`])(flex|grid|block|inline-flex)(?=[\s'"`]|$)|display\s*:\s*['"`]?(flex|grid|block)/.test(classOf(el) + ' ' + (attr(el, 'style')?.value ?? '')))
      .map((el) => ({ line: el.line, message: `display override on <${el.tag}>` }))),
    good: [
      { code: 'const a = <TableRow role="row" className="flex w-full" />;' },
      { code: 'const a = <TableCell className="flex items-center gap-2" />;' },
    ],
    bad: [
      { code: 'const a = <TableBody className="grid" />;' },
      { code: 'const a = <tr style={{ display: "flex" }} />;' },
    ],
  },
  {
    id: 'nested-table',
    severity: 'warning',
    platform: 'web',
    why: 'A table sits inside another table, which screen readers announce as one confusing structure.',
    fix: 'Show nested records in an expandable row with a list, or in the peek or detail page.',
    ref: 'WCAG 1.3.1; Primer DataTable',
    check: ({ source }) => source.elements
      .filter((el) => isTable(el) && ancestors(el).some(isTable))
      .map((el) => ({ line: el.line, message: `<${el.tag}> inside another table` })),
    good: [{ code: 'const a = <Table aria-label="Orders"><TableBody><TableRow><TableCell><ul><li>Item</li></ul></TableCell></TableRow></TableBody></Table>;' }],
    bad: [{ code: 'const a = <table aria-label="Orders"><tbody><tr><td><table aria-label="Items" /></td></tr></tbody></table>;' }],
  },
];
