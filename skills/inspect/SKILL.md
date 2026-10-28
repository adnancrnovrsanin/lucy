---
name: inspect
description: "Use when reviewing or checking an implementation against Lucy's quality factors, a diff by default or a named scope such as all forms, all tables, or all details pages: run the scan, walk the reviewer, route findings to the playbook that fixes them."
---

# Inspect

Inspect judges an implementation against the quality factors of its area. A reviewer is a checklist plus a reviewer prompt in this skill's directory; the scan in `scripts/` checks the mechanical factors of every reviewer. Inspect reports, and points each finding at the playbook section that fixes it. It never changes code itself.

## Reviewers

| Area | Reviewer | A file is in the area when |
|---|---|---|
| Forms | [forms/checklist.md](forms/checklist.md), [forms/reviewer.md](forms/reviewer.md) | `node <this skill's directory>/scripts/scan.mjs --inventory forms` lists it |
| Tables | [tables/checklist.md](tables/checklist.md), [tables/reviewer.md](tables/reviewer.md) | `node <this skill's directory>/scripts/scan.mjs --inventory tables` lists it |
| Details pages | [details/checklist.md](details/checklist.md), [details/reviewer.md](details/reviewer.md) | `node <this skill's directory>/scripts/scan.mjs --inventory details` lists it |

## 1. Choose the scope

- No scope named: the current diff, meaning the files changed since the merge base with the default branch plus untracked files. When the caller names a base, such as a review range's starting commit, pass it to every scan command as `--base <ref>`.
- A scope named, such as "all forms", "all tables", "all details pages", or "forms in app/checkout": that area and those paths; "all" means the whole project.

Done when you can state the areas and the file set, for example "forms, diff, 2 files".

## 2. Run the checks

1. From the project, run `node <this skill's directory>/scripts/scan.mjs` over the scope: no arguments for the diff, `--all`, or the paths.
2. For each area in the reviewers table, run it again with `--inventory <area>` over the same scope, and group the listed files into items. The files of one form, such as the steps of a multi-step form, belong together. So do the files of one table: its page or component, columns, toolbar, cells, and server query. So do the files of one details page: its route, page, peek, sections, query factory, and the shell parts it changed.
3. For the diff, or a scope with one item, review each item here by following steps 1 to 4 of its area's reviewer yourself, with its bracketed values filled in as that file says.
4. For a scope with more than one item, say how many you found in each area and ask before reviewing them, since each review is a subagent; when the user declines, report the scan findings only. Otherwise invoke `writing-for-agents` through the host's skill mechanism, then dispatch one review subagent per item, at most four at a time, each with its area's reviewer filled in for that item.

A scan exit of 1 means it found error findings, which you report; it is not a tool failure. A scan exit of 2 with a "not scanned" list means those files could not be read: list them as "not inspected", never as a pass. An exit of 2 with a usage message, such as no git repository for the diff, means the scope needs naming: say so and ask for one. An item whose review did not come back is "not inspected" too.

Done when the scan has covered the whole scope and every listed item has a review result or a "not inspected" entry.

## 3. Report

Each finding gives: the id (a scan rule id or a checklist item id), `file:line`, severity (error, warning, or info), the problem in one sentence, and "fix by", the craft section that fixes it. The scan prints its pointer; checklist items carry theirs. A checklist failure the scan already reported on the same line is listed once, under the scan rule. After the findings, list every checklist item marked "Not verified".

- For the diff, or a scope with one item, report in the conversation, or in the review that called you.
- For a scope with more than one item, also write `.lucy/inspections/<YYYY-MM-DD>-<area>.md`: one section per item, the scan summary, every "Not verified" item, and every "not inspected" entry. Before the first write into `.lucy/`, run `git check-ignore -q .lucy/`; if the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit.

Then propose the fixes. In an interactive session, list what you would fix and wait for a yes; then fix by applying the sections the pointers name, invoking `craft` through the host's skill mechanism. When craft's proof step, execute, or review-changes called you, return the findings without waiting for a yes; the caller fixes them in its own flow.

Done when every finding is reported with its pointer and every "not inspected" entry is named.

## Suppressions

A scan finding that is wrong for the code is suppressed on its line or the line above with `// inspect-ignore <rule-id>: <reason>`. A suppression without a reason is itself an error finding. Report every suppression with its reason.
