---
type: llm
focus: { source: file, path: app/invoices/columns.tsx }
---
PASS if, in these column definitions, amountMinor is shown in currency style with the row currency, and is right-aligned with tabular-nums here or through an imported money cell component or the column's alignment metadata; status is a badge with a label map; the customer column shows the customer name and not customerId; the number column is a link to the invoice; and no column renders id. An imported cell component counts for the property its name and props show. FAIL otherwise, naming the first miss.
