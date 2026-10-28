---
type: llm
focus: { source: file, path: "app/products/[id]/page.tsx" }
---
PASS if this page shows the product values as text, here or through an imported view component (for example a description list or a product details component), and editing stays a separate surface such as a link or an edit route. FAIL if the page renders the product form, disabled or read-only, as the view, or renders form inputs for the values.
