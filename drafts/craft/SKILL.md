---
name: craft
description: "Use when building or changing a form or input flow in any UI stack: detect the library, map the data model, pick real components, prove it with the scan."
---

# Craft

Craft holds playbooks for implementation areas where agents reliably cut corners. A playbook is a procedure plus reference files in this skill's directory. Every playbook starts with the two steps below, then continues in its own file.

## 1. Detect the stack

Run the scan's stack command from the project directory you are changing:

    node <this skill's directory>/scripts/scan.mjs --stack

It prints the UI library with its base or platform, the form library, the validation library with versions, the installed shadcn components, and the vendor tools the project configures. In a monorepo, run it from the package that holds the code.

When it reports `ui: none` but the code imports a UI library, name that library yourself and follow the playbook without a stack note.

Done when you can state the stack in one line, for example "shadcn on Radix, React Hook Form 7, Zod 4, web".

## 2. Inventory the components

Ask the library what it offers before writing a field. The vendor tools are the source of truth for component APIs:

- shadcn/ui: `npx shadcn@latest info --json` for installed components, base, and aliases, and `npx shadcn@latest docs <component>` for documentation and example URLs. When the `shadcn` skill is available, invoke it through the host's skill mechanism.
- HeroUI web and HeroUI Native: the HeroUI MCP tools `list_components` and `get_component_docs` when your tool list has them. When a HeroUI skill for the package is available, invoke it through the host's skill mechanism.
- With no vendor tool: read the installed component files and the package's type definitions.

A component the form needs and the project lacks comes from the same library, for example `npx shadcn@latest add calendar popover`, or you ask the user. The form is built from that library's components only: no raw HTML stand-in, no second UI library.

Done when every control the form needs maps to a component that exists or that you will add, and you have said which vendor tool you used or that none was available.

## 3. Follow the playbook

| Task | Playbook |
|---|---|
| Building or changing a form, a wizard, or any input flow | [forms.md](forms.md) |

Each playbook ends with a proof step that runs the same scan script.
