# Anatomy

The parts of a details page and where each field goes.

## Page kinds

| Kind | Examples | Layout |
| --- | --- | --- |
| Work item | issue, ticket, task, deployment | One scroll: header, body, properties rail, activity at the end. |
| Hub record | customer, company, account, user | Header and highlights, then tabs with Overview first when there are 4 or more independent related collections, otherwise sections. |
| Transaction | order, invoice, payment | Header with status, line items as a table, a rail for the parties and payment, a timeline. |
| Reference row | tag, currency, setting | A light page or only a peek. |

## Header

- Exactly one `h1`: the record's display name, with the type label above it.
- Status is a badge with text, never color alone.
- Copy id and copy link controls sit in the header.
- One visible primary action and about 3 visible actions at most; the rest go in an overflow menu.
- Header actions act on the whole record. Section actions live in their section.
- The destructive action is last in the overflow and styled plain. Danger styling appears only in its confirm.
- Actions are disabled until the record loads.
- Fallback names: "(Unnamed <type>)", and on create "New <type>".
- `document.title` is `<record> - <type> - <app>`, set through the framework's title API, with a type-only title while loading.

## Highlights

- 3 to 6 key facts under the title, taken from the record inventory's highlights rows.
- A fact shown here is not repeated in a field group.

## Layout

- A main column for what defines the record (body, field groups, related records, activity) and a rail for status, owner, metadata and relations, about 2/3 and 1/3.
- The rail responds to its container (container queries) and stacks below the main column when narrow.
- One component tree for all widths, never a separate mobile tree.
- Every details page in the project uses the same skeleton from the details shell.

## Field groups

- Markup is `dl > div > dt + dd`, one list per group under an `h2`, or labelled with `aria-labelledby`.
- A fixed-width label column (a grid with a fixed first track). Horizontal for short labels, vertical for long, stacking when narrow.
- Groups mirror the create form's sections.
- A value is formatted through the kind layer.
- A read-only value is text, never a disabled input.
- An empty value uses the words in [../kinds.md](../kinds.md#empty-values).
- Above about 15 fields, empty fields gather under one "More fields" disclosure.
- Row actions ("Change email") sit in a trailing `dd` with visually hidden context.

## Sections and tabs

- Sections first: one long page of `h2` sections, with an in-page table of contents above about 4 sections.
- Tabs only for a hub record with 4 or more independent related collections:
  - 2 to 7 tabs, Overview first;
  - never disabled, never hidden at a zero count (show an empty state with a create action);
  - the label repeated as a heading inside the panel;
  - counts in labels come from data.
- Tab state lives in `?tab=` through a literal parser with replace history and stable slugs, controlled by `value`.
- When each tab is a route, the tabs are links in a `nav` with `aria-current="page"`, not `role="tab"`.
- Panels that fetch use manual activation. Related data mounts with its tab.

## Related records

- Each related collection is its own query, mounted when visible.
- A preview of 5 to 10 rows with "View all (N)" linking to the list filtered to this record.
- Up to about 100 rows inline with "More"; beyond that a tab or the list page.
- Build the table with the tables playbook.
- Inside a peek, related tables page locally rather than in the URL.
- An empty collection shows an empty state with its create action.
- A failed collection shows its own error and Retry.

## Inspect section

- Developer records (API objects, users, webhooks, deployments, payments) may add an optional Inspect section: raw JSON in a code block, and logs and events for this record, each loaded on demand.
- Never show it to viewers without the permission.

## Accessibility

- One `h1`; `h2` per section and `h3` below.
- Field groups are description lists.
- Status is text.
- Icon-only buttons are named with the record ("Copy order ID").
- Copy feedback goes through `role="status"`.
- Sticky headers come with `scroll-padding-top`, so focus is never hidden.
