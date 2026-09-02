# 0004: Development is the default state; idea, explore, and teach are modes

Date: 2026-08-27
Status: accepted

## Context

Adnan uses agent sessions for more than writing code: sharpening ideas before a repo exists, understanding unfamiliar codebases and technologies, and learning topics over weeks. One plugin serving all of these must not load every purpose's tooling into every session, because of the context budget recorded in ADR-0003. Matt Pocock's teach skill showed the shape of a non-development activity with its own stateful workspace, and raised the question of how Lucy should switch between purposes: by the model recognising the activity, or by the user declaring it.

## Decision

- Development is the default state of a session. There is no /dev. Brainstorm, plan, execute, diagnose, review, finish, promote, and handoff are flows inside it.
- Three modes change what a session is for: /idea (ideation before a repo exists; a workspace only on request), /explore (understanding without changing; it never edits source files and writes cited notes and maps), and /teach (learning in a stateful workspace, vendored from mattpocock/skills).
- A mode is a user-invoked skill. Its body sets the session's purpose and names the model-invoked skills it relies on. Modes stay inline, without context: fork, in the first version.
- The user's typed command is the primary switch. The constitution carries a mode map of one line per mode and may suggest a mode once when a session clearly looks like one. Automatic detection through a UserPromptSubmit hook is deferred.
- A new mode is added only for a purpose with its own state or its own invariant, never for a variation of development.

## Consequences

- The always-on cost of modes is three lines in the constitution.
- A session in the wrong mode is a one-command fix, and a mode the model fails to suggest costs nothing but the user typing it.
- A mode that later needs isolation can adopt context: fork without changing its interface.
