---
type: llm
focus: { source: file, path: src/features/customers/customer-details.tsx }
---
PASS if this customer view renders its sections as tabs (directly or through an imported tabs component) with Overview as the first tab, and the selected tab comes in from a prop or the route's search params rather than from local component state. FAIL otherwise, naming the first miss.
