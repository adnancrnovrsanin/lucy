# Provenance

Authored for Lucy from the sources below, studied 2026-10-27; reports in .lucy/notes/2026-10-27-forms-research/ (not shipped).

## https://github.com/danielmeppiel/form-builder, commit 6be19fcbba6ac9f114175e7df14cfe5688e247fa

Taken: ideas only. Aria wiring of hints and errors with aria-describedby (forms/feedback.md, Announcements) and autocomplete tokens on personal-data fields (forms/autofill.md, Autocomplete tokens). Its other ideas (schema at module level, setError for server errors, reset after success) did not land as playbook text. The repository states the MIT License in README.md and SKILL.md and ships no license file.
Changed: no text copied. Its onBlur and onChange validation timing is replaced by the size-based timing in feedback.md (blur for small forms, submit for medium, section end for large, live revalidation after the first check).

## https://github.com/ancoleman/ai-design-components, commit 76551b7b19ebc667764ec75da14990d0aef8b6e5, path skills/building-forms

Taken: ideas for the option-count thresholds in forms/field-map.md (fixed sets of values), the per-step validation strategy and draft rules in forms/multi-step.md (Validation, Drafts), the conditional-field rules and async-check practices in forms/feedback.md (Conditional fields, Async checks), and the anti-pattern style of the scan rules.
Changed: the code is not used, because it does not run; every rule is restated in our words and the thresholds follow the decisions recorded in the synthesis (5 or fewer options for radios, Select from 6, Combobox above 30).

## https://github.com/secondsky/claude-skills, commit 88378361314f558fb719aec0af9fd898ab36f0b2, path plugins/react-hook-form-zod (first published in jezweb/claude-skills)

Taken: the server error envelope with a form-level fallback (feedback.md, Server errors), empty string mapped to undefined or null and the `z.coerce` traps (field-map.md, Value rules), edit-form reset when the record arrives, array min and max driving Add and Remove (field-map.md, Arrays and nested objects), per-step validation from the step's schema keys (multi-step.md), and the `shouldUnregister` default.
Changed: restated as short rules; its templates that fail on these points are reproduced only as negative fixtures for the scan rules (coerce-boolean, coerce-number-optional, index-key-field-array).

## https://github.com/vantezzen/autoform, commit 212cc51a677433cb006678348059dda6920703f1, path skills/autoform

Taken: the resolution order in forms/field-map.md ("How to use this map": project convention, then the row for the kind, then stop and decide), the field inventory of forms.md step 3, and the slot table that opens each stack note (forms/stacks/shadcn.md, heroui.md, heroui-native.md), modelled on its adapter contract.
Changed: the library's API is not used; the slots are renamed for the three supported stacks and the override precedence is reduced to the three-step order.

## https://github.com/shadcn-ui/ui, commit 96da9cc7f1aa10580a3741664e2a77c721206c00, paths apps/v4/content/docs/forms and apps/v4/content/docs/components/radix

Taken: the Field and form library binding recipes, the FieldError contract, the date picker recipes per data shape (Basic, DOB, Input, Time, Range), the Combobox API and async recipe, the date-fns locale rule, and the Base UI versus Radix caveat, all in forms/stacks/shadcn.md.
Changed: the Select, Checkbox, RadioGroup, and Switch snippets drop `ref` and `onBlur`, so our recipes forward both; `aria-describedby` is added because `field.tsx` does not wire it; the length-mirroring advice is reversed (no `maxLength`, see field-map.md). Facts rechecked against the repository are listed in the shadcn note's Checked facts.

## https://github.com/vercel-labs/web-interface-guidelines, commit 434b7f91364665f2f733b310ec54809bf8f37937

Taken: the submit, autofill, paste, trim, focus, locale, and unsaved-changes rules (forms/feedback.md Pending and Unsaved changes, forms/autofill.md, forms/field-map.md Value rules) and the seeds for scan rules such as paste-blocked, autofocus, viewport-zoom-blocked, placeholder-ellipsis, no-unsaved-guard, and date-format-no-locale.
Changed: rewritten as playbook steps and scan rules with fixtures; the guidance on disabled submit is tightened to aria-disabled while pending (see feedback.md, Pending).

## https://github.com/coreyhaines31/marketingskills, commit 17772c7a80b7b8c7a47af30f648374cd8bd8adc5, paths skills/cro and skills/signup

