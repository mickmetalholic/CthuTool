## 1. Native Hermes inventory

- [x] 1.1 Implement the read-only recursive scanner with package identity, ownership exclusions, native creation classification, uncertainty reporting, and fingerprints; verify temporary-home behavioral tests cover those outcomes and preserve all scanned files.
- [x] 1.2 Update the promoter, promotion contract, and invocation text for separate uncertain-source confirmation, portable evidence, and exact nested-package retirement; verify contract tests and Skill validation pass.

## 2. Integration validation

- [x] 2.1 Run the focused scanner and promoter tests, formatting, strict OpenSpec validation, and reference/scope checks; verify generated workflows and business plugin content are unchanged.
- [x] 2.2 Run a read-only scan against the installed Hermes tree and review recorded/uncertain/excluded results; verify no local Skill or metadata was changed.

## Validation evidence

- Focused Bun tests: 27 passed, 0 failed; temporary-home cases cover nested identities, native evidence, broken lineage, uncertain hints, managed/unsafe exclusions, environment-expanded external paths, and read-only behavior.
- Focused TypeScript check, Biome lint/format, Skill quick validation, strict OpenSpec validation, local references, and diff scope checks passed.
- Live Hermes scan: 9 recorded local creations, 25 source-uncertain packages, 57 exclusions, no scanner warnings. Active Skill files and ownership/provenance metadata hashes matched before and after scanning.
- No local Skill was promoted or retired. Installed Skills, Hermes metadata, generated workflows, and business plugin content were unchanged.
