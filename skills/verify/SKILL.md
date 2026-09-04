---
name: verify
description: "Use before claiming that work is complete, fixed, passing, or ready, and before committing or opening a PR: run the command that proves the claim and read its output first."
---

# Verify

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The iron law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The gate function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common failures

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red flags that mean stop

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence is not evidence |
| "Just this once" | No exceptions |
| "Linter passed" | A linter is not a compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion is not an excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key patterns

**Tests:**
```
Right: [Run test command] [See: 34/34 pass] "All tests pass"
Wrong: "Should pass now" / "Looks correct"
```

**Regression tests (TDD red-green):**
```
Right: Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
Wrong: "I've written a regression test" (without red-green verification)
```

**Build:**
```
Right: [Run build] [See: exit 0] "Build passes"
Wrong: "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
Right: Re-read plan → Create checklist → Verify each → Report gaps or completion
Wrong: "Tests pass, phase complete"
```

**Agent delegation:**
```
Right: Agent reports success → Check VCS diff → Verify changes → Report actual state
Wrong: Trust agent report
```

## Substantial work: the evidence is a ledger

When the work has more than a handful of independently required outcomes, or it ran unattended, one command's output is not enough evidence. Invoke `unlazy` through the host's skill mechanism: the gate ledger under .lucy/gates/ is the proof, and `--reverify` is the verification command. Report the met, unmet, and abandoned counts it prints, nothing rounder.

## When to apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness
