# 0011: value kinds are shared by every craft playbook

Date: 2026-10-28
Status: accepted

## Context

The forms playbook decided each field's control from the data model in its field map, and the tables playbook decided each column's presentation, filter and server needs from a column kind. A details page shows the same values again: a price, a status, a relation, a date. Three playbooks with three ideas of what a value is would let one app show the same field three ways, and a fix to one would miss the others. The details research found the same presentation rules (money in currency style from minor units, relations by display field, dates without a time zone shift, enums as labelled badges) behind every surface.

Two shapes were considered: let the details playbook point at the tables file, or move identification and presentation into one shared file that each playbook projects.

## Decision

- `craft/kinds.md` holds what a value is: the resolution order, the kind table with presentation, relation display fields, value rules, empty values, copy and long values, and the kind layer.
- Each playbook keeps only its projection: tables/column-kinds.md (alignment, sort, filter, export, server, column registry), forms/field-map.md (one section per value kind with its control), details/anatomy.md (placement in a details page).
- The term "column kind" becomes "value kind" everywhere; CONTEXT.md lists "column kind" under Avoid.
- Empty values keep one rule per surface: blank in table cells, words on details pages and form review steps.

## Consequences

- Fix-by pointers for presentation findings move from craft/tables to craft/kinds.md; the fix-by tests guard the headings.
- A new kind is added once, to kinds.md and the kind layer, then projected by each playbook.
- The kind layer now covers inputs and details presentations as well as table cells.
