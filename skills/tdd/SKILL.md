---
name: tdd
description: "Use when writing implementation code for a feature or bug fix, before the code exists: red, green, refactor, one slice at a time, at seams agreed with the user."
---

# Test-driven development

Write the test first. Watch it fail. Write the minimal code that makes it pass.

Core principle: if you did not watch the test fail, you do not know whether it tests the right thing.

Violating the letter of the rules is violating the spirit of the rules.

When exploring the codebase, read CONTEXT.md if it exists, so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you touch.

## When to use

Always:
- New features
- Bug fixes
- Refactoring
- Behavior changes

Exceptions, each agreed with the user first:
- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That is rationalization.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything, so agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What's the public interface, and which seams should we test?"

When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), invoke `codebase-design` through the host's skill mechanism for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not a session to run.

## The loop

Red, verify red, green, verify green, refactor, repeat. A wrong failure sends you back to red. A failing verify-green sends you back to green. Refactoring stays green.

### Red: write a failing test

Write one minimal test showing what should happen.

Good:

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

Clear name, tests real behavior, one thing.

Bad:

```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```

Vague name, tests the mock and not the code.

Requirements:
- One behavior
- Clear name
- Real code (mocks only when unavoidable)

### Verify red: watch it fail

Mandatory.

```bash
npm test path/to/test.test.ts
```

Confirm:
- The test fails, rather than erroring
- The failure message is the one you expected
- It fails because the feature is missing, not because of a typo

Test passes? You are testing existing behavior. Fix the test.

Test errors? Fix the error and re-run until it fails correctly.

### Green: minimal code

Write the simplest code that passes the test.

Good:

```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```

Just enough to pass.

Bad:

```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI
}
```

Over-engineered.

Stay inside the test. Add only what it asks for; other code and other improvements wait for their own tests.

### Verify green: watch it pass

Mandatory.

```bash
npm test path/to/test.test.ts
```

Confirm:
- The test passes
- The other tests still pass
- The output is clean: no errors, no warnings

Test fails? Fix the code, not the test.

Other tests fail? Fix them now.

### Refactor: clean up

After green only:
- Remove duplication
- Improve names
- Extract helpers
- Keep the tests green and add no behavior
- Refactoring is not part of the red-green cycle; it happens after green, and larger restructuring belongs to review.

### Repeat

Write the next failing test for the next slice of behavior.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test, one implementation, repeat, each test a **tracer bullet** that responds to what the last cycle taught you.
- **Passes immediately**: a test that passes on its first run is testing behavior that already exists, not the change you are making. Fix the test until it fails for the missing behavior.

## Good tests

| Quality | Good | Bad |
|---------|------|-----|
| Minimal | One thing. "and" in the name? Split it. | `test('validates email and domain and whitespace')` |
| Clear | The name describes the behavior | `test('test1')` |
| Shows intent | Demonstrates the desired API | Obscures what the code should do |

Read writing-good-tests.md when writing or changing any test.

## When stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test it | Write the wished-for API. Write the assertion first. Ask the user. |
| Test too complicated | The design is too complicated. Simplify the interface. |
| Must mock everything | The code is too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify the design. |

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately, which proves nothing. They may test the wrong thing, test the implementation instead of the behavior, or miss the edge case you forgot. You never watched it fail, so you never proved it can catch the bug. Test-first forces that failure. |
| "Already manually tested" | Manual testing is ad hoc: no record of what you covered, no way to re-run it when the code changes, easy to forget cases under pressure. "Worked when I tried it" is not coverage. Automated tests run the same way every time. |
| "Keep as reference, write tests first" | You will adapt it. That is testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw the exploration away, then start with TDD. |
| "TDD will slow me down" | TDD is the pragmatic path: it catches bugs before commit, prevents regressions, and lets you refactor without fear. "Pragmatic" shortcuts mean debugging in production, which is slower. |

## Bug fix example

Bug: an empty email is accepted.

Red:

```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

Verify red:

```bash
$ npm test
FAIL: expected 'Email required', got undefined
```

Green:

```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

Verify green:

```bash
$ npm test
PASS
```

Refactor: extract the validation when more fields need it.

## The rule

Production code exists only after a failing test asked for it. No exceptions without the user's permission.
