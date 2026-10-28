# TanStack Router

TanStack Router 1 with TanStack Query as the cache.

## Route files

- `src/routes/orders/$orderId.tsx` with `createFileRoute`.
- `validateSearch` takes a Standard Schema (Zod 4 directly). End each field with `.catch()` so a bad `?tab=` falls back.

## Not found and forbidden

- Throw `notFound()` in the loader, not the component, when the API returns 404.
- Set `defaultNotFoundComponent` on the router; the built-in one is deliberately bare.
- `useLoaderData` may be undefined there; read `useParams`.
- For no access, throw `notFound()` by default.

## Errors

- `errorComponent` receives `{ error, reset }`. Call `useQueryErrorResetBoundary().reset()` in an effect, then `router.invalidate()` to rerun the loader.
- `pendingComponent` shows after `pendingMs` (1000) and stays for `pendingMinMs` (500).

## Data

- `loader: ({ params }) => queryClient.query({ ...orderQuery(params.orderId), staleTime: 'static' })`.
- The component reads `useSuspenseQuery(orderQuery(orderId))`.
- Router options: `defaultPreloadStaleTime: 0` and `defaultPreload: 'intent'`.

## Peek routes

- `?peek=<id>` in `validateSearch` is the default.
- For a path URL, use route masking: `<Link to="/orders/$orderId/peek" mask={{ to: '/orders/$orderId', params }}>` with `unmaskOnReload: true`, so a reload opens the full page.

## Title

- `head: ({ loaderData }) => ({ meta: [{ title: ... }] })`, with `<HeadContent />` in the root route.

## Pitfalls

- The `<ScrollRestoration />` component is deprecated. Set `scrollRestoration: true` on the router and `resetScroll={false}` on tab links.
- The router has no route announcer or focus management; add both.
- The router's `viewTransition` option combined with React's `<ViewTransition>`.
