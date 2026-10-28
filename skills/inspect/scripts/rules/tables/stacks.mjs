import { has, str, attr, importsFrom, hits, ancestors, classOf } from '../../lib/helpers.mjs';

const RAC = /^react-aria-components$/;
const heroOrRac = (source, stack) => stack.ui === 'heroui' || importsFrom(source, RAC).length > 0;

export default [
  {
    id: 'heroui-table-without-name',
    severity: 'error',
    platform: 'web',
    when: (s) => s.ui === 'heroui',
    why: 'Table.Content has no accessible name, so screen readers announce an unnamed grid.',
    fix: 'Give Table.Content aria-label or aria-labelledby pointing at the page or card heading.',
    ref: 'WCAG 1.3.1; HeroUI Table docs',
    check: ({ source }) => source.elements
      .filter((el) => el.tag === 'Table.Content' && !has(el, 'aria-label', 'aria-labelledby'))
      .map((el) => ({ line: el.line, message: '<Table.Content> without a name' })),
    good: [{ code: 'const a = <Table.Content aria-label="Orders"><Table.Header /><Table.Body /></Table.Content>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = <Table.Content><Table.Header /><Table.Body /></Table.Content>;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'heroui-table-without-row-header',
    severity: 'error',
    platform: 'web',
    when: (s) => s.ui === 'heroui',
    why: 'No column is marked isRowHeader, which React Aria requires; the table throws at runtime.',
    fix: 'Mark the identifier column with isRowHeader.',
    ref: 'react-aria-components Table.tsx, row header check',
    check: ({ source }) => (source.elements.some((el) => el.tag === 'Table.Column') && !/\bisRowHeader\b/.test(source.text)
      ? source.elements.filter((el) => el.tag === 'Table.Content').map((el) => ({ line: el.line, message: 'no isRowHeader column' }))
      : []),
    good: [{ code: 'const a = <Table.Content aria-label="Orders"><Table.Header><Table.Column isRowHeader>Number</Table.Column><Table.Column>Total</Table.Column></Table.Header><Table.Body /></Table.Content>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = <Table.Content aria-label="Orders"><Table.Header><Table.Column>Number</Table.Column></Table.Header><Table.Body /></Table.Content>;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'rac-header-groups-first',
    severity: 'warning',
    platform: 'web',
    why: 'Headers are read from getHeaderGroups()[0], which drops columns once the table has column groups.',
    fix: 'Render leaf headers with table.getLeafHeaders() (or the last header group) inside a React Aria table.',
    ref: 'craft tables research, HeroUI TanStack demo review',
    check: ({ source, stack }) => (heroOrRac(source, stack) ? hits(source, /\bgetHeaderGroups\(\)\s*\[\s*0\s*\]/g).map((h) => ({ index: h.index, message: 'getHeaderGroups()[0]' })) : []),
    good: [{ code: 'const a = table.getLeafHeaders().map((h) => <Table.Column key={h.id} id={h.id}>{h.id}</Table.Column>);', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = table.getHeaderGroups()[0].headers.map((h) => <Table.Column key={h.id} id={h.id}>{h.id}</Table.Column>);', stack: { ui: 'heroui' } }],
  },
  {
    id: 'sort-descriptor-without-handler',
    severity: 'warning',
    platform: 'web',
    why: 'sortDescriptor is passed without onSortChange, so clicking a sortable header does nothing.',
    fix: 'Pass onSortChange and update the sort state the table owns (with TanStack, convert the descriptor to SortingState).',
    ref: 'react-aria-components Table docs, sorting',
    check: ({ source }) => source.elements
      .filter((el) => has(el, 'sortDescriptor') && !has(el, 'onSortChange'))
      .map((el) => ({ line: el.line, message: `<${el.tag}> sortDescriptor without onSortChange` })),
    good: [{ code: 'const a = <Table.Content aria-label="Orders" sortDescriptor={descriptor} onSortChange={setDescriptor} />;' }],
    bad: [{ code: 'const a = <Table.Content aria-label="Orders" sortDescriptor={descriptor} />;' }],
  },
  {
    id: 'heroui-selection-without-checkbox',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.ui === 'heroui',
    why: 'HeroUI v3 Table.Content has selectionMode but no selection checkbox, so selection has no visible control.',
    fix: 'Render <Checkbox slot="selection"> in the header column and in each row, as the HeroUI v3 selection docs show.',
    ref: 'HeroUI v3 Table migration, selection with checkboxes',
    check: ({ source }) => (/slot\s*=\s*['"{`]*selection/.test(source.text) ? [] : source.elements
      .filter((el) => el.tag === 'Table.Content' && /multiple|single/.test(str(el, 'selectionMode') ?? attr(el, 'selectionMode')?.value ?? ''))
      .map((el) => ({ line: el.line, message: 'selectionMode without a selection checkbox' }))),
    good: [{ code: 'const a = <Table.Content aria-label="Orders" selectionMode="multiple"><Table.Header><Table.Column><Checkbox slot="selection" /></Table.Column></Table.Header></Table.Content>;', stack: { ui: 'heroui' } }],
    bad: [{ code: 'const a = <Table.Content aria-label="Orders" selectionMode="multiple"><Table.Header /></Table.Content>;', stack: { ui: 'heroui' } }],
  },
  {
    id: 'ag-grid-container-without-height',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.tableEngine === 'ag-grid',
    why: 'The grid container has no height, so AG Grid renders with zero height and shows no rows.',
    fix: 'Give the grid container an explicit height, or set domLayout="autoHeight" for short grids.',
    ref: 'AG Grid skills, recommendations',
    check: ({ source }) => source.elements
      .filter((el) => el.tag === 'AgGridReact' && str(el, 'domLayout') !== 'autoHeight')
      .filter((el) => { const p = el.parent; const box = p ? classOf(p) + ' ' + (attr(p, 'style')?.value ?? '') : ''; return !/\bh-(\d|\[|full|screen|dvh|svh)|\bheight\s*:/.test(box); })
      .map((el) => ({ line: el.line, message: '<AgGridReact> container without a height' })),
    good: [{ code: 'const a = <div style={{ height: 600 }}><AgGridReact rowData={rows} columnDefs={columnDefs} /></div>;', stack: { tableEngine: 'ag-grid' } }],
    bad: [{ code: 'const a = <div><AgGridReact rowData={rows} columnDefs={columnDefs} /></div>;', stack: { tableEngine: 'ag-grid' } }],
  },
  {
    id: 'ag-grid-enterprise-import',
    severity: 'info',
    platform: 'all',
    why: 'AG Grid Enterprise is imported; it is commercial and needs a licence key in production.',
    fix: 'Confirm the project holds an AG Grid Enterprise licence and sets the key (the licenseKey prop on AgGridProvider from v35.1, LicenseManager.setLicenseKey before); otherwise use Community features only.',
    ref: 'AG Grid licensing',
    check: ({ source }) => importsFrom(source, /^(ag-grid-enterprise|@ag-grid-enterprise\/)/).map((i) => ({ line: i.line, message: `import from ${i.from}` })),
    good: [{ code: 'import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";' }],
    bad: [{ code: 'import { AllEnterpriseModule } from "ag-grid-enterprise";' }],
  },
  {
    id: 'rdg-rows-recreated',
    severity: 'warning',
    platform: 'all',
    when: (s) => s.tableEngine === 'react-data-grid',
    why: 'Every row object is recreated on update, which defeats react-data-grid row memoization.',
    fix: 'Replace only the changed rows and keep the other row objects as they were.',
    ref: 'react-data-grid README, rows',
    check: ({ source }) => hits(source, /\bsetRows\s*\(\s*[\w$]+\.map\s*\(\s*\(?\s*[\w$]+\s*\)?\s*=>\s*\(\s*\{\s*\.\.\./g).map((h) => ({ index: h.index, message: 'every row recreated' })),
    good: [{ code: 'setRows(rows.map((r) => (r.id === changed.id ? { ...r, ...changed } : r)));', stack: { tableEngine: 'react-data-grid' } }],
    bad: [{ code: 'setRows(rows.map((r) => ({ ...r, selected: false })));', stack: { tableEngine: 'react-data-grid' } }],
  },
];
