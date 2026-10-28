# Provenance

Split from skills/craft on 2026-10-27 (ADR-0009). The scan in scripts/ (reader, stack detector, engine, 70 rules, and their tests) and the forms checklist were authored for Lucy in the craft build, from the sources named in skills/craft/PROVENANCE.md, which records what each source contributed. LICENSE repeats craft's notices because that material moved here. Added in the split, and authored for Lucy: SKILL.md, forms/reviewer.md, the fix-by pointers, the checklist ids, and the --inventory flag.

## Tables rules and reviewer, 2026-10-28

The 55 table rules in scripts/rules/tables/, the tables checklist, the tables reviewer, the table stack detection, and the tables inventory were authored for Lucy. Rule ideas came from the sources below, which skills/craft/PROVENANCE.md records with their licences. A fix commit (f5292e8) narrowed several rules after they misfired on clean code: constant SQL, paging parameters, pass-through wrappers, select-all checkboxes, and small spinners.

- https://github.com/TanStack/table, commit c14e0221b1e656c7bb35e7b3d4cdf188719a3599 (MIT): the engine and virtualizer rules, from its docs and bundled skills.
- https://github.com/react-querybuilder/react-querybuilder, commit 851ed07541b566e9d45ff7186fe7687b5bdbc5ad (MIT): the server translation rules.
- https://github.com/ag-grid/skills, commit ef483f7f9e8cc9e5f359144d11317cd4094d5b8e (MIT): the AG Grid rules.
- https://github.com/w3c/aria-practices, commit 0f765e4dc33e966026114ac12a8380db1de3b787 (W3C Software and Document License), and Adrian Roselli's table articles: the semantics rules.
- https://github.com/sadmann7/tablecn at commit 8ed90808cb19eeac53dc058d48853fc7f68230f4 (MIT) and https://github.com/openstatusHQ/data-table-filters at dd87f2770048f1b805d497f1c763794e060781c1 (MIT): defects found in them became the money, locale, LIKE, and error-as-empty rules. Only the defect patterns are used, as negative fixtures; none of their code is shipped.

## Details rules and reviewer, 2026-10-28

The 68 details rules in scripts/rules/details/, the details checklist, the details reviewer, the details stack detection, and the details inventory were authored for Lucy. Rule ideas came from the sources below, which skills/craft/PROVENANCE.md records with their commit and licence. LICENSE carries their notices.

- https://github.com/primer/design (MIT) and https://github.com/patternfly/patternfly-org (MIT): the saving, heading level, and no-access rules.
- https://github.com/carbon-design-system/carbon-website (Apache-2.0): the read-only value rule.
- https://github.com/marmelab/react-admin, https://github.com/marmelab/atomic-crm, https://github.com/marmelab/shadcn-admin-kit, https://github.com/refinedev/refine, https://github.com/medusajs/medusa, and https://github.com/Kiranism/next-shadcn-dashboard-starter (MIT): defects found in them became the catch-all state, missing not-found, missing title, endless loading, and shared query rules. Only the defect patterns are used, as negative fixtures; none of their code is shipped.
- Framework and standards docs (Next.js, React, TanStack, React Router, nuqs, Expo, React Native, WCAG, WAI-ARIA APG, RFC 9110, OWASP): cited in each rule's ref string, not copied.
- Ideas only: Cloudscape (tab limits), Elastic EUI (page template states), and Plane (AGPL-3.0, a defect pattern; no code).

## Tier

model-invoked (tier 2): review-changes and craft's proof step call it mid-flow, and the model applies it unasked when asked to check an implementation (ADR-0009).
