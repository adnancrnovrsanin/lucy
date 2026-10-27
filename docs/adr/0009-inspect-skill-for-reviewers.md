# 0009: inspect holds Lucy's reviewers in one tier 2 slot

Date: 2026-10-27
Status: accepted

## Context

ADR-0008 put the forms playbook, its checklist, and its scan inside craft. That mixed two concerns: how to build an area well, and how to judge whether it was built well. Adnan wants quality assessment as its own part of Lucy: specialized reviewers that the AI calls on its own and that he can call by hand, on the current diff by default or on a named scope such as every form in an app, with each finding routed back to the playbook that fixes it. A reviewer the AI calls unasked must be model-invoked, and tier 2 is full at 15.

Three shapes were considered: one model-invoked skill holding every reviewer, plugin agents per area (no listing slot, but no Codex path confirmed), and folding reviewers into review-changes (no slot, but review-changes is a general reviewer and has no place for an app-wide audit).

## Decision

- One model-invoked skill, `inspect`, holds every reviewer. Forms is the first. Each reviewer is a directory with a checklist and a reviewer prompt; a table in the skill maps areas to reviewers and to the files that put a diff in an area. A reviewer may exist without a craft playbook.
- inspect is the sixteenth tier 2 skill; the ceiling in ADR-0003 and ADR-0008 moves to 16. Later reviewers share the slot.
- The scan and the forms checklist move from craft to inspect. Craft keeps build guidance and calls the scan's stack detection through the sibling skill directory. The suppression comment becomes `inspect-ignore`.
- inspect reports and points each finding at the craft section that fixes it; it never fixes code itself. Fixes happen by applying the playbook, with the user's approval interactively and through execute's fix loop in autonomous runs.
- The AI reaches inspect through review-changes and craft's proof step; no constitution gate is added.

## Consequences

- Building and judging each have one home, and the scan has one owner.
- The listing grows by one description.
- craft depends on inspect being installed beside it for stack detection; both ship in the same plugin and are linked together.
- App-wide inspections cost a review subagent per form, so inspect counts first and asks.
