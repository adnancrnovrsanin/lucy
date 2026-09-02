# Provenance

Merged skill.

## https://github.com/obra/superpowers, version 6.3.0, path skills/requesting-code-review

Taken: the flow (when to request review, how to request, act on feedback by severity), the dispatch of a reviewer subagent with crafted context and never with session history, the severity levels Critical, Important, and Minor, the rationalizations table, the red flags, the example, and the code-reviewer.md template (read-only rule, no-subagents rule, quality checklist, calibration, output format, critical rules).
Changed: step 1 became fixed-point pinning (a SHA, branch, tag, or HEAD~N from the user or the calling skill, confirmed with git rev-parse and a non-empty three-dot diff, asked for when missing); step 2 gained the spec-source lookup under .lucy/specs/, .lucy/plans/, a brief, or an issue; the dispatch and the template report on two axes under Standards and Spec headings with a severity list per axis and never rerank across axes; disagreement with a finding routes through the review-feedback skill; the plan path in the example moved to .lucy/plans/; the template's plan-alignment checklist folded into the Spec axis and the quality checklist into the Standards axis; em dashes, Title Case headings, and the upstream project name removed.

## https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, path skills/engineering/code-review

Taken: the two axes, Standards and Spec, reported separately and never reranked against each other; the Fowler smell baseline as twelve labelled heuristics that a documented repo standard overrides and that skip whatever tooling enforces; the spec-source lookup order; the pinning step (git rev-parse, three-dot diff, non-empty check, ask when unspecified); the reasons the axes stay separate.
Changed: folded into the reviewer template and the request steps of one dispatched reviewer instead of two parallel subagents plus an aggregation step; the issue-tracker lookup and its setup command dropped; spec paths moved to .lucy/specs/ and .lucy/plans/; the arrows in the smell list became "Fix:" sentences; the 400-word caps dropped in favour of the template's severity format.

## Tier

model-invoked (tier 2): called mid-flow by execute and finish; typed by the user for any diff.
