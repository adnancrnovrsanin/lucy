---
type: llm
focus: { source: file, path: app/invoices/columns.tsx }
---
PASS if, in these column definitions (directly or through imported cell components), amountMinor is shown in currency style with the row currency, right-aligned with tabular-nums; status is a badge with a label map; the customer column shows the customer name and not customerId; the number column is a link to the invoice; and no column renders id. FAIL otherwise, naming the first miss.
