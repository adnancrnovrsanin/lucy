# Lucy skill system design

Date: 2026-08-27
Status: approved (grill rounds 1 and 2 in chat, 2026-08-27; recorded in ADR-0003, ADR-0004, ADR-0005). Amended 2026-09-02 to add unlazy as a fourth source (ADR-0006).

## Context

Lucy's foundation (spec 2026-08-26, ADR-0001, ADR-0002) is built and validated: the repo root is the plugin, lifecycle lives in drafts/ and deprecated/, a symlink dev loop links skills into ~/.claude/skills, and one skill (unslop) ships. The next step was real content.

While evaluating mattpocock/skills as a vendoring source, the direction widened. On 2026-08-27 Adnan decided to retire the superpowers plugin entirely and make Lucy the process backbone: take the best of both corpora, merge where they overlap, and adapt the result to his own workflow.

Three corpora were studied end to end:

- superpowers 6.3.0 (obra/superpowers, MIT, installed from claude-plugins-official): 14 skills; a SessionStart hook that injects using-superpowers into every session; subagent-driven-development machinery (ledger, task briefs, review packages, fix loops with a breaker, model selection); multi-harness packaging (.codex-plugin, .opencode, .pi, GEMINI.md) and docs/porting-to-a-new-harness.md. Style: discipline and enforcement, iron laws, rationalization tables, hard gates.
- mattpocock/skills at commit 6654f6b (MIT): 25 shipped skills plus misc and in-progress buckets; a user-invoked versus model-invoked split; agents/openai.yaml beside every skill for Codex; per-repo issue-tracker configuration. Style: small composable primitives, leading words, positive instruction, vocabulary references.
- Leonxlnx/unlazy at commit 473d4b8 (MIT), added 2026-09-02: one skill plus zero-dependency Node scripts that make completion machine-checkable. A GATES.md ledger lists observable outcomes; a gate passes only on exit 0 plus an EXPECT match; CHECK lines run only after explicit approval; `--reverify` re-runs met gates; abandonment is a visible handoff; an optional Claude Code Stop hook blocks session end while gates are unmet. Style: fail-closed tooling, dense vocabulary (leaf, node, wave, lease, oracle, scope).

The three are complementary. superpowers supplies the process spine and the machinery. Matt supplies the language and the primitives. unlazy supplies the proof: completion decided by runnable checks instead of a confident report.

Three problems drive the design.

1. Context cost. Verified against the Claude Code skills documentation on 2026-08-27: Claude Code loads a listing of every model-invocable skill's name and description into context. The listing has a character budget of 1% of the model's context window. When it overflows, Claude Code shortens descriptions and then drops them, starting with the skills invoked least, which strips the keywords a trigger needs and silently breaks auto-invocation. A skill with `disable-model-invocation: true` is removed from Claude's context entirely and loads only when the user types `/name`. `/context` reports the listing's size after the budget is applied and `/doctor` estimates its cost. This dev machine already carries 50+ skills from plugins and ~/.claude/skills. Adding the 39 skills of both corpora naively would push the listing further past its budget.
2. Duplication. superpowers and mattpocock/skills overlap on design interviews, TDD, debugging, and code review. Two skills on one trigger produce nondeterministic behavior. The merge must produce one skill per concern.
3. Ownership. superpowers is a managed, read-only plugin that updates on its own schedule. Adnan wants skills he can edit, in his own repo, under his own rules (AGENTS.md, unslop prose).

A fourth problem surfaced in the first grill round: process artifacts (specs, plans, ledgers, notes, handoffs) were landing in the project's docs/ tree as written, at design time, and never reconciled with what was actually built. The project working area and the promote flow below answer it.

## Decisions

1. **superpowers is retired and Lucy replaces it.** Every superpowers capability Adnan uses is rebuilt in Lucy, merged with mattpocock/skills content where the two overlap, and the plugin is then uninstalled. Uninstall is the last step, after Lucy's replacements pass validation, because until then two session-start hooks and two skill sets on the same triggers would fire together.

2. **Three tiers, by standing context cost.**
   - Tier 1, the constitution: a short document injected by Lucy's SessionStart hook into every session (startup, clear, compact). It carries the skills-first rule, the gates, and the mode map. Target: under 60 lines.
   - Tier 2, the model-invoked core: the only skills whose descriptions sit in Claude's listing. A skill enters this tier only if it must fire without being asked (a discipline the model applies mid-work) or another skill calls it mid-flow through the Skill tool. Target: at most 14 skills.
   - Tier 3, user-invoked skills and reference files: everything else. User-invoked skills carry `disable-model-invocation: true` and cost nothing until typed. Reference files are plain markdown inside a skill directory, reached by pointers, and cost nothing until read.

