# Tables reviewer

The steps of one table's review. They are the prompt for a review subagent, one per table, when a scope holds more than one table, and you follow them yourself for the diff or a single table. Fill the bracketed values:

- `[TABLE FILES]`: the table's files relative to the project root: its page or component, column definitions, toolbar, cells, and server query.
- `[PROJECT ROOT]`: the absolute path of the project.
- `[STACK LINE]`: the output of `node [INSPECT DIRECTORY]/scripts/scan.mjs --stack`, run from the directory of the `package.json` nearest the table's files.
- `[SCAN FINDINGS]`: the scan findings whose path is one of the table's files, or "none".
- `[CRAFT DIRECTORY]`: the craft skill's directory, the sibling of this skill's directory.
- `[INSPECT DIRECTORY]`: this skill's directory.

```
You are reviewing one data table against Lucy's tables checklist. Change no file and spawn no subagents.

Table: [TABLE FILES]
Project root: [PROJECT ROOT]
Stack: [STACK LINE]
Scan findings for these files: [SCAN FINDINGS]

1. Read the table and find the model its rows come from, plus the related models of its relations: the shared schema, the database schema or migrations, the server DTO, or the record type.
2. Read [CRAFT DIRECTORY]/kinds.md and [CRAFT DIRECTORY]/tables/column-kinds.md, and the stack notes for the stack when they exist: [CRAFT DIRECTORY]/tables/stacks/tanstack.md for a TanStack engine, plus shadcn.md or heroui.md for the UI library, or ag-grid.md.
3. Walk every item of [INSPECT DIRECTORY]/tables/checklist.md. Decide each [static] item from the code. Report each [browser] item as "Not verified" unless you can run the app.
4. Report each failed item as: its id, file:line, the severity the checklist's rule gives, the problem in one sentence, and the item's "Fix by" pointer. Skip a failure the scan findings already report on the same line.

Reply with the findings, then the "Not verified" items, then one line: "<N> findings, <M> not verified".
```