Taken: the field cost audit in forms.md step 4, the public acquisition split above 5 fields and the step design order in forms/multi-step.md, the success-state rule, the password rules (minimum 8, no maximum, paste allowed), and the lookup fallback rule in forms/autofill.md.
Changed: the audit is folded into the model-based audit (server-set, known, derivable, deferrable, duplicate); conversion statistics are not carried over.

## https://github.com/jakubkrehel/skills, commit 592aedc44d7d5b3e29740984252902f3e5402a1c, path skills/better-accessibility

Taken: the announcement ladder in forms/feedback.md (Announcements: focus move, aria-describedby, role="status", role="alert"), the pending button through `aria-disabled`, the live-region and toast rules, the `type` and `inputmode` table in forms/autofill.md (Keyboards), and the drag alternative in field-map.md.
Changed: the ladder is cut to four ordered steps; the severity calibration becomes the error and warning split of the scan; assertive regions are excluded.

## https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, commit 28b3b8dee8c976df4fa3e94aed4e092ad43fcb03, path .claude/skills/ui-ux-pro-max/data/ux-guidelines.csv

Taken: the shape of a scan rule record with good and bad fixtures (scripts/rules/forms/ and tests/rules.test.mjs), the focusable error summary in feedback.md, and the redundant-entry and accessible-authentication ideas (WCAG 2.2 3.3.7 and 3.3.8) behind the "never ask twice" rule in multi-step.md.
Changed: only the rule shape and the ideas; no CSV rows are copied.

## https://github.com/Owl-Listener/designer-skills, commit 9a6930cf84a822eb458624bd11c61aac5bbdf224, path interaction-design

Taken: the option cutoff at 5, the review step for high-stakes forms (forms.md step 5, multi-step.md Review step), nothing preselected for consent (preselected-consent rule), and testing with real data (forms/checklist.md, Real data).
Changed: restated as checklist items and one scan rule.

## https://github.com/ibelick/ui-skills, commit 59193a75432e5f41c6980f53b9e6a7bd56919947, path skills/fixing-accessibility

Taken: the rule to never bring in a second UI library and to use the established primitives (SKILL.md step 2, "the form is built from that library's components only"), and seeds for the unlabeled-control and role-without-keys rules.
Changed: folded into the component inventory step.

## https://github.com/vibeeval/vibecosystem, commit 3b763b1fb288f57bfa3cce76ef18184b96461a78, path skills/form-validation

Taken: a cross-check list of form guidelines used to test that no common rule was missing from forms/feedback.md and forms/checklist.md.
Changed: no text carried over; items it had that we lacked were added in our words.

## https://github.com/omer-metin/skills-for-antigravity, commit e8dcf4e8737921a10088bd5c9eb65e81f74c051f, path skills/forms-validation

Taken: the record shape for anti-patterns (a named mistake, why it fails, the fix) that the scan rules and the Pitfalls sections of the stack notes follow.
Changed: shape only; no text carried over.

## https://github.com/TerminalSkills/skills, commit 3bfbf7f76459d89422eddc0e5f572ad0e6c393c9, path skills/react-hook-form

Taken: checks on the React Hook Form recipes in the stack notes (controller wiring, field arrays, reset) used as a second reading.
Changed: no text carried over.

## https://github.com/aj-geddes/useful-ai-prompts, commit 3f5182cfd739fc113f4af5244a1cf342ad7f7911, path skills/form-validation

Taken: scan candidates for bugs agents produce by default, among them money-tofixed, swallowed-submit-error, reset-in-catch, and nested-useform.
Changed: each candidate was rewritten as a rule with its own good and bad fixture; none of its code is used.

## HeroUI web and Native open-source docs: heroui-inc/heroui branch v3 at 70a11531fedfb39b6a0748ca49766266108362ae and heroui-inc/heroui-native at dc6833e906f36cb0f11283df0c7fdda2170a6413, with React Aria docs from adobe/react-spectrum at 06891def3e7488f4e598debb8418bf17cf060279, read 2026-10-27

Taken: the control matrix per platform, the React Aria validation model (`validationBehavior="aria"` with a form library, errors through FieldError), the React Hook Form recipes, the `@internationalized/date` conversion table, the async list recipe, and the pitfalls in forms/stacks/heroui.md and forms/stacks/heroui-native.md, plus the DateField auto-advance fact.
Changed: restated and shortened; versions are pinned in each note's Checked facts (`@heroui/react` 3.2.6, `heroui-native` 1.0.11, `react-aria-components` 1.21.1). Licensed Apache-2.0; none of the repositories has a NOTICE file (checked 2026-10-27).

