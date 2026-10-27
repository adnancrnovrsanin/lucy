# Multi-step forms

## When to split

- Split when the audit leaves more than 8 visible fields, 3 or more groups, or branches.
- Public acquisition forms (sign-up, lead, quote, application) split above 5 fields.
- Forms of 3 or fewer fields never split.
- Edit and settings forms for an existing record stay on one page with fieldsets.

## Step design

- One topic per step.
- Eligibility and branching questions come first.
- Easy questions come first and sensitive ones last.
- Each step is quick to complete.
- Never ask twice: prefill, or offer the earlier answer.

## Validation

- Each step validates its own fields, taken from the keys of the step's schema.
- Cross-step rules live on the full schema, and the final submit validates everything.
- Going back never validates.
- React Hook Form keeps values of unmounted steps by default (`shouldUnregister: false`).

## Drafts

- Local by default, under a namespaced key.
- Secrets and payment data are never stored.
- Drafts expire.
- A "restored" notice offers a discard option.
- Clear the draft after success.
- A server-side draft is proposed and asked about, since it stores data the user has not submitted.

## Navigation

- Each step is a browser history entry.
- The URL carries the step index and never field values.
- Back restores the step as the user left it.
- Focus moves to the step heading on every step change.
- The document title names the step ("Address, step 2 of 4").
- A sticky footer gets scroll padding so it never covers the focused field.

## Progress

- Default to "Step n of m" with the section title.
- A full Stepper fits only short, fixed, linear flows without branches.
- Step buttons say "Continue" or "Save and continue"; the last button names the action ("Send application").

## Review step

- One section per group, with a change link per answer whose hidden text names the answer.
- A change returns to the review, and any new follow-up questions are asked first.
- Skipped optional answers show "Not provided".
- The final button names the action.
- High-stakes forms get a review step even on one page.

Pattern from the GOV.UK Design System check answers (OGL v3.0).
