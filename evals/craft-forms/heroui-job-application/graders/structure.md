---
type: llm
focus: trace
---
PASS if the agent split the form into steps (the schema has 15 fields) with per-step validation and a review step before submit, and showed progress as "Step n of m" or a Stepper. FAIL otherwise.
