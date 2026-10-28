# HeroUI Native

heroui-native 1.x on Expo Router; Pro rows need `heroui-native-pro`. Route wiring is in the [Expo Router note](../routers/expo-router.md).

## Parts

- `ListGroup` and its item parts, `Card` (dot notation), `Surface`.
- `Separator`. There is no `Divider`.
- `Chip` for status, `Tabs`, `Accordion`, `Avatar`.
- `Alert` for banners.
- `Skeleton` and `SkeletonGroup`.
- No list, description list or timeline component exists. Build them.

## Screen states

- The screen renders its states from the query, as the Expo Router note describes.
- Loading is `Skeleton` rows shaped like the field groups.

## Peek

- A form-sheet route, not HeroUI `BottomSheet`. `BottomSheet` is not addressable and suits pickers and action lists.

## Rows and headings

- A read-only row is a `View`, or a `ListGroup.Item` with a non-chevron suffix, with `accessible` and `accessibilityLabel={`${label}: ${value}`}`. One focus stop per row.
- A chevron only on rows that navigate. Those rows also get a button or link role.
- Section titles use `Typography.Heading`.
- The record name is the native header title, not a second large heading.
- Empty values are words: "Not set".
- Copy with `Clipboard.setStringAsync`, an announcement, and an `accessibilityActions` copy action.

## Actions

- Header actions: `Stack.Toolbar` with `Stack.Toolbar.Menu` and `MenuAction destructive`.
- In content: `Menu` with `Menu.Item variant="danger"` last, and the same `presentation` on `Menu` and `Menu.Content`.
- Confirm with `Alert.alert`. The button text is the verb ("Delete order"), because the destructive style is iOS only.
- Undo with `toast.show({ actionLabel: 'Undo', onActionPress, duration: 8000 })` plus `AccessibilityInfo.announceForAccessibility`.
- Actions stay disabled until the record has loaded.

## Data

- Wire `focusManager` to `AppState` and `onlineManager` to NetInfo or expo-network once, in the app.
- Refetch on screen focus with `useFocusEffect(useCallback(...))`, skipping the first run.
- Use `subscribed: useIsFocused()` for screens left mounted behind others.
- Seed the record from the list cache, as on the web.

## Pitfalls

- Importing `Divider`. It does not exist; use `Separator`.
- `allowFontScaling={false}`. Cap with `maxFontSizeMultiplier` instead.
- `setAccessibilityFocus` is deprecated. Use `sendAccessibilityEvent(ref, 'focus')`.
- `estimatedItemSize` on FlashList 2.
- A FlatList inside a ScrollView of the same orientation.
- A swipe pager as the only way to reach the previous and next record.
