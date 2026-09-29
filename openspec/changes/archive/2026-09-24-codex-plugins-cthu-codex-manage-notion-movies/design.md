## Context

See proposal.md. The live Movie Library exposes IMDb/TMDB URL fields and Watched Date, while the old skill expects IMDB ID/TMDB ID and Date. Its blank default template carries a gray movie icon, Want to watch status, and false Is in Library. Director and Cast both target People Vault.

## Goals / Non-Goals

Keep the existing invocation name and instruction-only runtime while making CRUD concise. No live schema migration, people creation, backend integration, new scripts, or generated adapter changes.

## Decisions

- Rewrite the existing skill rather than add another movie entry point; the user already knows its name.
- Discover data-source and template IDs from the database each invocation, preserving the existing live-discovery boundary. Record current property semantics, not stale ID field aliases.
- Use explicit intent as authorization and clarify only material ambiguity; do not retain the old mandatory preview sequence.
- Allow Director/Cast writes only after verifying existing related pages. This supports record management without expanding into People Vault management.
- Keep future backend integration deferred and align its README TODO with scoped authorization. Do not introduce code or prose-mirroring tests for this instruction-only change; validate YAML, skill format, spec consistency, and scoped diffs.

## Risks / Trade-offs

- Search or deletion capability varies → use available connector paths and disclose incomplete coverage or manual removal needs.
- Same-name movies and people can collide → verify stable identity, year, director, and relation pages before affected writes.
- Templates apply asynchronously → bounded verification and manual icon repair without repeat creation or destructive reapplication.

## Migration Plan

Update skill and metadata in place, revise movie documentation and the future integration TODO, validate, sync only this capability, archive this change, and commit/push the isolated branch. No PR or merge. Revert the commit to restore the old behavior.
