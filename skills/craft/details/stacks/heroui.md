# HeroUI

HeroUI v3 on React Aria Components. Route and data wiring is in the router note, not here.

## Parts

- Peek: the Pro `Sheet` (ask first, commercial). Without Pro, the open-source `Modal` styled as a side panel, or the project's own sheet component.
- Master-detail: `Resizable` where installed (Pro).
- Section anchors: `FloatingToc` (Pro).
- Tabs: `Tabs` with `selectedKey` and `onSelectionChange` bound to the URL.
- Description list: built.
- Pro components are commercial: ask before using one, and fall back to a built part when the answer is no.

## Pitfalls

- When each tab is a route, give every React Aria tab an `href` so it is a real link.
- No `DescriptionList` or `Timeline` component exists. Build both.
