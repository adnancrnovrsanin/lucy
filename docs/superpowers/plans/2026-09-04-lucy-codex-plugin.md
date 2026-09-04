# Lucy native Codex plugin implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Lucy as a native Codex plugin that shares the existing skill tree and can be installed from this repository.

**Architecture:** Codex receives its own minimal plugin manifest and repository marketplace while both providers load the same `skills/` and `hooks/` directories. A dependency-free validator and regression test make the package contract executable. Shared skill prose becomes host-neutral, and the README carries the host-specific commands.

**Tech Stack:** JSON manifests, Bash hooks, Node.js 16+ standard library, Codex CLI.

**Spec:** `docs/superpowers/specs/2026-09-04-lucy-codex-plugin-design.md`

## Global constraints

- Do not alter `.claude-plugin/` or its existing version.
- Keep `skills/` as the only shipped skill tree. Do not add a generated overlay.
- Preserve `disable-model-invocation` and its matching `agents/openai.yaml` policy.
- Keep `CLAUDE_PLUGIN_ROOT` in the hook commands because Codex provides it for compatibility.
- Use plain repository prose: no em dashes, curly quotes, or decorative emoji.
- Codex hook trust remains an explicit `/hooks` action.

---

## File map

- `.codex-plugin/plugin.json`: Codex plugin identity and shared skills path.
- `.agents/plugins/marketplace.json`: repository-local Codex marketplace entry.
- `tests/codex-plugin.test.mjs`: dependency-free regression test for the package contract.
- `scripts/validate-codex-plugin.mjs`: reusable validator invoked by developers and CI.
- `hooks/hooks.json`: session-start sources for both providers.
- `scripts/install-dev-hooks.mjs`: Claude development installer that mirrors
  the shared SessionStart source list.
- `skills/*/SKILL.md`: provider-neutral live workflow instructions.
- `skills/lucy/PHASE-BOUNDARIES.md`, `skills/brainstorm/spec-template.md`,
  and `skills/unlazy/SECURITY.md`: active supporting instructions that must
  remain portable too.
- `README.md`: installation and update instructions for Claude Code and Codex.
- `AGENTS.md`: package validation and cross-provider repository invariants.
- `docs/adr/0007-codex-plugin-package.md`: durable rationale for the shared-tree design.

### Task 1: Add the executable Codex package contract

**Files:**
- Create: `tests/codex-plugin.test.mjs`
- Create: `scripts/validate-codex-plugin.mjs`
- Create: `.codex-plugin/plugin.json`
- Create: `.agents/plugins/marketplace.json`

**Interfaces:**
- Consumes: the repository root and every `skills/*/agents/openai.yaml` file.
- Produces: `node scripts/validate-codex-plugin.mjs`, which exits 0 for a valid package and exits nonzero with a useful error otherwise.

- [ ] **Step 1: Write the failing package test**

Create `tests/codex-plugin.test.mjs` with Node's `assert` and `spawnSync`. It must require:

```js
assert.equal(plugin.name, "lucy");
assert.equal(plugin.version, "0.2.0");
assert.equal(plugin.skills, "./skills/");
assert.equal(marketplace.name, "lucy-codex");
assert.deepEqual(marketplace.plugins, [{
  name: "lucy",
  source: "./",
  description: "Adnan's personal plugin system for Codex.",
}]);
```

It must also assert that every shipped skill has `agents/openai.yaml` whose
implicit-invocation setting matches `disable-model-invocation`, and that the
validator exits 0.

- [ ] **Step 2: Run the test to prove the missing package fails**

Run: `node tests/codex-plugin.test.mjs`

Expected: failure because `.codex-plugin/plugin.json` does not exist yet.

- [ ] **Step 3: Implement the minimal manifests and validator**

Create the Codex manifest with the fields asserted above. Create the
marketplace with one `lucy` plugin rooted at `./`. Implement the validator
with only `node:fs`, `node:path`, and `node:url`; it parses both JSON files,
checks the exact package fields, verifies every shipped skill's
`agents/openai.yaml` policy pairing, and rejects a deliberately mismatched
policy in a copied fixture.

- [ ] **Step 4: Run the package test again**

Run: `node tests/codex-plugin.test.mjs`

Expected: pass.

### Task 2: Make the shared runtime portable

**Files:**
- Modify: `hooks/hooks.json`
- Modify: `scripts/install-dev-hooks.mjs`
- Modify: `tests/codex-plugin.test.mjs`
- Modify: `scripts/validate-codex-plugin.mjs`
- Modify: `skills/using-lucy/SKILL.md`
- Modify: `skills/lucy/SKILL.md`
- Modify: `skills/lucy/PHASE-BOUNDARIES.md`
- Modify: `skills/brainstorm/SKILL.md`
- Modify: `skills/brainstorm/spec-template.md`
- Modify: `skills/idea/SKILL.md`
- Modify: `skills/explore/SKILL.md`
- Modify: `skills/finish/SKILL.md`
- Modify: `skills/plan/SKILL.md`
- Modify: `skills/execute/SKILL.md`
- Modify: `skills/handoff/SKILL.md`
- Modify: `skills/promote/SKILL.md`
- Modify: `skills/review-changes/SKILL.md`
- Modify: `skills/tdd/SKILL.md`
- Modify: `skills/verify/SKILL.md`
- Modify: `skills/unlazy/SKILL.md`
- Modify: `skills/unlazy/SECURITY.md`

