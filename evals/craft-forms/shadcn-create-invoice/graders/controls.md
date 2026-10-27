---
type: llm
focus: { source: file, path: app/invoices/new/page.tsx }
---
PASS if status uses a RadioGroup or ToggleGroup with the three statuses, issuedOn and dueOn use a Popover with Calendar, the customer is a Combobox that loads /api/customers with an encoded query and uses the customer id as the value, the amount is a text input with inputMode decimal stored in minor units, notes is a Textarea with a character count and no maxLength, and id, createdAt, and updatedAt are not rendered. FAIL otherwise, naming the first miss.
