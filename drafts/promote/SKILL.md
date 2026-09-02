---
name: promote
description: "Turn .lucy/ artifacts into project documentation, reconciled with what was built."
disable-model-invocation: true
---

# Promote

Move what the flows produced under .lucy/ into the project's own documents. Only promoted material enters the repository; .lucy/ is process state and stays ignored.

## 1. Inventory

List the promotable artifacts: everything under .lucy/specs/, .lucy/notes/, and .lucy/ideas/, plus a plan under .lucy/plans/ only when the user names it. .lucy/runs/, .lucy/handoffs/, and .lucy/gates/ are never promoted. Show one line per artifact. Stop if the list is empty.

Done when the user has seen the list and picked what to promote (default: everything listed).

## 2. Map

Detect the project's documentation conventions: docs/adr/, docs/specs/, docs/design/, CONTEXT.md, README.md, a notes directory, AGENTS.md or CLAUDE.md. Propose one target per artifact: a spec goes to the specs directory (docs/specs/ when none exists), notes to the notes directory (docs/notes/ when none exists), decisions to docs/adr/, terminology to CONTEXT.md, agent pointers to AGENTS.md (CLAUDE.md when AGENTS.md is absent). When a target is ambiguous, call the Skill tool with "grilling" for one round.

Done when every artifact has a target the user agreed to.

## 3. Correct

A spec is promoted as built. Read the execute ledger of the plan that implemented it (.lucy/runs/<plan>/progress.md) and collect every line containing "Ruling:"; each ruling marks a place where implementation departed from the spec. Apply each ruling to the promoted text, then read the code the spec describes and fix any statement the code contradicts. Remove sections that only made sense before the build (open questions, grill rounds, migration order); keep the decisions and their reasons.

Done when no sentence in the promoted document contradicts the code and every ruling is reflected.

## 4. Merge

Call the Skill tool with "domain-modeling". A decision that is hard to reverse, surprising without context, and the result of a real trade-off becomes an ADR in docs/adr/, numbered after the highest existing one. New terms go into CONTEXT.md. User-facing behavior goes into README.md or the docs the project already keeps. Pointers an agent needs to find the new documents go into AGENTS.md or CLAUDE.md; call the Skill tool with "writing-for-agents" before writing them. Merge into existing documents rather than adding a parallel file that says the same thing.

Done when each piece of the artifact lives in exactly one project document.

## 5. Move

Delete the promoted artifact from .lucy/ (move, never copy). Run the project's prose or lint checks if it has any. Propose one commit named for the promotion, for example "docs: promote pricing spec as built", and wait for the user before committing.

Done when .lucy/ no longer holds the artifact and the commit is proposed.
