# Details checklist

Answer each check yes or no. `[static]` means reading the code settles it; `[browser]` means it needs the running app. Each item starts with its id and ends with the craft section that fixes a failure.

A failed item is an error when it shows wrong states, builds the view as an edit form, shows a raw id or raw money, opens a redirect from the URL, or is a WCAG 2.2 A or AA failure. Every other failed item is a warning.

## Gate and plan

- [ ] `view-not-form` The view page shows the record; it is not the edit form or a set of disabled inputs. [static] Fix by: craft/details.md#is-this-a-details-page
- [ ] `page-plan` A page plan was shown and approved, or the page meets the reference-row exception. [static] Fix by: craft/details.md#step-8-page-plan
- [ ] `current-apis` The code uses the installed versions' APIs: `queryClient.query`, `react-router`, `retry` (Next.js 16.3 or later). [static] Fix by: craft/details.md#step-1-stack

## Model and kinds

- [ ] `fields-from-model` Every field comes from the named model and has a record inventory row. [static] Fix by: craft/details.md#step-3-record-inventory
- [ ] `value-kinds` Every value renders through the kind layer by its value kind. [static] Fix by: craft/kinds.md#kind-layer
- [ ] `relations-by-name` Relations show the related record's display field as a link, never a foreign-key id. [static] Fix by: craft/kinds.md#relations-and-display-fields
- [ ] `money-and-dates` Money uses currency style from minor units or a decimal string, and dates follow the date rules with the time zone stated. [static] Fix by: craft/kinds.md#numbers-and-money

## Header and layout

- [ ] `one-h1` One `h1` holds the record's name; sections are `h2`. [static] Fix by: craft/details/anatomy.md#header
- [ ] `title-format` The document title is `<record> - <type> - <app>`, set through the framework's title API. [static] Fix by: craft/details/anatomy.md#header
- [ ] `status-text` Status badges carry text, never color alone. [static] Fix by: craft/details/anatomy.md#header
- [ ] `header-actions` One primary action, about 3 visible actions, the rest in an overflow menu with the destructive action last and plain. [static] Fix by: craft/details/anatomy.md#header
- [ ] `actions-gated` Actions are disabled until the record loads and follow per-record permissions, hidden or disabled with a reason as the app decided. [static] Fix by: craft/details.md#step-6-states-and-permissions
- [ ] `highlights` The highlights show 3 to 6 key facts that are not repeated below. [static] Fix by: craft/details/anatomy.md#highlights
- [ ] `shared-shell` The page is built on the project's details shell and matches the other details pages. [static] Fix by: craft/details/anatomy.md#layout

## Fields

- [ ] `description-lists` Field groups are description lists (`dl > div > dt + dd`) under an `h2`, with a fixed label column. [static] Fix by: craft/details/anatomy.md#field-groups
- [ ] `read-only-text` Read-only values are text, never disabled or read-only inputs. [static] Fix by: craft/details/anatomy.md#field-groups
- [ ] `empty-words` Empty values are words, and above about 15 fields the empty ones gather under More fields. [static] Fix by: craft/kinds.md#empty-values
- [ ] `copy-ids` Identifiers have a copy action with a stable name and announced feedback. [static] Fix by: craft/kinds.md#copy-and-long-values

## Sections, related records, and activity

- [ ] `sections-before-tabs` Content is in `h2` sections; tabs appear only on a hub record with 4 or more independent related collections. [static] Fix by: craft/details/anatomy.md#sections-and-tabs
- [ ] `tab-rules` Tabs number 2 to 7 with Overview first, none disabled or hidden at zero, their state in `?tab=` with replace history and controlled `value`. [static] Fix by: craft/details/anatomy.md#sections-and-tabs
- [ ] `related-on-demand` Each related collection has its own query mounted when visible, a preview, and "View all (N)" to the filtered list. [static] Fix by: craft/details/anatomy.md#related-records
- [ ] `activity-feed` Activity is an ordered list, newest first, with `time` elements, a type filter above about 3 kinds, and "Show N more". [static] Fix by: craft/details/activity.md#feed
- [ ] `inspect-section` A developer record's Inspect section loads on demand and is shown only with the permission. [static] Fix by: craft/details/anatomy.md#inspect-section

## States

