---
type: regex
target: { source: file, path: src/routes/customers/index.tsx }
# The list route's search validation accepts a peek param, inline or through a schema defined just above it.
pattern: 'validateSearch[\s\S]{0,600}\bpeek\b|\bpeek\s*:[\s\S]{0,600}validateSearch'
---
