# Lucy Claude plugin foundation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Lucy repo skeleton as a working Claude Code plugin with one shipped skill (unslop), a symlink dev loop, and a marketplace install path, all validated end to end.

**Architecture:** The repo root is the plugin (`.claude-plugin/plugin.json`) and its own single-plugin marketplace (`.claude-plugin/marketplace.json`). `skills/` holds only shipped skills; `drafts/` and `deprecated/` hold the lifecycle outside it. Two bash scripts provide the dev loop (symlink into `~/.claude/skills`, inventory listing).

**Tech Stack:** Markdown, JSON, bash (macOS /bin/bash 3.2 compatible), Claude Code CLI 2.1.246 (`claude plugin ...` subcommands).

**Spec:** `docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md` (approved 2026-08-26). The plan argues from the spec; read both.

## Global constraints

- Repo prose (README, CLAUDE.md, ADRs, specs, this plan) is English and follows the unslop rules: no em dashes, no en dashes, no curly quotes, sentence-case headings, no decorative emoji. Verify any prose file with:
  `perl -CSD -ne 'print "$.: $_" if /[\x{2014}\x{2013}\x{201C}\x{201D}\x{2018}\x{2019}]/' <file>` (empty output = clean).
- Scripts: `#!/usr/bin/env bash` plus `set -euo pipefail`, and must run on macOS bash 3.2 (no `mapfile`, no associative arrays, no `${var,,}`).
- Manifest JSON is copied exactly as written in this plan. After touching anything in `.claude-plugin/`, run `claude plugin validate . --strict`.
- No new dependencies, no `package.json`, no test framework. Script tests run via a throwaway harness in a temp dir, never committed.
- Work directly on `master`. Every commit message ends with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- If a `claude plugin ...` command behaves differently than the expected output written here (prompts interactively, rejects a flag, fails on a valid structure), stop and report the deviation instead of improvising around it.

---

