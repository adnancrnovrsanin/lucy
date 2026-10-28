# AG Grid tables stack note

AG Grid renders and processes the table itself, so its column definitions replace the kind layer's components. This note maps the value kinds of [kinds.md](../../kinds.md) and their table projection in [column-kinds.md](../column-kinds.md) to column definitions. Adapted from AG Grid's ag-dev skill (MIT).

## Detect

- Read the major from `package.json` and the lockfile, and put `table engine: ag-grid, major N, community|enterprise` on the stack line.
- Enterprise means an `ag-grid-enterprise` dependency. Enterprise is commercial: never add it without asking, and an Enterprise import needs the project's licence key (see Checked facts for where the key goes in the installed major).
- Read the installed `ag-grid-community` types and the AG Grid MCP tools when available; the docs for the installed major win over memory.

## Value kinds as column definitions

| Kind | Column definition |
|---|---|
| text, identifier, email, URL, phone | `filter: 'agTextColumnFilter'`; default comparator or locale collation; `valueFormatter` where the kind formats |
| quantity, money, percent, duration | `type: 'rightAligned'`; `filter: 'agNumberColumnFilter'`; `valueFormatter` with the kind's `Intl` formatter; numeric `comparator` |
| date, timestamp | `filter: 'agDateColumnFilter'`; `valueFormatter` with the kind's format; chronological `comparator` |
| enum or status | `cellRenderer` for the badge; `filter: 'agSetColumnFilter'` (Enterprise) or `agTextColumnFilter` in Community; `comparator` in declared order |
| person or user | `cellRenderer` for avatar plus name; text filter on the name |
| relation to-one | `cellRenderer` link to the related page; `valueGetter` returns the display field |
| boolean | `valueFormatter` to domain words; `comparator` false before true |
| long text, file or image, JSON | hidden by default (`hide: true`) or `sortable: false`; no filter, or text filter on long text |

- `sortable` and `comparator` come from the kind's sort column.
- Keep formatting in `valueFormatter` and markup in `cellRenderer`, so export and filtering read the value.
- `getRowId` returns the backend id.

## Modules and validation

- Register modules before the first grid: `ModuleRegistry.registerModules([AllCommunityModule])`, or the specific modules the grid uses.
- A feature that does nothing usually means an unregistered module. Read the console error first.
- Call `enableDevValidations()` (equivalent to registering `ValidationModule`) in non-production builds while building.

## Row models

- Client-side is the default.
- Infinite (Community) serves large server-driven scrolling.
- Server-Side (Enterprise) needs a licence.
- Keep sort, filter, and paging in one place. A server row model never mixes with client sort.

## Pitfalls

- The grid container needs an explicit height, or `domLayout="autoHeight"` for short grids.
- Keep `rowData`, `columnDefs`, and `defaultColDef` referentially stable (module-level or memoized). Event handlers need no `useCallback`.
- AG Grid renders `role="grid"`, so keep its keyboard model and add no `role="table"` override.
- A cell renderer for a status or avatar still returns the text the kind's export column names.

## Checked facts

- Current major is 36 (docs version 36.2.0). Source: https://www.ag-grid.com/react-data-grid/modules/, read 2026-10-28.
- `ModuleRegistry.registerModules([...])` registers globally before any grid exists. `AllCommunityModule` bundles every Community module, and `AllEnterpriseModule` comes from `ag-grid-enterprise`. Since 35.1, `AgGridProvider` supplies modules, and a `modules` prop on `AgGridReact` adds per-grid modules. Same source and date.
- `enableDevValidations()` is called once, before any grid, in non-production builds, and equals registering `ValidationModule`. Same source and date.
- Licence key: since 35.1 it is the `licenseKey` prop on `AgGridProvider` from `ag-grid-react`; before 35.1 it was `LicenseManager.setLicenseKey("...")` imported from `ag-grid-enterprise`. Source: https://www.ag-grid.com/react-data-grid/license-install/, read 2026-10-28. Detect Enterprise by the `ag-grid-enterprise` dependency, and use the key mechanism the installed major documents.
- Row models: Client-Side and Infinite are Community; Server-Side and Viewport are Enterprise; for Enterprise users the docs recommend Server-Side over Infinite. Source: https://www.ag-grid.com/react-data-grid/row-models/, read 2026-10-28. The `rowModelType` values and module names were not on the page: Not verified, so read them from the installed types.
- The filter names, `type: 'rightAligned'`, `getRowId`, `domLayout`, and stability advice are from the ag-dev skill and prior AG Grid knowledge, not re-read on the docs this session: Not verified.
