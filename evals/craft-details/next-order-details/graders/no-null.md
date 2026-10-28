---
type: regex
target: { source: file, path: "app/orders/[id]/order-details.tsx" }
# The view never renders nothing for a missing record or an empty value.
pattern: '\breturn null\b'
match: not_contains
---
