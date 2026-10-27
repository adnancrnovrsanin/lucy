# Feedback

## Validation timing

- Small forms validate first on blur, medium forms on submit, large forms when a section is finished (a step's Continue, or focus leaving a fieldset on a long single page, which triggers that fieldset's fields).
- Every size revalidates live after the first check.
- Early in any size: character overflow, debounced async checks after the user finishes typing, and non-blocking warnings.
- React Hook Form: `mode: "onTouched"` for small; `mode: "onSubmit"` with `reValidateMode: "onChange"` for medium. For large forms `reValidateMode` applies only after a submit, so use `mode: "onChange"` and show a field's error, and set its invalid flags (`aria-invalid`, `data-invalid`, `isInvalid`), only once its section is finished or after a submit attempt. A section's Continue calls `trigger(sectionFields, { shouldFocus: true })` and marks the section finished, and from then on its fields revalidate live. The stack notes give the TanStack Form and React Aria equivalents.

Checked facts (https://react-hook-form.com/docs/useform and its `trigger` page, read 2026-10-27): `mode` defaults to `"onSubmit"`, `reValidateMode` to `"onChange"`, `shouldFocusError` to `true`, `shouldUnregister` to `false`. `trigger(name?, { shouldFocus, shouldTouch })` returns a promise of a boolean; `shouldFocus` (since v7.7.0) focuses the input when trigger sets an error on it, and works only on inputs registered through `register`, not a custom register.

## Announcements

First match wins:

1. A focus move needs nothing more.
2. A message tied to a control uses aria-describedby, with the hint and error ids together.
3. A non-urgent message without a control uses `role="status"`.
4. An urgent one uses `role="alert"`.

Live regions are in the page before their text arrives. Use `aria-live="polite"` through `role="status"` and do not set `aria-live="assertive"`; `role="alert"` is the urgent channel.

## Error summary

For multi-step and large forms:

- Place it at the top of the form, above the heading of the step, under a heading such as "There is a problem".
- One link per error moves focus to its field through the form library's focus method. A fragment link alone does not focus a custom control.
- The target is the library control that takes focus: the Select trigger, the first radio, the first date input.
- Focus moves to the summary after a failed submit and never on blur.
- The document title gains an "Error: " prefix while errors show. Inline errors stay.

Pattern from the GOV.UK Design System error summary (OGL v3.0).

## Short forms

Focus goes to the first invalid field on submit. React Hook Form does this by default (`shouldFocusError` is `true`). Controlled components forward the field's ref so focus reaches them.

## Message shapes

| State | Pattern |
|---|---|
| Empty text | "Enter <thing>" |
| Unanswered choice | "Select <thing>" |
| Length | "<Thing> must be <n> characters or less", "or more", "between <a> and <b>" |
| Number | "must be a number", "<min> or more", "<max> or fewer" |
| Money | "must include pence" or "must not include pence" style rules for the currency |
| Characters | "must not include <chars>" or "must only include <allowed>" |
| Dates | "must include a <part>", "must be a real date", "must be in the past", "must be today or in the past", "must be in the future", "must be after <date>" |

Write the patterns in the app's language and i18n setup. Reuse the label's words, say what to do, and give one message per failure. Plain wording: no "please", "sorry", "invalid", "is required", or "an error occurred".

Patterns from the GOV.UK Design System (OGL v3.0).

## Server errors

- One envelope: field errors keyed by path, plus form errors. Use the project's existing shape when it has one.
- Nested paths join with dots.
- Unknown keys and non-field failures (permissions, eligibility, capacity, outages) go to a form-level message with a way to retry.
- Values stay in the form on failure.
- Zod 4: `z.flattenError` for flat forms, issue paths (or `z.treeifyError`) for nested ones.
- HTTP 409 maps to the conflicting field.

## Pending

- The label stays, with a spinner beside it.
- Repeat clicks are ignored in the handler.
- Use the library pending prop or `aria-disabled="true"`; native `disabled` drops focus from the button.
- Submit stays enabled while the form is merely incomplete.
- A spinner appears after about 150 to 300 ms and stays at least 300 to 500 ms.
- Payments and sends carry an idempotency key.

## Success

- Show an immediate next step.
- Transactional forms end on a confirmation with a reference and what happens next.
- A toast never carries the only copy of an error or an action. Error toasts stay until dismissed; timed toasts last at least 5 seconds and pause on hover and focus.
- After sign-in or sign-up, navigate away so password managers register the success.

## Unsaved changes

The form library's dirty state drives a `beforeunload` listener and the router's blocker. Both clear after a successful submit.

## Async checks

- Run after entry with a 300 to 500 ms debounce.
- Abort the previous request and drop stale responses.
- Show a pending state.
- A timeout or unknown answer never counts as a rejection.
- The server checks again on submit.
- The client schema makes no network calls.
- Sign-in and reset forms never reveal whether an account exists. On sign-up that is a product decision to ask about.

## Conditional fields

- Hidden fields are cleared and not validated.
- A simple follow-up question may appear under its radio or checkbox; a complex one goes to the next step.
- Changes that add or remove fields are announced through the status region.
