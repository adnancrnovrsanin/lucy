# Lucy

Lucy is Adnan's personal plugin system of skills, hooks, and agents for Claude Code and Codex. This glossary covers terms that are specific to Lucy.

## Craft

**Craft skill**:
The model-invoked skill that holds Lucy's playbooks and the stack detection they share.
_Avoid_: specialist skill, domain skill

**Playbook**:
A procedure plus its reference files for one implementation area where agents tend to cut corners, such as forms.
_Avoid_: domain, guide, recipe

**Stack note**:
A playbook reference file for one UI library or platform, naming which component fills each role and the library's pitfalls.
_Avoid_: adapter, library guide

**Field inventory**:
The table a form starts from: one row per field of the data model, with its kind, constraints, chosen control, autocomplete token, and help text.
_Avoid_: field list, form spec

**Form size**:
The band a form falls in by visible fields: small up to 4, medium 5 to 8, large above 8 or with 3 or more sections.

**Data table**:
A table whose rows come from a data source and that people sort, filter, page through, or select from.
_Avoid_: grid (unless cells are edited in place), list view

**Static table**:
A table whose content is fixed in the page, such as a pricing comparison; the tables playbook gives it only semantics.

**Value kind**:
What a field's value is, combining its technical type (integer, decimal, timestamp, foreign key) with its meaning (price, quantity, status, person, relation); it decides how the value is shown, entered, sorted, and filtered in every playbook.
_Avoid_: column kind, column type, data type, field kind

**Column inventory**:
The table a data table starts from: one row per column with its source field, value kind, presentation, filter, and sortability.
_Avoid_: column list, table spec

**Table plan**:
The column inventory plus the data-flow, rendering, filtering, and opt-in choices for one data table, approved before the table is built.

**Column registry**:
The one definition of a data table's columns in the project's code, carrying each column's value kind and flags, read by both the table and the server.
_Avoid_: column config, column defs (for the registry as a whole)

**Kind layer**:
The project's shared set of value presentations, filter controls, and inputs, one per value kind, that every table, form, and details page in the project reuses.
_Avoid_: cell library, renderers

**Filter tree**:
The one shape every filter on a data table takes: groups joined by and or or, holding conditions of field, operator, and value; chips and the filter builder are views of it.
_Avoid_: filter model, query object

**Exemplar**:
A data table Adnan has built and approved, recorded as the reference the tables playbook and its stack notes are calibrated against.
_Avoid_: golden table, sample

**Details page**:
The page for one record, opened from a data table or a link, that shows what the record is, what relates to it, and what happened to it.
_Avoid_: detail view, show page, record page, entity page, object page

**Page kind**:
Which of four shapes a details page takes: work item, hub record, transaction, or reference row; it decides the layout.

**Record inventory**:
The table a details page starts from: one row per field of the record with its value kind, group, placement, edit surface, and empty-value words.
_Avoid_: field list, attribute list

**Page plan**:
The record inventory plus the page kind, surfaces, sections or tabs, related records, activity, and states for one details page, approved before it is built.

**Details shell**:
The project's shared set of details page parts (header, highlights, field groups, sections, activity, state views) that every details page in the project reuses.
_Avoid_: page template, layout kit

**Peek**:
A details page shown in a side sheet or modal over the list it was opened from, the same component as the full page and addressable by URL.
_Avoid_: preview, quick view, drawer (for the peek itself)

**Router note**:
A playbook reference file for one routing framework, covering record routes, loading, not-found and forbidden states, peek routes, titles, and focus.

## Inspect

**Inspect skill**:
The model-invoked skill that holds Lucy's reviewers and the scan, and judges an implementation against them.
_Avoid_: cop, QA skill, audit

**Reviewer**:
A checklist plus a reviewer prompt for one area, inside the inspect skill, whose findings point at the playbook section that fixes them.
_Avoid_: cop, checker

**Inspection**:
One run of inspect over a scope: the current diff by default, or a named area and paths.
_Avoid_: audit, review pass

**Scan rule**:
One check in the inspect scan, with an id, a severity, the pattern it flags, the guard that limits it, good and bad examples, and a fix-by pointer.
_Avoid_: lint rule, check

**Fix-by pointer**:
The playbook section a finding names as the place where its fix is explained.
_Avoid_: ref, link
