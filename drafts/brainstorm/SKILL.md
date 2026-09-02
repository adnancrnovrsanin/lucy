---
name: brainstorm
description: "Turn an idea into an approved design: classify, interview in rounds, write the spec to .lucy/specs/."
disable-model-invocation: true
argument-hint: "[the idea]"
---

# Brainstorm

Turn ideas into fully formed designs and specs through dialogue with the user. Start by classifying how much process the request needs, then work through that path: understand the context, refine the idea, present a design, and get the user's approval.

Do not invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have told the user what you intend and they have approved it. The ceremony scales with the task; the approval gate never does.

## Three paths

Before your first question, classify the request and say the classification out loud, for example "this looks bounded, so I'll present a short design here rather than write a spec", so the user can override it.

- **Spike.** A feasibility question ("can we...", "is it possible...", "quick and dirty is fine") whose output is an answer, not code you keep. Present the question and what you will try in two or three sentences, get a nod, then find out as cheaply as correctness allows. No design doc, no spec file. Report findings as a recommendation; anything you built stays labeled throwaway.
- **Bounded.** A well-scoped change to code that already exists in this repo: a new flag, a small endpoint, a one-file fix. Understanding the kind of app is not enough; bounded means the flow you are changing is already here to read. If there is no existing flow to change, the task is not bounded. Ask the clarifying questions that matter, present a short design in chat, a few sentences to a few short paragraphs, and stop. Implementation starts only after the user says yes to that design. A bounded task's approval is as hard a gate as an architectural one. No spec file, no implementation plan document.
- **Architectural.** New projects, new subsystems, changes that restructure how components fit together or alter interfaces others depend on. Follow the full process: questions, approaches, sectioned design, written spec, then /plan.

When in doubt between two paths, take the heavier one. The path moves in one direction only. Hidden complexity discovered mid-task upgrades it: stop, say so, and step up. Nothing downgrades mid-task.

**The "too simple to need approval" anti-pattern.** Every path ends with the user approving your intent before implementation. A todo list, a single-function utility, a config change: the design may be two sentences in chat, but you must present it and get approval. "Simple" tasks are where unexamined assumptions cause the most wasted work. What scales with simplicity is the artifact, never the approval.

Red flags, and what is true instead:

| Thought | Reality |
|---------|---------|
| "This is too simple to need a design" | Simple means a short design, not no design. Two sentences in chat, then approval. |
| "I'll call it bounded and skip the spec" | Reaching for a label to skip work is the doubt. Take the heavier path. |
| "I understand this kind of app, so it's bounded" | Bounded measures the repo, not your familiarity. A new project has no existing flow; it is architectural. |
| "The spike works, so I'll keep the code" | A spike's output is an answer. Keeping the code is a new request; classify it. |
| "It grew, but I'm almost done" | Hidden complexity upgrades the path mid-task. Stop and say so. |

## The interview

Call the Skill tool with "grilling" for every question round: number the questions, attach a recommended answer to each, ask the whole frontier at once, and find facts yourself before asking the user for decisions. On the architectural path also call the Skill tool with "domain-modeling", so terms sharpen and CONTEXT.md and ADRs update as decisions land.

Before the first round:

- Check the current project state first: files, docs, recent commits.
- Assess scope before asking detailed questions. If the request describes multiple independent subsystems, for example "build a platform with chat, file storage, billing, and analytics", flag this immediately. Do not spend questions refining details of a project that needs to be decomposed first.
- If the project is too large for a single spec, help the user decompose it into sub-projects: what the independent pieces are, how they relate, and in what order to build them. Then brainstorm the first sub-project through the normal design flow. Each sub-project gets its own spec, plan, and implementation cycle.

The rounds aim at purpose, constraints, and success criteria.

## Checklists

Classify first, announce the path, then create a task for each item on your path and complete them in order.

Spike:

1. Explore project context, enough to frame the probe.
2. Present the question and the probe plan in two or three sentences.
3. Get approval. A nod is enough.
4. Investigate, as cheaply as correctness allows.
5. Report findings as a recommendation. Label anything built as throwaway.

Bounded:

1. Explore project context: files, docs, recent commits.
2. Ask the clarifying questions that matter, in grilling rounds.
3. Present a short design in chat: approach, files touched, testing.
4. Get approval. Stop and wait for an explicit yes; presenting the design and starting in the same breath is skipping the gate.
5. Implement through the normal development flow; tdd applies; no plan document.

Architectural:

1. Explore project context: files, docs, recent commits.
2. Interview, through grilling plus domain-modeling as described above.
3. Propose two or three approaches with trade-offs and a recommendation.
4. Present the design in sections and confirm each with the user.
5. Write the spec to `.lucy/specs/<YYYY-MM-DD>-<slug>.md` from `spec-template.md` in this skill's directory.
6. Spec self-review.
7. User review gate.
8. Tell the user to run `/plan <spec path>`. Brainstorm never invokes plan.

## Exploring approaches

- Propose two or three different approaches with trade-offs.
- Present the options conversationally, with your recommendation and reasoning.
- Lead with your recommended option and explain why.
- Apply YAGNI to every approach and design: remove every feature the goal does not need.

## Presenting the design

- Once you believe you understand what you are building, present the design.
- Scale each section to its complexity: a few sentences if straightforward, up to 200 to 300 words if nuanced.
- Ask after each section whether it looks right so far.
- Cover architecture, components, data flow, error handling, and testing.
- Be ready to go back and clarify if something does not make sense.

For module shape, seams, and testability, call the Skill tool with "codebase-design" and use its vocabulary in the design.

## Working in existing codebases

- Explore the current structure before proposing changes. Follow existing patterns.
- Where existing code has problems that affect the work, for example a file that has grown too large, unclear boundaries, or tangled responsibilities, include targeted improvements as part of the design, the way a good developer improves code they are working in.
- Do not propose unrelated refactoring. Stay focused on what serves the current goal.

## After the design

Architectural path only. Write the validated design to `.lucy/specs/<YYYY-MM-DD>-<slug>.md`, following `spec-template.md`. Before the first write into `.lucy/`, run `git check-ignore -q .lucy/`; if the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit. The spec itself is never committed. It stays in `.lucy/specs/` through the build, where plan and execute read it; say so when the user approves it. After finish, the user runs /promote to move the spec, corrected to what was built, into the project's documentation.

Spec self-review. Look at the written spec with fresh eyes:

1. Placeholder scan. Any "TBD", "TODO", incomplete sections, vague requirements, or open questions still listed? Fix them; an open question goes back to the user in a grilling round.
2. Internal consistency. Do any sections contradict each other? Does the architecture match the feature descriptions?
3. Scope check. Is this focused enough for a single implementation plan, or does it need decomposition?
4. Ambiguity check. Could any requirement be read two different ways? If so, pick one and make it explicit.

Fix every issue inline, then move on without a second review.

User review gate. Ask the user to review the written spec:

> Spec written to <path>. Review it and tell me what to change before we plan the implementation.

Wait for the answer. If they request changes, make them and repeat the self-review. Once the user approves, set the spec's Status line to approved with how and when, then tell the user to run `/plan <path>`. Brainstorm never invokes plan.