3. **User-invoked is the default.** Every new skill is born with `disable-model-invocation: true`. A slot in the model-invoked listing must be justified in the skill's provenance note under the tier 2 test. This inverts the mattpocock/skills default on purpose: that repo has 25 skills, this machine has a zoo.

4. **Gates live in the constitution, not in skill descriptions.** "The user wants something built and no design is approved: suggest /brainstorm", "before claiming done, verify", "a bug appeared: apply diagnose" cost one line each in the constitution. superpowers spent a full skill description on each gate. Skills whose procedure the model must apply on its own (tdd, diagnose, verify) still live in tier 2, because a gate can only point at a skill the model is allowed to invoke.

5. **Development is the default state; modes are for other purposes.** There is no /dev. Brainstorm, plan, execute, diagnose, review, finish, promote, and handoff are flows inside development. Three modes change what a session is for: /idea (ideation before a repo exists), /explore (understanding without changing), /teach (learning in a stateful workspace). Modes are user-invoked skills. The constitution's mode map lets the model suggest a mode once when a session clearly looks like one; the user's typed command stays the primary mechanism. Automatic detection through a UserPromptSubmit hook is deferred.

6. **One skill per concern, merged from the better parts of both sources.** brainstorm, tdd, diagnose, and review-changes are merges. Everything else is taken from one source and adapted. The per-skill map is below.

7. **writing-for-agents is the standard for everything Lucy writes and for every dispatch.** It enters the model-invoked core with a broadened trigger: creating or editing a skill, editing AGENTS.md or CLAUDE.md, and dispatching a subagent. The execute skill cites it for dispatch hygiene instead of restating it.

8. **Vendored and merged skills keep every applicable license and a provenance note.** Both sources are MIT. A single-source skill keeps the LICENSE file with a provenance header line, as unslop does today. A merged skill carries a LICENSE file with both notices and a PROVENANCE.md naming, for each source, the repo, path, and commit or version, plus a paragraph on what was taken and what was changed.

9. **Names are short and typed-friendly, and never collide with skills Claude Code already exposes.** Flows are typed as slash commands many times a day. Names are one word where possible. On this machine Claude Code already exposes skills named `design`, `review`, `code-review`, `debug`, `security-review`, `simplify`, `init`, `run`, `loop`, and `schedule` (bundled with Claude Code or its desktop app); on the dev machine Lucy's skills load un-namespaced from ~/.claude/skills, so those names are off limits. Before a name is final, check it against the current listing. Confirmed in round 1: the design flow is `brainstorm`, debugging is `diagnose`, the review pair is `review-changes` and `review-feedback`.

10. **Skills are the only command mechanism.** Claude Code has merged commands into skills; a user-invoked skill is a slash command. Lucy creates no commands/ directory.

11. **Lucy's working artifacts live in `.lucy/` inside the project and enter the project only by promotion.** Every flow writes what it produces under `.lucy/`: specs, plans, run state, notes, handoffs, idea briefs. The directory is git-ignored. The only path from `.lucy/` into the project proper is the promote flow, which turns process artifacts into project documentation: reconciled against what was actually built, merged into the documents where they belong, then removed from `.lucy/`. The repo holds only what was deliberately promoted, process state never pollutes docs/, and correction happens once, against the as-built code, instead of leaving design-time documents that stopped matching the code. Details under "The project working area".

12. **agents/openai.yaml ships beside every SKILL.md from the start.** One small file per skill: display name, short description, and `policy.allow_implicit_invocation: false` for user-invoked skills, kept in sync with `disable-model-invocation`. It costs nothing at runtime and spares the Codex track a retrofit.

