# craft-forms eval suite

This suite measures whether the craft skill fires when a task builds a form, and whether the form it produces follows the forms playbook. It also checks that craft stays silent on work that is not a form.

## Cases

| Case | Stack | What it checks |
| --- | --- | --- |
| shadcn-create-invoice | shadcn/ui, Prisma | Field table shown first, control choice per field, no raw date inputs, scan script run |
| heroui-job-application | HeroUI v3 | Multi-step structure with review, HeroUI wiring, scan script run |
| no-data-model | shadcn/ui | With no model, craft proposes a shared schema and field table and asks before writing |
| small-sign-in | shadcn/ui | Small-form rules: autofill attributes, onTouched mode, one generic failure message |
| not-a-form | shadcn/ui | Control case: craft must not fire on a plain helper function |

Every case except not-a-form has a craft-fired grader. Each case is seeded from its fixture directory by setup.sh, which runs only with --scaffold.

## Run

```bash
claude plugin eval . --tag craft-forms --scaffold --allow-tools Bash Write Edit --max-cost-usd 15
```

By default each case runs with and without the plugin (ablation with-without), so the report shows craft's effect. Graders of type tool_used on Skill count only for the with-plugin arm.

This spends model tokens on the account that runs it. Run it by hand; nothing in the repo runs it automatically.
