# shadcn/ui tables stack note

shadcn components are copied into the project, so the installed files are the API. This note maps the kinds of [column-kinds.md](../column-kinds.md) to shadcn components; the engine rules are in [tanstack.md](tanstack.md).

## Detect

- Read the base and style from `components.json`. `base-*` styles mean Base UI; `radix-*`, `new-york`, and `default` mean Radix; an `aria` base means react-aria-components.
- With the aria base, read the HeroUI note's React Aria rules.
- Add components the table needs and the project lacks with `npx shadcn@latest add <name>`.

## Slots

| Role | Component |
|---|---|
| Table | Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption |
| Status and tags | Badge |
| Person | Avatar |
| Full value and absolute time | Tooltip |
| Filter popovers | Popover plus Command |
| Date presets | Calendar |
| Row menu | DropdownMenu |
| Selection | Checkbox |
| Peek | Sheet, and Drawer on mobile |
| Skeleton | Skeleton |
| Toolbar view switch | Tabs or Select |

## Toolbar and filters

- The toolbar is a flex row: an Input for search, a faceted filter button per enum (Popover, Command, counts), a "+ Filter" field picker, then Sort and Display as DropdownMenu.
- Chips are Badge-styled buttons.
- The bulk bar is a fixed bottom-center card holding Buttons with text labels.
- Filter behavior per kind is in [filtering.md](../filtering.md).

## Building the table

- Start from the shadcn Table and TanStack v9, per the TanStack note.
- Build the toolbar, filters, and URL state from these rules; the diceui block stays uninstalled.
- The DataTable component takes the column registry, and each column's cell renders the kind layer component.
- Wrap the Table in a scroll region with `role="region"`, a name, and `tabIndex={0}`.

## Pitfalls

- The docs' sortable header is a Button with a static icon and no `aria-sort`. Write a stateful header that sets `aria-sort` on the TableHead.
- The docs' money example uses `parseFloat` with a hardcoded "en-US" and "USD". Use the money kind.
- The docs' `tasks` example types enums as `z.string()`. Type them as the enum.
- The built-in Table wrapper scrolls with `overflow-auto` but has no region role, so add the region outside it.

## Checked facts

- Sortable header (Button, `ArrowUpDown`, `toggleSorting`, no `aria-sort`) at lines 548 to 561 and money example (`parseFloat`, `Intl.NumberFormat("en-US")`, `currency: "USD"`) at lines 346 to 361: `.lucy/notes/2026-10-27-tables-research/repos/ui/apps/v4/content/docs/components/radix/data-table.mdx`, commit 96da9cc.