13. **unlazy is vendored whole and is the proof layer.** Added 2026-09-02 (ADR-0006). The skill keeps its name and enters tier 2: the model reaches for it on substantial multi-part autonomous work, which is the point of a completion ledger. Its state moves under Lucy's working area: `.unlazy/<scope>/` becomes `.lucy/gates/<scope>/`, the solo ledger lives at `.lucy/gates/GATES.md`, hook state moves under `.lucy/gates/`, and the approval store moves from `~/.unlazy/approved` to `~/.lucy/approved`. Its Stop hook ships in Lucy's hooks/hooks.json for every project; it is scan-only and allows the stop when no ledger exists. Orchestrated mode is vendored too, under one rule: execute drives, unlazy proves. execute remains the executor of plans, each task may carry gates, finish requires ALL MET on the task ledgers, and unlazy's own orchestrated mode runs only when execute is not driving. Two fold-ins: plan adopts the contract inventory table (every independently omittable outcome mapped to an owner and an observing gate), and verify names a gate ledger as the form of evidence for substantial work.

## Tier 1: the constitution

The constitution lives at skills/using-lucy/SKILL.md, user-invoked, so /using-lucy re-reads it on demand and the hook injects the same file. One source, two readers.

Draft contents, to be written under the writing-for-agents rules:

- The rule. Before responding or acting, check whether a Lucy skill applies. If one does, invoke it through the Skill tool. Process skills come before implementation skills.
- Gates, one line each:
  - Building or changing behavior with no approved design: suggest /brainstorm and do not implement until the design is approved.
  - A bug, a failing test, or unexpected behavior: apply diagnose before proposing a fix.
  - Implementation code: tdd applies.
  - Before claiming complete, fixed, or passing: verify.
  - Substantial multi-part autonomous work: write the gate ledger first (unlazy).
  - Dispatching a subagent or writing a document for an agent: writing-for-agents.
  - Review feedback arrives: review-feedback.
- Mode map, one line each for /idea, /explore, /teach, plus one sentence: if the session clearly looks like one of these and it is not active, suggest it once.
- Pointer to /lucy, the router, for "which flow fits my situation".

Budget: under 60 lines, roughly 500 tokens. superpowers injects about 70 lines and lists 14 descriptions.

## Tier 2: the model-invoked core

Fourteen skills, each with a reason it needs the listing.

| Skill | Source | Why it needs the listing |
|---|---|---|
| tdd | merge: superpowers test-driven-development + Matt tdd | applied mid-implementation without being asked |
| diagnose | merge: Matt diagnosing-bugs as the spine + superpowers systematic-debugging | fires on any bug or failing test |
| verify | superpowers verification-before-completion | fires before any completion claim |
| writing-for-agents | Matt, trigger broadened to dispatch | fires when dispatching subagents or writing agent docs |
| review-feedback | superpowers receiving-code-review | fires when review feedback arrives |
| grilling | Matt | primitive called by brainstorm, idea, explore, teach, promote |
| domain-modeling | Matt | called by brainstorm and promote mid-session |
| codebase-design | Matt | vocabulary consulted by tdd, brainstorm, plan |
| review-changes | superpowers requesting-code-review + Matt code-review rubric | called by execute and finish; also typed directly |
| worktree | superpowers using-git-worktrees | called by execute at setup |
| finish | superpowers finishing-a-development-branch | called by execute at the end; also typed directly (/finish: merge, clean up the worktree, no retyping the request) |
| resolve-conflicts | Matt resolving-merge-conflicts | conflicts arise inside agent-run rebases and merges |
| unslop | existing | existing decision: must always apply |
| unlazy | Leonxlnx/unlazy 473d4b8, re-pathed to .lucy/ | fires on substantial multi-part autonomous work; a completion ledger only helps if the model reaches for it unasked |

Every description is written trigger-first and kept short. The listing caps each entry at 1,536 characters and shortens entries under budget pressure, so the first clause must carry the trigger.

## Tier 3: user-invoked flows and modes

| Skill | Source | Notes |
|---|---|---|
| brainstorm | merge: superpowers brainstorming + Matt grilling, grill-with-docs, to-spec | writes the approved spec to .lucy/specs/; see "Merged skills" |
| plan | superpowers writing-plans | writes to .lucy/plans/; plus tracer-bullet vertical slices and blocked-by edges from Matt to-tickets |
| execute | superpowers subagent-driven-development, with executing-plans as its inline mode | workspace .lucy/runs/<plan>/ replaces .superpowers/sdd/; scripts (sdd-workspace, task-brief, review-package) and prompt templates vendored and re-pathed; dispatch hygiene cites writing-for-agents |
| promote | new | turns .lucy/ artifacts into project documentation; see "The project working area" |
| handoff | Matt handoff + claude-handoff | argument: what the next session is for; writes to .lucy/handoffs/ inside a repo, OS temp outside one; asks whether to also spawn a background agent seeded with the document |
| wizard | Matt wizard | human-only steps; starts user-invoked (Matt ships it model-invoked); revisit after use |
| idea | new; shaped from Matt grill-me, prototype, and the loop-me workspace pattern | mode; a workspace only when the user asks for one |
| explore | new; shaped from Matt research | mode; writes cited notes and maps to .lucy/notes/ |
| teach | Matt teach | mode |
| lucy | new; shaped like Matt ask-matt | router over Lucy's flows and modes |
| using-lucy | new; shaped like superpowers using-superpowers | constitution, injected by the hook |

