# Forms playbook

This playbook takes a form from its data model to a proven result. It starts after the craft core's two steps: you have the stack line and the component inventory.

Read the stack note for the detected library before step 4: [shadcn/ui](forms/stacks/shadcn.md), [HeroUI web](forms/stacks/heroui.md), [HeroUI Native](forms/stacks/heroui-native.md). Other libraries follow this procedure without a note.

## Step 1: Stack

Carry the stack line from the core into your plan or reply.

Done when it names the UI library, its base or platform, the form library, and the validation library with major versions.

## Step 2: Source of truth

Find the data model the form writes to, in this order: a schema shared by client and server; the database schema or migrations (Prisma, Drizzle, SQL); server DTOs or validators; an OpenAPI or GraphQL schema; the TypeScript type of the record. The form follows that model and never invents a second one. When the server already validates with a schema the client can import, import it.

When no model exists yet, propose one: a validation schema shared by client and server, shown together with the field table from step 4. Write the form only after the user approves it; the approved schema is then the source of truth.

Done when you can name the file that defines every field, or the proposed schema is approved.

## Step 3: Field inventory

Write one row per field of the model: key, kind (string, number, decimal, boolean, enum, date, timestamp, time, relation, array, object, file), required or nullable, default, constraints (length, range, pattern, precision), options for enums, and where the value comes from.

A kind that [forms/field-map.md](forms/field-map.md) does not cover stops you: say so and decide with the user. It never becomes a text input by default.

Done when every field of the model has a row.

## Step 4: Audit and map

Audit each row before choosing its control:

- Set by the server (id, timestamps, owner from the session, slug, status): not rendered.
- Known from the signed-in user or an earlier step: prefilled or skipped.
- Derivable (country and time zone from Intl, company from the email domain): derived, and editable when shown.
- Nullable and not needed for this action: propose deferring it. A NOT NULL column with no default is asked; deferring it needs a schema change, so ask the user.
- A confirmation duplicate, such as a second email field: dropped.

Give each remaining field its control from [forms/field-map.md](forms/field-map.md), its autocomplete token and any input help from [forms/autofill.md](forms/autofill.md), its constraints, and its help text. Then count: the form size is small up to 4 visible fields, medium from 5 to 8, large above 8 or with 3 or more sections.

For medium and large forms, show the table (field, control, validation, autocomplete) and wait for approval. Small forms go straight to code, with the table in your reply. In a plan or an autonomous run the table goes into the plan or spec, where it is approved.

Done when every visible field has a control from the inventory, every personal-data field has an autocomplete token, and the table is approved or, for a small form, written in the reply.

## Step 5: Structure

Choose one page or steps with [forms/multi-step.md](forms/multi-step.md). One page groups related fields in fieldsets with legends. Add a review step for multi-step forms and for high-stakes forms (payments, legal, medical), even on one page.

Done when the structure is named, one page or the list of steps with their fields, and it fits the split rule.

## Step 6: Build

Build with the stack note's slot table and binding recipe, and with [forms/feedback.md](forms/feedback.md):

- Validation timing follows the form size: small forms validate first on blur, medium forms on submit, large forms when a section is finished. Every size revalidates live after the first check.
- Large and multi-step forms get the error summary; smaller forms move focus to the first invalid field.
- Server errors land on their fields, with a form-level message for everything else.
- Pending, success, unsaved changes, and async checks follow the feedback reference.
- Every control has a visible label tied to it: the library's label slot, or `label` with `htmlFor` and a matching id. A placeholder is never the label; examples go in the hint.
- Focus follows the visual order and stays visible: no positive `tabIndex`, no `outline-none` without a focus-visible style, and no `autoFocus` on load.

Done when every field in the table renders with its mapped control and the project's type check or build passes for the changed files.

## Step 7: Prove

1. Run `node <this skill's directory>/scripts/scan.mjs` from the project. It scans the files changed since the merge base plus untracked files; pass paths to scan others.
2. Fix every error finding. When a finding is wrong for this code, suppress it on the line above with `// craft-scan-ignore <rule-id>: <reason>`. Read the warnings and fix the ones that apply.
3. Walk [forms/checklist.md](forms/checklist.md).

4. Check the summary's `files N`. It must count the form's files. When it shows 0 or misses them (nothing changed since the merge base, or the form is already committed), run the scan again with the form's paths passed explicitly. A scan that checked no form file proves nothing.
5. The scan sees an enum only when it is declared in the same file as the control. Check every enum field's control against the field table by hand.

Done when the scan exits 0, its `files N` counts the form's files, and every checklist item is checked. Report the scan's summary line, every suppression with its reason, and every checklist item you could not check, marked "Not verified".
