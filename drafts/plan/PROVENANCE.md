# Provenance

Merged skill.

## https://github.com/obra/superpowers, version 6.3.0 (Claude Code plugin cache copy, claude-plugins-official), path skills/writing-plans

Taken: the whole method: the overview (plans written for an engineer with zero context on the codebase, bite-sized tasks, DRY, YAGNI, TDD, frequent commits), the scope check, file structure, task right-sizing, bite-sized granularity, the plan document header with its global constraints block, the task structure template with files, interfaces, and five steps, the no-placeholders list, and the three self-review checks.
Changed: the save path moved from docs/superpowers/plans/ to .lucy/plans/, the user-preference override dropped since ADR-0005 fixes the working area, and the git check-ignore guard from ADR-0005 added before the first write; the header blockquote now names Lucy's execute skill; the execution handoff became "tell the user to run /execute <path>" with the subagent-versus-inline choice removed, since execute decides; the worktree context line and the announce line dropped; plan-document-reviewer-prompt.md dropped; the "step" bullets rewritten as a plain list; em dashes and Title Case headings rewritten.

## https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, path skills/engineering/to-tickets

Taken: the vertical-slice rules (a narrow but complete path through every layer, demoable or verifiable on its own, sized to one fresh context window, prefactoring first), blocking edges with the frontier rule, and the expand-contract sequence for wide refactors.
Changed: folded into the Task shape section, the Blocked by line of the task template, and its explanation; the issue tracker, the triage label, the setup pointer, the quiz round, and the two ticket templates dropped, since plan writes one plan file.

## https://github.com/Leonxlnx/unlazy, commit 473d4b80421c36d733042434cd4b938f81a19ef1, path templates/PLAN.md

Taken: the contract inventory idea and the table shape (ID, required outcome, owner, observing check).
Changed: reduced to four columns, without disposition and revision; the owner is a plan task and the check is a command or review; the leaf dispatch table, the state vocabulary, the tree, and the status log dropped. The Gates line of the task template points at an unlazy ledger under .lucy/gates/.

## Tier

user-invoked (tier 3): typed by the user after brainstorm.
