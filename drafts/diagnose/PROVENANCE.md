# Provenance

Merged skill.

## https://github.com/mattpocock/skills, commit 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, path skills/engineering/diagnosing-bugs

Taken: the redact rule; phases 1 to 6 (build a feedback loop, reproduce and minimise, hypothesise, instrument, fix and regression test, cleanup) as the spine; scripts/hitl-loop.template.sh verbatim.
Changed: renamed to diagnose with a trigger-first description; item 0 (read the whole error and stack trace, check recent changes) added to the phase 1 constructions; phase 2b inserted between phases 2 and 3; the breaker inserted between phases 5 and 6; headings set in sentence case; the en dash in the hypothesis range and the multiplication glyph in the loop count written as words ("3 to 5", "100 times"); the "debugging superpower" aside dropped from the tighten-the-loop paragraph.

## https://github.com/obra/superpowers, version 6.3.0, path skills/systematic-debugging

Taken: the root-cause principle as one sentence in the opening; pattern analysis as phase 2b; the multi-layer instrumentation example under phase 4; the breaker (three failed fixes put the architecture in question); the no-root-cause handling; the rationalization table trimmed to five rows; the reference files root-cause-tracing.md, condition-based-waiting.md, condition-based-waiting-example.ts, and defense-in-depth.md.
Changed: the single-hypothesis rule replaced by Matt's ranked hypotheses; the Iron Law, red flags, partner signals, quick reference, and the phase 4 implementation steps (with their references to the upstream tdd and verification skills) dropped in favour of Matt's phases 5 and 6; CREATION-LOG.md, test-academic.md, test-pressure-1.md to test-pressure-3.md, and find-polluter.sh dropped, with the polluter section of root-cause-tracing.md rewritten as prose that no longer names the script; reference file headings set in sentence case; arrow, check, and cross glyphs written as words; hyphens used as dashes replaced by punctuation.

## Tier

model-invoked (tier 2): the model must apply it unasked when anything is broken, failing, or slow.
