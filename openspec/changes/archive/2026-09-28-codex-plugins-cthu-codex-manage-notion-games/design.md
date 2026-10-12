## Context

See proposal.md. Video Game Library has IGDB metadata, Developer/Series relations, a personal Owned On relation, and derived Playable On/Emulators rollups. Purchase Price is formatted as yuan. The blank default template carries a gray video-game icon and Want to play. No existing game skill was found.

## Goals / Non-Goals

Keep one compact instruction-only skill with essential CRUD rules. No game-store integration, ownership synchronization, related-database management, scripts, new dependencies, or generated adapter edits.

## Decisions

- Discover current relation targets and options from the database rather than hardcode page identities. Resolve existing pages before linking them.
- Separate public availability from personal Owned On; rollups are read-only and must not be forced through related-page mutations.
- Reconcile work/edition/platform scope before deduplication. A new owned platform often belongs on an existing game; remakes and expansions may have distinct identities.
- Preserve price and time units explicitly. The current yuan format is a cue to verify currency, not permission to convert foreign amounts automatically.
- Use clear user requests as authorization and preserve unknown values. Validate instruction format, metadata, docs, and OpenSpec without adding tests that mirror prose or mutating live records.

## Risks / Trade-offs

- Store/catalog metadata conflates editions → reconcile IGDB and release context before writes.
- Connector search, icon repair, or trash may be unavailable → disclose coverage and manual follow-up without claiming success.
- Templates apply asynchronously → bounded verification and icon repair without duplicate creation or destructive reapplication.

## Migration Plan

Add skill and documentation, validate, sync this capability, archive only this change, and commit/push the isolated branch. No PR creation or merge. Revert the commit to remove the addition. Generated adapters remain unchanged.
