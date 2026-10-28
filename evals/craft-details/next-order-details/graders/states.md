---
type: llm
focus: trace
---
PASS if the page distinguishes not found (from a 404 ApiError) from other errors, other errors offer Retry, and the page never returns null for a missing record. FAIL otherwise, naming the first miss.
