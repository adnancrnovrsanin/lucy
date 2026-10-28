# Next.js

Next.js 16 App Router; check the installed major first.

## Route files

- `app/(admin)/orders/[id]/` holds `page.tsx`, `loading.tsx`, `error.tsx` and `not-found.tsx`.
- `loading.tsx` is the layout-shaped skeleton. Dynamic routes need it for partial prefetch.
- `params` is a Promise: `const { id } = await params`.

## Not found and forbidden

- Call `notFound()` in the data function when the API returns 404. It throws, so write no `return`, and keep it out of `try` unless the `catch` calls `unstable_rethrow`.
- `forbidden()` and `unauthorized()` exist only behind `experimental.authInterrupts`. Without the flag, render the not-found view or a Forbidden component.
- Status: once `loading.tsx` streams, these calls keep status 200 and add `noindex`. Internal admin pages accept that. A public page that needs a real status checks in Proxy or before any fallback renders.

## Errors

- `error.tsx` is a Client Component taking `{ error, retry }`. Call `retry()` (Next.js 16.3 or later), which refetches; `reset()` only clears state.
- Narrow with `instanceof Error`.
- Section boundaries use `catchError` from `next/error` (Next.js 16.3 or later).

## Data

- Server: `void queryClient.query(orderQuery(id))`, or `await` it when the page needs a real 404, plus `<HydrationBoundary state={dehydrate(queryClient)}>`.
- Client: `useSuspenseQuery(orderQuery(id))` with the same factory.
- The server query client sets `shouldRedactErrors: () => false`.
- To stream a pending query, the server query client's `dehydrate.shouldDehydrateQuery` returns true for `defaultShouldDehydrateQuery(query) || query.state.status === 'pending'`, and the server client sets a default `staleTime` above 0.
- A Server Action is not a `queryFn`; Server Actions run serially.

## Peek routes

- `?peek=<id>` through nuqs (`nuqs/adapters/next/app`) is the default.
- When the peek needs a path, use a parallel `@modal` slot with an intercepting `(.)orders/[id]` route.
  - `@modal/default.tsx` returns null.
  - Close with `router.back()`.
  - Add `@modal/[...catchAll]/page.tsx` returning null for closing by link.

## Title

- `generateMetadata({ params })` returns `{ title: order.number }`.
- The root layout sets `title.template: '%s - Orders - App'` and a `title.default`.
- Next announces route changes from the title.

## Pitfalls

- `params.id` read synchronously.
- `reset()` as the retry.
- `return notFound()`.
- A `[id]` route without `loading.tsx`.
- A `@slot` without `default.tsx`.
- A client-only `useSuspenseQuery` 404, which never reaches `not-found.tsx`.
