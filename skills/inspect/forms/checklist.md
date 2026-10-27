# Forms checklist

Answer each check yes or no. `[static]` means reading the code settles it; `[browser]` means it needs the running app. Each item starts with its id and ends with the craft section that fixes a failure.

A failed item is an error when it leaves free text where the model has a fixed set, a raw date input where the library has a picker, a control that contradicts the model, or a WCAG 2.2 A or AA failure. Every other failed item is a warning.

## Model coverage

- [ ] `model-rows` Every model field has a row in the field table. [static] Fix by: craft/forms.md#step-3-field-inventory
- [ ] `visible-rendered` Every visible field is rendered. [static] Fix by: craft/forms.md#step-4-audit-and-map
- [ ] `hidden-justified` Hidden fields are server-set, or deferred with the user's agreement. [static] Fix by: craft/forms.md#step-4-audit-and-map

## Controls

- [ ] `library-controls` Every control comes from the library inventory. [static] Fix by: craft/SKILL.md#2-inventory-the-components
- [ ] `option-thresholds` Option counts match the thresholds in the field map. [static] Fix by: craft/forms/field-map.md#fixed-sets-of-values
- [ ] `enum-controls` Every enum field's control matches the field table, checked by hand because the scan sees only enums declared in the same file. [static] Fix by: craft/forms/field-map.md#fixed-sets-of-values
- [ ] `date-controls` Dates use the picker or the memorable-date inputs. [static] Fix by: craft/forms/field-map.md#dates-and-times
- [ ] `number-types` No `type="number"` outside quantities. [static] Fix by: craft/forms/field-map.md#numbers-and-money

## Input help

- [ ] `autofill-tokens` Personal-data fields carry autocomplete tokens. [static] Fix by: craft/forms/autofill.md#autocomplete-tokens
- [ ] `keyboards` Keyboards match the kind of value. [static] Fix by: craft/forms/autofill.md#keyboards
- [ ] `input-help` Suggestions or lookups are in place where the autofill reference says. [static] Fix by: craft/forms/autofill.md#input-help-free-and-keyless

## Structure

- [ ] `split-rule` The split rule holds for the field count. [static] Fix by: craft/forms/multi-step.md#when-to-split
- [ ] `step-validation` Each step has its own validation. [static] Fix by: craft/forms/multi-step.md#validation
- [ ] `review-step` The review step exists where required. [static] Fix by: craft/forms/multi-step.md#review-step

## Feedback

- [ ] `timing` The first check fires at the right moment for the form size. [static] Fix by: craft/forms/feedback.md#validation-timing
- [ ] `inline-and-summary` Errors appear inline, and in the summary where required. [static] Fix by: craft/forms/feedback.md#error-summary
- [ ] `focus-on-error` Focus lands on the summary or the first invalid field. [browser] Fix by: craft/forms/feedback.md#short-forms
- [ ] `server-errors` Server errors map onto their fields. [browser] Fix by: craft/forms/feedback.md#server-errors
- [ ] `pending-success-unsaved` Pending, success, and unsaved changes behave as the feedback reference says. [browser] Fix by: craft/forms/feedback.md#pending

## Accessibility

- [ ] `visible-labels` Every control has a visible label. [static] Fix by: craft/forms.md#step-6-build
- [ ] `described-errors` Descriptions and errors are tied with aria-describedby. [static] Fix by: craft/forms/feedback.md#announcements
- [ ] `keyboard-only` The whole form works by keyboard. [browser] Fix by: craft/forms.md#step-6-build
- [ ] `status-announced` Status messages are announced. [browser] Fix by: craft/forms/feedback.md#announcements

## Real data

- [ ] `longest-values` The longest value each column allows fits and submits. [browser] Fix by: craft/forms/field-map.md#value-rules
- [ ] `international-names` Names with accents, apostrophes, and non-Latin scripts work. [browser] Fix by: craft/forms/field-map.md#text-fields
- [ ] `pasted-spaces` Pasted values with spaces are accepted. [browser] Fix by: craft/forms/field-map.md#value-rules
- [ ] `slow-network` A slow network shows the pending states. [browser] Fix by: craft/forms/feedback.md#pending

Every check you could not run is reported as "Not verified", never assumed. Report the scan summary only when its `files N` counts the form's files; otherwise pass the form paths explicitly and run it again.
