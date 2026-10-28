# Provenance

Authored for Lucy from the sources below, studied 2026-10-27; reports in .lucy/notes/2026-10-27-forms-research/ (not shipped).

The scan, its rules and tests, and the forms checklist moved to skills/inspect on 2026-10-27 (ADR-0009); the sections below still record what each source contributed to that material.

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

Taken: the shape of a scan rule record with good and bad fixtures (skills/inspect/scripts/rules/forms/ and skills/inspect/tests/rules.test.mjs), the focusable error summary in feedback.md, and the redundant-entry and accessible-authentication ideas (WCAG 2.2 3.3.7 and 3.3.8) behind the "never ask twice" rule in multi-step.md.
Changed: only the rule shape and the ideas; no CSV rows are copied.

## https://github.com/Owl-Listener/designer-skills, commit 9a6930cf84a822eb458624bd11c61aac5bbdf224, path interaction-design

Taken: the option cutoff at 5, the review step for high-stakes forms (forms.md step 5, multi-step.md Review step), nothing preselected for consent (preselected-consent rule), and testing with real data (skills/inspect/forms/checklist.md, Real data).
Changed: restated as checklist items and one scan rule.

## https://github.com/ibelick/ui-skills, commit 59193a75432e5f41c6980f53b9e6a7bd56919947, path skills/fixing-accessibility

Taken: the rule to never bring in a second UI library and to use the established primitives (SKILL.md step 2, "the form is built from that library's components only"), and seeds for the unlabeled-control and role-without-keys rules.
Changed: folded into the component inventory step.

## https://github.com/vibeeval/vibecosystem, commit 3b763b1fb288f57bfa3cce76ef18184b96461a78, path skills/form-validation

Taken: a cross-check list of form guidelines used to test that no common rule was missing from forms/feedback.md and skills/inspect/forms/checklist.md.
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

Taken: the autofill token table in forms/autofill.md (CC BY 4.0) and the token data in skills/inspect/scripts/rules/forms/autofill-tokens.mjs (BSD 3-Clause), including the element allow-list used by the autocomplete-invalid rule.
Changed: the table is reformatted as Markdown and the data as a module; skills/inspect/tests/autofill-tokens.test.mjs checks that the two stay in step.

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

## Tables playbook sources, studied 2026-10-27 and 2026-10-28

## https://github.com/TanStack/table, commit c14e0221b1e656c7bb35e7b3d4cdf188719a3599 (MIT)

Taken: the client or server rule, the server checklist, the feature registration rule, the v8 and v9 table, and the virtualization rules, in tables/data-flow.md, tables/rendering.md, and tables/stacks/tanstack.md, plus the v9 feature and factory names as facts.
Changed: restated in our words and cut to decisions the playbook needs; the registration rule comes from its bundled agent skills, and the v9 names are marked in tanstack.md as something to confirm against the installed table-core.

## https://github.com/heroui-inc/heroui, branch v3 at commit 70a11531fedfb39b6a0748ca49766266108362ae (Apache-2.0)

Taken: the TanStack composition in tables/stacks/heroui.md, adapted from its TanStack table demo.
Changed: the server flags, the selection bridge, and leaf headers are added; none of them is in the demo. The note's Checked facts pin what was read.

## https://github.com/adobe/react-spectrum, commit 3280ed4b0e65cfce16ae2767aba52a5f9a8ad4d6 (Apache-2.0)

Taken: facts only, in tables/stacks/heroui.md Checked facts: the grid role, `aria-sort`, the row header requirement, keyboard resize, and the Virtualizer.
Changed: no code or text copied; each fact is stated once with its file and line.

## https://github.com/bvaughn/react-window, commit dfbfc501350e7b60eed8a17bbfb2bfff22daf65d (MIT)

Taken: the idea behind the accessible virtual markup in tables/rendering.md.
Changed: restated as a rule; none of its code is used.

## https://github.com/ag-grid/skills, commit ef483f7f9e8cc9e5f359144d11317cd4094d5b8e (MIT)

Taken: the container height, module registration, stable props, and purpose-built feature rules in tables/stacks/ag-grid.md (adapted from its ag-dev skill).
Changed: restated and shortened. The AG Grid licensing facts (the licence key set with the `licenseKey` prop on `AgGridProvider` from v35.1, `LicenseManager` before, and which row models are Enterprise) were read from ag-grid.com on 2026-10-28 and are recorded in the note's Checked facts.

## https://github.com/react-querybuilder/react-querybuilder, commit 851ed07541b566e9d45ff7186fe7687b5bdbc5ad (MIT)

Taken: the allow-list rule and the diagnostic codes in tables/filtering.md.
Changed: reduced to the rule for turning a filter state into a server query, and the codes a server returns when it refuses one.

## https://github.com/w3c/aria-practices, commit 0f765e4dc33e966026114ac12a8380db1de3b787 (W3C Software and Document License)

Taken: the sort header pattern and the grid keys in tables/look.md.
Changed: restated as short rules; no example code is copied.

## Ideas only, no text copied

- tablecn at commit 8ed90808cb19eeac53dc058d48853fc7f68230f4 (MIT), data-table-filters at dd87f2770048f1b805d497f1c763794e060781c1 (MIT), and diceui at 061d7b67ef233c531f2c86448741f0b37b3d3583 (MIT).
- shadcn-ui/ui at 96da9cc7f1aa10580a3741664e2a77c721206c00 (MIT).
- Material React Table and Mantine React Table (MIT).
- Supabase at 845ed5a1e3e8e39f8eef41b2875be4e7a9b8bdfc (Apache-2.0) and PostHog at fbf1e0015fba76b0e5407a308ed4fad3342049f8 (MIT outside ee/).
- Carbon at 5e9cd1da43c32d3d3b991dc947b427f674da61a8 (Apache-2.0), Primer at 87f799f202ec95df15c99f473c9c0c803da8e6b3 (MIT), Polaris at 3f7954ae42fabf26d63cee68c23ceebfd7ef0972 (MIT), and GOV.UK Design System at 14ef0f3cad54b5e42c58b4a080d2dd54617b443a (MIT).
- nuqs at d9dc5c2a51af9d1d6276e002415028e194bcfaab (MIT) and liqe at 011ff2a0602309cae84f7074959e40f88090c747 (BSD-3-Clause).

## Ideas only, licence forbids copying

Twenty, Plane, and Dub (AGPL-3.0), and the build000r and oakoss skills (no licence). They were read for ideas and nothing from them is in the playbook.

## Ideas only, docs and articles read 2026-10-27 and 2026-10-28

NN/g on data tables and infinite scrolling, Adrian Roselli's three table articles, Sarah Higley on grids, Pencil & Paper, and the Linear, Attio, Notion, Airtable, Stripe, Retool, Clay, and Vercel Geist docs.

Research reports and the synthesis are in .lucy/notes/2026-10-27-tables-research/ (not shipped).

## Tier

model-invoked (tier 2): the model must apply it unasked whenever it builds or changes a form or input flow (ADR-0008).
