---
type: llm
focus: { source: file, path: src/routes/customers/index.tsx }
---
PASS if the customers list opens a customer in a side peek driven by a `peek` search param (not component state), and the peek renders the same customer component the customer page uses (imported, not duplicated). FAIL otherwise, naming the first miss.
