# Lucy repo rules

Lucy is Adnan's personal plugin system: his own skills, commands, hooks, and agents. It ships as a Claude Code plugin today, with Codex and OpenCode versions planned. The repo root is the plugin and its own single-plugin marketplace. Design specs: docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md (foundation) and docs/superpowers/specs/2026-08-27-lucy-skill-system-design.md (skill system). Structural decisions live in docs/adr/.

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
- A new skill is user-invoked by default (`disable-model-invocation: true`). It enters the model's listing only if the model must apply it unasked or another skill calls it mid-flow, and PROVENANCE.md's `## Tier` section says which. Fourteen model-invoked skills is the ceiling; adding one means removing one or amending ADR-0003.
- Skill names are one word where possible and never collide with a skill Claude Code already exposes (check the listing before naming). Renaming a shipped skill is a structural decision.
- Every skill directory carries agents/openai.yaml (in sync with disable-model-invocation) and PROVENANCE.md; a vendored or merged skill also carries LICENSE with every applicable notice. scripts/check-skill.sh must pass on a skill before it moves from drafts/ to skills/.
- .lucy/ is Lucy's working area in every project, this one included. It is git-ignored; nothing under it is committed, and only the promote flow moves material out of it.
- After touching hooks/ or skills/unlazy/scripts/, re-run `node scripts/install-dev-hooks.mjs` and smoke-test both hooks (`echo '{}' | bash hooks/session-start` prints JSON; `echo '{"session_id":"abcdefabcdefabcdefabcdef"}' | node skills/unlazy/scripts/stop-hook.mjs` prints nothing in a project without ledgers).
- Skill text calls other skills with `Call the Skill tool with "<name>"`, one per call, and never targets a user-invoked skill that way; it tells the user to type it instead.
