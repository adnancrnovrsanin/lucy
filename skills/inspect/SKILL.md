---
name: inspect
description: "Use when reviewing or checking an implementation against Lucy's quality factors, a diff by default or a named scope such as all forms: run the scan, walk the reviewer, route findings to the playbook that fixes them."
---

# Inspect

Inspect judges an implementation against the quality factors of its area. A reviewer is a checklist plus a reviewer prompt in this skill's directory; the scan in `scripts/` checks the mechanical factors of every reviewer. Inspect reports, and points each finding at the playbook section that fixes it. It never changes code itself.

## Reviewers

| Area | Reviewer | A file is in the area when |
|---|---|---|
| Forms | [forms/checklist.md](forms/checklist.md), [forms/reviewer.md](forms/reviewer.md) | `node <this skill's directory>/scripts/scan.mjs --inventory forms` lists it |

## 1. Choose the scope

- No scope named: the current diff, meaning the files changed since the merge base with the default branch plus untracked files. When the caller names a base, such as a review range's starting commit, pass it to every scan command as `--base <ref>`.
- A scope named, such as "all forms" or "forms in app/checkout": that area and those paths; "all" means the whole project.

Done when you can state the areas and the file set, for example "forms, diff, 2 files".

## 2. Run the checks

1. From the project, run `node <this skill's directory>/scripts/scan.mjs` over the scope: no arguments for the diff, `--all`, or the paths.
2. Run it again with `--inventory forms` over the same scope, and group the listed files into forms: the files of one form, such as the steps of a multi-step form, belong together.
3. For the diff, or a scope with one form, review each form here by following steps 1 to 4 of [forms/reviewer.md](forms/reviewer.md) yourself, with its bracketed values filled in as that file says.
4. For a scope with more than one form, say how many you found and ask before reviewing them, since each review is a subagent; when the user declines, report the scan findings only. Otherwise invoke `writing-for-agents` through the host's skill mechanism, then dispatch one review subagent per form, at most four at a time, each with [forms/reviewer.md](forms/reviewer.md) filled in for its form.

A scan exit of 2 with a "not scanned" list means those files could not be read: list them as "not inspected", never as a pass. An exit of 2 with a usage message, such as no git repository for the diff, means the scope needs naming: say so and ask for one. A form whose review did not come back is "not inspected" too.

Done when the scan has covered the whole scope and every listed form has a review result or a "not inspected" entry.

## 3. Report

Each finding gives: the id (a scan rule id or a checklist item id), `file:line`, severity (error, warning, or info), the problem in one sentence, and "fix by", the craft section that fixes it. The scan prints its pointer; checklist items carry theirs. A checklist failure the scan already reported on the same line is listed once, under the scan rule.

- For the diff, or a scope with one form, report in the conversation, or in the review that called you.
- For a scope with more than one form, also write `.lucy/inspections/<YYYY-MM-DD>-<area>.md`: one section per form, the scan summary, and every "not inspected" entry. Before the first write into `.lucy/`, run `git check-ignore -q .lucy/`; if the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit.

Then propose the fixes. In an interactive session, list what you would fix and wait for a yes; then fix by applying the sections the pointers name, invoking `craft` through the host's skill mechanism. When execute or review-changes called you, return the findings; they enter that flow's fix loop.

Done when every finding is reported with its pointer and every "not inspected" entry is named.

## Suppressions

A scan finding that is wrong for the code is suppressed on its line or the line above with `// inspect-ignore <rule-id>: <reason>`. A suppression without a reason is itself an error finding. Report every suppression with its reason.
