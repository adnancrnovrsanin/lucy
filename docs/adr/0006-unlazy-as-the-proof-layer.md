# 0006: unlazy is vendored as Lucy's proof layer

Date: 2026-09-02
Status: accepted

## Context

Lucy's approved design (spec 2026-08-27, ADR-0003 to ADR-0005) decides completion by process: tdd, verify, review, and the execute ledger. All of them are prose the model applies to itself; none of them makes "done" machine-checkable. Adnan runs long autonomous sessions that spawn many subagents, where the failure that costs most is a confident done report over half-finished work.

Leonxlnx/unlazy (commit 473d4b8, MIT, studied end to end on 2026-09-02) closes that gap. A GATES.md ledger lists observable outcomes; a runnable gate passes only when its CHECK exits 0 and its EXPECT matches the output; evidence records shell, working directory, exit status, a PATH fingerprint, and an output digest, never raw output. `--status` never executes, `--approve` is explicit consent because CHECK lines are code, `--reverify` re-runs already met gates, and abandonment is a visible handoff that can never promote to success. An optional Claude Code Stop hook blocks session end while gates are unmet and releases after six no-progress blocks. Orchestrated mode adds a PLAN contract inventory, leaf and branch ledgers, ownership leases, and dispatch waves.

Quality was checked rather than assumed: `npm test` passed on the dev machine (Node 24.20), the checker and linter behaved as documented in a smoke test, and the Stop hook allowed a stop with no ledger, blocked with an unmet one, and allowed with a met one. The project is three weeks old, untagged, and moving fast (48 commits since 2026-08-09); its orchestrated mode overlaps execute, and its `.unlazy/` directory collides with ADR-0005.

## Decision

- unlazy is vendored whole, orchestrated mode included, under its own name, with its MIT license and a provenance note at commit 473d4b8.
- It joins tier 2 as the fourteenth model-invoked skill. The constitution gains one gate: substantial multi-part autonomous work starts by writing the gate ledger.
- Its state moves under Lucy's working area: `.unlazy/<scope>/` becomes `.lucy/gates/<scope>/`, the solo ledger lives at `.lucy/gates/GATES.md`, hook state moves under `.lucy/gates/`, and the approval store moves from `~/.unlazy/approved` to `~/.lucy/approved`. Environment variable names stay `UNLAZY_*`. The vendored tests are the completeness check for the rename.
- The Stop hook ships in Lucy's hooks/hooks.json for every project; the per-project installer is dropped. The hook is scan-only and allows the stop when no ledger exists.
- One rule keeps two orchestrators from running at once: execute drives, unlazy proves. execute remains the executor of plans, its tasks may carry gates, finish requires ALL MET on the task ledgers, and unlazy's own orchestrated mode runs only when execute is not driving.
- Two fold-ins: plan adopts the contract inventory table (every independently omittable outcome mapped to an owner and an observing gate); verify names a gate ledger as the form of evidence for substantial work.

## Consequences

- Completion of substantial work is decided by a ledger and runnable checks, and a session cannot end quietly with unmet gates.
- Lucy gains a Node dependency (16 or newer) for the checker and the Stop hook. A machine without Node loses the proof layer and nothing else.
- The fork freezes unlazy at 473d4b8; upstream fixes are ported by hand, the same cost accepted for superpowers in ADR-0003.
- The tier 2 ceiling moves from 13 to 14 descriptions; the context budget criterion in the spec keeps its form and is measured the same way.
- Gate ledgers are process state under `.lucy/` and are never promoted.
