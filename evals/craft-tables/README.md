# craft-tables eval suite

This suite measures whether the craft skill fires when a task builds a data table, and whether the table it produces follows the tables playbook. It also checks that craft stays silent on work that is not a table, and that a static table takes the short branch.

## Cases

| Case | Stack | What it checks |
| --- | --- | --- |
| shadcn-server-invoices | shadcn/ui, TanStack Table, Prisma | Column inventory shown first, a kind per column, server-side flags, inspect run |
| heroui-orders | HeroUI v3, TanStack Table and Query | HeroUI table wiring: row header, sort descriptor, selection checkbox, currency format |
| static-pricing | shadcn/ui | Static-table branch: scoped headers, no column inventory, no plan approval |
| ambiguous-integer | shadcn/ui, TanStack Table, Drizzle | An integer column with no stated meaning makes craft ask before rendering it |
| not-a-table | shadcn/ui | Control case: craft must not fire on a plain helper function |

Every case except not-a-table has a craft-fired grader. Each case is seeded from its fixture directory by setup.sh, which runs only with --scaffold.

## Grader design

An llm judge with `focus: trace` sees only the first 12 and the last 12 messages of a run, so it misses a plan or code written mid-run. Grade code with a judge or regex on a file the prompt names. For a property spread across files, use a trace regex scoped to the agent's own Write and Edit inputs (`"name":"(?:Write|Edit)","input":...`), never a bare trace regex, which also matches the skill text the agent reads. A shown plan is a trace regex over the agent's text blocks before its first Write or Edit, naming the fixture's fields with their kinds.

## Run

```bash
claude plugin eval . --tag craft-tables --scaffold --allow-tools Bash Write Edit --max-cost-usd 15
```

By default each case runs with and without the plugin (ablation with-without), so the report shows craft's effect. Graders of type tool_used on Skill count only for the with-plugin arm.

This spends model tokens on the account that runs it. Run it by hand; nothing in the repo runs it automatically.
