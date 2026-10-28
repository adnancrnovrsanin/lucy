---
type: regex
target: { source: file, path: "app/orders/[id]/error.tsx" }
# Errors other than not found reach error.tsx, which offers a retry through retry() (Next.js 16.3 and later).
pattern: '\bretry\(\)'
---
