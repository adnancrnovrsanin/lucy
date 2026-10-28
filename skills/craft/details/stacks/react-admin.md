# react-admin

Covers react-admin and shadcn-admin-kit. Route and data wiring is in the router note, not here.

## Parts

- `Show` or `ShowBase` with `useShowController` loads the record.
- `ReferenceManyField` loads a related collection on demand and paginates it.
- `TabbedShowLayout` syncs the active tab to the location.

## Pitfalls

- The default `ShowView` renders `null` while pending or missing, and redirects to "not found" for every error. Render the state views yourself.
- `useShowController` redirects to the list on any error. Map 404 and 403 before it runs.
- Give every tab a `path` slug. An index path breaks bookmarks.
- shadcn-admin-kit's `RecordField` is a pair of divs. Wrap the fields in a `dl`.
- The built-in title is an `h2`. Render the record name as the `h1`.
