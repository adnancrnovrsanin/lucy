# 0002: AGENTS.md is the single source of agent instructions

Date: 2026-08-26
Status: accepted

## Context

Lucy targets three harnesses: Claude Code today, Codex and OpenCode later. Each reads a different instruction file. A separate rules file per harness would mean three copies of the same invariants drifting apart, which is the failure this repo exists to prevent.

AGENTS.md is the cross-tool convention, read natively by Codex and OpenCode. Claude Code does not read it. Verified on 2026-08-26 against Claude Code 2.1.246 in two independent ways: the official memory documentation states that Claude Code reads CLAUDE.md and not AGENTS.md, and a string search of the shipped binary found AGENTS.md only inside the Codex config importer and Codex detection, never in project-document discovery. Claude Code does support importing another file with the @path syntax, which inlines the target at session start, resolves relative to the importing file, allows up to four hops, and ignores imports that appear inside code spans or fenced blocks. The documentation names a thin CLAUDE.md importing AGENTS.md as the pattern for repos serving several harnesses.

A probe in a scratch clone showed that claude plugin validate warns about CLAUDE.md at the plugin root whenever the file exists, and never warns about AGENTS.md.

## Decision

- AGENTS.md holds every rule for working in this repo.
- CLAUDE.md is a pointer: an @AGENTS.md import plus a note not to edit it. Provider files added later follow the same shape, or are omitted entirely where the harness reads AGENTS.md directly.
- Rules are not split by harness. An instruction such as "validate both manifests after touching .claude-plugin/" is repo workflow binding whoever works here, not Claude-specific content, so it lives in AGENTS.md like everything else.

## Consequences

- One file to edit, and no drift between harnesses. Adding a harness means adding a pointer, not a second copy of the rules.
- Claude Code depends on that import line. Deleting or renaming AGENTS.md would silently strip every rule from Claude's context, and nothing would fail loudly. Treat the pair as one unit.
- The plugin validator keeps warning about CLAUDE.md at the plugin root, because the file exists at all, even at two lines. That warning stays accepted for the reason recorded in AGENTS.md.
- The foundation spec (docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md) describes CLAUDE.md as the rules file. It stays as written, a record of what was decided on the day. This ADR supersedes it on that point.
