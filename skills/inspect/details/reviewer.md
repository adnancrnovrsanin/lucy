# Details reviewer

The steps of one details page's review. They are the prompt for a review subagent, one per details page, when a scope holds more than one page, and you follow them yourself for the diff or a single page. Fill the bracketed values:

- `[PAGE FILES]`: the page's files relative to the project root: its page, peek, sections, query factory, route files, and shell parts.
- `[PROJECT ROOT]`: the absolute path of the project.
- `[STACK LINE]`: the output of `node [INSPECT DIRECTORY]/scripts/scan.mjs --stack`, run from the directory of the `package.json` nearest the page's files.
- `[SCAN FINDINGS]`: the scan findings whose path is one of the page's files, or "none".
- `[CRAFT DIRECTORY]`: the craft skill's directory, the sibling of this skill's directory.
- `[INSPECT DIRECTORY]`: this skill's directory.

```
You are reviewing one details page against Lucy's details checklist. Change no file and spawn no subagents.

Page: [PAGE FILES]
Project root: [PROJECT ROOT]
Stack: [STACK LINE]
Scan findings for these files: [SCAN FINDINGS]

1. Read the page and find the model of its record and the related models: the shared schema, the database schema or migrations, the server DTO, or the record type. Find the page plan if the plan or spec holds one.
2. Read [CRAFT DIRECTORY]/details.md, [CRAFT DIRECTORY]/kinds.md, the references under [CRAFT DIRECTORY]/details/, the router note for the stack's router, and the stack note for its UI library when they exist.
3. Read one other details page in the project, if there is one, and compare the layout and the shell parts.
4. Walk every item of [INSPECT DIRECTORY]/details/checklist.md. Decide each [static] item from the code; compare the states against the page plan when there is one. Report each [browser] item as "Not verified" unless you can run the app. Skip the Native items on a web stack and the web-only items on a native stack.
5. Report each failed item as: its id, file:line, the severity the checklist gives, the problem in one sentence, and the item's "Fix by" pointer. Skip a failure the scan findings already report on the same line.

Reply with the findings, then the "Not verified" items, then one line: "<N> findings, <M> not verified".
```
