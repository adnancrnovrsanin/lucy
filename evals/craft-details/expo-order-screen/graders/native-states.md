---
type: llm
focus: trace
---
PASS if the screen renders loading, not found (a 404 ApiError) and error states from the query, exports an ErrorBoundary, and sets the title with Stack.Screen. FAIL otherwise, naming the first miss.
