# craft-details eval suite

This suite measures whether the craft skill fires when a task builds a details page (a view of one record), and whether the page it produces follows the details playbook. It also checks that craft stays silent on work that is not a details page, that a view is not built by reusing an edit form, and that an integer field with no stated meaning makes craft ask.

## Cases

| Case | Stack | What it checks |
| --- | --- | --- |
| next-order-details | Next.js, shadcn/ui, TanStack Query, Prisma | Record inventory shown first, not found split from other errors, one h1 with description lists, the v5.105 query API, inspect run |
| tanstack-customer-hub | TanStack Router, HeroUI v3, Zod | A record with four related collections becomes a hub: tabs with Overview first, tab and peek kept in the URL |
| edit-form-trap | Next.js, shadcn/ui, react-hook-form | The existing product form is not reused as the view page |
| ambiguous-status | Next.js, shadcn/ui, Prisma | An integer state column with no stated meaning makes craft ask before rendering it |
| expo-order-screen | Expo Router, HeroUI Native | Native branch: loading, not found and error states, ErrorBoundary, Stack.Screen title, accessible rows |
| not-a-details-page | Next.js, shadcn/ui | Control case: craft must not fire on a plain card component |

Every case except not-a-details-page has a craft-fired grader. Each case is seeded from its fixture directory by setup.sh, which runs only with --scaffold.

## Run

```bash
claude plugin eval . --tag craft-details --scaffold --allow-tools Bash Write Edit --max-cost-usd 20
```

By default each case runs with and without the plugin (ablation with-without), so the report shows craft's effect. Graders of type tool_used on Skill count only for the with-plugin arm.

This spends model tokens on the account that runs it. Run it by hand; nothing in the repo runs it automatically.
