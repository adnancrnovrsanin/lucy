# Lucy

Lucy is my personal plugin system: the home of my own skills, hooks, and agents. It supports Claude Code and Codex. An OpenCode version is planned and will use that host's native capabilities.

Lucy replaces the superpowers plugin. Its skills are merged from superpowers 6.3.0, mattpocock/skills, and Leonxlnx/unlazy (all MIT, provenance in every skill directory) and adapted to my workflow. The design is in docs/superpowers/specs/2026-08-27-lucy-skill-system-design.md and docs/adr/.

## How it is organised

- The constitution (skills/using-lucy) is injected into every session by a SessionStart hook: the skills-first rule, the gates, the mode map.
- Fourteen model-invoked skills are the only ones in the model's listing: tdd, diagnose, verify, writing-for-agents, review-feedback, grilling, domain-modeling, codebase-design, review-changes, worktree, finish, resolve-conflicts, unslop, unlazy.
- The remaining user-invoked skills are brainstorm, plan, execute, promote, handoff, wizard, idea, explore, teach, and lucy.
- Flows write under .lucy/ in the project (specs, plans, runs, notes, handoffs, ideas, gates). Only promote moves anything into the project's own files. unlazy's Stop hook keeps a session from ending while gates are unmet.

## Claude Code development machine

Clone, link every shipped and draft skill into ~/.claude/skills as symlinks, and wire the two hooks into ~/.claude/settings.json:

```bash
scripts/link-skills.sh
node scripts/install-dev-hooks.mjs
```

A git pull keeps skills current. New skills start in drafts/ (linked locally, not shipped) and pass scripts/check-skill.sh before moving into skills/. Retired skills go to deprecated/. List everything with scripts/list-skills.sh. Remove the hooks with `node scripts/install-dev-hooks.mjs --uninstall`. Do not also install the Claude Code plugin on this machine, because the symlinks would load every skill twice.

## Claude Code installation

```
/plugin marketplace add adnancrnovrsanin/lucy
/plugin install lucy@lucy
```

Skills arrive namespaced, for example /lucy:brainstorm, and the hooks come with the plugin. The unlazy checker and the Stop hook need Node 16 or newer.

## Codex installation

For a local checkout, add its marketplace and install Lucy:

```bash
codex plugin marketplace add /absolute/path/to/lucy
codex plugin add lucy@lucy-codex
```

For another machine, add the remote marketplace and install it:

```bash
codex plugin marketplace add adnancrnovrsanin/lucy
codex plugin add lucy@lucy-codex
```

After a remote update, refresh the marketplace, then reinstall the plugin:

```bash
codex plugin marketplace upgrade lucy-codex
codex plugin remove lucy@lucy-codex
codex plugin add lucy@lucy-codex
```

For a local checkout, rerun the remove and add commands after changing the plugin. Open `/hooks`, inspect Lucy's hook commands, and explicitly trust them only when they point to the expected files. Installing Lucy does not trust hooks automatically.

Invoke a Lucy skill in Codex with its plugin-qualified selector, for example `$lucy:brainstorm`.

## Layout

- AGENTS.md: the rules for working in this repo, for any agent. CLAUDE.md only imports it.
- .claude-plugin/: Claude Code plugin and marketplace manifests
- .codex-plugin/: Codex plugin manifest
- .agents/plugins/marketplace.json: Codex marketplace manifest
- hooks/: hooks.json, session-start
- skills/: shipped skills, flat, one directory each with SKILL.md, agents/openai.yaml, PROVENANCE.md, and LICENSE where vendored
- drafts/: work in progress, never shipped
- deprecated/: retired, neither linked nor shipped
- scripts/: link-skills.sh, list-skills.sh, check-prose.sh, check-skill.sh, install-dev-hooks.mjs, validate-codex-plugin.mjs
- docs/: ADRs and design specs
