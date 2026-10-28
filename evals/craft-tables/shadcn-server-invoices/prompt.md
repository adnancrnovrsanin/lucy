---
description: Server-side invoices table on shadcn/ui from a Prisma model.
tags: [craft-tables]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a server-side invoices table at app/invoices/page.tsx for the Invoice model, with sorting, filtering, and pagination against GET /api/invoices. Keep the column definitions in app/invoices/columns.tsx and the table component in app/invoices/invoices-table.tsx. I approve in advance whatever design and plan you propose, including any field table, table plan, or page plan: show it, then build without waiting for me.