- [ ] `state-order` States render as early returns in order, and the header renders only once the record exists. [static] Fix by: craft/details/states.md#state-order
- [ ] `not-found-by-status` Not found comes from a 404, never from any error; no access shows not found unless the viewer knows the record; no record name appears in either. [static] Fix by: craft/details/states.md#not-found-and-no-access
- [ ] `deleted-archived` Deleted and archived records show their state, with restore when allowed. [static] Fix by: craft/details/states.md#deleted-and-archived
- [ ] `error-retry` A failed record shows plain words and Retry. [static] Fix by: craft/details/states.md#errors-and-retry
- [ ] `section-isolation` Each section fails alone with its own Retry, and no failed fetch shows as an empty state. [static] Fix by: craft/details/states.md#section-isolation
- [ ] `loading-shape` The skeleton follows the layout, nothing shows for loads under 1 second, and `aria-busy` is reset. [browser] Fix by: craft/details/states.md#loading

## Editing

- [ ] `edit-surface` Each editable field uses the surface its scope calls for, and one edit mode is open at a time. [static] Fix by: craft/details/editing.md#choosing-the-surface
- [ ] `pickers-undo` Single-property pickers commit on select with undo and roll back on failure. [static] Fix by: craft/details/editing.md#pickers
- [ ] `explicit-save` Text and groups use one save button that is never disabled, Cancel restores, and leaving with changes asks. [static] Fix by: craft/details/editing.md#explicit-save
- [ ] `conflicts` A versioned record sends its version and handles a 412 with the conflict banner. [static] Fix by: craft/details/editing.md#conflicts
- [ ] `delete-severity` Delete follows its severity, then returns to the list with its query and announces the result. [static] Fix by: craft/details/editing.md#delete

## Navigation and peek

- [ ] `peek-in-url` The peek is the page's component at `?peek=<id>`, with expand, copy link, Escape, and focus back on the row. [static] Fix by: craft/details/navigation.md#peek
- [ ] `back-keeps-filters` A breadcrumb or a back link, not both, is a real link carrying the list's query, and any `from` value is validated. [static] Fix by: craft/details/navigation.md#breadcrumbs-and-back-links
- [ ] `prev-next` Prev and next come from the cached list with "N of M", and hide without one. [static] Fix by: craft/details/navigation.md#previous-and-next
- [ ] `route-focus` After a route change focus lands on the `h1` and the change is announced. [browser] Fix by: craft/details/navigation.md#focus-and-title

## Data

- [ ] `query-factory` One `queryOptions` factory is shared by the loader, prefetch, list seeding, and the component. [static] Fix by: craft/details/data.md#query-factory
- [ ] `seeded-from-list` Opening from the list renders from the list cache and revalidates. [browser] Fix by: craft/details/data.md#seeding-from-the-list
- [ ] `no-4xx-retry` The record query does not retry 401, 403, 404, or 410. [static] Fix by: craft/details/data.md#retries
- [ ] `mutations-refresh` Mutations invalidate the detail and the lists, return the promise, and roll back optimistic changes. [static] Fix by: craft/details/data.md#mutations

## Accessibility

- [ ] `named-controls` Icon-only controls have names and every dialog or sheet has a title. [static] Fix by: craft/details/anatomy.md#accessibility
- [ ] `keyboard-only` The page, tabs, peek, and inline edit work by keyboard, and focus is visible and never hidden under a sticky header. [browser] Fix by: craft/details/anatomy.md#accessibility

## Native

- [ ] `native-screen` The screen renders its own states, exports an `ErrorBoundary` with retry, sets its title in the native header, and peeks with a form sheet. [static] Fix by: craft/details/routers/expo-router.md#screen-states
- [ ] `native-rows` Rows group label and value into one accessible element, headings have the header role, and font scaling is on. [static] Fix by: craft/details/stacks/heroui-native.md#rows-and-headings
- [ ] `native-focus-manager` `focusManager` and `onlineManager` are wired once in the app. [static] Fix by: craft/details/stacks/heroui-native.md#data

## Project files

- [ ] `next-route-files` Next.js: every `[id]` route has `loading.tsx`, every `@slot` has `default.tsx`, and `forbidden()` appears only with `experimental.authInterrupts`. [static] Fix by: craft/details/routers/next.md#route-files
- [ ] `tsr-not-found-handler` TanStack Router: the router sets `defaultNotFoundComponent`. [static] Fix by: craft/details/routers/tanstack-router.md#not-found-and-forbidden

Every check you could not run is reported as "Not verified", never assumed. Report the scan summary only when its `files N` counts the details page's files; otherwise pass the details page paths explicitly and run it again.
