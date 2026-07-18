## Context

The personal Album database now has a deliberately small metadata surface: `Name`, `Artist`, `Release Date`, `Genre`, `MusicBrainz Release Group`, and `Discogs Master`, plus user-owned listening fields. `Artist` relates to the existing People Vault data source. The live schema still names the listening date `Date`, has only two Genre options, has no release-type property, and People Vault has no stable MusicBrainz artist identifier.

CthuCodex already contains an instruction-only Notion channel skill that establishes useful patterns: fetch live schema instead of trusting cached IDs, complete a read-only preflight, require confirmation for inferred values, avoid duplicate writes, and verify results. Album matching adds a more deterministic identity problem because MusicBrainz distinguishes a Release Group from a concrete Release and Discogs distinguishes a Master from a Release.

MusicBrainz and Discogs expose public structured APIs. MusicBrainz Release Group URL relationships can often provide a Discogs Master directly, reducing the need for fuzzy Discogs searches. The Notion connector remains responsible for schema discovery and writes; local plugin code must not receive or store Notion credentials.

## Goals / Non-Goals

**Goals:**

- Support natural-language requests to add, complete, or audit one album and direct MusicBrainz Release Group, MusicBrainz Release, Discogs Master, or Notion Album URLs.
- Treat the MusicBrainz Release Group as the canonical abstract-album identity and use a Discogs Master only after identity validation.
- Align the Album schema with `Listened Date`, documented metadata fields, and a `Release Type` select, and add `MusicBrainz Artist` to People Vault.
- Add new Discogs genre/style values to the live `Genre` option set as part of an explicitly confirmed album mutation.
- Resolve Artist relations by MusicBrainz Artist URL when possible and use exact-name matching only as a guarded fallback.
- Produce a deterministic candidate score and conflict report, preview every field and schema change, fill only missing values by default, and verify all writes.
- Keep the implementation self-contained in the CthuCodex plugin with focused offline tests.

**Non-Goals:**

- Add or modify a CthuTool backend, desktop, browser-runtime, or MCP service.
- Support album batches, track lists, cover art, labels, barcodes, streaming-link discovery, or concrete edition cataloguing.
- Store an arbitrary MusicBrainz Release or Discogs Release as the album's canonical identity.
- Automatically create missing People Vault artists or resolve ambiguous same-name artists.
- Overwrite existing album metadata without a field-specific user decision.
- Modify `Status`, `Listened Date`, `Score`, or `Rating` during normal album maintenance.
- Clean up historical fields removed from the live schema or modify the existing Notion channel skill.

## Decisions

### Use a plugin-local skill plus deterministic resolver script

Create `skills/notion-maintain-album/` with a concise `SKILL.md`, `agents/openai.yaml`, a schema-and-matching reference, and a Node.js resolver script. The skill coordinates Notion reads, previews, confirmation, and writes. The script performs URL classification, MusicBrainz/Discogs HTTP requests, normalization, candidate scoring, conflict detection, and structured JSON output.

Use Node built-ins and dependency-injected `fetch`, identify requests with a meaningful CthuCodex User-Agent, serialize MusicBrainz calls to respect its rate limit, inspect Discogs rate-limit headers, and bound retries with backoff. Tests use synthetic fixtures and never require live APIs.

Alternative considered: instruction-only matching. Rejected because URL parsing, candidate scoring, rate limiting, and Release-to-Release-Group conversion need repeatable behavior. A new MCP server is also rejected because the resolver is stateless, has one plugin consumer, and does not need a persistent credential or process.

### Permit narrow implicit invocation but keep all writes explicit

Describe the skill narrowly enough to trigger on requests to add, complete, audit, or reconcile records in the personal Notion Album database, including MusicBrainz or Discogs album URLs. Ordinary music discussion does not match the trigger. A triggered skill may perform the read-only preflight, but it cannot mutate Notion until it presents the candidate and field/schema preview and receives explicit confirmation.

Alternative considered: explicit-only invocation like the current Notion channel skill. Rejected because the target requests are intentionally natural-language forms such as “添加 Paranoid by Black Sabbath”; confirmation provides the write boundary.

### Separate one-time schema alignment from runtime option expansion

The deployment migration performs the following once after refetching both data sources:

- Rename Album `Date` to `Listened Date`, preserving existing values.
- Add Album `Release Type` as a select with MusicBrainz primary types `Album`, `Single`, `EP`, `Broadcast`, and `Other`.
- Add People Vault `MusicBrainz Artist` as a URL property.
- Add descriptions that define `MusicBrainz Release Group` as the canonical abstract album URL, `Discogs Master` as a Master URL only, `Release Date` as the Release Group's earliest release date, `Genre` as the controlled Discogs-derived genre/style vocabulary, and `Artist` as a People Vault relation.

The runtime skill validates these properties and stops with a schema mismatch instead of silently recreating or renaming them. The exception is `Genre`: after confirmation, the skill may extend the existing multi-select options with normalized Discogs Master `genres` and `styles` that are not already present. It refetches the schema immediately before alteration to avoid duplicate options. `Release Type` stores only the MusicBrainz primary type; secondary types remain preview evidence.

If the connected Notion schema tool cannot write property descriptions, the migration records the exact descriptions as a required manual database step and verifies them before the skill is considered ready. The change does not introduce a raw Notion API token or browser automation solely to bypass connector limits.

### Resolve abstract identities before selecting metadata

