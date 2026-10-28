# shadcn/ui

Details parts come from the installed shadcn components; the installed files are the API. Route and data wiring is in the router note, not here.

## Parts

- Peek: `Sheet`, `SheetContent`, `SheetTitle`, `SheetDescription`.
- Tabs: `Tabs` controlled by nuqs, with `value` and `onValueChange` bound to the URL.
- Overflow menu: `DropdownMenu`.
- Confirms: `AlertDialog`.
- Status: `Badge` plus text.
- Loading: `Skeleton` shaped like the field groups.
- Description list: built, because shadcn has no such component. Use a `dl` with a CSS grid and a fixed first track so values align.

## Pitfalls

- `SheetContent` without `SheetTitle` warns and fails screen readers. Add a visually hidden title when the design has none.
- `Tabs defaultValue` read from the URL. Use the controlled `value` so back and forward move the tab.
- Icon-only `Button size="icon"` without `aria-label`.
