---
description: Create-invoice form on shadcn/ui from a Prisma model.
tags: [craft-forms]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a form to create an invoice at app/invoices/new/page.tsx for the Invoice model in prisma/schema.prisma. Customers can be searched through GET /api/customers?q=. Keep the whole form in that one file. I approve in advance whatever design and plan you propose, including any field table, table plan, or page plan: show it, then build without waiting for me.
