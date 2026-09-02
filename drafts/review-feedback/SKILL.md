---
name: review-feedback
description: "Use when code review feedback arrives from a person or a reviewer agent, before acting on it: verify each item against the codebase, then fix it or push back with reasons."
---

# Review feedback

## Overview

Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## The response pattern

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

## Forbidden responses

**NEVER:**
- "You're absolutely right!" (explicit instruction-file violation)
- "Great point!" / "Excellent feedback!" (performative)
- "Let me implement that now" (before verification)

**INSTEAD:**
- Restate the technical requirement
- Ask clarifying questions
- Push back with technical reasoning if wrong
- Just start working (actions > words)

## Handling unclear feedback

```
IF any item is unclear:
  STOP. Do not implement anything yet
  ASK for clarification on unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

**Example:**
```
The user: "Fix 1-6"
You understand 1,2,3,6. Unclear on 4,5.

Wrong: Implement 1,2,3,6 now, ask about 4,5 later
Right: "I understand items 1,2,3,6. Need clarification on 4 and 5 before proceeding."
```

## Source-specific handling

### From the user
- **Trusted.** Implement after understanding
- **Still ask** if scope unclear
- **No performative agreement**
- **Skip to action** or technical acknowledgment

### From external reviewers
```
BEFORE implementing:
  1. Check: Technically correct for THIS codebase?
  2. Check: Breaks existing functionality?
  3. Check: Reason for current implementation?
  4. Check: Works on all platforms/versions?
  5. Check: Does reviewer understand full context?

IF suggestion seems wrong:
  Push back with technical reasoning

IF can't easily verify:
  Say so: "I can't verify this without [X]. Should I [investigate/ask/proceed]?"

IF conflicts with the user's prior decisions:
  Stop and discuss with the user first
```

**The rule:** be skeptical of external feedback, and check it carefully.

## YAGNI check for "professional" features

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage

  IF unused: "This endpoint isn't called. Remove it (YAGNI)?"
  IF used: Then implement properly
```

**The rule:** you and the reviewer both answer to the user. If the feature is not needed, do not add it.

## Implementation order

```
FOR multi-item feedback:
  1. Clarify anything unclear FIRST
  2. Then implement in this order:
     - Blocking issues (breaks, security)
     - Simple fixes (typos, imports)
     - Complex fixes (refactoring, logic)
  3. Test each fix individually
  4. Verify no regressions
```

## When to push back

Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack
- Legacy/compatibility reasons exist
- Conflicts with the user's architectural decisions

**How to push back:**
- Use technical reasoning, not defensiveness
- Ask specific questions
- Reference working tests/code
- Involve the user if architectural

**If you're uncomfortable pushing back out loud:** Name that tension, then tell the user about the issue you've seen. They'll appreciate your honesty.

## Acknowledging correct feedback

When feedback IS correct:
```
Right: "Fixed. [Brief description of what changed]"
Right: "Good catch, [specific issue]. Fixed in [location]."
Right: [Just fix it and show in the code]

Wrong: "You're absolutely right!"
Wrong: "Great point!"
Wrong: "Thanks for catching that!"
Wrong: "Thanks for [anything]"
Wrong: ANY gratitude expression
```

**Why no thanks:** Actions speak. Just fix it. The code itself shows you heard the feedback.

**If you catch yourself about to write "Thanks":** DELETE IT. State the fix instead.

## Gracefully correcting your pushback

If you pushed back and were wrong:
```
Right: "You were right. I checked [X] and it does [Y]. Implementing now."
Right: "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

Wrong: Long apology
Wrong: Defending why you pushed back
Wrong: Over-explaining
```

State the correction factually and move on.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Performative agreement | State requirement or just act |
| Blind implementation | Verify against codebase first |
| Batch without testing | One at a time, test each |
| Assuming reviewer is right | Check if breaks things |
| Avoiding pushback | Technical correctness > comfort |
| Partial implementation | Clarify all items first |
| Can't verify, proceed anyway | State limitation, ask for direction |

## Real examples

**Performative agreement (bad):**
```
Reviewer: "Remove legacy code"
Wrong: "You're absolutely right! Let me remove that..."
```

**Technical verification (good):**
```
Reviewer: "Remove legacy code"
Right: "Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has the wrong bundle ID. Fix it or drop pre-13 support?"
```

**YAGNI (good):**
```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
Right: "Grepped the codebase; nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

**Unclear item (good):**
```
The user: "Fix items 1-6"
You understand 1,2,3,6. Unclear on 4,5.
Right: "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

## GitHub thread replies

When replying to inline review comments on GitHub, reply in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.
