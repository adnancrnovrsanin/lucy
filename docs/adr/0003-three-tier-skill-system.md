# 0003: Lucy replaces superpowers with a three-tier skill system

Date: 2026-08-27
Status: accepted

## Context

Lucy's process discipline came from the superpowers plugin (obra/superpowers 6.3.0, installed from claude-plugins-official): a SessionStart hook injecting using-superpowers into every session plus 14 model-invoked skills. mattpocock/skills (commit 6654f6b) was evaluated as a second source and overlaps superpowers on design interviews, TDD, debugging, and code review. Both are MIT.

Three facts, verified against the Claude Code skills documentation on 2026-08-27, shape the decision. Claude Code loads the name and description of every model-invocable skill into context; that listing has a budget of 1% of the context window; on overflow, descriptions are shortened and then dropped starting with the least-invoked skills, which silently breaks triggering. A skill with disable-model-invocation: true is removed from the model's context entirely and loads only when the user types its name. The dev machine already carries more than 50 skills, so adding both corpora as model-invoked skills would deepen the overflow, and two skills on one trigger would fire nondeterministically. superpowers is also read-only and updates on its own schedule, while Adnan wants skills he can edit under this repo's rules.

## Decision

- superpowers is retired. Lucy rebuilds every capability Adnan uses from it, merged with mattpocock/skills where the two overlap, one skill per concern. The plugin is uninstalled only after Lucy's replacements pass validation, so that two hooks and two skill sets never run together.
- Skills are organised in three tiers by standing context cost. Tier 1 is the constitution, skills/using-lucy/SKILL.md, injected by Lucy's SessionStart hook on startup, clear, and compact, under 60 lines, carrying the skills-first rule, the gates, and the mode map. Tier 2 is the model-invoked core, at most 13 skills, the only descriptions in the model's listing. Tier 3 is everything else: user-invoked skills (disable-model-invocation: true) and reference files reached by pointers.
- User-invoked is the default. A skill enters tier 2 only if the model must apply it without being asked, or another skill calls it mid-flow through the Skill tool. The justification is recorded in the skill's provenance note.
- Gates live in the constitution as single lines, not as skill descriptions.
- Skill names are short, and never collide with a skill Claude Code already exposes on this machine (design, review, code-review, debug, security-review, simplify, init, run, loop, and schedule at the time of writing), because the dev machine loads Lucy's skills un-namespaced from ~/.claude/skills.
- Every skill ships agents/openai.yaml beside SKILL.md, kept in sync with disable-model-invocation, for the Codex track.
- Vendored and merged skills keep every applicable license; a merged skill also carries PROVENANCE.md naming each source's repo, path, and commit or version.

The full skill map and the merge notes are in docs/superpowers/specs/2026-08-27-lucy-skill-system-design.md.

## Consequences

- Standing context cost has a ceiling: one short injection plus 13 descriptions, measured with the Skills row of /context against the superpowers baseline recorded before the build.
- The model can only reach tier 2 skills on its own. A flow the user forgets to type does not run; the constitution's gates exist to suggest it.
- Lucy owns its process text. Upstream improvements arrive only when someone diffs against upstream and ports them by hand.
- If the SessionStart hook fails, no constitution loads and nothing fails loudly; /using-lucy reloads it by hand.
