# refine

refine core with its shadcn, antd or MUI views. Route and data wiring is in the router note, not here.

## Parts

- `useShow` loads the record; `setShowId` drives a peek.
- `useCan` with the record id answers each action. Disable with the reason as the title, or hide; set one policy with `hideIfUnauthorized`.
- Delete buttons navigate to the list afterwards.

## Pitfalls

- The show view's title is the resource label. Use the record name.
- `data ? content : <Loading />` loads forever on error. Render the error state from the query.
- Inferencer output shows raw foreign ids and field names as headings. Replace both.
- Keep the list's query string when the delete button navigates back.