Reference files, not skills: writing-good-tests (merged from superpowers writing-good-tests.md and Matt tests.md plus mocking.md) under tdd; root-cause-tracing, condition-based-waiting, defense-in-depth under diagnose; CONTEXT-FORMAT and ADR-FORMAT under domain-modeling; DEEPENING and DESIGN-IT-TWICE under codebase-design; implementer, task-reviewer, re-review, and code-reviewer prompts under execute and review-changes; template.sh under wizard; the four format files under teach; PHASE-BOUNDARIES under lucy. unlazy keeps its own references (gates, method, orchestration, dispatch, parallel, token-economy), its three ledger templates, and its Node scripts.

## Merged skills: what comes from where

### brainstorm

- From superpowers brainstorming: classify the request as spike, bounded, or architectural before the first question and say the classification out loud; ratchet up when hidden complexity appears; the hard gate (no implementation until the human approves, for every path); YAGNI; spec self-review (placeholders, internal consistency, scope, ambiguity); the user review gate on the written spec; the handoff to plan.
- From Matt grilling: work the design tree in rounds; ask the whole frontier in one round; number the questions and attach a recommended answer to each; facts are the agent's job (dispatch a sub-agent), decisions are the user's. This replaces superpowers' one-question-per-message rule.
- From Matt domain-modeling, called through the Skill tool: challenge terms against the glossary, sharpen fuzzy language, update CONTEXT.md and offer ADRs inline under the triple test (hard to reverse, surprising without context, a real trade-off).
- From Matt to-spec: the spec sections (problem statement, solution, user stories, implementation decisions, testing decisions, out of scope) merged with superpowers' coverage list (architecture, components, data flow, error handling, testing) into Lucy's spec template.
- Replaced: the design-for-isolation section becomes a pointer to codebase-design.
- Dropped: the visual companion and its server; the elements-of-style pointer.
- Output path: .lucy/specs/<date>-<topic>.md. The approved spec stays there through the build and is promoted after finish, as-built.

### tdd

- From superpowers: the iron law; the red, green, refactor loop with mandatory verify-red and verify-green; minimal implementation; the when-stuck table; the bug-fix example; a trimmed rationalization table.
- From Matt: seams (test only at pre-agreed seams, confirmed with the user before any test is written); the anti-patterns (implementation-coupled, tautological, horizontal slicing); tracer-bullet vertical slices; CONTEXT.md vocabulary in test names; the pointer to codebase-design when the interface itself is in question.
- One writing-good-tests reference merged from both sources.

### diagnose

- Spine from Matt diagnosing-bugs: redact secrets; phase 1, build a tight red-capable feedback loop (the ten constructions in order, tighten the loop, raise the reproduction rate of flaky bugs, the completion criterion of one command already run); phase 2, reproduce and minimise; phase 3, three to five ranked falsifiable hypotheses shown to the user; phase 4, instrument one variable at a time with tagged logs; phase 5, regression test at a correct seam before the fix, or record that no correct seam exists; phase 6, cleanup.
- From superpowers systematic-debugging: read the whole error and check recent changes (folded into phase 1); pattern analysis against working examples (a step between phases 2 and 3); the multi-layer instrumentation example; the breaker (three failed fixes means the architecture is in question: stop and discuss); the "no root cause" handling; a trimmed rationalization table; the root-cause-tracing, condition-based-waiting, and defense-in-depth references.

### review-changes

- Flow and machinery from superpowers requesting-code-review: dispatch a reviewer subagent with crafted context and never with session history; severity levels; act on feedback in order.
- Rubric from Matt code-review: two axes, Standards and Spec, reported separately and never reranked against each other; the Fowler smell baseline as labelled heuristics; documented repo standards override the baseline.
- The code-reviewer template is extended accordingly. execute uses it for task reviews and for the final whole-branch review.

