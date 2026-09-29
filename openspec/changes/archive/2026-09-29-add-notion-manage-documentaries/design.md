## Context

See proposal.md for motivation. Live discovery found Name, IMDb, Type, Series, Topics, Release Date, Status, Watched Date, Is in Library, and the In Library formula. The default blank template uses a gray document icon, Want to watch status, and unchecked Is in Library.

## Goals / Non-Goals

Goals: a short manual-only skill consistent with adjacent library skills, with correct film/series/season/episode identity.
Non-goals: downloading media, changing taxonomy, managing another library, or creating a runtime resolver.

## Decisions

- Use a self-contained SKILL.md and agents/openai.yaml; no script is needed for schema-guided CRUD. A dedicated resolver would add maintenance without a demonstrated need.
- Treat IMDb as a verified title identifier at the requested scope. Seasons may lack their own identifier, so combine parent identity with season/episode context instead of enforcing URL-only deduplication.
- Keep observed schema and template hints concise and re-fetch live values before writes rather than freezing a schema snapshot.
- Update only the business plugin and its documentation as explicitly requested; generated adapters remain unchanged.

## Risks / Trade-offs

- Shared parent URLs can resemble duplicates → verify scope before mutation.
- Schema/template drift → use live discovery and report incompatible fields.
- Connector cannot trash or repair icons → disclose limitation and return manual page links.
