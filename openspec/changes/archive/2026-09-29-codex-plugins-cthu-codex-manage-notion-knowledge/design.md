## Context

See proposal.md. Knowledge Vault exposes Name, userDefined:URL (display URL), Category, Source, Status, Type(Manual), formula Type, and App/Magazine/Podcast relations. Six identically named templates were fetched: Course, Paper, Resource, Project, Article, and Notes, all blank with Backlog and distinct gray icons. Textbook is an available type with no matching advertised template.

## Goals / Non-Goals

Keep one concise skill with CRUD and essential constraints. No automatic knowledge capture, source copying, taxonomy migration, related-library maintenance, new scripts, or generated adapter changes.

## Decisions

- Resolve templates by properties rather than identical names or list order. Do not assume the Textbook option implies a Textbook template; report missing conventions and never invent a fallback.
- Treat source URL as a separate property from Notion's own url. Match resource scope and retain identity-bearing URL components rather than strip every query/fragment.
- Permit explicit body editing and source-grounded summaries while keeping ordinary record creation property-focused. This supports notes without replacing the user's writing automatically.
- Keep Type derived; do not infer its formula rules or mutate related databases to influence it. Distinguish status Archived from page deletion.
- Validate skill format, parsed metadata, and specs without adding tests that merely match prose or mutating live records.

## Risks / Trade-offs

- Mixed resource identities can collide → compare versions/lessons/editions and clarify ambiguous matches.
- Templates or body fetches may be incomplete → disclose limitations; no unrelated template or wholesale body replacement.
- Some resources have no meaningful cover → explicitly report image unavailability rather than generate or guess one.

## Migration Plan

Add skill and documentation, validate, sync only this capability, archive this change, and commit/push the isolated branch. Do not create or merge PRs. Revert the commit to remove the addition. Generated adapters remain unchanged.
