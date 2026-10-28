---
description: Products table where an integer column has no stated meaning.
tags: [craft-tables]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a products table at app/products/page.tsx for the Product model in db/schema.ts. Load rows from GET /api/products, which returns { rows, total }.
