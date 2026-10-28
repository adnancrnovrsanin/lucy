---
type: llm
focus: { source: file, path: src/routes/customers/index.tsx }
---
PASS if the customers list opens a customer in a side peek whose open customer comes from a `peek` search param (read from the route's search and set by navigation or links), not from component state. FAIL otherwise, naming the first miss.
