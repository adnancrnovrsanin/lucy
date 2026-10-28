import { has, str, expr, attr, ancestors, descendants, inLibraryDir, classOf, isTableFile, HEAD_TAGS, ROW_TAGS, TABLE_TAGS } from '../../lib/helpers.mjs';

const LINKS = new Set(['a', 'Link', 'NextLink']);
const BUTTONS = new Set(['button', 'Button']);
const FILTER_CONTROLS = new Set(['input', 'Input', 'select', 'Select', 'Combobox', 'DatePicker', 'SearchField', 'TextField']);
const STICKY_HEAD = new Set(['thead', 'TableHeader', 'tr', 'TableRow', 'th', 'TableHead']);
const isIcon = (el) => /Icon$|^Icon|^Lucide|^svg$/.test(el.tag) || /^(MoreHorizontal|MoreVertical|Ellipsis|Trash\w*|Pencil\w*|Edit\w*|X|Check|Copy|Eye\w*)$/.test(el.tag);
const named = (el) => has(el, 'aria-label', 'aria-labelledby', 'title') || descendants(el).some((d) => /\bsr-only\b/.test(classOf(d)))
  || el.text.trim().length > 0 || descendants(el).some((d) => d.text.trim().length > 0)
  || (el.parent && has(el.parent, 'asChild') && has(el.parent, 'aria-label', 'aria-labelledby'));

