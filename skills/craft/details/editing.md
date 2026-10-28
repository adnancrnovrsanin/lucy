# Editing

How a details page changes its record without turning into a form.

## Choosing the surface

| Scope | Surface |
| --- | --- |
| One or two low-risk fields | Inline edit per field. |
| A status, assignee, priority, labels or owner | A picker that commits on select. |
| A field group | Section edit, or a drawer that is a nested route (`/orders/:id/edit-address`) closing back to the page with its query string. |
| Long, multi-section, or side-effect edits | A separate edit route built with the forms playbook: `h1` "Edit <name>", the create form's field order, button "Save <type>". |

- One edit mode is open at a time.
- The display and edit layouts match, so nothing moves when edit opens.

## Inline edit

- The trigger is a real button, "Edit <field>".
- Focus moves into the field on open.
- Enter saves a single-line field. Escape cancels.
- Focus returns to the button on save or cancel.
- Announce success through `role="status"` unless the visible change is obvious.
- The editor remounts on a record-version counter that changes on refetch, not on the id.

## Pickers

- A single-property picker commits on select, optimistically, and shows an undo toast.
- A failure rolls the value back and says so.
- The change lands in the activity feed.

## Explicit save

- Free text and field groups use explicit save.
- One save button per page.
- Save is never disabled or hidden. Validate on submit instead.
- Cancel restores the old value.
- No autosave for text, checkbox groups, radios or native selects.

## Unsaved changes and failures

- Leaving with unsaved changes asks: "Save changes", "Discard changes and leave page", or stay.
- Nothing is asked when nothing changed.
- A failed save keeps the input and focuses the first invalid field, or the message.
- Skeletons never replace fields while saving.

## Conflicts

- When the backend versions records, send `If-Match` with the ETag or the version field.
- A 412 refetches the record, keeps the draft, and shows a banner with "Review changes" and "Overwrite".
- Never retry silently.

## Delete

- Pick by severity:
  - archive or soft delete with an undo toast where the backend allows it;
  - otherwise a specific confirm ("Delete invoice INV-123?", button "Delete invoice", initial focus on Cancel) that names what breaks;
  - type the name only when the delete cascades to contained records.
- After delete, go to the list with its query string kept and announce the result.
- Focus lands on the list's `h1` or the status message.
