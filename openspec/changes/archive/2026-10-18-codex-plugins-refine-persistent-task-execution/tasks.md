## 1. Complete execution phases

- [x] 1.1 Rewrite the shared Skill around upfront discovery, decision-dependent phase boundaries, scope-based authorization, in-scope recovery, independent continuation, and safe resume; verify every changed requirement is represented without routine phase gates.
- [x] 1.2 Update PLAN, LOG, and interaction templates to record authorization and real decision dependencies; verify checkpoints continue covered work and no fixed phase count or per-phase approval is prescribed.

## 2. Consistency and verification

- [x] 2.1 Update README, Codex interface text, and behavioral examples for complete phases, conditional policies, execution-dependent decisions, recovery, and legacy resume; verify adapters and explicit-only invocation remain compatible.
- [x] 2.2 Run Skill structural/reference/metadata validation, review behavioral scenarios against the delta, and run strict OpenSpec validation plus diff checks; verify generated OpenSpec adapters and unrelated plugin content remain unchanged.

Verification evidence:
- Skill validator passed with Python UTF-8 mode; all 10 local Markdown reference links, metadata, and code fences passed structural checks.
- Six behavioral scenarios were reviewed against the delta: complete environment setup, policy-based file organization, bounded troubleshooting, execution-dependent trial choice, recovery/local blockers, and legacy resume. This was instruction review, not a live Codex/Hermes execution test.
- The delta passed strict OpenSpec validation, and the existing 68 main capabilities passed strict validation before sync. Surviving scenario names were checked against the original requirements.
- Diff checks passed. Exactly seven implementation files changed, all inside the selected Skill; both invocation adapters, generated OpenSpec skills, and other plugin contents remained unchanged.
- After sync, all 68 main capabilities passed strict validation; all three delta blocks matched the merged main spec and all 12 original scenarios survived. Both unchanged requirements were preserved exactly.
- This archived change passed the CLI archive check with all four tasks complete. The full archive scan reported two pre-existing incomplete-task findings in `2026-07-02-use-main-backend-image-tag` and `2026-07-18-add-cthu-codex-notion-album-skill`; neither was modified.