export default [
  {
    id: 'row-click-navigation-without-link',
    severity: 'warning',
    platform: 'web',
    why: 'A row navigates on click with no link inside, so it cannot be opened in a new tab, middle-clicked, or reached as a link by keyboard.',
    fix: 'Make the identifier cell a real link to the detail page; a row click may delegate to that link.',
    ref: 'Polaris IndexTable primary link; WCAG 2.1.1',
    check: ({ source }) => source.elements
      .filter((el) => ROW_TAGS.has(el.tag) && /\b(router\.push|navigate|window\.location|redirect)\b/.test(expr(el, 'onClick') ?? '') && !descendants(el).some((d) => LINKS.has(d.tag)))
      .map((el) => ({ line: el.line, message: `<${el.tag} onClick> navigates without a link` })),
    good: [{ code: 'const a = <TableRow onClick={() => router.push(href)}><TableCell><Link href={href}>{name}</Link></TableCell></TableRow>;' }],
    bad: [{ code: 'const a = <TableRow onClick={() => router.push(`/invoices/${row.id}`)}><TableCell>{name}</TableCell></TableRow>;' }],
  },
  {
    id: 'hover-only-row-actions',
    severity: 'warning',
    platform: 'web',
    why: 'Row actions appear only on hover, so keyboard and touch users cannot find them.',
    fix: 'Keep row actions visible, or reveal them on hover and on focus-within together, and always on touch.',
    ref: 'Carbon data table, row actions; NN/g data tables',
    check: ({ source }) => source.elements
      .filter((el) => { const c = classOf(el); return /\b(opacity-0|invisible)\b/.test(c) && /\bgroup-hover:(opacity-100|visible)\b/.test(c) && !/\b(group-focus-within|focus-within|focus-visible|group-has-\[:focus)/.test(c); })
      .map((el) => ({ line: el.line, message: 'actions revealed on hover only' })),
    good: [{ code: 'const a = <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"><RowActions /></div>;' }],
    bad: [{ code: 'const a = <div className="opacity-0 group-hover:opacity-100"><RowActions /></div>;' }],
  },
  {
    id: 'icon-action-without-name',
    severity: 'error',
    platform: 'web',
    why: 'An icon-only button has no accessible name, so screen readers announce just "button".',
    fix: 'Name icon buttons with aria-label that includes the row identity, such as "Actions for invoice 1042".',
    ref: 'WCAG 4.1.2 Name, Role, Value',
    check: ({ source, path }) => (inLibraryDir(path) || !isTableFile(source) ? [] : source.elements
      .filter((el) => BUTTONS.has(el.tag) && el.children.length > 0 && el.children.every(isIcon) && !named(el))
      .map((el) => ({ line: el.line, message: `icon-only <${el.tag}> without a name` }))),
    good: [
      { code: ['import { useTable } from "@tanstack/react-table";', 'const a = <Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.number}`}><MoreHorizontal /></Button>;'].join('\n') },
      { code: ['import { useTable } from "@tanstack/react-table";', 'const a = <SortableItemHandle aria-label={`Reorder ${label}`} asChild><Button size="icon"><GripVertical /></Button></SortableItemHandle>;'].join('\n') },
    ],
    bad: [{ code: ['import { useTable } from "@tanstack/react-table";', 'const a = <Button variant="ghost" size="icon"><MoreHorizontal /></Button>;'].join('\n') }],
  },
  {
    id: 'constant-row-checkbox-label',
    severity: 'warning',
    platform: 'web',
    why: 'Every row checkbox has the same label, so a screen-reader user cannot tell which row it selects.',
    fix: 'Name each row checkbox with the row identity, such as "Select invoice 1042".',
    ref: 'MDC data table, row checkbox labels; Primer DataTable',
    check: ({ source }) => (!isTableFile(source) ? [] : source.elements
      .filter((el) => (el.tag === 'Checkbox' || (el.tag === 'input' && str(el, 'type') === 'checkbox')) && /^select( row| this row)?$/i.test(str(el, 'aria-label') ?? ''))
      .map((el) => ({ line: el.line, message: `row checkbox labelled "${str(el, 'aria-label')}"` }))),
    good: [{ code: ['import { useTable } from "@tanstack/react-table";', 'const a = <Checkbox aria-label="Select all invoices on this page" checked={all} />;', 'const b = <Checkbox aria-label={`Select invoice ${row.original.number}`} />;'].join('\n') }],
    bad: [{ code: ['import { useTable } from "@tanstack/react-table";', 'const b = <Checkbox aria-label="Select row" checked={row.getIsSelected()} />;'].join('\n') }],
  },
  {
    id: 'select-all-without-indeterminate',
    severity: 'warning',
    platform: 'web',
    why: 'The select-all checkbox has no indeterminate state, so a partial selection looks like none.',
    fix: 'Check "all selected" first, then pass the indeterminate state from the "some selected" check.',
    ref: 'Carbon data table selection; TanStack Table v9 migration, select-all order',
    check: ({ source }) => source.elements
      .filter((el) => /getIsAll(?:Page)?RowsSelected/.test(attr(el, 'checked')?.value ?? '') && !/getIsSome(?:Page)?RowsSelected|indeterminate/.test([...el.attrs.values()].map((a) => a.value).join(' ')) && !has(el, 'indeterminate'))
      .map((el) => ({ line: el.line, message: 'select-all without an indeterminate state' })),
    good: [{ code: 'const a = <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} />;' }],
    bad: [{ code: 'const a = <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} />;' }],
  },
  {
    id: 'zebra-with-selection',
    severity: 'warning',
    platform: 'web',
    why: 'Zebra striping is combined with selected or hover row tints, so the states are hard to tell apart.',
    fix: 'Use row dividers with hover and selected tints in selectable tables; keep stripes for read-only dense tables.',
    ref: 'Pencil & Paper data table patterns; craft tables research, conflicts settled',
    check: ({ source }) => {
      if (!/data-\[state=selected\]|aria-selected|getIsSelected/.test(source.text)) return [];
      return source.elements.filter((el) => /\b(even|odd):bg-/.test(classOf(el))).map((el) => ({ line: el.line, message: 'zebra striping on a selectable table' }));
    },
    good: [{ code: 'const a = <TableRow data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/50" />;' }],
    bad: [{ code: 'const a = <TableRow data-state={row.getIsSelected() && "selected"} className="even:bg-muted/40" />;' }],
  },
  {
    id: 'pagination-div-onclick',
    severity: 'warning',
    platform: 'web',
    why: 'A page control is a div or span with onClick, so it is not a link or a button for keyboard users.',
    fix: 'Render page controls as links when the page lives in the URL, or as buttons otherwise.',
    ref: 'WCAG 2.1.1; Vercel Web Interface Guidelines, URL state',
    check: ({ source }) => source.elements
      .filter((el) => ['div', 'span', 'li'].includes(el.tag) && /\b(setPageIndex|nextPage|previousPage|firstPage|lastPage|setPage)\b/.test(expr(el, 'onClick') ?? ''))
      .map((el) => ({ line: el.line, message: `<${el.tag} onClick> as a page control` })),
    good: [{ code: 'const a = <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>;' }],
    bad: [{ code: 'const a = <div onClick={() => table.nextPage()}>Next</div>;' }],
  },
  {
    id: 'table-scroll-snap',
    severity: 'warning',
    platform: 'web',
    why: 'Scroll snap on a table container jumps past columns and rows while reading.',
    fix: 'Remove scroll snap from table containers.',
    ref: 'Adrian Roselli, fixed table headers',
    check: ({ source }) => (!isTableFile(source) ? [] : source.elements
      .filter((el) => /\bsnap-(x|y|both|mandatory|proximity)\b|scrollSnapType/.test(classOf(el) + ' ' + (attr(el, 'style')?.value ?? '')))
      .map((el) => ({ line: el.line, message: 'scroll snap on a table container' }))),
    good: [{ code: 'const a = <div className="overflow-x-auto" role="region" aria-labelledby="h" tabIndex={0}><Table aria-labelledby="h" /></div>;' }],
    bad: [{ code: 'const a = <div className="overflow-x-auto snap-x snap-mandatory"><Table aria-label="Invoices" /></div>;' }],
  },
  {
    id: 'scroll-container-without-region',
    severity: 'warning',
    platform: 'web',
    why: 'A scrolling table container cannot be focused or identified, so keyboard users cannot scroll it.',
    fix: 'Give the scroll container role="region", a name (aria-labelledby the table title), and tabIndex={0} with a visible focus style.',
    ref: 'Adrian Roselli, a responsive accessible table; WCAG 2.1.1',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => /\boverflow(-x|-y)?-(auto|scroll)\b/.test(classOf(el)) && descendants(el).some((d) => TABLE_TAGS.has(d.tag)))
      .filter((el) => !(str(el, 'role') === 'region' && has(el, 'aria-label', 'aria-labelledby') && has(el, 'tabIndex')))
      .map((el) => ({ line: el.line, message: 'scroll container without region, name, and tabIndex' }))),
    good: [{ code: 'const a = <div className="overflow-x-auto" role="region" aria-labelledby="invoices-heading" tabIndex={0}><Table aria-labelledby="invoices-heading" /></div>;' }],
    bad: [{ code: 'const a = <div className="overflow-x-auto"><Table aria-labelledby="invoices-heading" /></div>;' }],
  },
  {
    id: 'sticky-header-without-background',
    severity: 'warning',
    platform: 'web',
    why: 'A sticky header has no background, so rows show through it while scrolling.',
    fix: 'Give sticky header cells an opaque background and a z-index above body cells.',
    ref: 'Adrian Roselli, fixed table headers',
    check: ({ source }) => source.elements
      .filter((el) => STICKY_HEAD.has(el.tag) && /\bsticky\b/.test(classOf(el)) && /\btop-/.test(classOf(el)) && !/\bbg-/.test(classOf(el)))
      .map((el) => ({ line: el.line, message: `sticky <${el.tag}> without a background` })),
    good: [{ code: 'const a = <TableHeader className="sticky top-0 z-10 bg-background" />;' }],
    bad: [{ code: 'const a = <TableHeader className="sticky top-0" />;' }],
  },
  {
    id: 'filter-input-in-thead',
    severity: 'warning',
    platform: 'web',
    why: 'Filter controls sit inside the table header, where they are read as column headers and crowd the sort controls.',
    fix: 'Put filters in the toolbar above the table (chips and "+ Filter") or in the column header menu.',
    ref: 'Adrian Roselli, sortable table columns',
    check: ({ source }) => source.elements
      .filter((el) => FILTER_CONTROLS.has(el.tag) && ancestors(el).some((a) => HEAD_TAGS.has(a.tag)))
      .map((el) => ({ line: el.line, message: `<${el.tag}> inside the table header` })),
    good: [{ code: 'const a = <div role="toolbar" aria-label="Filters"><Input aria-label="Search invoices" /></div>;' }],
    bad: [{ code: 'const a = <TableHeader><TableRow><TableHead><Input aria-label="Filter name" /></TableHead></TableRow></TableHeader>;' }],
  },
];
