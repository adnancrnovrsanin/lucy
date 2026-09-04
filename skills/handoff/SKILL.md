---
name: handoff
description: "Compact this conversation into a handoff document for the next session; optionally spawn it."
argument-hint: "[what the next session is for]"
disable-model-invocation: true
---

# Handoff

Write a handoff document so a fresh session can continue this work without the conversation. Invoke `writing-for-agents` through the host's skill mechanism first: the document is a brief for an agent.

## Write

Include: the goal and where the work stands; what was decided and why, one line each; what comes next, as an ordered list; the exact files, commits, specs, plans, and ledgers to read, by path or URL, without repeating their content; open questions for the user; and a "suggested skills" list naming the Lucy skills the next session should call. If the user passed an argument, treat it as the next session's focus and shape the document around it.

Redact secrets, keys, tokens, and personal data.

Inside a repository, save to .lucy/handoffs/<YYYY-MM-DD>-<slug>.md and copy it to .lucy/handoffs/latest.md. Outside a repository, save to the OS temporary directory and print the path.

Before the first write under .lucy/ in a project, run `git check-ignore -q .lucy`. If the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit; .lucy/ is process state and never enters the repository.

Done when the file exists and a reader with only the file could start the next step.

## Offer to spawn

Ask one question: should the user open the next session themselves, or should the host create a native background task seeded with this document? If the user chooses a background task and the host exposes a native task or subagent mechanism, create it from the current directory with the prompt `Read <handoff path> and continue the work it describes.` and tell the user where it appears. If the host has no such mechanism, print that exact prompt and tell the user to begin a new session with it.
