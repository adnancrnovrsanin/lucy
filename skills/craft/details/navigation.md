# Navigation

How people reach a record, move between records, and go back.

## Peek

- The peek is the details page's component in a side sheet (from tables and lists) or a centered modal (from galleries and calendars).
- It opens at `?peek=<id>`, with replace semantics on open and close, through the URL-state library. Reload and share reopen it.
- Its header has expand to full page, copy link, prev and next with "N of M", and close.
- Escape closes it unless a nested popup is open. Focus returns to the row, which stays highlighted.
- The sheet has a title.
- On narrow screens the peek becomes the full page.
- Use router masking or Next intercepting routes only when the peek needs a path URL (see the router note).

## Split view and modals

- A list beside the record is for queue work only (triage, inbox). It stacks to drill-down below about 768px.
- A modal dialog is for confirmations and short single tasks, never to show the record.

## Breadcrumbs and back links

- Breadcrumbs (List > Record) in hierarchical apps. A back link only in linear flows. Never both.
- The current page is not a crumb. The `h1` names it.
- The list link is a real `<a href>` carrying the list's query string:
  - read it from `?from=`, validated as a same-origin relative path (starts with `/`, not `//`);
  - or rebuild it from the list's URL parsers.
- Never `history.back()`.
- Back restores the list's scroll and selected row.
- On mobile the breadcrumb collapses to the parent.

## Previous and next

- Neighbours and "N of M" come from the list query in the cache for the same URL filter and sort.
- At a page edge, load the next list page.
- With no cached list (a direct link), hide prev and next.
- Keys: j and k, or the arrows.
- On a key change wrap the navigation in `startTransition`, so the page does not fall back to its skeleton.

## Focus and title

- After a route change, focus the record's `h1` (`tabIndex={-1}`, focus without scrolling) once the data has resolved.
- Next.js announces route changes. React Router and TanStack Router do not, so add a polite live region there.
- The title follows the format in [anatomy.md](anatomy.md#header).

## View transitions

- Pair the list row and the details header with React's `<ViewTransition name={...}>` (React 19.3).
- Do not also call `document.startViewTransition`.
- Honour reduced motion.

## Responsive

- The rail stacks below the main column.
- The status and primary action stay in the header.
- A sticky header uses `scroll-padding-top`.
- Tabs that would wrap scroll, or fall back to sections.
