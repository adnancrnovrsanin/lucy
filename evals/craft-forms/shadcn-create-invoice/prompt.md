---
description: Create-invoice form on shadcn/ui from a Prisma model.
tags: [craft-forms]
runs: 1
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---
Add a form to create an invoice at app/invoices/new/page.tsx for the Invoice model in prisma/schema.prisma. Customers can be searched through GET /api/customers?q=. I approve whatever field table you propose, so show it and then build the form without waiting for me.
