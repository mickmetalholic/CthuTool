## Why

Video Game Library has no dedicated management skill. Add lightweight manual CRUD while keeping game identity, owned platforms, personal play history, and derived platform/emulator data distinct.

## What Changes

- Add manual-only `notion-manage-games` under the Notion display grouping.
- Support query, create, scoped update, and connector-supported reversible removal.
- Preserve base-game, DLC, remake, remaster, edition, and platform identity during IGDB matching and deduplication.
- Resolve existing Developer, Series, and Owned On relations; keep Rating, Playable On, and Emulators read-only.
- Preserve personal purchase/play data, apply the live template with icon repair, and output verified cover images or links for manual addition.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-game-library-skill`: Manual Video Game Library CRUD with ownership, identity, template, and personal-data safeguards.

### Modified Capabilities

None.

## Impact

New instruction-only skill and metadata, plugin README and docs, and one new capability. No dependencies, scripts, services, live Notion mutations, schema changes, or generated adapter edits.
