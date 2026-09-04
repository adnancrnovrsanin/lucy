---
name: review-changes
description: "Use when a task, feature, or branch is done and needs review before merging or moving on: dispatch a reviewer subagent over the diff since a fixed point, reporting standards and spec findings separately."
---

# Review changes

Dispatch a reviewer subagent to catch issues before they cascade into more work. The reviewer gets crafted context for the evaluation, never your session's history. It reports along two axes, Standards (how the code is written) and Spec (whether it does what was asked), under separate headings.

**Core principle:** Review early, review often.

## When to request review

Mandatory:

- After each task when execute drives a plan
- After completing a major feature
- Before merging to main (finish calls this skill)

Optional but valuable:

- When stuck (a fresh perspective)
- Before refactoring (a baseline check)
- After fixing a complex bug

## How to request

**1. Pin the fixed point.**

The user or the calling skill supplies the point the diff starts from: a SHA, a branch, a tag, or `HEAD~N`. When nothing is supplied, ask. Confirm the ref resolves and the diff is non-empty before dispatching anything:

```bash
git rev-parse <fixed-point>            # must print a SHA
git diff <fixed-point>...HEAD --stat   # must be non-empty (three-dot: compared against the merge-base)
BASE_SHA=$(git rev-parse <fixed-point>)
HEAD_SHA=$(git rev-parse HEAD)
```

A bad ref or an empty diff fails here, in your session, and never inside the reviewer.

**2. Find the spec source.**

The spec or plan the work implements, in this order: the `.lucy/specs/` or `.lucy/plans/` file the work was done from (when execute is driving, the task brief under `.lucy/runs/<plan-basename>/`), a path the user passed, or an issue the commit messages reference. When you find none, the dispatch says `no spec available`; the reviewer then skips the spec axis and says so in its report.

**3. Dispatch the reviewer.**

Dispatch a fresh reviewer subagent, filling the template at [code-reviewer.md](code-reviewer.md). Hand it the range and the spec source, never your session history. In Codex, use `spawn_agent` with `fork_turns: "none"`; on another host, use its equivalent no-history spawn. The dispatch states: Report Standards and Spec findings under separate headings; never rerank one axis against the other.

Placeholders:

- `[DESCRIPTION]`: a brief summary of what you built
- `[PLAN_OR_REQUIREMENTS]`: the spec source from step 2, or `no spec available`
- `[BASE_SHA]`: the fixed point, resolved
- `[HEAD_SHA]`: the ending commit

**4. Act on feedback.**

- Critical: fix now, before anything else.
- Important: fix before proceeding.
- Minor: note for later.

Severity is read within each axis. A Critical spec finding is fixed now even when the Standards axis is clean, and the other way round. When you disagree with a finding, invoke `review-feedback` through the host's skill mechanism and work through it there, with reasoning and evidence.

## Example

```
[Task 2 of .lucy/plans/deployment-plan.md just landed: add the verification function]

You: Requesting review before Task 3.

FIXED=a7981ec                                   # the Task 1 commit, supplied by execute
git rev-parse "$FIXED"                          # resolves
git diff "$FIXED"...HEAD --stat                 # non-empty
BASE_SHA=$(git rev-parse "$FIXED"); HEAD_SHA=$(git rev-parse HEAD)

[Dispatch reviewer]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 in .lucy/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Reviewer returns]
  Strengths: clean architecture, tests exercise real behavior
  Standards:
    Minor: magic number (100) for the reporting interval, possible Primitive Obsession
  Spec:
    Important: Task 2 asks for progress indicators; none present
  Assessment: ready to proceed with fixes

You: [Add the progress indicators, then continue to Task 3]
```

## Common rationalizations

| Excuse | Reality |
|--------|---------|
| "I'll just review the diff myself instead of dispatching a reviewer" | You are the coordinator. Reviewing the diff inline burns the context window you need to keep driving the work. Dispatch a reviewer subagent: the diff and the evaluation live in its context, and only the findings come back to you. |
| "The reviewer needs my whole session history to understand the change" | Hand it crafted context, never your session's history. That keeps the reviewer on the work product instead of your thought process. |
| "The Standards axis is clean, so the Spec findings can wait" | The axes are separate on purpose. A change can follow every standard and still build the wrong thing. Read severity within each axis and act on both. |

## Red flags

Stop when you notice any of these:

- Skipping the review because the change feels simple.
- Moving on with a Critical or Important finding unfixed.
- Folding the two axes into one ranked list.
- Complying with a finding you believe is wrong, or arguing it inline. Either one goes through review-feedback (step 4).

See the template at [code-reviewer.md](code-reviewer.md).
