---
type: llm
focus: { source: file, path: app/invoices/page.tsx }
---
Read app/invoices/page.tsx and any files the agent created under components that the page uses. PASS if amountMinor is rendered with Intl.NumberFormat in currency style using the row currency, right-aligned with tabular-nums, status is a badge with a label map, the customer column shows the customer name and not customerId, the number column is a link, and no column renders id. FAIL otherwise, naming the first miss.
