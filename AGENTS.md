# Lucy repo rules

Lucy is Adnan's personal plugin system: his own skills, commands, hooks, and agents. It ships as a Claude Code plugin today, with Codex and OpenCode versions planned. The repo root is the plugin and its own single-plugin marketplace. Design spec: docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md. Structural decisions live in docs/adr/.

This file is the single source of instructions for any agent working in this repo. Provider files, meaning CLAUDE.md today plus any Codex or OpenCode equivalent added later, only point here and carry no rules of their own. Why, and what each harness reads, is recorded in docs/adr/0002-agents-md-as-the-instruction-source.md.

## Invariants

- Rules live in this file. Never add a rule to a provider file; add it here, where every harness sees it.
- skills/ holds only shipped skills. Work in progress lives in drafts/, retired skills in deprecated/. Promotion is moving the directory; plugin.json has no skills array.
- After adding, renaming, or removing a skill, re-run scripts/link-skills.sh.
- After touching anything in .claude-plugin/, validate both manifests. The directory form only reaches the marketplace manifest, so the plugin needs its own call:

      claude plugin validate . --strict
      claude plugin validate .claude-plugin/plugin.json

  The second command prints one known warning, that CLAUDE.md at the plugin root is not loaded as project context, and still exits 0. That warning is expected and accepted: CLAUDE.md is a pointer for people and agents working here, not content shipped to plugin consumers. Do not add --strict to the second command, which turns that warning into a failure, and do not delete CLAUDE.md to silence it, because Claude Code would then read no rules at all.
- Structural decisions get an ADR in docs/adr/.
- A vendored third-party skill keeps its license file in its directory plus a provenance line naming the source repo, path, and commit.
- Repo prose (README, this file, ADRs, specs) follows the unslop skill's rules: no em dashes, no curly quotes, sentence-case headings, no decorative emoji, plain speech. skills/unslop/SKILL.md holds the full list.
- The dev machine uses symlinks only; never also install the lucy plugin there (every skill would load twice).
