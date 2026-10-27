---
type: llm
focus: trace
---
PASS if the final files use validationBehavior="aria" with React Hook Form, render errors through FieldError (no errorMessage prop), use DateField for dateOfBirth and a DatePicker for startDate, convert dates with @internationalized/date (parseDate and toString) instead of JS Date, map country through a searchable ComboBox or Autocomplete built from Intl.DisplayNames, and leave consentToContact unchecked by default. FAIL otherwise, naming the first miss.
