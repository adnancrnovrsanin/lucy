# Lucy repo rules

Lucy is Adnan's personal Claude Code plugin: his own skills, commands, hooks, and agents. The repo root is the plugin and its own single-plugin marketplace. Design spec: docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md. Structural decisions live in docs/adr/.

## Invariants

- skills/ holds only shipped skills. Work in progress lives in drafts/, retired skills in deprecated/. Promotion is moving the directory; plugin.json has no skills array.
- After adding, renaming, or removing a skill, re-run scripts/link-skills.sh.
- After touching anything in .claude-plugin/, run: claude plugin validate . --strict
- Structural decisions get an ADR in docs/adr/.
- A vendored third-party skill keeps its license file in its directory plus a provenance line naming the source repo, path, and commit.
- Repo prose (README, ADRs, specs, this file) follows the unslop skill's rules: no em dashes, no curly quotes, sentence-case headings, no decorative emoji, plain speech. skills/unslop/SKILL.md holds the full list.
- The dev machine uses symlinks only; never also install the lucy plugin there (every skill would load twice).
