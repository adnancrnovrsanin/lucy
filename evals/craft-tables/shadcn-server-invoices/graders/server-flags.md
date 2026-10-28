---
type: llm
focus: { source: file, path: app/invoices/invoices-table.tsx }
---
PASS if this table component sets manualPagination together with manualSorting and manualFiltering (or their TanStack Table v9 equivalents) and passes a row count or page count from the server. FAIL otherwise, naming the first miss.
