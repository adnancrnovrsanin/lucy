# Details playbook

This playbook takes the page for one record (opened from a table row or a link) from its data model to a proven result. It starts after the craft core's two steps: you have the stack line, including the router, and the component inventory.

Read the router note for the stack's router before step 9: [Next.js](details/routers/next.md), [TanStack Router](details/routers/tanstack-router.md), [React Router](details/routers/react-router.md), or [Expo Router](details/routers/expo-router.md); and the stack note for the UI library: [shadcn/ui](details/stacks/shadcn.md), [HeroUI](details/stacks/heroui.md), [HeroUI Native](details/stacks/heroui-native.md), [react-admin](details/stacks/react-admin.md) (also shadcn-admin-kit), or [refine](details/stacks/refine.md). Other stacks follow this procedure without a note.

## Is this a details page

A create flow and bulk edit belong to the forms playbook; finding records and analysis belong to the tables playbook or a dashboard. The page that shows a record is never the edit form and never a stack of disabled inputs: viewing and editing are separate surfaces, and editing follows step 7.

Done when you can name the record type and say the page shows one record.

## Step 1: Stack

Carry the stack line into your plan or reply. Write for the installed versions: `queryClient.query()` rather than `prefetchQuery` or `ensureQueryData` from TanStack Query 5.105; `react-router` rather than `react-router-dom` on React Router 8; the `retry` prop in Next.js 16.3 or later error files.

Done when the stack line names the UI library, the router with its major, the data layer with its version, and the URL-state library.

## Step 2: Source of truth

Find, in this order: the record's model (shared schema, database schema or migrations, server DTOs or validators, OpenAPI or GraphQL, the TypeScript type); every related model with its display field; where permissions come from (per record and per action); where activity or audit events come from; whether the backend soft-deletes and whether records carry a version or ETag.

When no model exists, propose one with the record inventory and build only after approval.

Done when each item names a file or "none".

## Step 3: Record inventory

Write one row per field: field, value kind from [kinds.md](kinds.md), group, placement (header, highlights, section, rail, or More fields), edit surface, and empty-value words. Group fields as the create form groups them. Leave out internal ids and secrets; on a developer record they go to the Inspect section ([details/anatomy.md](details/anatomy.md#inspect-section)). An unclear kind stops you: ask. Above about 15 fields, empty fields go to More fields.

Done when every field has a row, every row has a value kind, and the record inventory is shown in your reply or the plan.

## Step 4: Page kind and surfaces

Choose the page kind with [details/anatomy.md](details/anatomy.md#page-kinds): work item, hub record, transaction, or reference row. The full page is canonical and has its own route. Add a peek when the record opens from a list or table, as the same component at `?peek=<id>` ([details/navigation.md](details/navigation.md#peek)). A split view only for queue work; a modal only for confirmations.

Done when the page kind and every surface are named.

## Step 5: Sections, related records, and activity

Use `h2` sections by default; tabs only for a hub record with 4 or more independent related collections, Overview first ([details/anatomy.md](details/anatomy.md#sections-and-tabs)). For each related collection: its own query, a preview of 5 to 10 rows, and "View all (N)" to the filtered list; the table itself is built with the tables playbook. Activity: yes or no, its event kinds and source ([details/activity.md](details/activity.md)). A developer record gets the Inspect section.

Done when every section, tab and related collection is listed with its data source.

## Step 6: States and permissions

Fill the state table from [details/states.md](details/states.md#state-table): loading, not found, no access (not found by default), deleted or archived, error, ready, plus each section's own failure, stale, and locked. For each action, decide who may run it and whether it is hidden or disabled with a reason, once for the app.

Done when every state has its view and every action its permission.

## Step 7: Editing

Choose each field's edit surface with [details/editing.md](details/editing.md#choosing-the-surface). Single-property pickers commit on select with undo; text and field groups use explicit save. Delete by severity. When the backend versions records, send the version and handle a conflict. Edit routes and drawer forms are built with the forms playbook.

Done when every editable field has a surface and delete has its severity.

## Step 8: Page plan

Show the page plan: the record inventory, page kind, surfaces, sections or tabs, related records, activity, states, permissions, and edit surfaces. Wait for approval. One exception: a reference-row page that is read-only, has about 6 fields or fewer, and has no tabs and no activity goes straight to step 9 with the plan in your reply. In planned or autonomous work, the page plan goes into the plan or spec, where it is approved. When the user approved in advance, still show the plan in your reply (with every field's value kind) before building, then build without waiting.

Done when the plan is shown in your reply or the plan document, and approved or exempt: approved by the user, approved in advance, or a page that meets the exception.

## Step 9: Build

Build in this order:

1. The details shell. Find the project's existing details parts and add only the missing ones (header, highlights, field group, section, related preview, activity, state views) where the project keeps shared components. Reuse before you write.
2. The query factory and mutations ([details/data.md](details/data.md)).
3. The route, following the router note: loader, states, title, focus.
4. The page inside the shell.
5. The peek as the same component.

Done when every field renders through the kind layer and the shell, and the project's type check or build passes for the changed files.

## Step 10: Prove

Invoke `inspect` through the host's skill mechanism on your changes; that invocation is the step, and reading inspect's files or running scan.mjs yourself does not replace it. It runs the scan, walks the details checklist, and reports each finding with the section that fixes it. When the project has MSW or Playwright, add a test per state: 404, 403, a 500 in one section, Back keeping the list's filters, Escape closing the peek with focus back on the row.

Fix every error finding by applying the section it points at. When a scan finding is wrong for this code, suppress it on the line above with `// inspect-ignore <rule-id>: <reason>`. Read the warnings and fix the ones that apply.

Done when inspect was invoked, it reports no error findings, its scan counted the page's files, and every checklist item is checked. Report inspect's summary, every suppression with its reason, and every item marked "Not verified".
