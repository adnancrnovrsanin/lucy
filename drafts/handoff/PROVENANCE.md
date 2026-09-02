# Provenance

Single source.

## https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, path skills/productivity/handoff and skills/in-progress/claude-handoff

Taken: the content rules shared by both SKILL.md files (a "suggested skills" section, reference specs, plans, commits, and diffs by path or URL instead of repeating them, redact secrets and personal data, treat the argument as the next session's focus) and the background-agent launch from claude-handoff (`claude --bg --name "<name>" "<prompt>"`, run from the current directory, managed with `claude agents`).
Changed: rewritten as one skill with a spawn question at the end instead of two skills; the document is saved to .lucy/handoffs/<YYYY-MM-DD>-<slug>.md and copied to .lucy/handoffs/latest.md inside a repository, with the OS temporary directory kept only for use outside a repository; the required contents of the document are listed explicitly; writing-for-agents is called first; the spawn command runs only when `claude --help` lists `--bg`, and otherwise the skill prints the command for a new session; the description and argument-hint were rewritten; agents/openai.yaml regenerated with the policy block; LICENSE and this file added.

## Tier

user-invoked (tier 3): typed by the user at a session boundary.
