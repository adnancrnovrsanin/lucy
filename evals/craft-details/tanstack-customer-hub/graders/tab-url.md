---
type: llm
focus: { source: file, path: src/routes/customers/$customerId.tsx }
---
PASS if this route keeps the selected tab in the URL: its validateSearch (inline, or through a schema it defines or imports) accepts a tab search param, and the route passes that tab to the customer view. FAIL otherwise, naming the first miss.