## unlazy: what changes in the vendored copy

- Paths: `.unlazy/<scope>/` becomes `.lucy/gates/<scope>/`; the solo ledger lives at `.lucy/gates/GATES.md` instead of the project root; `.unlazy-hook-state.json` becomes `.lucy/gates/hook-state.json`; `~/.unlazy/approved` becomes `~/.lucy/approved`; `UNLAZY_*` environment variables keep their names. At 473d4b8 the rename surface is 174 lines, concentrated in the constants of scripts/lib/gates.mjs, the templates, and the tests. The vendored test suite is the check that the rename is complete.
- Hook: scripts/stop-hook.mjs is registered in hooks/hooks.json on the Stop event instead of being installed per project; install-hooks.mjs is dropped. Verified on 2026-09-02: with no ledger the hook exits 0 and allows the stop; with an unmet ledger it returns `decision: block` naming the gate; with a met ledger it allows.
- Rule: execute drives, unlazy proves. Written into execute, unlazy, and finish.
- Fold-ins: the PLAN contract inventory table into plan; the gate ledger as evidence form into verify.
- Prose: unslop pass; the SKILL.md description rewritten trigger-first and short.

## Modes

### idea

Purpose: sharpen an idea before any repo or code exists: a product, a feature for a project not yet started, a talk, a course.

Behavior: grilling rounds with recommended answers. A workspace directory (the loop-me and writing-fragments pattern, holding NOTES.md and idea briefs) is created only when the user asks for one: .lucy/ideas/ inside a repo, a directory of the user's choice outside one. Prototypes are allowed as throwaway artifacts under Matt's prototype rules when a question needs a runnable answer. The mode ends with an idea brief the user can carry into /brainstorm inside a repo.

### explore

Purpose: understand something without changing it. Two shapes share one invariant: a codebase tour that produces a map, and a technology or design-space investigation that produces cited notes.

Invariant: explore never edits source files. It writes notes.

Behavior: read-only investigation against primary sources, following every claim back to the source that owns it (the Matt research shape), with sub-agents for the legwork. Output goes to .lucy/notes/; promote later moves it to wherever the project keeps such notes, or to docs/notes/ when it keeps none. When graphify-out/ exists, explore uses graphify; graphify stays installer-managed and is not vendored.

### teach

Purpose: learn a topic over multiple sessions. Vendored from Matt teach with its format files. The current directory is the workspace: MISSION.md, RESOURCES.md, reference/, lessons/, learning-records/, assets/, NOTES.md. The first version changes nothing beyond an unslop pass.

### Mode mechanics

- A mode is a user-invoked skill. Its body sets the session's purpose and names the model-invoked skills it relies on (grilling, writing-for-agents).
- The constitution's mode map is the only always-on cost: one line per mode.
- `context: fork` (running a skill in its own subagent context) is available for skills that are tasks rather than guidelines. Modes stay inline in v1.

## The project working area: .lucy/

Layout inside a project:

```
.lucy/
├── specs/        # brainstorm writes here; plan and execute read from here
├── plans/        # plan writes here; execute reads from here
├── runs/<plan>/  # execute's ledger, briefs, reports, review packages
├── notes/        # explore writes here
├── handoffs/     # handoff writes here: latest.md plus dated copies
├── ideas/        # idea briefs, when the user asked for a workspace inside a repo
└── gates/        # unlazy: GATES.md for solo work, <scope>/ for orchestrated runs, hook and dispatch state
```

Git rule: `.lucy/` is ignored. Before its first write in a project, Lucy runs `git check-ignore -q .lucy`; if the directory is not ignored, it appends `.lucy/` to .gitignore and proposes that one-line commit, the same guard superpowers applies to `.worktrees/`. The trade-off is accepted: an unpromoted artifact exists only on the machine that wrote it. When that matters, promote early.

Promotion is the promote flow, user-invoked, in five steps:

