# Provenance

Authored for Lucy on 2026-09-02.

## Shapes borrowed

No text copied. Two skills gave the constitution its shape.

- https://github.com/obra/superpowers, version 6.3.0 (Claude Code plugin cache copy, claude-plugins-official), path skills/using-superpowers: the bootstrap document. One short skill, injected by a SessionStart hook into every session and readable again by typing its name, carries the skills-first rule: check for an applicable skill before any response or action, invoke it through the Skill tool, and let process skills run before implementation skills. Lucy keeps that shape and drops the shouting, the red-flag table, and the announce line. The gates that superpowers spread across skill descriptions live here as one line each.
- https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, path skills/engineering/ask-matt: the map. A user-invoked router that names every flow and says which situation it fits. The constitution borrows only the idea of a single place to look; the map itself is the lucy skill, and the Where to look section points at it.

## Tier

user-invoked (tier 3): injected by the SessionStart hook; typed by the user only to reload.
