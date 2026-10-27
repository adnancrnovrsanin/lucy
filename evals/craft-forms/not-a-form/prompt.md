---
description: Non-form task; craft must not fire.
tags: [craft-forms]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a formatBytes(bytes: number) helper to lib/format.ts that returns a human-readable size such as "1.5 MB", with a unit test.
