---
description: Non-table task; craft must not fire.
tags: [craft-tables]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Write a function in lib/format.ts that formats a byte count as B, KB, or MB.
