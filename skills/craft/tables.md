# Tables playbook

This playbook takes a data table from its data model to a proven result. It starts after the craft core's two steps: you have the stack line and the component inventory.

Read the stack notes for the detected stack before step 8: [TanStack Table](tables/stacks/tanstack.md) whenever the engine is TanStack, plus [shadcn/ui](tables/stacks/shadcn.md) or [HeroUI](tables/stacks/heroui.md) for the UI library, or [AG Grid](tables/stacks/ag-grid.md). Other engines follow this procedure without a note.

A data table shows rows from a data source that people sort, filter, page through, or select from. A static table holds fixed content, such as a pricing comparison; it takes only the next section.

## Static tables

- Name the table with a `caption`, or with `aria-labelledby` pointing at the heading above it.
- Column headers are `th scope="col"`; a row's label cell is `th scope="row"`.
- Numbers are right-aligned with `tabular-nums`, text is left-aligned, and no cell is centered.
- One data point per cell.

Then go to step 9. Done when the table has a name, scoped headers, and aligned numbers.

## Step 1: Stack

Carry the stack line from the core into your plan or reply. Keep the engine the project uses and write for its installed major: v8 code in a TanStack v8 project, v9 code in a v9 project, an upgrade only when the user asks. With no engine installed, use TanStack Table v9: on shadcn, build on the shadcn Table; on HeroUI v3, follow the composition in the HeroUI note. For spreadsheet-style editing outside an AG Grid project, use react-data-grid. Never add a second engine, or a commercial tier (AG Grid Enterprise, MUI X Pro or Premium, HeroUI Pro, Handsontable, PrimeReact 11 beyond its Community tier), without asking.

Done when the stack line names the UI library, the table engine with its major version, the data layer, and the URL-state library.

## Step 2: Source of truth

Find the model the rows come from, in this order: a schema shared by client and server; the database schema or migrations; server DTOs or validators; an OpenAPI or GraphQL schema; the TypeScript type of the record. For every relation, also find the related model: its display field fills the cell.

When no model exists yet, propose one together with the column inventory from step 3, and write the table only after the user approves it.

Done when you can name the file that defines every column's field and every related model.

## Step 3: Column inventory

Write one row per column: source field, column kind, presentation, filter with its default operator, sortable or not, mobile priority, and for a relation its display field. Choose each kind with [tables/column-kinds.md](tables/column-kinds.md): first how the project already shows the field, then the schema. When the kind is still unclear, stop and ask; a kind the kind table does not cover stops you too. An integer is never guessed as money, a count, or a year, and no column falls back to raw text or a raw number.

Leave out fields that do not serve the table's job, such as internal ids, secrets, JSON blobs, and long text; they belong in the peek or the detail page.

Done when every column has a row and every row has a kind from the kind table.

## Step 4: Data flow

Decide client or server with [tables/data-flow.md](tables/data-flow.md). A server table follows its server checklist: every server-owned value in the query key, the manual flags set together, the server's rows passed straight through, a row or page count, the page reset on change, previous data kept. Sort, filter, and page state live in the URL. State the selection scope: the page, with "select all matching" as a separate step.

Done when you can name client or server, the URL params, the query key, and the selection scope.

## Step 5: Rendering

Paginate admin tables by default, 20 rows per page. Virtualize only when [tables/rendering.md](tables/rendering.md) says so, such as a long single-scroll feed, pages above about 50 rows, or more than about 12 visible columns.

Done when you can name pagination or virtualization and the row of the decision table that chose it.

## Step 6: Filtering

Choose the filter surface for the table's job with [tables/filtering.md](tables/filtering.md): a chips bar with "+ Filter" by default, a facet sidebar for log and feed tables, the builder behind "Advanced filter". Each filterable column takes its control and operators from its kind. Every surface reads and writes the filter tree, and the server re-validates it against the column registry.

Done when you can list the filterable columns with their controls and the surface.

## Step 7: Look and table plan

Apply the modern default in [tables/look.md](tables/look.md). Add an opt-in tier (peek, power keyboard, grouping, totals, grid mode, facet sidebar, saved views, AI filters) only when the table's job needs it, and name the reason.

Then show the table plan: the column inventory, the data-flow choice, the rendering choice, the filter surface with the filterable columns, and the opt-in tiers. Wait for approval. One exception: a client-side, read-only table with at most 5 columns and no filters goes straight to step 8, with the plan in your reply. In a plan or an autonomous run, the table plan goes into the plan or spec, where it is approved.

Done when the table plan is approved, or written in the reply for a table that meets the exception.

## Step 8: Build

Build in this order:

1. The kind layer. Find the project's existing cell presentations and filter controls, and add the missing ones, one per column kind the table uses, where the project keeps shared components. Reuse before you write.
2. The column registry: the one definition of the table's columns with each column's kind and flags, read by the table and by the server's allow-list.
3. The table, with the stack note's binding, every state from the look reference (first load, refetch, no data, no results, error), and its accessibility rules.

[tables/column-kinds.md](tables/column-kinds.md) describes the kind layer and the registry.

Done when every column renders through the kind layer and the project's type check or build passes for the changed files.

## Step 9: Prove

Invoke `inspect` through the host's skill mechanism on your changes. It runs the scan, walks the tables checklist, and reports each finding with the section of this playbook that fixes it. A server-side table also needs a test that the column registry and the server agree: the same columns filter, with the same kinds, and the same columns sort.

Fix every error finding by applying the section it points at. When a scan finding is wrong for this code, suppress it on the line above with `// inspect-ignore <rule-id>: <reason>`. Read the warnings and fix the ones that apply.

Done when inspect reports no error findings, its scan counted the table's files, and every checklist item is checked. Report inspect's summary, every suppression with its reason, and every item marked "Not verified".
