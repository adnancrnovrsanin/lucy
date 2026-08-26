# Lucy Claude plugin foundation design

Date: 2026-08-26
Status: approved (design review in chat, 2026-08-26)

## Context

Lucy is Adnan's personal plugin system for development: the home where his own skills, commands, hooks, and agents are written, versioned, and installed from. A Claude Code plugin comes first. Codex and OpenCode versions come later and will use each provider's native capabilities rather than a lowest-common-denominator format.

This repo is a fresh start (a single "first commit" with a README). An earlier incarnation of Lucy built a provider-neutral core format with compiled adapters; that architecture is retired. The new direction is Claude-native first: content is written directly in Claude Code plugin format, and other providers are derived from it later.

The design borrows deliberately from two studied repos:

- mattpocock/skills (studied at commit 6654f6b): root-as-plugin shape, its own single-plugin marketplace, symlink-based local dev, repo invariants in CLAUDE.md, ADRs for structural decisions.
- cursor/plugins (studied at commit bdf7aa3): source of the first shipped skill, unslop, from the pstack plugin (MIT).

## Decisions

1. **Root is the plugin.** `.claude-plugin/plugin.json` sits at the repo root. There is no nested `plugins/` directory. `.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace, used as the install path on machines other than the dev machine.

2. **Lifecycle lives outside `skills/`.** `skills/` contains only shipped skills. Work in progress lives in `drafts/` (linked locally, never shipped). Retired skills live in `deprecated/` (neither linked nor shipped). Rationale: Codex plugin manifests accept a single skills path and drop symlinks on install (documented in mattpocock/skills ADR-0002, where lifecycle buckets inside `skills/` blocked a native Codex plugin). Keeping `skills/` shipped-only means a future Codex manifest can point at it directly.

3. **Promotion is by location.** Moving a skill from `drafts/` to `skills/` ships it. `plugin.json` omits the `skills` field, so Claude Code discovers `./skills/` by default and there is no manifest array to keep in sync.

4. **Flat `skills/` for now.** Category subdirectories are deferred until the skill count justifies them. If categories arrive, the options are an explicit `skills` array in `plugin.json` (Matt's verified pattern) or verified recursive discovery. Recorded in ADR-0001.

5. **Light versioning.** `plugin.json` carries a `version` (starting at `0.1.0`) bumped by hand when it matters. No changesets, no `package.json`, no release workflow. Dev machines track git directly.

6. **Personal now, public maybe.** Short README, no per-skill docs pages, no install marketing. The structure stays compatible with going public later without restructuring.

7. **Symlinks on the dev machine, plugin install elsewhere.** Never both on one machine, because that loads every skill twice.

8. **Vendored skills keep their license and provenance.** A third-party skill copied into Lucy keeps its license text in its directory and a provenance note naming the source repo, path, and commit.

9. **No repo license yet.** The repo stays unlicensed (all rights reserved) while personal. `skills/unslop/LICENSE` covers the vendored content. Revisit if Lucy goes public.

10. **Unslop rules apply to repo prose.** README, CLAUDE.md, ADRs, and specs follow the unslop skill's writing rules (no em dashes, sentence-case headings, no decorative emoji, plain speech). The first skill polices its own house.

## Repo structure

```
lucy/
├── .claude-plugin/
│   ├── plugin.json          # plugin "lucy"
│   └── marketplace.json     # repo as its own single-plugin marketplace
├── skills/                  # shipped skills only, flat
│   └── unslop/
│       ├── SKILL.md         # vendored from cursor/plugins (pstack)
│       └── LICENSE          # MIT notice from pstack
├── drafts/                  # WIP: linked locally, never shipped
├── deprecated/              # retired: neither linked nor shipped
├── scripts/
│   ├── link-skills.sh       # symlink skills/* and drafts/* into ~/.claude/skills/
│   └── list-skills.sh       # inventory across all three buckets
├── docs/
│   ├── adr/
│   │   └── 0001-repo-shape.md
│   └── superpowers/specs/   # design specs (this file)
├── CLAUDE.md                # repo invariants
└── README.md                # what Lucy is, install, dev loop
```

`drafts/` and `deprecated/` start empty and carry a `.gitkeep`. Directories for hooks, agents, and commands are not created until their first content exists; the plugin manifest already looks for them at their default paths when they appear.

## Component specs

### plugin.json

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

No `skills` field (decision 3). Fields are added only when they earn their place.

### marketplace.json

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

Install on non-dev machines: `/plugin marketplace add adnancrnovrsanin/lucy`, then `/plugin install lucy@lucy`. Skills arrive namespaced (`/lucy:unslop`).

### skills/unslop

`SKILL.md` is copied verbatim from `cursor/plugins` at commit `bdf7aa355337897f167153e05069aca505dae17c`, path `pstack/skills/unslop/SKILL.md`. Frontmatter (`name: unslop`, model-invocable) stays unchanged. Local adaptations may come later; the first version is a faithful copy.

`LICENSE` is the MIT text from `pstack/LICENSE` (copyright Lauren Tan), with a provenance header line naming the source repo, path, and commit.

### scripts/link-skills.sh

Links every skill in `skills/` and `drafts/` into `~/.claude/skills/<name>` as a symlink to the skill directory in this repo. Behavior:

- Idempotent: re-running refreshes links (`ln -sfn`).
- Refuses collisions: if the target exists and is not a symlink into this repo, the script errors and touches nothing. It never deletes foreign content (the dev machine's `~/.claude/skills` holds third-party installs).
- Prunes its own dangling links: a symlink in `~/.claude/skills` that points into this repo but whose source no longer exists (renamed, moved to `deprecated/`) is removed.
- Skips `deprecated/`.
- Targets only `~/.claude/skills` for now. Linking into `~/.agents/skills` arrives with the Codex track.

### scripts/list-skills.sh

Prints every `SKILL.md` path under `skills/`, `drafts/`, and `deprecated/`, labeled by bucket.

### CLAUDE.md

Invariants, kept short:

- `skills/` holds only shipped skills. WIP lives in `drafts/`, retired skills in `deprecated/`.
- After adding, renaming, or removing a skill, re-run `scripts/link-skills.sh`.
- After touching `.claude-plugin/*.json`, run `claude plugin validate . --strict`.
- Structural decisions get an ADR in `docs/adr/`.
- Vendored third-party skills keep their license file and a provenance line.
- Repo prose follows the unslop skill's rules.

### docs/adr/0001-repo-shape.md

Records decisions 1 through 5 with the Codex single-path rationale and the deferred-categories options, so the reasoning survives this chat.

### README.md

What Lucy is (one paragraph), the dev-machine loop (clone, `scripts/link-skills.sh`), the other-machine install (marketplace add + install), and the promotion model (drafts to skills by moving the directory).

## Validation (definition of done)

1. `claude plugin validate . --strict` passes.
2. `scripts/link-skills.sh` runs cleanly; a new Claude Code session can invoke `/unslop`.
3. One-time marketplace round trip: add the repo as a local marketplace, install, confirm the skill resolves as `/lucy:unslop`, then uninstall and remove the marketplace so the dev machine returns to symlinks only.
4. Everything committed on `master`.

## Out of scope

Hooks, agents, and commands content; Codex and OpenCode adapters; skill categories; per-skill docs pages; changesets or any release automation; graphify migration (it is an installer-managed Python application, not an authored markdown skill; where it lives is a separate decision); publishing to any official marketplace.
