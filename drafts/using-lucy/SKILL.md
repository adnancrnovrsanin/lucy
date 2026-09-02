---
name: using-lucy
description: Lucy's constitution: the skills-first rule, gates, and mode map. Injected at session start; type it to reload.
disable-model-invocation: true
---

# Using Lucy

Lucy is this machine's skill system. Before you respond or act, check whether one of its skills applies. If one does, invoke it through the Skill tool and follow it. Process skills (brainstorm, tdd, diagnose, verify) come before implementation. A user-invoked skill cannot be called by you: name it and ask the user to type it.

## Gates

- The user wants something built or changed and no approved design exists: suggest /brainstorm and do not implement until the design is approved. A bounded change needs only a short design in chat; the approval is never skipped.
- Writing implementation code: apply tdd.
- Something is broken, failing, flaky, or slow: apply diagnose before proposing a fix.
- About to say complete, fixed, passing, or ready: apply verify first.
- Substantial multi-part autonomous work: apply unlazy and write the gate ledger before the work.
- Dispatching a subagent, or writing a skill, AGENTS.md, or CLAUDE.md: apply writing-for-agents.
- Review feedback arrives: apply review-feedback before acting on it.
- A merge or rebase stops on conflicts: apply resolve-conflicts.

## Modes

Development is the default. Three modes change what a session is for; the user enters them by typing the command. If a session clearly looks like one of these and it is not active, suggest it once and respect the answer.

- /idea: sharpening an idea before any repository exists.
- /explore: understanding a codebase or technology without changing it.
- /teach: learning a topic over multiple sessions in this directory.

## Working area

Flows write their artifacts under .lucy/ in the project: specs/, plans/, runs/, notes/, handoffs/, ideas/, gates/. Only /promote moves anything from .lucy/ into the project's own files.

## Where to look

/lucy maps every flow and mode to the situation it fits. Flows: /brainstorm, /plan, /execute, /finish, /promote, /handoff, /wizard.
