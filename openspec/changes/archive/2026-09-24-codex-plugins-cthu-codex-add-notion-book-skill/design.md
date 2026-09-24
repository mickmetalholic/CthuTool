## Context

See proposal.md for motivation. A two-file `notion-manage-books` draft already exists in the working tree. The plugin manifest discovers `./skills/`, so no new registration mechanism is needed. Existing Notion skills use `notion-` names and `Notion ·` display names.

The separate `notion-maintain-books` skill and its documentation already describe an implicit, preview-confirmed, single-book workflow with preview-only removal. Those policies differ from the user's requested lightweight manual CRUD skill. This change adds the explicitly selected `notion-manage-books` entrypoint and does not replace or inherit the other skill's workflow. No existing main book-library specification was found during discovery.

The observed Book Library has a default blank template with a gray book-closed icon, formula-based Rating, and shared Author/Series/Access relations. Connector capability discovery currently reports query restrictions; tools must be selected from current capabilities, not a presumed full-table query API.

## Goals / Non-Goals

**Goals:** Keep reusable instructions in one short SKILL.md and invocation metadata in agents/openai.yaml; make template/icon fallback and manual cover output unambiguous.

**Non-Goals:** No new scripts, services, data-model migration, view management, generated adapter edits, publication, or installation. Do not consolidate the independent maintain-books skill in this change.

## Decisions

1. Use `notion-manage-books` and `allow_implicit_invocation: false`. Here the requested Notion namespace means the repository's established `notion-` naming family within CthuCodex, not modification of the third-party Notion plugin. Moving files into the installed plugin cache would make the skill unmanaged and fragile.
2. Keep only the database URL constant; discover schema, relation targets, default template, and tool capabilities live. A frozen full schema or SQL-only workflow would break when the database or connection changes.
3. Create from the default template and treat updates as preservation plus targeted repairs. Reapplying templates on every update can duplicate blocks or reset values. Verify asynchronous application before dependent edits, and explicitly repair the shared icon when application is unsupported or unsuccessful; report unresolved failures.
4. Always include a verified edition-matching cover image or direct image link in creation results. Prefer stable public image sources to expiring signed links. Unavailable images are a reported limitation, not a reason to invent a cover or repeatedly recreate a successful entry.
5. Keep checks proportional: clarify identity when ambiguous, preserve personal values and relations, use reversible deletion when supported, and verify uncertain writes before retries. Do not copy the unrelated skill's mandatory second confirmation or single-book limit.
6. Store business rules in the authored plugin skill and acceptance criteria in this change's delta spec. Generated OpenSpec adapters are not an appropriate source for these rules and will not be regenerated.

## Risks / Trade-offs

- Two similarly named book skills coexist → preserve explicit entrypoint selection and avoid automatic invocation of the new skill; any future consolidation needs its own requested scope.
- Template/icon support varies by connector → use supported operations, verify the resulting page, and report partial completion instead of claiming success.
- Limited query access weakens exhaustive duplicate checks → combine available search with candidate fetches and disclose uncertainty instead of asserting absence.
- Cover sources can disappear or use a different edition → verify identity and hand off the available image honestly.
- Existing draft is not proof of behavior → review it against scenarios and validate its metadata during the apply phase; no live mutation test is required merely to validate instruction files.

## Migration Plan

No Notion migration is needed. Review and finalize the existing draft in the normal apply workflow, then make it available through the plugin's existing release/install process only when requested. Rollback removes this skill's two files; it does not revert or delete user library data.
