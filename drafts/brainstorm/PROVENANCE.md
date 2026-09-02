# Provenance

Merged skill.

## https://github.com/obra/superpowers, version 6.3.0 (Claude Code plugin cache copy, claude-plugins-official), path skills/brainstorming

Taken: the overview and the hard gate; the three paths with the one-way upgrade rule; the "too simple to need approval" anti-pattern and five rows of the red flags table; the per-path checklists; exploring approaches; presenting the design; working in existing codebases; after the design, with the spec self-review and the user review gate.
Changed: the interview replaced by grilling and domain-modeling through the Skill tool, which removes the one-question-per-message rule and the bullets on question form; the visual companion section, visual-companion.md, spec-document-reviewer-prompt.md, and scripts/ dropped; the dot process graph, the terminal-states paragraph, and the elements-of-style pointer dropped; the design-for-isolation bullets replaced by a pointer to codebase-design; the spec path moved from docs/superpowers/specs/ to .lucy/specs/, with no commit of the spec, a git check-ignore step from ADR-0005, and promotion by /promote after finish; the handoff to writing-plans became "tell the user to run /plan"; "your human partner" became "the user"; em dashes, curly quotes, Title Case headings, and the HARD-GATE tags rewritten as plain prose.

## https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, paths skills/productivity/grill-me, skills/engineering/grill-with-docs, skills/engineering/to-spec

Taken: the interview through grilling (grill-me) and through grilling plus domain-modeling (grill-with-docs); the spec sections from to-spec: problem statement, solution, user stories, implementation decisions with the no-paths-no-code rule and its prototype exception, testing decisions, out of scope.
Changed: merged into spec-template.md together with superpowers' coverage list (architecture, components, data flow, error handling, testing) as an architecture section; "Further notes" became "Open questions" with the rule that it is empty before approval; a title, date, and status header added; the issue tracker publishing, the triage label, the setup pointer, and the no-interview rule dropped, since brainstorm interviews.

## Tier

user-invoked (tier 3): typed by the user; the constitution suggests it when a build request has no approved design.
