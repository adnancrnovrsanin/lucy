# Data

A details page loads, seeds, mutates and refreshes its record through one TanStack Query 5 factory (5.105 or later; check the installed version).

## Query factory

- One `queryOptions` factory per record type. The loader, the prefetch, the list seeding and the component all use it.

  ```ts
  export const orderQuery = (id: string) => queryOptions({
    queryKey: ['orders', 'detail', id],
    queryFn: () => api.order(id),
    retry: (count, error) => !(error instanceof ApiError && [401, 403, 404, 410].includes(error.status)) && count < 3,
  });
  ```

- List keys are `['orders', 'list', filters]`, so the prefix `['orders']` reaches the detail and every list.
- Repeat a key inline in a loader or a prefetch nowhere; call the factory.

## Loading the record

- TanStack Query 5.105 deprecates `prefetchQuery`, `ensureQueryData` and `fetchQuery`; use `queryClient.query()`.
- The record: `await queryClient.query(orderQuery(id))`, with no `.catch`, so the router's not-found and error boundaries fire.
- Where `ensureQueryData` was used: `query({ ...orderQuery(id), staleTime: 'static' })`.
- The component reads with `useSuspenseQuery(orderQuery(id))`, or `useQuery` where the screen renders its own states.
- Assert that the fetched record's id equals the route id.
- The router note shows the wiring.

## Seeding from the list

- The list row is the full record: `initialData: () => queryClient.getQueryData(listKey)?.find((r) => r.id === id)` with `initialDataUpdatedAt: () => queryClient.getQueryState(listKey)?.dataUpdatedAt`.
- The list row is partial: `placeholderData` from the row, and `isPlaceholderData` shows skeletons for the missing fields.
- Prefetch on hover and focus of a row link: `void queryClient.query({ ...orderQuery(id), staleTime: 60_000 }).catch(noop)`.

## Related data

- Each related section is its own component with its own query, so suspense queries run side by side, not one after another.
- Non-critical prefetches: `void queryClient.query(...).catch(noop)`.
- Fetch a relation when its tab or section mounts, not up front.

## Retries

- No retry for 401, 403, 404 and 410. Three retries of a 404 cost about 7 seconds before the not-found state shows.
- The default backoff stays for 5xx and network errors.

## Mutations

- The change shows in one place: optimism through variables. Render `mutation.variables` while the mutation is pending; there is nothing to roll back.
- The change shows in several places: optimism through the cache.
  - `onMutate`: `await context.client.cancelQueries(...)`, snapshot with `getQueryData`, `setQueryData`, return the snapshot.
  - `onError`: restore the snapshot.
- `onSettled` returns `context.client.invalidateQueries({ queryKey: ['orders'] })`, so the detail and the lists refresh.
- When the response returns the record, `setQueryData` from it.
- Cache updates are immutable.
- One optimistic layer per field: `useOptimistic` or the query cache, never both.

## Freshness

- `refetchOnWindowFocus` stays on, with a `staleTime` of about 30 to 60 seconds.
- With server events (SSE or WebSocket), an event for the record invalidates its detail key. While the user has unsaved edits, the page shows the stale banner instead (see the [states reference](states.md)).
