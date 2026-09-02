# 0005: Working artifacts live in .lucy/ and enter the project by promotion

Date: 2026-08-27
Status: accepted

## Context

Lucy's flows produce artifacts: specs from brainstorm, plans from plan, ledgers and briefs from execute, notes from explore, handoff documents, idea briefs. superpowers wrote specs and plans straight into docs/superpowers/ at design time and kept run state in a git-ignored .superpowers/sdd/ directory; mattpocock/skills uses .scratch/ for a local issue tracker. Writing design-time documents into docs/ has two costs: process state pollutes the project's documentation tree, and a spec written before implementation is never reconciled with what was actually built, so the repo carries documents that stopped matching the code.

## Decision

- Every flow writes its artifacts under .lucy/ in the project: specs/, plans/, runs/<plan>/ (execute's ledger, briefs, reports, review packages), notes/, handoffs/, ideas/.
- .lucy/ is git-ignored in full. Before the first write in a project, Lucy checks git check-ignore and, if needed, appends .lucy/ to .gitignore and proposes that one-line commit.
- The only path from .lucy/ into the project is the promote flow, user-invoked: inventory the promotable artifacts (specs, notes, and ideas always; plans only on request; runs and handoffs never); map each to the project's documentation conventions, or to docs/specs/, docs/adr/, docs/notes/, and CONTEXT.md when it has none; correct a spec against what was built, using the execute ledger's rulings as the list of departures; merge decisions into ADRs, terminology into CONTEXT.md, behavior into README or docs, and agent pointers into AGENTS.md; move the artifact out of .lucy/ and propose one commit.
- Promotion happens after finish, as-built. brainstorm leaves the approved spec in .lucy/specs/ through the build. finish counts unpromoted artifacts and tells the user to run /promote; it cannot invoke promote itself, because a user-invoked skill is reachable only by the human.
- Lucy's own repo follows the same rule from now on. The specs and plans already under docs/superpowers/ stay where they are, records of the days they were written.

## Consequences

- The repo holds only what was deliberately promoted, and promoted design documents describe the code as built.
- An unpromoted artifact exists only on the machine that wrote it. Accepted for a solo developer; promote early when it matters.
- Plans are ephemeral by default; a plan worth keeping is promoted on request.
- .lucy/ is the natural home for per-project Lucy configuration when that need appears; it is out of scope today.
- The vendored sdd-workspace script is re-pathed from .superpowers/sdd/ to .lucy/runs/.
