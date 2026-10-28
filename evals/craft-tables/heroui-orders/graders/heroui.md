---
type: llm
focus: trace
---
PASS if, in the files the agent wrote for the orders page (page.tsx or the table component it renders, judged from the Write and Edit calls in the trace), the table uses Table.Content with an aria-label, marks one Table.Column isRowHeader, passes onSortChange together with a sortDescriptor, renders Checkbox slot="selection", uses getLeafHeaders or plain columns rather than getHeaderGroups()[0], and formats total as currency. FAIL otherwise, naming the first miss.
