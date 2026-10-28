---
type: llm
focus: trace
---
PASS if the agent split the form into steps (the schema has 15 fields) with per-step validation and a review step before submit, and showed progress as "Step n of m" or a Stepper. FAIL otherwise.

Judge from the contents of the Write and Edit calls in the trace, across every file the agent wrote for the form. A label built from variables such as `Step {n} of {m}` counts.
