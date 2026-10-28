@../AGENTS.md

This file is a pointer, not a rulebook. Every rule for this repo lives in AGENTS.md at the repo root, which the import above pulls into context, because Claude Code reads CLAUDE.md and does not discover AGENTS.md on its own. It sits in .claude/ rather than the repo root so the plugin validator, which treats the repo root as the plugin, does not warn about it (ADR-0010). Add rules to AGENTS.md, never here.
