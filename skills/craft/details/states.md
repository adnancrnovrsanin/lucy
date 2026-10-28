# States

Every details page renders one state at a time, in a fixed order.

## State order

- Early returns in this order: loading, not found, no access, deleted or archived, error, ready.
- The header, actions and sections render only once the record exists.
- Never `return null`.
- Never use a loading view as the only fallback.
- The error check never comes after a `!data` check.

## State table

| State | Shows | Status |
| --- | --- | --- |
| Loading | A skeleton in the page's shape; nothing for loads under about 1 second; `aria-busy` on the region, always reset. | none |
| Not found | Its own `h1` and title, "<Type> not found", no id echo, a link back to the list. | 404 |
| No access | The not-found view by default. "You don't have access to this <type>" only when the viewer already knows the record exists. Never the record's name. | 404, or 403 in the second case |
| Deleted or archived | "This <type> was deleted" or "archived", with who and when if the viewer may know, and restore when allowed. Archived is read-only. | 410 when deletion is permanent, else 200 with a state |
| Error | Plain words, a Retry, and whether unsaved input was kept. No codes, no "oops". | 5xx |
| Ready | The page. | 200 |

## Not found and no access

- Decide not found from the status (404), never from any error.
- Map 403 to the not-found view unless the viewer knows of the record.
- Never put the record name in the title or breadcrumb of these states.
- Do not retry 401, 403, 404 or 410.

## Deleted and archived

- A soft-deleted record loaded by link shows the deleted state, with restore when allowed.
- Archived records show a banner, are read-only, and swap the action set (Unarchive instead of Archive and Edit).
- Offer hard delete only from the archived state, when the backend works that way.

## Errors and retry

- A route-level boundary handles a failed record with Retry. The router note names the API.
- A failed mutation keeps the user's input and focuses the message.

## Section isolation

- Each related section and the activity feed fail alone, with their own message and Retry, inside their own error boundary.
- Show the error where a fetch failed, never a generic empty state.
- At most about 5 outage messages per page.
- If a whole section cannot load, explain it or remove it with its heading.

## Loading

- Under 1 second show nothing; 1 to 3 seconds an indeterminate indicator; 3 to 10 seconds a determinate one; above 10 seconds move the work to the background.
- Skeletons follow the layout so nothing shifts, and follow the read, not the save.
- A record seeded from the list cache renders at once and revalidates.

## Stale and locked

- When another user changes the record while this user has unsaved edits, show "Updated by <name>. Reload" instead of replacing the form.
- A locked or limited record shows a banner in place of its edit controls.
