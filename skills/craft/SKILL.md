---
name: craft
description: "Use when building or changing a form, input flow, data table, or details page in any UI stack: detect the library, map the data model, pick real components, prove it with inspect."
---

# Craft

Craft holds playbooks for implementation areas where agents reliably cut corners. A playbook is a procedure plus reference files in this skill's directory. Every playbook starts with the two steps below, then continues in its own file.

## 1. Detect the stack

Run the inspect skill's stack command from the project directory you are changing:

    node <this skill's directory>/../inspect/scripts/scan.mjs --stack

It prints the UI library with its base or platform, the form library, the validation library with versions, the table engine with its major version, the router with its major version, the data layer, the URL-state library, the virtualizer, the installed shadcn components, and the vendor tools the project configures. In a monorepo, run it from the package that holds the code.

When it reports `ui: none` but the code imports a UI library, name that library yourself and follow the playbook without a stack note.

Done when you can state the stack in one line, for example "shadcn on Radix, React Hook Form 7, Zod 4, web" or "shadcn on Radix, TanStack Table 9, TanStack Query 5, nuqs, web" or "shadcn on Radix, Next 16, TanStack Query 5.105, nuqs, web".

## 2. Inventory the components

Ask the library what it offers before writing a field. The vendor tools are the source of truth for component APIs:

- shadcn/ui: `npx shadcn@latest info --json` for installed components, base, and aliases, and `npx shadcn@latest docs <component>` for documentation and example URLs. When the `shadcn` skill is available, invoke it through the host's skill mechanism.
- HeroUI web and HeroUI Native: the HeroUI MCP tools `list_components` and `get_component_docs` when your tool list has them. When a HeroUI skill for the package is available, invoke it through the host's skill mechanism.
- TanStack Table: when `node_modules/@tanstack/table-core/skills/` exists, read the skill files for the features you use; they match the installed version. Otherwise read the installed type definitions under `node_modules/@tanstack/table-core/dist/`.
- AG Grid: the AG Grid MCP tools when your tool list has them, otherwise the AG Grid documentation for the installed major.
- Routers: the documentation for the installed major; for TanStack Router and React Router also the installed type definitions; for Expo Router the docs for the installed SDK.
- With no vendor tool: read the installed component files and the package's type definitions.

A component the form needs and the project lacks comes from the same library, for example `npx shadcn@latest add calendar popover`, or you ask the user. The form or table is built from that library's components only: no raw HTML stand-in (such as a clickable div where a button or the library's choice component belongs), no second UI library.

Done when every control the form or table needs maps to a component that exists or that you will add, and you have said which vendor tool you used or that none was available.

## 3. Follow the playbook

| Task | Playbook |
|---|---|
| Building or changing a form, a wizard, or any input flow | [forms.md](forms.md) |
| Building or changing a data table, or a static table | [tables.md](tables.md) |
| Building or changing the page for one record: a details page, show page, record page, or its peek | [details.md](details.md) |

Each playbook ends with a proof step that invokes inspect.
