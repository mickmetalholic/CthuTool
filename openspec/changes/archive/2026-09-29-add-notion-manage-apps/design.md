## Context

See proposal.md. App Vault exposes Name, userDefined:URL, Platform, Tag, and Knowledges. Knowledges targets Knowledge Vault. No templates were returned; three sampled pages have uploaded app/site icons, while the database uses a gray window icon.

## Goals / Non-Goals

Goals: lightweight manual CRUD with exact schema keys, product identity, and safe membership edits.
Non-goals: software installation, taxonomy changes, knowledge content management, or automatic branding replacement.

## Decisions

- Use one SKILL.md and explicit-only invocation metadata, matching adjacent skills; no helper script is needed.
- Treat missing templates as an observed limitation, not a guessed template ID. Preserve branded icons and use the database's verified gray window icon only as a missing-icon fallback under the user's uniform-icon requirement.
- Keep app artwork output separate from icon repair; this respects manual image addition and existing custom icons.
- Use product/publisher identity rather than domain alone; suites and multiple products can share a host.
- Only the explicitly requested business plugin and documentation change; generated adapters stay unchanged.

## Risks / Trade-offs

- Platform may mean availability or a user's chosen subset → preserve supplied choices and clarify material ambiguity before broadening it.
- Missing template → disclose absence, apply the known fallback if supported, and do not create a template incidentally.
- Similar products or obsolete store URLs → verify official evidence and preserve unresolved values.
