---
name: handoff
description: Compact this conversation into a handoff document for the next session; optionally spawn it.
argument-hint: "[what the next session is for]"
disable-model-invocation: true
---

# Handoff

Write a handoff document so a fresh session can continue this work without the conversation. Call the Skill tool with "writing-for-agents" first: the document is a brief for an agent.

## Write

Include: the goal and where the work stands; what was decided and why, one line each; what comes next, as an ordered list; the exact files, commits, specs, plans, and ledgers to read, by path or URL, without repeating their content; open questions for the user; and a "suggested skills" list naming the Lucy skills the next session should call. If the user passed an argument, treat it as the next session's focus and shape the document around it.

Redact secrets, keys, tokens, and personal data.

Inside a repository, save to .lucy/handoffs/<YYYY-MM-DD>-<slug>.md and copy it to .lucy/handoffs/latest.md. Outside a repository, save to the OS temporary directory and print the path.

Done when the file exists and a reader with only the file could start the next step.

## Offer to spawn

Ask one question: open the next session yourself, or spawn a background agent seeded with this document? If the user chooses spawn and `claude --help` lists a `--bg` flag, run `claude --bg --name "<short descriptive name>" "Read <handoff path> and continue the work it describes."` from the current directory and tell the user the agent appears under `claude agents`. If the flag is not available, print the exact command to start a new session and point it at the file.
