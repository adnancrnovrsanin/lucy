---
description: Small sign-in form on shadcn/ui.
tags: [craft-forms]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a sign-in form at app/login/page.tsx using lib/auth-schema.ts. Call signIn(values) from lib/auth.ts, which you may stub.