### Task 1: Plugin and marketplace manifests with lifecycle buckets

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `drafts/.gitkeep`
- Create: `deprecated/.gitkeep`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: plugin name `lucy` and marketplace name `lucy` (Task 6 installs `lucy@lucy`); `drafts/` and `deprecated/` directories (Task 4's script scans `drafts/`, ignores `deprecated/`).

- [ ] **Step 1: Confirm the repo is not yet a valid plugin (red)**

Run: `cd /Users/adnan/Projects/lucy && claude plugin validate . --strict`
Expected: nonzero exit, error about a missing `.claude-plugin/plugin.json` (wording may vary).

- [ ] **Step 2: Create `.claude-plugin/plugin.json`**

```json
{
  "name": "lucy",
  "version": "0.1.0",
  "description": "Adnan's personal plugin: his own skills, commands, hooks, and agents.",
  "author": {
    "name": "Adnan Crnovrsanin"
  }
}
```

Deliberately no `skills` field: Claude Code discovers `./skills/` by default, and promotion is by location (spec decision 3).

- [ ] **Step 3: Create `.claude-plugin/marketplace.json`**

```json
{
  "name": "lucy",
  "owner": {
    "name": "Adnan Crnovrsanin"
  },
  "description": "Lucy: Adnan's personal plugin system.",
  "plugins": [
    {
      "name": "lucy",
      "source": "./",
      "description": "Adnan's personal plugin: his own skills, commands, hooks, and agents."
    }
  ]
}
```

- [ ] **Step 4: Create the lifecycle buckets**

Run: `mkdir -p drafts deprecated && touch drafts/.gitkeep deprecated/.gitkeep`

`skills/` is NOT created here; it arrives with its first skill in Task 2.

- [ ] **Step 5: Validate (green)**

Run: `claude plugin validate . --strict`
Expected: exit 0, validation passes (a plugin with no skills yet is valid). If it fails on the missing `skills/` directory, stop and report (global constraints).

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin drafts deprecated
git commit -m "feat: add plugin and marketplace manifests with lifecycle buckets

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Vendor the unslop skill from cursor/plugins

**Files:**
- Create: `skills/unslop/SKILL.md` (verbatim copy from the pinned commit)
- Create: `skills/unslop/LICENSE` (provenance header plus pstack's MIT text)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `skills/unslop/` containing `SKILL.md` with frontmatter `name: unslop` (model-invocable). Task 3 lists it, Task 4 links it, Task 6 installs it as `/lucy:unslop`.

- [ ] **Step 1: Fetch the pinned source commit**

```bash
SRC="$(mktemp -d)"
git -C "$SRC" init -q
git -C "$SRC" remote add origin https://github.com/cursor/plugins
git -C "$SRC" fetch -q --depth 1 origin bdf7aa355337897f167153e05069aca505dae17c
git -C "$SRC" checkout -q FETCH_HEAD -- pstack/skills/unslop/SKILL.md pstack/LICENSE
```

Fallback if the direct SHA fetch is refused by the server:

```bash
git clone -q --filter=blob:none https://github.com/cursor/plugins "$SRC/full"
git -C "$SRC/full" checkout -q bdf7aa355337897f167153e05069aca505dae17c -- pstack/skills/unslop/SKILL.md pstack/LICENSE
SRC="$SRC/full"
```

- [ ] **Step 2: Verify the source hashes before copying**

Run: `shasum -a 256 "$SRC/pstack/skills/unslop/SKILL.md" "$SRC/pstack/LICENSE"`
Expected, exactly:

```
181883e539caec8258ec9129e3ba5f133409144a2cbf2aa361158ab94cfc3441  .../pstack/skills/unslop/SKILL.md
bc957ca6bee02792566a1a028d105e02e247c6e77cf057061674273da77b200e  .../pstack/LICENSE
```

On any mismatch: stop and report; do not vendor unverified content.

- [ ] **Step 3: Copy SKILL.md and write LICENSE with provenance**

```bash
mkdir -p skills/unslop
cp "$SRC/pstack/skills/unslop/SKILL.md" skills/unslop/SKILL.md
{
  printf 'Vendored from https://github.com/cursor/plugins\n'
  printf 'commit bdf7aa355337897f167153e05069aca505dae17c, path pstack/skills/unslop/SKILL.md.\n'
  printf 'The license below is pstack/LICENSE from that commit, verbatim.\n\n'
  cat "$SRC/pstack/LICENSE"
} > skills/unslop/LICENSE
```

- [ ] **Step 4: Verify the vendored copy and the plugin**

Run: `shasum -a 256 skills/unslop/SKILL.md`
Expected: `181883e539caec8258ec9129e3ba5f133409144a2cbf2aa361158ab94cfc3441`

Run: `head -4 skills/unslop/SKILL.md`
Expected frontmatter begins:

```
---
name: unslop
description: Cut AI tells from any writing. Must always apply.
---
```

Run: `claude plugin validate . --strict`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add skills/unslop
git commit -m "feat: vendor unslop skill from cursor/plugins (MIT)

Verbatim SKILL.md from pstack at bdf7aa3; license and provenance
kept in skills/unslop/LICENSE.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Inventory script (list-skills.sh)

**Files:**
- Create: `scripts/list-skills.sh`

**Interfaces:**
- Consumes: the bucket layout from Task 1 and `skills/unslop/` from Task 2.
- Produces: `scripts/list-skills.sh`, printing one line per skill as `<bucket><TAB><name><TAB><repo-relative path>` across `skills/`, `drafts/`, `deprecated/`.

- [ ] **Step 1: Write `scripts/list-skills.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Prints every skill as "<bucket>\t<name>\t<path>" across the three buckets.
# A skill is a directory directly under a bucket that contains SKILL.md.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

for bucket in skills drafts deprecated; do
  dir="$REPO/$bucket"
  [ -d "$dir" ] || continue
  find "$dir" -mindepth 2 -maxdepth 2 -name SKILL.md | sort | while IFS= read -r f; do
    skill_dir="$(dirname "$f")"
    printf '%s\t%s\t%s\n' "$bucket" "$(basename "$skill_dir")" "${skill_dir#"$REPO"/}"
  done
done
```

Run: `chmod +x scripts/list-skills.sh`

- [ ] **Step 2: Run and verify output**

Run: `scripts/list-skills.sh`
Expected, exactly one line:

```
skills	unslop	skills/unslop
```

(`drafts/` and `deprecated/` contain only `.gitkeep`, so they contribute nothing.)

- [ ] **Step 3: Commit**

```bash
git add scripts/list-skills.sh
git commit -m "feat: add list-skills inventory script

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Dev loop script (link-skills.sh) with scenario tests

**Files:**
- Create: `scripts/link-skills.sh`
- Test: throwaway harness at `${TMPDIR:-/tmp}/lucy-link-harness/run-tests.sh` (never committed, deleted at the end)

**Interfaces:**
- Consumes: `skills/unslop/` from Task 2; `drafts/` from Task 1.
- Produces: `scripts/link-skills.sh` with this contract, which Task 6 relies on:
  - links every `<bucket>/<name>/` containing `SKILL.md` (buckets: `skills/`, `drafts/`) to `$HOME/.claude/skills/<name>` as an absolute symlink into the repo; `deprecated/` is never linked
  - exit 0 and idempotent on rerun
  - exit 1 without changing anything if any target name is occupied by a non-symlink or by a symlink pointing outside the repo (two-phase: verify all, then apply)
  - removes symlinks in `$HOME/.claude/skills` that point into the repo but whose source no longer exists; never touches foreign entries

- [ ] **Step 1: Write the test harness (red)**

Write `${TMPDIR:-/tmp}/lucy-link-harness/run-tests.sh` with exactly:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Throwaway harness for scripts/link-skills.sh. Runs the real script with
# HOME pointed at scratch dirs. Not part of the repo.

REPO="/Users/adnan/Projects/lucy"
SCRIPT="$REPO/scripts/link-skills.sh"

pass=0
fail=0

check() {
  desc="$1"; shift
  if "$@"; then
    echo "ok: $desc"
    pass=$((pass + 1))
  else
    echo "FAIL: $desc"
    fail=$((fail + 1))
  fi
}

# Scenario 1: fresh home gets a link for every shipped skill
H="$(mktemp -d)"
HOME="$H" "$SCRIPT" >/dev/null
check "unslop link exists" test -L "$H/.claude/skills/unslop"
check "unslop link points into repo" test "$(readlink "$H/.claude/skills/unslop")" = "$REPO/skills/unslop"
check "SKILL.md readable through link" test -f "$H/.claude/skills/unslop/SKILL.md"

# Scenario 2: idempotent rerun
HOME="$H" "$SCRIPT" >/dev/null
check "rerun keeps link" test "$(readlink "$H/.claude/skills/unslop")" = "$REPO/skills/unslop"
rm -rf "$H"

# Scenario 3: foreign real directory at a linked name aborts, nothing changes
H="$(mktemp -d)"
mkdir -p "$H/.claude/skills/unslop"
echo keep > "$H/.claude/skills/unslop/marker"
mkdir -p "$REPO/drafts/tmp-probe"
printf -- '---\nname: tmp-probe\ndescription: throwaway probe\n---\n' > "$REPO/drafts/tmp-probe/SKILL.md"
trap 'rm -rf "$REPO/drafts/tmp-probe"' EXIT
rc=0
HOME="$H" "$SCRIPT" >/dev/null 2>&1 || rc=$?
check "collision exits nonzero" test "$rc" -ne 0
check "foreign dir untouched" test -f "$H/.claude/skills/unslop/marker"
check "two-phase: probe not linked either" test ! -e "$H/.claude/skills/tmp-probe"
rm -rf "$REPO/drafts/tmp-probe"
trap - EXIT
rm -rf "$H"

# Scenario 4: foreign symlink at a linked name aborts
H="$(mktemp -d)"
mkdir -p "$H/.claude/skills"
ln -s /somewhere/else "$H/.claude/skills/unslop"
rc=0
HOME="$H" "$SCRIPT" >/dev/null 2>&1 || rc=$?
check "foreign symlink exits nonzero" test "$rc" -ne 0
check "foreign symlink untouched" test "$(readlink "$H/.claude/skills/unslop")" = "/somewhere/else"
rm -rf "$H"

# Scenario 5: prune own dangling links, keep foreign ones
H="$(mktemp -d)"
mkdir -p "$H/.claude/skills"
ln -s "$REPO/skills/ghost" "$H/.claude/skills/ghost"
ln -s /nonexistent/foreign "$H/.claude/skills/foreign-ghost"
HOME="$H" "$SCRIPT" >/dev/null
check "own dangling link pruned" test ! -L "$H/.claude/skills/ghost"
check "foreign dangling link kept" test -L "$H/.claude/skills/foreign-ghost"
rm -rf "$H"

# Scenario 6: unrelated foreign entries are ignored
H="$(mktemp -d)"
mkdir -p "$H/.claude/skills/some-other-tool"
ln -s /somewhere/else "$H/.claude/skills/other-link"
HOME="$H" "$SCRIPT" >/dev/null
check "foreign dir ignored" test -d "$H/.claude/skills/some-other-tool"
check "foreign link ignored" test "$(readlink "$H/.claude/skills/other-link")" = "/somewhere/else"
check "unslop still linked" test "$(readlink "$H/.claude/skills/unslop")" = "$REPO/skills/unslop"
rm -rf "$H"

echo
echo "passed: $pass, failed: $fail"
test "$fail" -eq 0
```

Run: `mkdir -p "${TMPDIR:-/tmp}/lucy-link-harness"`, write the file, then `chmod +x "${TMPDIR:-/tmp}/lucy-link-harness/run-tests.sh"`.

- [ ] **Step 2: Run the harness to verify it fails**

Run: `"${TMPDIR:-/tmp}/lucy-link-harness/run-tests.sh"`
Expected: nonzero exit at scenario 1 (`scripts/link-skills.sh` does not exist yet).

- [ ] **Step 3: Write `scripts/link-skills.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Links every skill in skills/ and drafts/ into $HOME/.claude/skills/<name>
# as an absolute symlink into this repo, so a git pull keeps installed
# skills current. deprecated/ is never linked.
#
# Ownership rule: the script only creates, replaces, or removes symlinks
# whose raw target points into this repo. Any colliding entry it does not
# own is an error, and the error is raised before a single change is made.
# Dangling links it owns (source renamed, moved, or deprecated) are pruned.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.claude/skills"

names=()
srcs=()

collect() {
  bucket_dir="$1"
  [ -d "$bucket_dir" ] || return 0
  for skill_dir in "$bucket_dir"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_dir="${skill_dir%/}"
    if [ ! -f "$skill_dir/SKILL.md" ]; then
      echo "warn: skipping $skill_dir (no SKILL.md)" >&2
      continue
    fi
    names+=("$(basename "$skill_dir")")
    srcs+=("$skill_dir")
  done
}

collect "$REPO/skills"
collect "$REPO/drafts"

# Phase 1: verify every planned link before touching anything.
errors=0
i=0
while [ "$i" -lt "${#names[@]}" ]; do
  j=$((i + 1))
  while [ "$j" -lt "${#names[@]}" ]; do
    if [ "${names[$i]}" = "${names[$j]}" ]; then
      echo "error: duplicate skill name '${names[$i]}' (${srcs[$i]} and ${srcs[$j]})" >&2
      errors=1
    fi
    j=$((j + 1))
  done
  target="$DEST/${names[$i]}"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ ! -L "$target" ]; then
      echo "error: $target exists and is not a symlink; refusing to touch it" >&2
      errors=1
    else
      case "$(readlink "$target")" in
        "$REPO"/*) : ;;
        *)
          echo "error: $target points to $(readlink "$target"), not into this repo; refusing to touch it" >&2
          errors=1
          ;;
      esac
    fi
  fi
  i=$((i + 1))
done

if [ "$errors" -ne 0 ]; then
  echo "aborting: nothing was changed" >&2
  exit 1
fi

# Phase 2: apply.
mkdir -p "$DEST"
i=0
while [ "$i" -lt "${#names[@]}" ]; do
  ln -sfn "${srcs[$i]}" "$DEST/${names[$i]}"
  echo "linked ${names[$i]} -> ${srcs[$i]}"
  i=$((i + 1))
done

# Phase 3: prune dangling links owned by this repo.
if [ -d "$DEST" ]; then
  for entry in "$DEST"/*; do
    [ -L "$entry" ] || continue
    case "$(readlink "$entry")" in
      "$REPO"/*)
        if [ ! -e "$entry" ]; then
          rm "$entry"
          echo "pruned dangling $(basename "$entry")"
        fi
        ;;
    esac
  done
fi
```

Run: `chmod +x scripts/link-skills.sh`

- [ ] **Step 4: Run the harness to verify it passes**

Run: `"${TMPDIR:-/tmp}/lucy-link-harness/run-tests.sh"`
Expected: exit 0, final line `passed: 14, failed: 0`, no `FAIL:` lines.

- [ ] **Step 5: Delete the harness**

Run: `rm -rf "${TMPDIR:-/tmp}/lucy-link-harness"`
Also confirm the probe is gone: `test ! -e drafts/tmp-probe && git status --porcelain` shows only `scripts/link-skills.sh` as new.

- [ ] **Step 6: Commit**

```bash
git add scripts/link-skills.sh
git commit -m "feat: add link-skills dev loop script

Two-phase: verify all names, then link; refuses to touch anything it
does not own; prunes its own dangling links.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Repo docs (CLAUDE.md, ADR-0001, README)

**Files:**
- Create: `CLAUDE.md`
- Create: `docs/adr/0001-repo-shape.md`
- Modify: `README.md` (current content is exactly `# lucy`; confirm, then replace)

**Interfaces:**
- Consumes: names and paths as delivered by Tasks 1 to 4 (`scripts/link-skills.sh`, `scripts/list-skills.sh`, `/lucy:unslop`).
- Produces: nothing programmatic; these files are the human and agent contract for the repo.

- [ ] **Step 1: Confirm the README stub before replacing it**

Run: `cat README.md`
Expected: exactly `# lucy`. If it contains anything else, stop and report.

- [ ] **Step 2: Write `CLAUDE.md`**

```markdown
# Lucy repo rules

Lucy is Adnan's personal Claude Code plugin: his own skills, commands, hooks, and agents. The repo root is the plugin and its own single-plugin marketplace. Design spec: docs/superpowers/specs/2026-08-26-lucy-claude-plugin-foundation-design.md. Structural decisions live in docs/adr/.

## Invariants

- skills/ holds only shipped skills. Work in progress lives in drafts/, retired skills in deprecated/. Promotion is moving the directory; plugin.json has no skills array.
- After adding, renaming, or removing a skill, re-run scripts/link-skills.sh.
- After touching anything in .claude-plugin/, run: claude plugin validate . --strict
- Structural decisions get an ADR in docs/adr/.
- A vendored third-party skill keeps its license file in its directory plus a provenance line naming the source repo, path, and commit.
- Repo prose (README, ADRs, specs, this file) follows the unslop skill's rules: no em dashes, no curly quotes, sentence-case headings, no decorative emoji, plain speech. skills/unslop/SKILL.md holds the full list.
- The dev machine uses symlinks only; never also install the lucy plugin there (every skill would load twice).
```

- [ ] **Step 3: Write `docs/adr/0001-repo-shape.md`**

```markdown
# 0001: Repo shape for the Claude plugin

Date: 2026-08-26
Status: accepted

## Context

Lucy ships Adnan's own skills, commands, hooks, and agents as a Claude Code plugin, with native Codex and OpenCode versions planned later. The studied reference, mattpocock/skills (commit 6654f6b), keeps lifecycle buckets (in-progress, deprecated) inside skills/ and curates the shipped subset through an explicit skills array in plugin.json. Its ADR-0002 records the cost: Codex plugin manifests accept a single skills path and drop symlinks on install, so a curated subset of a bucketed skills/ tree cannot be expressed, and a native Codex plugin was deferred.

## Decision

- The repo root is the plugin: .claude-plugin/plugin.json at the top, no nested plugins directory. .claude-plugin/marketplace.json makes the repo its own single-plugin marketplace for installs on other machines.
- skills/ holds only shipped skills. Work in progress lives in drafts/ (symlinked locally, never shipped). Retired skills live in deprecated/ (neither linked nor shipped).
- Promotion is by location: moving a directory from drafts/ to skills/ ships it. plugin.json omits the skills field and relies on default ./skills/ discovery, so there is no manifest array to keep in sync.
- skills/ stays flat for now. Categories are deferred until the count justifies them; the options then are an explicit skills array (the pattern mattpocock/skills verified) or verified recursive discovery.
- Versioning is manual: plugin.json carries a version bumped by hand. No changesets, no package.json.

## Consequences

- A future native Codex plugin can point at ./skills/ as its single path with no restructuring.
- Nothing enforces the shipped set beyond location: there is no array to forget, and also no explicit review gate on promotion.
- Renames and moves require re-running scripts/link-skills.sh; the script prunes its own dangling links.
```

- [ ] **Step 4: Replace `README.md`**

````markdown
# Lucy

Lucy is my personal plugin system: the home of my own skills, commands, hooks, and agents. It ships as a Claude Code plugin today; Codex and OpenCode versions come later and will use each provider's native capabilities.

## Dev machine

Clone, then link every shipped and draft skill into ~/.claude/skills as symlinks:

```bash
scripts/link-skills.sh
```

A git pull is enough to keep them current. New skills start in drafts/ (linked locally, not shipped). Moving a skill's directory into skills/ ships it. Retired skills go to deprecated/. List everything with scripts/list-skills.sh.

## Other machines

```
/plugin marketplace add adnancrnovrsanin/lucy
/plugin install lucy@lucy
```

Skills arrive namespaced, for example /lucy:unslop. Never install the plugin on a machine that already uses the symlinks; every skill would load twice.

## Layout

- .claude-plugin/: plugin and marketplace manifests
- skills/: shipped skills, flat
- drafts/: work in progress, never shipped
- deprecated/: retired, neither linked nor shipped
- scripts/: link-skills.sh, list-skills.sh
- docs/: ADRs and design specs
````

- [ ] **Step 5: Verify prose rules on all three files**

Run: `perl -CSD -ne 'print "$ARGV:$.: $_" if /[\x{2014}\x{2013}\x{201C}\x{201D}\x{2018}\x{2019}]/' CLAUDE.md docs/adr/0001-repo-shape.md README.md`
Expected: empty output.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/adr/0001-repo-shape.md README.md
git commit -m "docs: add repo rules, ADR-0001, and README

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: End-to-end validation (marketplace round trip, then dev-machine link)

**Files:**
- None created or modified. This task validates the foundation per the spec's definition of done. Runs after Tasks 1 to 5.

**Interfaces:**
- Consumes: marketplace `lucy` and plugin `lucy` (Task 1), `skills/unslop` (Task 2), `scripts/link-skills.sh` contract (Task 4).
- Produces: the dev machine's steady state (symlinks installed, no plugin installed).

- [ ] **Step 1: Full validation from a clean tree**

Run: `git status --porcelain` (expected: empty) then `claude plugin validate . --strict`
Expected: exit 0.

- [ ] **Step 2: Marketplace round trip, part 1 (add and install)**

Run, in order:

```bash
claude plugin marketplace add /Users/adnan/Projects/lucy
claude plugin install lucy@lucy
claude plugin list
```

Expected: add succeeds naming marketplace `lucy`; install succeeds; the list output contains the `lucy` plugin (from marketplace `lucy`), enabled or installed state visible.

- [ ] **Step 3: Marketplace round trip, part 2 (uninstall and remove)**

Run, in order:

```bash
claude plugin uninstall lucy
claude plugin marketplace remove lucy
claude plugin list
```

Expected: both commands succeed; the final list no longer shows `lucy`. The dev machine must end this step with NO lucy plugin installed (spec decision 7: symlinks only on the dev machine).

- [ ] **Step 4: Install the dev-machine steady state**

Run: `scripts/link-skills.sh`
Expected output includes: `linked unslop -> /Users/adnan/Projects/lucy/skills/unslop`

Run: `readlink ~/.claude/skills/unslop`
Expected: `/Users/adnan/Projects/lucy/skills/unslop`

Run: `test -f ~/.claude/skills/unslop/SKILL.md && echo ok`
Expected: `ok`

- [ ] **Step 5: Human acceptance (Adnan)**

In a NEW Claude Code session (skills load at session start), confirm `/unslop` appears and run it on a slop sentence, for example: `/unslop This groundbreaking, cutting-edge solution is a testament to our vibrant ecosystem.`
Expected: the skill rewrites the sentence per its rules. This step is the user's; report readiness and hand over.

---

## Self-review notes

- Spec coverage: decisions 1 and 3 land in Task 1; decision 2 in Tasks 1 and 4; decisions 4 and 5 in Tasks 1 and 5 (ADR); decision 6 in Task 5 (README scope); decision 7 in Task 6 (round trip ends uninstalled, symlinks last); decision 8 in Task 2 (LICENSE with provenance); decision 9 by adding no root LICENSE anywhere; decision 10 in the global constraints and Task 5 step 5. All component specs (manifests, unslop, both scripts, CLAUDE.md, ADR, README) have exactly one task each; the spec's four definition-of-done items map to Task 6 steps 1 to 5 plus per-task commits.
- Names used across tasks match: `lucy@lucy`, `scripts/link-skills.sh`, `scripts/list-skills.sh`, `skills/unslop`, `/lucy:unslop`.
- No placeholders: every file's full content or an exact fetch-and-verify recipe (with pinned SHA and sha256 sums) is in the task that creates it.
