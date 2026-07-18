## Why

The personal Notion Album database needs a reliable workflow for adding albums, completing missing metadata, and reconciling MusicBrainz Release Groups with Discogs Masters without confusing abstract albums with specific editions. The recently simplified schema makes it practical to establish one canonical, preview-first workflow while aligning the remaining fields with stable source identities.

## What Changes

- Add a CthuCodex `notion-maintain-album` skill for adding one album, completing missing metadata, and checking MusicBrainz/Discogs matches from natural-language input or source URLs.
- Treat MusicBrainz Release Group as the canonical album identity, use its earliest release date and release type, and use Discogs Master for cross-validation and genre/style enrichment.
- Require a read-only candidate and field-change preview before any Notion write, stop on ambiguous or conflicting identities, fill only missing values by default, and verify every write.
- Align the live Album schema by renaming `Date` to `Listened Date`, documenting the core metadata fields, and adding a `Release Type` select property.
- Add a `MusicBrainz Artist` URL property to the related People Vault data source so Artist relations can be resolved by stable identity instead of name alone.
- Allow the skill to add newly confirmed Discogs genre/style values as `Genre` multi-select options during the approved album write instead of limiting enrichment to a pre-existing option list.
- Add deterministic MusicBrainz and Discogs resolution, scoring, conflict detection, rate limiting, and synthetic test fixtures without adding a new MCP server.
- Preserve `Status`, `Listened Date`, `Score`, and `Rating` as user-owned listening data that the skill does not modify unless a later request explicitly expands scope.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-album-skill`: Defines Album and People Vault schema expectations plus the CthuCodex workflow for album identity resolution, metadata preview, controlled option creation, idempotent writes, and verification.

### Modified Capabilities

None.

## Impact

- Affected plugin source: `codex/plugins/cthu-codex/skills/notion-maintain-album/` and CthuCodex plugin metadata.
- Affected tests: focused resolver and plugin integration coverage under `apps/cli/tests/` using synthetic MusicBrainz and Discogs fixtures.
- Affected documentation: `apps/docs/src/content/docs/modules/codex-plugin.md` and the OpenSpec capability map.
- External systems: the personal Notion Album and People Vault data sources, MusicBrainz Web Service, and Discogs API.
- No backend, desktop, browser-runtime, Anki MCP, or existing `notion-add-channel` behavior is changed.
- The neighboring `improve-notion-channel-batch-add` change remains untouched.
