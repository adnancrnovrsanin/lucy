---
type: llm
focus: { source: file, path: app/orders/orders-table.tsx }
---
PASS if the total column shows the order total in currency format, through Intl.NumberFormat in currency style in this file or through an imported money cell or formatter. FAIL if it renders a raw number or a hand-built string.
