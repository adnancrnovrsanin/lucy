---
name: idea
description: "Ideation mode: sharpen an idea before a repo exists."
argument-hint: "[the idea]"
disable-model-invocation: true
---

# Idea

This session is for sharpening an idea that has no repository yet: a product, a feature for a project not started, a talk, a course. Nothing gets built here.

## Run

1. Restate the idea in two sentences and name the decision this session should reach: a brief to carry into `brainstorm`, a go or no-go, a scope.
2. Invoke `grilling` through the host's skill mechanism and work the design tree in rounds until the frontier is empty. Facts are yours to find; decisions are the user's.
3. When a question needs a runnable answer (does this state model hold, what should this look like), build a throwaway prototype: a single HTML file for logic, or the smallest set of UI variations, labeled as throwaway and kept out of any main branch. Fold the answer back into the idea; the prototype is a source, not a deliverable.
4. End with an idea brief: the problem, who it is for, the shape of the solution, decisions taken, open questions, and the recommended next step.

Done when the brief exists and the user has accepted it.

## Workspace

State lives in the conversation unless the user asks for a workspace. When asked: inside a repository use .lucy/ideas/<slug>/; outside one, use the directory the user names. The workspace holds NOTES.md (the user's world, tools, and terminology, sharpened into canonical terms as they surface) and the brief. Append to NOTES.md as facts land; never rewrite its history.

Before the first write under .lucy/ in a project, run `git check-ignore -q .lucy`. If the directory is not ignored, append `.lucy/` to .gitignore and propose that one-line commit; .lucy/ is process state and never enters the repository.
