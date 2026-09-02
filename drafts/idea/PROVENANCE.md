# Provenance

Authored for Lucy on 2026-09-02.

## Shapes borrowed

No text copied. Four skills from https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, gave this mode its shape.

- skills/productivity/grill-me: the stateless interview. The whole skill is one Skill tool call to grilling with no workspace, so state lives in the conversation. Step 2 of Run keeps that: grilling is reached through the Skill tool, and no file is written unless the user asks.
- skills/engineering/prototype: the throwaway rules. A prototype answers one question, is a single HTML file for a logic question or a small set of UI variations for a look question, is labeled throwaway, stays off any main branch, and is kept as a source once its answer is folded back. Step 3 of Run restates those rules in four clauses; the full skill is second wave.
- skills/in-progress/loop-me and skills/in-progress/writing-fragments: the NOTES.md workspace. loop-me keeps NOTES.md for the user's world, tools, and terminology and sharpens fuzzy terms into canonical ones as they surface; writing-fragments appends to one file from the first message and asks once where to save when no path was given. The Workspace section takes the NOTES.md contents and the append-only rule, and creates the directory only when the user asks for one, at .lucy/ideas/<slug>/ inside a repository or the directory the user names outside one.

## Tier

user-invoked (tier 3): a mode the user enters by typing /idea.
