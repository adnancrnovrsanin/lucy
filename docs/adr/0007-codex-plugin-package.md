# 0007: Native Codex package shares Lucy's skill tree

Date: 2026-09-04
Status: accepted

## Context

Lucy supports Claude Code and Codex. The Claude package already loads the shipped skills from `skills/`. Each shipped skill also has `agents/openai.yaml`, which records its Codex invocation policy. Creating a copied or generated tree for Codex would make the same skills drift between providers.

Codex uses `.codex-plugin/plugin.json` and discovers repository marketplaces through `.agents/plugins/marketplace.json`. The existing Claude marketplace is named `lucy`. Codex needs a separate marketplace identity so its source and installation state do not collide with the Claude marketplace.

Lucy already defines its SessionStart and Stop hooks in `hooks/hooks.json`. Codex discovers those hooks from the installed plugin, including the compatibility `CLAUDE_PLUGIN_ROOT` variable used by their commands. Codex requires the user to review and trust installed hooks through `/hooks`; a plugin cannot grant that trust itself.

The generic plugin-creator validator rejects Lucy's intentional Claude `disable-model-invocation` frontmatter in shared skills. Codex accepts that frontmatter during marketplace installation, so the generic validator cannot validate this package accurately.

## Decision

- Add a native Codex plugin manifest that points directly to `./skills/`.
- Publish it through the repository marketplace named `lucy-codex`. The plugin remains named `lucy`.
- Keep `hooks/hooks.json` as the single hook definition for both providers, and keep the Claude development installer on the same SessionStart source list. Users inspect and explicitly trust the Codex hooks through `/hooks` after installation.
- Keep fresh workers free of controller history. The Codex adapter uses `fork_turns: "none"` for fresh agents and native follow-ups for fix rounds.
- Treat `node scripts/validate-codex-plugin.mjs` as the static package check. It validates the manifest, marketplace, shared invocation policy, full hook contract, and active portable instructions. Treat Codex marketplace installation as the canonical integration validation because it accepts the intentional cross-provider frontmatter.

## Consequences

- Claude Code and Codex load the same shipped skills, so promotion remains a move into `skills/` and no overlay needs maintenance.
- The two marketplaces have distinct names. Codex installs use `lucy@lucy-codex`; Claude Code installs use `lucy@lucy`.
- Codex hook execution remains gated by user trust. Documentation must not imply that installing or updating Lucy trusts hooks automatically.
- Changes to the Codex manifest or marketplace require the repository validator. A generic plugin-creator validation failure for the shared Claude frontmatter does not make the Codex package invalid.
