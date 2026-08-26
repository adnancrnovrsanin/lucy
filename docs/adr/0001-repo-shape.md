# 0001: Repo shape for the Claude plugin

Date: 2026-08-26
Status: accepted

## Context

Lucy ships Adnan's own skills, commands, hooks, and agents as a Claude Code plugin, with native Codex and OpenCode versions planned later. The studied reference, mattpocock/skills (commit 6654f6b), keeps lifecycle buckets (in-progress, deprecated) inside skills/ and curates the shipped subset through an explicit skills array in plugin.json. Its ADR-0002 records the cost: Codex plugin manifests accept a single skills path and drop symlinks on install, so a curated subset of a bucketed skills/ tree cannot be expressed, and a native Codex plugin was deferred.

## Decision

- The repo root is the plugin: .claude-plugin/plugin.json at the top, no nested plugins directory. .claude-plugin/marketplace.json makes the repo its own single-plugin marketplace for installs on other machines.
- skills/ holds only shipped skills. Work in progress lives in drafts/ (symlinked locally, never shipped). Retired skills live in deprecated/ (neither linked nor shipped).
- Promotion is by location: moving a directory from drafts/ to skills/ ships it. plugin.json omits the skills field and relies on default ./skills/ discovery, so there is no manifest array to keep in sync.
- skills/ stays flat for now. Categories are deferred until the count justifies them; the options then are an explicit skills array (the pattern mattpocock/skills verified) or verified recursive discovery.
- Versioning is manual: plugin.json carries a version bumped by hand. No changesets, no package.json.

## Consequences

- A future native Codex plugin can point at ./skills/ as its single path with no restructuring.
- Nothing enforces the shipped set beyond location: there is no array to forget, and also no explicit review gate on promotion.
- Renames and moves require re-running scripts/link-skills.sh; the script prunes its own dangling links.
