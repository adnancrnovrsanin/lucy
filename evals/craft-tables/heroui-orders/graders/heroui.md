---
type: llm
focus: { source: file, path: app/orders/page.tsx }
---
PASS if the table uses Table.Content with an aria-label, marks one Table.Column isRowHeader, passes onSortChange together with a sortDescriptor, renders Checkbox slot="selection", uses getLeafHeaders or plain columns rather than getHeaderGroups()[0], and formats total as currency. FAIL otherwise, naming the first miss.
