---
type: regex
target: { source: file, path: app/invoices/new/page.tsx }
pattern: 'type=["\x27](date|datetime-local)["\x27]'
match: not_contains
---
