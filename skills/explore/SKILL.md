---
name: explore
description: "Explore mode: understand a codebase or technology without changing it; writes notes to .lucy/notes/."
argument-hint: "[what to explore]"
disable-model-invocation: true
---

# Explore

This session is for understanding, not changing. Two shapes share one rule: a codebase tour that produces a map, and a technology or design-space investigation that produces cited notes.

## The rule

Explore never edits source files, configuration, or documentation in the project. It writes only under .lucy/notes/ (or the OS temporary directory outside a repository). If the user asks for a change mid-session, say that explore is read-only and suggest leaving the mode.

## Codebase tour

1. Name the question the tour answers: how does X flow, where does Y live, what would Z touch.
2. When graphify-out/ exists in the project, query it first; otherwise dispatch sub-agents for the legwork and keep your own context for the synthesis. Call the Skill tool with "writing-for-agents" before dispatching.
3. Write the map to .lucy/notes/<YYYY-MM-DD>-<slug>.md: the entry points, the modules and their seams (call the Skill tool with "codebase-design" for the vocabulary), the data flow for the question asked, and the surprises. Cite file paths with line numbers for every claim.

## Investigation

1. Name the question and the decision waiting on it.
2. Read primary sources: official documentation, source code, specifications, first-party APIs. Follow every claim back to the source that owns it. Dispatch sub-agents for parallel reading.
3. Write the notes to .lucy/notes/<YYYY-MM-DD>-<slug>.md: the answer first, then the evidence with one citation per claim (URL or path, with the date accessed), then what remains unknown.

Done when the file exists, every claim carries a citation, and the user can make the decision that motivated the question. Tell the user that /promote moves the notes into the project's documentation when they are worth keeping.
