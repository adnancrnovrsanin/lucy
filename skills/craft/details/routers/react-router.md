# React Router

React Router 8, framework or data mode.

## Route files

- One route module per record (`routes/orders.$orderId.tsx`) exporting `loader`, `meta` and `ErrorBoundary`.
- Import from `react-router`; `RouterProvider` and `HydratedRouter` come from `react-router/dom`. `react-router-dom` is gone in 8.

## Not found and forbidden

- The loader throws `data('Not Found', { status: 404 })`.
- Throw 403 instead only when the viewer already knows the record exists.

## Errors

- `ErrorBoundary` branches on `isRouteErrorResponse(error)`, then `error instanceof Error`, then a generic fallback.
- Every app exports a root `ErrorBoundary`.

## Data

- The loader awaits `queryClient.query(orderQuery(params.orderId))`.
- The component reads the same factory.

## Peek routes

- `?peek=<id>` is the default.
- For a path: `<Link to="/orders?peek=5" mask="/orders/5">`. Masks work in SPA mode only; SSR ignores them.
- The v6 `backgroundLocation` recipe is outdated.

## Title

- `meta` receives `loaderData`.

## Pitfalls

- No focus management or announcer by default; add both.
- `<ScrollRestoration />` needs `getKey` when two routes share a scroll position.
- `viewTransition` on `Link`, `useViewTransitionState` and the NavLink `isTransitioning` render prop are deprecated. Wrap `<Outlet />` in React's `<ViewTransition>`.
