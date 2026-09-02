# Provenance

Single source.

## https://github.com/Leonxlnx/unlazy, commit 473d4b80421c36d733042434cd4b938f81a19ef1, path whole repository except .git, .github, README.md, CHANGELOG.md, CONTRIBUTING.md, .gitignore, scripts/install-hooks.mjs

Taken: SKILL.md (gates before work, modes, the depth tree, four passes per leaf, honest gate authoring, final audit, attention rules); references/ (gates, method, orchestration, dispatch, parallel, token-economy); templates/ (PLAN, gates-leaf, gates-node); scripts/ (gate-check, gate-lint, dispatch-check, stop-hook, lib/); tests/; SECURITY.md; research/validation-protocol.md; package.json.
Changed: state re-pathed from `.unlazy/` to `.lucy/gates/` (solo ledger at `.lucy/gates/GATES.md`, scopes at `.lucy/gates/<scope>/`, hook state at `.lucy/gates/hook-state.json`) and approvals from `~/.unlazy/approved` to `~/.lucy/approved`, with `UNLAZY_*` environment names kept; scripts/install-hooks.mjs and its tests dropped because Lucy registers the Stop hook itself; the SKILL.md hook section replaced and an "execute drives, unlazy proves" section added; description rewritten trigger-first; SECURITY.md installer section replaced with the Lucy hook registration; package.json renamed; tests re-pathed so they build the new layout; unslop pass on the prose.

## Tier

model-invoked (tier 2): the model must apply it unasked on substantial multi-part autonomous work; a completion ledger only helps when the model reaches for it.
