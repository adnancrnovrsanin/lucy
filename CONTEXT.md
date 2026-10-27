# Lucy

Lucy is Adnan's personal plugin system of skills, hooks, and agents for Claude Code and Codex. This glossary covers terms that are specific to Lucy.

## Craft

**Craft skill**:
The model-invoked skill that holds Lucy's playbooks and the stack detection they share.
_Avoid_: specialist skill, domain skill

**Playbook**:
A procedure plus its reference files for one implementation area where agents tend to cut corners, such as forms.
_Avoid_: domain, guide, recipe

**Stack note**:
A playbook reference file for one UI library or platform, naming which component fills each role and the library's pitfalls.
_Avoid_: adapter, library guide

**Field inventory**:
The table a form starts from: one row per field of the data model, with its kind, constraints, chosen control, autocomplete token, and help text.
_Avoid_: field list, form spec

**Form size**:
The band a form falls in by visible fields: small up to 4, medium 5 to 8, large above 8 or with 3 or more sections.

## Inspect

**Inspect skill**:
The model-invoked skill that holds Lucy's reviewers and the scan, and judges an implementation against them.
_Avoid_: cop, QA skill, audit

**Reviewer**:
A checklist plus a reviewer prompt for one area, inside the inspect skill, whose findings point at the playbook section that fixes them.
_Avoid_: cop, checker

**Inspection**:
One run of inspect over a scope: the current diff by default, or a named area and paths.
_Avoid_: audit, review pass

**Scan rule**:
One check in the inspect scan, with an id, a severity, the pattern it flags, the guard that limits it, good and bad examples, and a fix-by pointer.
_Avoid_: lint rule, check

**Fix-by pointer**:
The playbook section a finding names as the place where its fix is explained.
_Avoid_: ref, link
