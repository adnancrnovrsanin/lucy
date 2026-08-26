# Lucy

Lucy is my personal plugin system: the home of my own skills, commands, hooks, and agents. It ships as a Claude Code plugin today; Codex and OpenCode versions come later and will use each provider's native capabilities.

## Dev machine

Clone, then link every shipped and draft skill into ~/.claude/skills as symlinks:

```bash
scripts/link-skills.sh
```

A git pull is enough to keep them current. New skills start in drafts/ (linked locally, not shipped). Moving a skill's directory into skills/ ships it. Retired skills go to deprecated/. List everything with scripts/list-skills.sh.

## Other machines

```
/plugin marketplace add adnancrnovrsanin/lucy
/plugin install lucy@lucy
```

Skills arrive namespaced, for example /lucy:unslop. Never install the plugin on a machine that already uses the symlinks; every skill would load twice.

## Layout

- .claude-plugin/: plugin and marketplace manifests
- skills/: shipped skills, flat
- drafts/: work in progress, never shipped
- deprecated/: retired, neither linked nor shipped
- scripts/: link-skills.sh, list-skills.sh
- docs/: ADRs and design specs
