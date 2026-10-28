# 0010: the plugin passes strict validation

Date: 2026-10-28
Status: accepted

## Context

`claude plugin validate . --strict` failed on master with three findings. The repo root is the plugin (ADR-0001), so the validator read it as a plugin directory:

- LICENSE_MISSING: the plugin had no LICENSE file and plugin.json had no `license`. The foundation spec had decided to add no root LICENSE, leaving each vendored skill with its own.
- ICON_MISSING: no square PNG icon.
- A warning that CLAUDE.md at the plugin root is not loaded as project context. ADR-0002 accepted that warning, because CLAUDE.md is the pointer that makes Claude Code read AGENTS.md, and AGENTS.md told agents not to run the plugin check with --strict.

Adnan wanted every validator to pass.

## Decision

- Lucy is licensed under Apache-2.0. The root holds LICENSE (the Apache-2.0 terms) and NOTICE (copyright, and a note that vendored or adapted material keeps the licence in its own LICENSE file). plugin.json sets `"license": "Apache-2.0"`. This supersedes the foundation spec's decision to add no root LICENSE.
- plugin.json sets `"icon": ".claude-plugin/icon.png"`, a generated 1024 px square PNG. It can be replaced by any square PNG of 512 to 2048 px under 2 MB.
- The Claude pointer moves from the repo root to .claude/CLAUDE.md and imports `@../AGENTS.md`. Claude Code reads .claude/CLAUDE.md as project memory, so the rules still load. This amends ADR-0002 only on where the pointer lives; AGENTS.md stays the single source of rules.
- Both validate commands in AGENTS.md now run with --strict and must pass with no warnings.

## Consequences

- A future warning from the validator is a failure, not an accepted exception.
- Anyone forking Lucy gets clear terms: Apache-2.0 for Lucy's own material, the stated licence for vendored skills.
- The icon may become a listing icon only the first time the plugin is submitted to the plugin directory; replacing it later does not change that listing.
- Tools or people looking for a root CLAUDE.md find it in .claude/ instead; README's layout section says so.
