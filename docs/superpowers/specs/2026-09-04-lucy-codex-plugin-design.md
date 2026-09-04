# Lucy native Codex plugin design

Date: 2026-09-04
Status: approved in the current Codex task

## Goal

Make Lucy available as a native, installable Codex plugin while keeping the
existing Claude Code plugin and its shipped skills intact.

## Context

Lucy already keeps every shipped skill in `skills/`, and every skill has an
`agents/openai.yaml` file that records its Codex invocation policy. The Claude
Code package uses `.claude-plugin/`. Codex packages use
`.codex-plugin/plugin.json` and can be offered through a repository-local
`.agents/plugins/marketplace.json`.

An integration probe verified that Codex accepts the existing shared skills,
including Claude's `disable-model-invocation` frontmatter. The generic plugin
creator validator rejects that intentional cross-provider metadata, so it is
not the validation authority for this repository. Codex's own marketplace and
plugin commands are the integration check.

## Decision

- Add `.codex-plugin/plugin.json` for a plugin named `lucy`, version `0.2.0`,
  with `skills` set to `./skills/`.
- Add `.agents/plugins/marketplace.json` with the distinct marketplace name
  `lucy-codex`. It offers `lucy` from the repository root through source
  `./`.
- Reuse `skills/` directly. Do not create a generated Codex copy or change
  shared skill frontmatter solely for Codex.
- Keep `hooks/hooks.json` as the single hook definition. Codex discovers that
  file from an installed plugin and supports its compatibility
  `CLAUDE_PLUGIN_ROOT` variable. Include `resume` in the SessionStart matcher
  so the constitution reaches resumed tasks too. Keep the Claude development
  installer on the same SessionStart source list.
- Make live workflow instructions provider-neutral. Shared skills say to
  invoke or load another skill through the host's skill mechanism instead of
  naming a Claude-only tool or slash command. User-facing examples live in the
  host-specific README sections.
- Replace the handoff skill's `claude --bg` command with a host-native
  background-task path and a portable fallback prompt.
- Add a dependency-free Node validation script and regression test that check
  Lucy's Codex manifest, marketplace mapping, complete hook contract, shared
  skill policy pairing, active support documents, Codex fresh-agent adapter,
  and absence of retired hard Claude instructions.
- Document Claude and Codex installation paths separately. Codex users trust
  the installed hooks through `/hooks`; this is an explicit security action,
  not something the package can silently enable.

## Non-goals

- This change does not add an OpenCode package.
- This change does not rename skills, change their tier policy, or duplicate
  `skills/`.
- This change does not install Lucy's Claude Code plugin on the development
  machine, which already uses Claude symlinks.
- This change does not make hook trust automatic.

## Acceptance criteria

- `node tests/codex-plugin.test.mjs` passes.
- `node scripts/validate-codex-plugin.mjs` passes.
- `scripts/check-skill.sh skills/*` passes after the wording changes.
- The hook smoke tests in `AGENTS.md` pass after the matcher changes.
- The validator rejects a mismatched `agents/openai.yaml`, a broken hook
  handler, and a provider-specific command in an active support document.
- Codex can add the local marketplace, list `lucy`, and install it from that
  marketplace.
- README and `AGENTS.md` describe the supported installation and validation
  path, including `$lucy:brainstorm` as a Codex invocation example, without
  provider-specific instructions in shared skills.
- An ADR records why Codex shares `skills/` rather than using an overlay.