**Interfaces:**
- Consumes: the existing shared skills and `hooks/hooks.json`.
- Produces: host-neutral workflow directions, a host-native handoff fallback,
  and SessionStart coverage for `resume`.

- [ ] **Step 1: Extend the package test and make it fail for the expected reason**

Add assertions for every SessionStart source and its command handler, the
Stop hook command handler, the matching development installer, and the
absence of retired provider-specific instructions in active skills and
support documents. Run:

```bash
node tests/codex-plugin.test.mjs
```

Expected: failure reporting a missing source, handler, policy pairing, or
provider-specific instruction.

- [ ] **Step 2: Add `resume` to SessionStart**

Change both SessionStart matchers from `startup|clear|compact` to
`startup|resume|clear|compact`. Preserve their commands and compatibility
environment variable.

- [ ] **Step 3: Rewrite the active provider-specific instructions**

Replace live `Call the Skill tool` wording with an instruction to invoke the
named skill through the host's skill mechanism. Replace workflow references
such as `/brainstorm` with ``brainstorm`` skill references. In `handoff`,
offer a native background task when the host supports it, otherwise provide a
new-session prompt, with no `claude` executable call. Add the Codex
`fork_turns: "none"` adapter for fresh workers and reviewers. Extend the
validator with the full hook contract, policy pairing, active support
documents, and retired-command checks.

- [ ] **Step 4: Run the package test and skill checks**

Run:

```bash
node tests/codex-plugin.test.mjs
scripts/check-skill.sh skills/*
```

Expected: both commands exit 0.

- [ ] **Step 5: Reinstall and smoke-test the hooks**

Run:

```bash
node scripts/install-dev-hooks.mjs
echo '{}' | bash hooks/session-start
echo '{"session_id":"abcdefabcdefabcdefabcdef"}' | node skills/unlazy/scripts/stop-hook.mjs
```

Expected: the first command produces SessionStart JSON and the second emits
no output in this repository without ledgers.

### Task 3: Document the package and record the decision

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Create: `docs/adr/0007-codex-plugin-package.md`

**Interfaces:**
- Consumes: manifest names, the validator command, hook trust requirement,
  and the existing Claude development workflow.
- Produces: reproducible installation, update, validation, and maintenance
  instructions.

- [ ] **Step 1: Update README installation paths**

Describe Claude Code and Codex as supported. Keep the Claude development
symlink commands. Add Codex local commands:

```bash
codex plugin marketplace add /absolute/path/to/lucy
codex plugin add lucy@lucy-codex
```

Add remote marketplace installation from `adnancrnovrsanin/lucy`, the
reinstall-on-update command, a `$lucy:brainstorm` invocation example, and
the requirement to trust hooks with `/hooks`.

- [ ] **Step 2: Update repository invariants**

Teach `AGENTS.md` to run `node scripts/validate-codex-plugin.mjs` after
changing `.codex-plugin/` or `.agents/plugins/marketplace.json`, preserve
the Claude validation instructions, distinguish Claude symlinks from Codex
plugin installation, and require provider-neutral skill-to-skill wording.

- [ ] **Step 3: Add ADR 0007**

Record that Codex shares `skills/`, that `lucy-codex` avoids a marketplace
name collision, that the existing hooks are discovered from `hooks/`, and
that actual Codex CLI installation validates intentional cross-provider
frontmatter better than the generic plugin-creator validator.

- [ ] **Step 4: Check all prose**

Run:

```bash
scripts/check-prose.sh README.md AGENTS.md docs/adr/0007-codex-plugin-package.md \
  docs/superpowers/specs/2026-09-04-lucy-codex-plugin-design.md \
  docs/superpowers/plans/2026-09-04-lucy-codex-plugin.md
```

Expected: exit 0 with no reported prose violations.

### Task 4: Verify the native Codex installation

**Files:**
- No repository files.

**Interfaces:**
- Consumes: the local marketplace and plugin manifest.
- Produces: an installed `lucy@lucy-codex` plugin visible to Codex.

- [ ] **Step 1: Validate the static package**

Run:

```bash
node scripts/validate-codex-plugin.mjs
node tests/codex-plugin.test.mjs
scripts/check-skill.sh skills/*
```

Expected: every command exits 0.

- [ ] **Step 2: Add and inspect the local marketplace**

Run:

```bash
codex plugin marketplace add /Users/adnan/Projects/lucy
codex plugin list --marketplace lucy-codex --available --json
```

Expected: the available list contains `lucy` at version `0.2.0`.

- [ ] **Step 3: Install Lucy from the marketplace**

Run:

```bash
codex plugin add lucy@lucy-codex --json
codex plugin list --marketplace lucy-codex --json
```

Expected: the installed list contains `lucy@lucy-codex` and its cache points
at a copied version of this repository.

- [ ] **Step 4: Review hooks in Codex**

Open Codex's `/hooks` view, inspect Lucy's two hooks, and explicitly trust
the package only after confirming the displayed commands point to this
repository's `hooks/session-start` and `skills/unlazy/scripts/stop-hook.mjs`.

## Self-review

- The plan maps each acceptance criterion in the spec to a task and command.
- The only executable implementation has a failing-test-first path.
- The plan does not alter the existing Claude manifests or skill tier policy.
- The installation test uses Codex itself instead of assuming a generic
  validator understands cross-provider frontmatter.