1. Inventory. List the promotable artifacts: specs/, notes/, and ideas/ always; plans/ only when the user asks; runs/, handoffs/, and gates/ never.
2. Map. Detect the project's documentation conventions (docs/adr/, docs/specs/, CONTEXT.md, README, a notes directory) and propose a target for each artifact. A project with no conventions gets docs/specs/, docs/adr/, docs/notes/, and CONTEXT.md at the root. Ambiguity goes through one grilling round.
3. Correct. Reconcile a spec against what was built. The execute ledger's rulings are the list of places where implementation departed from the spec; each one is applied to the promoted document, so the repo ends up with an as-built design document, not a design-time wish.
4. Merge. Decisions that pass the ADR triple test become ADRs (domain-modeling). New terminology goes into CONTEXT.md. User-facing behavior goes into README or docs. Pointers agents need go into AGENTS.md or CLAUDE.md under writing-for-agents rules. Merge into existing documents rather than adding a parallel file.
5. Move, don't copy. The promoted artifact leaves .lucy/. Propose one commit for the promotion.

Integration points:

- brainstorm leaves the approved spec in .lucy/specs/ through the build and says so at approval time.
- finish counts unpromoted artifacts before presenting its menu and adds one line: "N unpromoted artifacts in .lucy/, run /promote". finish cannot invoke promote; a user-invoked skill is reachable only by the human.
- execute writes its workspace under .lucy/runs/<plan-basename>/. The vendored sdd-workspace script is re-pathed accordingly.
- Lucy's own repo follows the same rule from now on. The specs and plans already under docs/superpowers/ stay where they are, records of the days they were written.

## Hook

hooks/hooks.json registers a SessionStart hook with matcher `startup|clear|compact` that runs hooks/session-start. The script reads skills/using-lucy/SKILL.md, JSON-escapes it, and emits `hookSpecificOutput.hookEventName: "SessionStart"` with `additionalContext`. It is adapted from superpowers' hook with the Cursor and Copilot branches removed until Lucy has those tracks, and it runs on macOS bash 3.2.

Failure mode: if the hook fails, the session has no constitution and nothing fails loudly. Mitigation: /using-lucy reloads it by hand, and validation includes a hook smoke test.

hooks/hooks.json also registers a Stop hook that runs skills/unlazy/scripts/stop-hook.mjs (Node 16 or newer). It scans the current project's `.lucy/gates/` ledgers and dispatch state, blocks the stop while gates are unmet or launch waves are incomplete, and releases after six consecutive no-progress blocks. It never executes CHECK lines. In a project with no ledger it allows the stop, which is what makes shipping it plugin-wide safe.

## Repo structure after this design

```
lucy/
├── .claude-plugin/
├── hooks/
│   ├── hooks.json
│   └── session-start
├── skills/                    # shipped, flat, one directory per skill
│   ├── using-lucy/            # tier 1
│   ├── lucy/                  # router
│   ├── tdd/  diagnose/  verify/  writing-for-agents/  review-feedback/
│   ├── grilling/  domain-modeling/  codebase-design/
│   ├── review-changes/  worktree/  finish/  resolve-conflicts/  unslop/  unlazy/
│   ├── brainstorm/  plan/  execute/  promote/  handoff/  wizard/
│   └── idea/  explore/  teach/
├── drafts/                    # every skill above starts here
├── deprecated/
├── scripts/
└── docs/
```

Twenty-five skill directories: fourteen in tier 2, eleven in tier 3. Each directory: SKILL.md, agents/openai.yaml, its reference files, LICENSE, and PROVENANCE.md where more than one source contributed.

## Context budget

Estimates, measured at validation with the Skills row of `/context` and with `/doctor`:

- superpowers today: the using-superpowers injection (about 70 lines) plus 14 descriptions.
- A naive union of the three corpora: 40 descriptions plus the injection.
- Lucy target: a constitution under 60 lines plus 14 short, trigger-first descriptions.

Success criterion: after Lucy replaces superpowers, the Skills row of `/context` is not larger than it was with superpowers installed, and the constitution stays under 60 lines.

A side recommendation for this machine, outside Lucy: set rarely triggered third-party skills (the paddle-* set, the heroui-* set) to `"name-only"` or `"user-invocable-only"` through `skillOverrides` in settings, so their descriptions stop competing for the 1% budget.

## Migration order