For a MusicBrainz Release Group URL, lookup that group directly. For a concrete MusicBrainz Release URL, lookup the Release, obtain its single owning Release Group, and discard edition-specific dates from the album proposal. For name input, search Release Groups using the normalized title and optional artist, retain a bounded candidate set, and lookup the best eligible candidates for full relationships.

Score candidates deterministically from exact normalized title, exact artist identity or credit, allowed primary type, known year agreement, and the upstream search score. A direct valid ID bypasses search ranking but not conflict validation. A high score only selects the recommended candidate; it never authorizes a write. Missing artist input, near-tied candidates, mismatched artists, incompatible types, edition qualifiers, or date conflicts require user selection or resolution.

Use the Release Group `first-release-date` for `Release Date`. Do not fabricate month or day when MusicBrainz exposes only partial precision; leave the Notion date missing and report the available precision. Store the canonical Release Group URL and the Release Group primary type.

### Prefer MusicBrainz Discogs relationships before search

Inspect Release Group URL relationships for Discogs Master URLs. When exactly one Master relation exists, fetch it and validate normalized title, artist, and year. When the relation is missing or ambiguous, search Discogs Masters and score title, artist, year, and object type. Any artist mismatch or unresolved competing Master blocks the write; a year mismatch is a visible conflict and cannot be silently resolved by choosing Discogs over MusicBrainz.

The confirmed Discogs Master URL is stored as provenance for Genre. Discogs year only cross-checks the MusicBrainz earliest-release year and never supplies a more precise core date.

### Resolve People Vault relations with stable identity

For each MusicBrainz artist credit, first look for an exact `MusicBrainz Artist` URL match. If none exists, search People Vault by name, fetch candidate pages, and accept only one exact normalized name as a proposed relation. The preview includes filling that person's missing `MusicBrainz Artist` URL. A non-empty conflicting Artist URL, multiple exact names, or no artist record blocks the album write and asks the user to select or create the artist separately.

Multiple-artist credits are supported only when every artist resolves without conflict. The skill does not create People Vault pages.

### Use a compare-and-set style write workflow

Build the read-only preview from live Album rows, People Vault rows, current schema options, and source metadata. Display current value, proposed value, action, authority URL, new Genre options, People Vault identifier updates, and conflicts. Existing non-empty values remain unchanged unless the user explicitly approves that individual replacement.

After confirmation, refetch the target page, relevant artist pages, and schema. Abort and regenerate the preview if any planned value or option set has changed. Apply writes in dependency order: add missing Genre options, fill approved People Vault identifiers, then create or minimally update the Album page. Query again by Release Group URL before creating, and treat title plus Artist only as a duplicate candidate rather than a unique key.

Fetch every affected data source/page after writing. If a partial or uncertain response occurs, discover the resulting state before retrying; do not roll back successful option or identifier writes and do not blindly repeat the full plan.

## Risks / Trade-offs

- [Automatically growing Genre can create spelling or granularity drift] → Use only confirmed Discogs Master `genres` and `styles`, normalize whitespace/case for duplicate checks, show new options in the preview, and retain Discogs Master as provenance.
- [MusicBrainz and Discogs can disagree] → Treat MusicBrainz as authority for Release Group identity/date/type, use Discogs as cross-validation and Genre source, and block unresolved artist/year conflicts.
- [Notion has no uniqueness constraint on URL properties] → Re-query by canonical Release Group URL immediately before creation and verify the result afterward.
- [Schema option creation and page writes are not transactional] → Refetch before each phase, preserve per-operation results, and inspect state before retrying.
- [People Vault name fallback can confuse homonyms] → Use it only for one exact normalized result and write the MusicBrainz Artist URL for future stable matching.
- [External APIs can throttle or change] → Use bounded requests, explicit User-Agent, response-header-aware backoff, small candidate sets, and fixture-based contract tests.
- [Property descriptions may not be writable through the current connector] → Treat verified descriptions as a migration gate and use a documented manual schema step rather than adding credentials or scraping.
- [Implicit invocation could trigger unexpectedly] → Keep the description specific to personal Notion Album maintenance and prohibit every write until explicit preview confirmation.

## Migration Plan

1. Implement and test the resolver, skill instructions, prompt metadata, and documentation without changing live Notion state.
2. Refetch Album and People Vault, preflight exact property names/types, and confirm `Date` still contains the listening dates intended for rename.
3. Rename `Date` to `Listened Date`, add `Release Type`, add `MusicBrainz Artist`, and apply/verify the agreed field descriptions without dropping properties or values.
4. Refresh the CthuCodex plugin cachebuster, merge the isolated change, reinstall the personal plugin, and start a fresh Codex task.
5. Exercise check-only, add, missing-field completion, concrete Release URL conversion, new Genre option creation, duplicate, conflict, and partial-write scenarios.

Rollback code and plugin metadata by reverting the change and reinstalling the previous plugin. Do not drop the new Notion properties or reverse populated identifiers automatically; if required, rename `Listened Date` back to `Date` only after verifying existing values. Newly added Genre options and MusicBrainz Artist URLs are retained because removing them could discard approved user data.

## Open Questions

None. The skill uses narrow implicit invocation, requires explicit confirmation for all writes, automatically creates previewed Discogs-derived Genre options during the confirmed write, stores the MusicBrainz primary type in `Release Type`, and leaves partial dates empty rather than fabricating precision.
