---
type: llm
focus: { source: file, path: app/login/page.tsx }
---
PASS if the email field has autocomplete username or email and spellcheck off, the password field has current-password and a show and hide toggle of type button, React Hook Form uses mode onTouched, there is no confirmation field and no error summary, submit is not disabled while the form is incomplete, and a failed sign-in shows one message that does not say which credential was wrong. FAIL otherwise, naming the first miss.
