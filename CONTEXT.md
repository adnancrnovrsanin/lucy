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

**Scan rule**:
One check in a playbook's scan script, with an id, a severity, the pattern it flags, the guard that limits it, and good and bad examples.
_Avoid_: lint rule, check
