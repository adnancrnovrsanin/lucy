# 0008: craft holds Lucy's playbooks in one tier 2 slot

Date: 2026-10-27
Status: accepted

## Context

Lucy's skills are all process skills: they shape how work is done, never what a good result looks like in a specific area. Some implementation areas fail the same way every time an agent touches them. Forms are the first: agents use a free-text input where the data model has a fixed set of values, use a raw `<input type="date">` where the project's UI library has a date picker, and build controls and validation without reading the data model the form writes to.

The fix has to fire on its own, mid-work, when an agent starts building a form, which in Lucy means a model-invoked skill (ADR-0003). Tier 2 is full at 14 (ADR-0006). Three shapes were considered: one model-invoked skill per area, raising the ceiling with every area; demoting an existing tier 2 skill to make room; or one umbrella skill whose description names each area and whose body routes to a playbook per area. The steps every UI playbook needs (detecting the UI library and its components, asking the vendor's own tools for component details) are the same across areas, which favours one skill that holds them once.

Research for the first playbook covered 16 sources, studied 2026-10-27; the reports live in the working area and the decisions are in the craft spec.

## Decision

- One model-invoked skill, `craft`, holds every playbook. Its core carries the shared stack detection and component inventory; each playbook is a procedure plus reference files under the skill. Forms is the first playbook.
- craft joins tier 2 as the fifteenth model-invoked skill. The ceiling in ADR-0003 moves from 14 to 15. A later playbook adds a trigger to craft's description and a file to its directory; it never takes a new slot.
- The constitution gains one gate line pointing at craft. plan, execute, review-changes, and verify each gain one line so the playbook reaches planned and autonomous work, not only interactive work.
- A playbook defers to the library's own tools for component APIs (the shadcn CLI and skill, the HeroUI MCP) and carries only the process, the rules that hold across libraries, and the pitfalls the vendors do not document.
- A playbook proves its result with a dependency-free scan script that runs on the diff; findings of error severity block a completion claim.

## Consequences

- The model's listing grows by one description, measured with the Skills row of /context like the others.
- craft's description lengthens with each playbook and must stay within the 300-character limit check-skill.sh enforces; when it no longer fits, this decision is revisited.
- Library-specific API knowledge stays with the vendors, so craft goes stale more slowly but depends on those tools being present; the playbook says what to do when they are not.
- Lucy gains a second Node script surface beside unlazy, with its own tests.
