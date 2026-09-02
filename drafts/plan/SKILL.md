---
name: plan
description: "Turn an approved spec into a bite-sized implementation plan in .lucy/plans/."
disable-model-invocation: true
argument-hint: "[spec path]"
---

# Plan

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

Save the plan to `.lucy/plans/YYYY-MM-DD-<feature-name>.md`. Before the first write into `.lucy/`, run `git check-ignore -q .lucy/`; if the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit.

## Scope check

If the spec covers multiple independent subsystems, brainstorm should have broken it into sub-project specs. If it didn't, suggest separate plans, one per subsystem. Each plan should produce working, testable software on its own.

## File structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, leave that structure alone; if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task right-sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate. When drawing task boundaries: fold setup, configuration, scaffolding, and documentation steps into the task whose deliverable needs them; split only where a reviewer could meaningfully reject one task while approving its neighbor. Each task ends with an independently testable deliverable.

## Task shape

Each task is a vertical slice: a narrow but complete path through every layer it touches, demoable or verifiable on its own, sized to fit one fresh context window. Prefactoring comes first as its own task. A wide refactor (one mechanical change whose blast radius spans the codebase) is the exception: sequence it as expand, migrate in batches, contract, each batch its own task blocked by the expand.

## Bite-sized task granularity

Each step is one action that takes two to five minutes. The steps of a typical task:

- Write the failing test.
- Run it to make sure it fails.
- Implement the minimal code to make the test pass.
- Run the tests and make sure they pass.
- Commit.

## Plan document header

Every plan starts with this header:

```markdown
# [Feature name] implementation plan

> For agentic workers: run this plan with Lucy's execute skill (/execute), one task at a time. Steps use checkbox syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [Two or three sentences about the approach]

**Tech stack:** [Key technologies and libraries]

**Spec:** [path to the spec this plan implements. The plan argues from the spec, so the spec travels with it; executors read both]

## Global constraints

[The spec's project-wide requirements, one line each, with exact values copied verbatim from the spec: version floors, dependency limits, naming and copy rules, platform requirements. Every task's requirements implicitly include this section.]

## Contract inventory

Every independently required outcome of the spec, one row each, before the first task. A plan whose inventory has an outcome with no owner or no check is not finished.

| ID | Required outcome | Owner task | Observing check |
|---|---|---|---|
| C1 | <what the spec requires, paraphrased> | Task N | <the command or review that proves it> |

---
```

## Task structure

````markdown
### Task N: [Component name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Blocked by:** Task <M> (or "none")
**Gates:** <ledger path under .lucy/gates/, or "none">

**Interfaces:**
- Consumes: [what this task uses from earlier tasks, with exact signatures]
- Produces: [what later tasks rely on: exact function names, parameter and return types. A task's implementer sees only their own task; this block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

Blocked by names the tasks whose outputs this task consumes; execute works the frontier of unblocked tasks. Gates names an unlazy ledger when the task's completion should be proven by runnable checks rather than review alone.

## No placeholders

Every step must contain the actual content an engineer needs. These are plan failures; write none of them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code; the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Self-review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself, not a subagent dispatch.

**1. Spec coverage:** Skim each section and requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags, any of the patterns from the "No placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Inventory coverage:** every row of the contract inventory names a task that exists and a check that task performs.

If you find issues, fix them inline. No need to re-review; fix and move on. If you find a spec requirement with no task, add the task.

## Execution handoff

Plan complete at <path>. Tell the user to run /execute <path>. The plan skill never invokes execute.