## HeroUI Pro docs (heroui.pro), read 2026-10-27

Taken: facts only, restated in our own words: which Pro components exist per platform (marked "Pro" in the slot and control tables of the two HeroUI notes), their handler names, value shapes, and defaults.
Changed: nothing was copied. Pro is under the HeroUI Pro License Agreement. The notes tell the agent to read the installed package's types before relying on a Pro row, because a Pro beta can change.

## GOV.UK Design System (https://design-system.service.gov.uk), the patterns and components listed in report-govuk-webdev-whatwg.md, read 2026-10-27

Taken: the error summary mechanics (forms/feedback.md, Error summary), the error message templates (Message shapes), the check answers review step (forms/multi-step.md, Review step), the memorable-date three-input rule, name, phone, address, password, and card field rules in forms/field-map.md, and the maxlength correction behind the character count rule.
Changed: templates are generalized to "<thing>" patterns and told to follow the app's language and i18n setup; the date, address, and phone rules are shortened to the decisions the playbook needs.
Contains public sector information licensed under the Open Government Licence v3.0.

## web.dev sign-in, sign-up, and payment and address form best practices (Sam Dutton), read 2026-10-27, CC BY 4.0

Taken: the field guidance in forms/autofill.md (autocomplete tokens for sign-in, sign-up, payment, and address forms, the input help lists, `one-time-code`) and the matching text rules in forms/field-map.md, including the show and hide password toggle.
Changed: condensed into token tables and short rules; credited at the end of forms/autofill.md.

## WHATWG HTML Living Standard section 4.10.19.7, snapshot 939677714df7379fee3667040113b41c91c851e7, read 2026-10-27

Taken: the autofill token table in forms/autofill.md (CC BY 4.0) and the token data in scripts/rules/forms/autofill-tokens.mjs (BSD 3-Clause), including the element allow-list used by the autocomplete-invalid rule.
Changed: the table is reformatted as Markdown and the data as a module; tests/autofill-tokens.test.mjs checks that the two stay in step.

## Facts confirmed during the build, each with its URL and date

Taken: facts, not text. All read 2026-10-27.
- https://react-hook-form.com/docs/useform and its trigger page: defaults of `mode`, `reValidateMode`, `shouldFocusError`, `shouldUnregister`, and the `trigger` and `shouldFocus` behavior (forms/feedback.md).
- https://reactnative.dev/docs/textinput: `autoComplete`, `textContentType`, and `keyboardType` values (forms/autofill.md, React Native; forms/stacks/heroui-native.md).
- https://github.com/adobe/react-spectrum, `packages/react-aria/src/datepicker/useDateSegment.ts`: segment auto-advance (forms/stacks/heroui.md).
- https://react-aria.adobe.com/forms and https://react-aria.adobe.com/NumberField: the validation model and the `NaN` value of an unparsed number (heroui.md).
- https://heroui.com/react/llms.txt, https://heroui.com/native/llms.txt, and https://heroui.com/docs/native: component lists for web and Native (heroui.md, heroui-native.md).
- shadcn-ui/ui at 96da9cc: date picker and combobox recipes, `field.tsx` without `aria-describedby`, the registry `combobox.tsx` for the base and aria bases (shadcn.md).
- `npx shadcn@latest init --help`, run 2026-10-27: the `aria` base value that components.json docs do not describe (shadcn.md).
- https://github.com/react-hook-form/resolvers/releases: v6.0.0 (2026-10-19) and v6.0.1 (2026-10-27) release notes and the `zodResolver` usage (shadcn.md).
- https://base-ui.com/react/components/combobox.md: `filter`, `filter={null}`, and `onInputValueChange` for async search (shadcn.md).
- https://github.com/TanStack/form, `framework/react/guides/dynamic-validation.md`: `revalidateLogic` is required for `onDynamic` (shadcn.md).
Changed: each fact is stated once in the note that uses it; the notes' Checked facts sections hold the detail.

## Tier

model-invoked (tier 2): the model must apply it unasked whenever it builds or changes a form or input flow (ADR-0008).
