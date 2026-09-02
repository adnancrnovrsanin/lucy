---
name: lucy
description: "Which Lucy flow or mode fits my situation."
disable-model-invocation: true
---

# Lucy

You do not have to remember every skill. Say what you are trying to do and this map answers with the flow.

## The main flow: idea to shipped

1. /brainstorm sharpens an idea into an approved design. A small change gets a short design in chat and an approval. A large change gets a spec written to .lucy/specs/.
2. /plan turns an approved spec into a plan of bite-sized tasks in .lucy/plans/, with a contract inventory that maps every required outcome to a task and a check.
3. /execute runs the plan: a fresh implementer subagent per task, a review after each, a ledger in .lucy/runs/, gates from unlazy where the plan declares them.
4. /finish runs the suite, re-verifies the ledgers, then merges, opens a PR, or keeps the branch, and cleans up the worktree. It reminds you of unpromoted artifacts.
5. /promote turns the spec and notes into project documentation, corrected against what was built.

Keep steps 1 and 2 in one context window. Each /execute starts fresh from the plan.

## Discipline that applies itself

These skills fire on their own; you can also type them. tdd when writing code. diagnose when something is broken. verify before claiming done. unlazy for substantial autonomous work: gates first. review-changes when a diff needs review. review-feedback when feedback arrives. worktree for isolation. resolve-conflicts when a merge stops. writing-for-agents when writing for an agent or dispatching one. grilling, domain-modeling, and codebase-design are the interview and vocabulary primitives the flows call. unslop applies to any prose.

## Modes

- /idea when there is no repository yet and the idea needs sharpening.
- /explore when the job is to understand a codebase or a technology without changing it.
- /teach when the job is to learn a topic over several sessions.

## Utilities

- /handoff compacts the conversation into a document for the next session and can spawn it.
- /wizard generates a bash wizard for steps only you can perform: credentials, dashboards, cutovers.
- /using-lucy reloads the constitution.

## Boundaries between sessions

Continue when the context still serves the next step. /handoff when the next step runs in a new directory, a new harness, or by someone else. A subagent when a bounded task can return a report. /clear when nothing here matters to what comes next. Read PHASE-BOUNDARIES.md for the ordered decision.
