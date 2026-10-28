# Expo Router

Expo Router on SDK 58 with React Native 0.88.

## Route files

- `app/orders/[id].tsx`.
- `useLocalSearchParams<{ id: string }>()`; the global hook re-renders every mounted stack screen.
- A param change remounts the screen.

## Screen states

- The screen renders loading, not found, no access and error itself, from the query's error status. Native has no server 404, and `+not-found` catches unmatched URLs only.
- Loading is a skeleton shaped like the rows.

## Errors

- Export `ErrorBoundary({ error, retry })` from the route file, so a crash keeps the header and offers Retry.
- Query errors stay screen states.

## Peek routes

- A route with `presentation: 'formSheet'` and `sheetAllowedDetents`.
- On Android the sheet drops the native header, so its title and actions live in the content.
- Anchor deep links with `unstable_settings = { anchor: 'index' }`.
- An "Open full" control pushes the full screen.

## Title

- `<Stack.Screen options={{ title: order.number }} />`, the object form inside the page.
- While loading, set a type-only title such as "Order".

## Pitfalls

- `useGlobalSearchParams` in a record screen.
- Untyped params.
- A route file without `ErrorBoundary`.
- Header options on an Android form sheet.
- Prev and next by swipe only.