1. Spec approved and recorded in ADR-0003 (superpowers retired; three-tier invocation policy; user-invoked default; bundled-name rule), ADR-0004 (modes), and ADR-0005 (the .lucy/ working area and promotion), all on 2026-08-27. ADR-0006 (unlazy as the proof layer) added on 2026-09-02.
2. Record the baseline: the Skills row of `/context` with superpowers installed.
3. Write the implementation plan with superpowers writing-plans, since Lucy's plan skill does not exist yet.
4. Build in drafts/, tier 2 first (tdd, diagnose, verify, writing-for-agents, review-feedback, grilling, domain-modeling, codebase-design, review-changes, worktree, finish, resolve-conflicts, unlazy), then the flows (brainstorm, plan, execute, promote, handoff, wizard), then the modes (idea, explore, teach), then using-lucy, lucy, and the hook. Each skill: base text, fold-ins, unslop pass, provenance, openai.yaml, description rewritten trigger-first. unlazy's build task is complete only when its vendored test suite passes against the re-pathed copy.
5. Link with scripts/link-skills.sh, validate both manifests, then E2E in a scratch repo: the constitution is injected on startup and after /clear; user-invoked skills are absent from the model's listing and present in the / menu; the core is present; a toy run of /brainstorm, /plan, /execute, /finish creates and uses .lucy/, which ends up ignored; /promote moves the toy spec into docs/specs/ and removes it from .lucy/; /handoff produces a usable prompt; /teach creates its workspace; the Skills row of `/context` is measured against the baseline from step 2; the Stop hook allows a stop in a project with no ledger and blocks one with an unmet ledger.
6. Promote drafts/ to skills/ by moving the directories, re-link.
7. Uninstall superpowers (`claude plugin uninstall superpowers`), confirm no superpowers hook fires and that the orphaned 6.1.1 cache is gone or inert, re-run the E2E probe.
8. Update README, AGENTS.md (new invariants: user-invoked default, bundled-name rule, provenance shape, openai.yaml beside every skill, the .lucy/ rule), and memory.

## Out of scope

- Matt's issue-tracker suite (setup-matt-pocock-skills, to-spec, to-tickets, triage, implement, wayfinder, and ask-matt as a whole) beyond the concepts folded into plan and brainstorm. wayfinder is the strongest second-wave candidate.
- Matt research (its shape is folded into explore), prototype (folded partially into idea; the full skill is second wave), improve-codebase-architecture, wait-what, to-questionnaire (second wave).
- The superpowers visual companion (dropped).
- Automatic mode detection through a UserPromptSubmit hook.
- Multi-harness adapters for Codex and OpenCode. superpowers' shims and porting guide are the reference when those tracks start.
- git-guardrails as a Lucy hook (later).
- Per-project Lucy configuration (where a project keeps its docs, which issue tracker it uses). `.lucy/` is its natural home when the need appears.
- Matt's in-progress bucket (retro, setup-ts-deep-modules): watch.

## Resolved in grill round 1 (2026-08-27)

- Names: brainstorm, diagnose, review-changes, review-feedback; the rest as in the skill map.
- explore covers both codebase understanding and technology research; notes go to .lucy/notes/ and are promoted to the project's notes location, or docs/notes/.
- idea creates a workspace only on request.
- resolve-conflicts is in tier 2; wizard starts user-invoked.
- agents/openai.yaml ships beside every skill now.
- Working artifacts live in .lucy/ and reach the project through promote.
- unslop stays in tier 2 as "must always apply".

## Resolved in grill round 2 (2026-08-27)

- `.lucy/` is git-ignored in full.
- Promotion happens after finish, as-built.
- promote proposes one commit; it does not commit on its own.
- Plans are promoted only on request.

## Resolved on 2026-09-02 (unlazy round)

- unlazy enters tier 2 as the fourteenth core skill; the constitution gains the gate-ledger gate.
- The name stays unlazy.
- Orchestrated mode is vendored whole, under the rule execute drives, unlazy proves.
- The Stop hook ships in the plugin for every project.
- ADR-0006 and this amendment precede the implementation plan.

## Risks

- disable-model-invocation semantics: verified in the documentation on 2026-08-27; re-verified in E2E with a probe session that reports what the model sees.
- Silent hook failure: covered above.
- Unpromoted artifacts exist on one machine only: accepted for a solo developer; promote early when it matters.
- Drift from upstream: accepted. A periodic diff against upstream tags is a manual chore.
- Loss of superpowers auto-updates: accepted, that is the point.
- Description truncation: descriptions stay short and trigger-first; the Skills row of `/context` is measured, not assumed.
- unlazy is three weeks old and untagged at 473d4b8: the fork freezes it, and upstream fixes are ported by hand, as with superpowers.
- Node dependency: the gate checker and the Stop hook need Node 16 or newer. A machine without Node loses the proof layer and nothing else.
