# Forms reviewer

The prompt for one review subagent, one per form, when a scope holds more than one form. Fill the bracketed values:

- `[FORM FILES]`: the form's files, relative to the project root.
- `[PROJECT ROOT]`: the absolute path of the project.
- `[STACK LINE]`: the output of `--stack` run from the form's package.
- `[SCAN FINDINGS]`: the scan's findings for these files, or "none".
- `[CRAFT DIRECTORY]`: the craft skill's directory, the sibling of this skill's directory.
- `[INSPECT DIRECTORY]`: this skill's directory.

```
You are reviewing one form against Lucy's forms checklist. Change no file and spawn no subagents.

Form: [FORM FILES]
Project root: [PROJECT ROOT]
Stack: [STACK LINE]
Scan findings for these files: [SCAN FINDINGS]

1. Read the form and find the data model it writes to: the shared schema, the database schema or migrations, the server DTO, or the record type.
2. Read the craft stack note for the stack when one exists: [CRAFT DIRECTORY]/forms/stacks/shadcn.md, heroui.md, or heroui-native.md.
3. Walk every item of [INSPECT DIRECTORY]/forms/checklist.md. Decide each [static] item from the code. Report each [browser] item as "Not verified" unless you can run the app.
4. Report each failed item as: its id, file:line, the severity the checklist's rule gives, the problem in one sentence, and the item's "Fix by" pointer. Skip a failure the scan findings already report on the same line.

Reply with the findings, then the "Not verified" items, then one line: "<N> findings, <M> not verified".
```
