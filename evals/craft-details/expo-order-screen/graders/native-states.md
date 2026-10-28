---
type: llm
focus: { source: file, path: "app/orders/[id].tsx" }
---
PASS if this screen renders loading, not found (a 404 ApiError) and error states from the query, here or through imported state components, exports an ErrorBoundary, and sets the title with Stack.Screen. FAIL otherwise, naming the first miss.
