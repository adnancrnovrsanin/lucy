# Activity

One feed of what happened to the record.

## Feed

- An `h2` "Activity" and an `ol`, newest first.
- Comments and system events share the one feed.

## Items and time

- Each item has the actor, the verb, the object, and old and new values where a field changed.
- Each item has a `time` element with `datetime`.
- Relative time under about 7 days, absolute beyond.
- Audit views are always absolute, with the time zone.
- When the visible time is short, the full timestamp is in the item's accessible name.

## Filters and grouping

- A type filter (All, Comments, Changes) once there are more than about 3 kinds of event.
- The filter announces the result count through `role="status"`.
- Consecutive system events by the same actor are grouped.

## Comments

- Explicit submit: a button, and Cmd or Ctrl+Enter.
- Drafts survive navigation.
- Internal notes are marked as such.

## Long feeds

- "Show N more" loads older items and keeps focus on the first new one.
- No infinite scroll.
- A long feed collapses its middle.
- Use `content-visibility: auto` with `contain-intrinsic-size` for long lists.
- `role="feed"` only when the feed truly loads on scroll.
