---
type: llm
focus: trace
---
PASS if the files the agent wrote use validationBehavior="aria" with React Hook Form, render errors through FieldError (no errorMessage prop), use DateField for dateOfBirth and a DatePicker for startDate, convert dates with @internationalized/date (parseDate and toString) instead of JS Date, map country through a searchable ComboBox or Autocomplete built from Intl.DisplayNames, and leave consentToContact unchecked by default. FAIL otherwise, naming the first miss.

Judge from the contents of the Write and Edit calls in the trace, across every file the agent wrote for the form.
