## Context

See proposal.md. Live Drama Library has Category, Episodes, Genres, IMDb, TMDB, fallback Reference, and Director/Cast/Writer relations. The template is blank with a gray tv icon, Want to watch, and false Is in Library. Research & Archive is an existing status. No existing drama skill or capability was found.

## Goals / Non-Goals

Provide a short instruction-only entry point; do not prescribe a workflow for every request. No Notion schema changes, people creation, scripts, services, or automatic library maintenance.

## Decisions

- Create a dedicated skill instead of extending movies because TV identity, seasons, episode counts, classification, and fallback references have different semantics.
- Discover live IDs and options from the supplied database URL rather than hardcode option identifiers. Keep the field guide within the short skill; no supporting scripts are needed.
- Deduplicate using record scope plus identifiers. A shared series URL can legitimately appear on seasonal records, so canonical URL equality alone is insufficient.
- Treat Episodes as scoped metadata rather than watching progress; report provisional counts and uncertain premiere context instead of silently guessing.
- Use explicit requests as authorization, retaining clarification for material ambiguity. Keep Research & Archive separate from reversible deletion.

## Risks / Trade-offs

- Source catalogs disagree on seasons and specials → reconcile requested scope before affected writes.
- Connector query, icon repair, or trash support varies → disclose limitations and provide manual links without claiming completion.
- Templates apply asynchronously → bounded refetches and icon repair without duplicate pages or content resets.

## Migration Plan

Add skill and manual-only metadata, document it, validate format and scoped specs, sync this new capability, archive this change, and commit/push its isolated branch. No PR creation or merge. Revert the commit to remove the added capability. Generated adapters remain untouched.
