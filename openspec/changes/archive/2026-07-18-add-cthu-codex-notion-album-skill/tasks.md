## 1. Skill and Resolver Foundation

- [x] 1.1 Create `codex/plugins/cthu-codex/skills/notion-maintain-album/` with concise `SKILL.md`, matching `agents/openai.yaml`, narrow implicit-invocation metadata, and a schema-and-matching reference.
- [x] 1.2 Implement deterministic Unicode/title/artist normalization plus strict MusicBrainz Release Group, MusicBrainz Release, Discogs Master, and Notion Album URL classification.
- [x] 1.3 Implement the MusicBrainz client for Release Group search/lookup and concrete Release-to-Release-Group conversion with a meaningful User-Agent, serialized requests, bounded retries, and partial-date preservation.
- [x] 1.4 Implement Discogs Master relationship extraction, Master lookup, search fallback, rate-limit-header handling, and normalized Genre/Style extraction without persisting full API responses.
- [x] 1.5 Implement structured candidate scoring, score-margin selection, source evidence, and blocking conflict output for title, artist, type, edition qualifier, and year disagreements.

## 2. Notion Read-Only Preflight

- [x] 2.1 Define and validate the live Album and People Vault schema contract, including query-data-source fallback to database-view/search reads when SQL querying is unavailable.
- [x] 2.2 Implement single-album operation parsing for add, missing-field completion, and check-only requests while preserving natural-language and direct-URL inputs.
- [x] 2.3 Build Album duplicate and target detection using canonical MusicBrainz Release Group URL first, Discogs Master second, and title-plus-Artist only as a clarification candidate.
- [x] 2.4 Resolve People Vault Artist relations by `MusicBrainz Artist` URL, with one exact normalized-name fallback and blocking behavior for missing, ambiguous, or conflicting artists.
- [x] 2.5 Produce a field-level preview containing current/proposed values, actions, authority URLs, Release Type, new Genre options, People Vault identifier updates, and every blocking conflict.

## 3. Confirmed Mutation and Verification

- [x] 3.1 Implement explicit plan confirmation and stale-state detection so schema, Artist, or Album changes after preview force a refreshed preflight.
- [x] 3.2 Extend the live `Genre` multi-select with every still-missing, previewed Discogs Master Genre/Style value after confirmation, reusing normalized existing options.
- [x] 3.3 Fill approved missing `MusicBrainz Artist` URLs on uniquely resolved People Vault pages without creating Artist pages or replacing conflicting identifiers.
- [x] 3.4 Create or minimally update one Album page with the confirmed Release Group identity, Artist relation, earliest full Release Date, Release Type, Discogs Master, and Genre while omitting personal listening fields.
- [x] 3.5 Verify every affected data source and page after mutation, preserve partial-success results, and discover current state before retrying an uncertain operation.

## 4. Fixtures and Automated Coverage

- [x] 4.1 Add synthetic MusicBrainz Release Group, concrete Release, Discogs Master, ambiguous-candidate, partial-date, and conflicting-candidate fixtures without retaining live copyrighted payloads.
- [x] 4.2 Add focused resolver tests for URL classification, normalization, deterministic scoring, Release-to-Release-Group conversion, direct Discogs relationships, search fallback, Genre normalization, and rate-limit/retry behavior.
- [x] 4.3 Add workflow contract tests or static validation for implicit trigger scope, preview-before-write, check-only behavior, missing-only updates, personal-field exclusion, Genre option creation, Artist conflicts, duplicate prevention, and partial-write verification.
- [x] 4.4 Confirm the plugin installer/cache copy preserves the skill-local script and reference resources and that installed-path script resolution works from a fresh task.

## 5. Plugin Metadata and Documentation

- [x] 5.1 Update CthuCodex plugin metadata and README to include the Notion album-maintenance skill without adding another MCP server.
- [x] 5.2 Document supported requests, authority rules, Release Group versus Release behavior, Genre option expansion, Artist resolution, previews, conflicts, and personal-field boundaries in the Codex plugin module documentation.
- [x] 5.3 Add `codex-plugins-cthu-codex-notion-album-skill` to the OpenSpec capability map and refresh the plugin cachebuster metadata for reinstall after merge.

## 6. Live Schema Alignment

- [x] 6.1 Refetch and preflight the live Album and People Vault data sources, verify the expected IDs/types and existing `Date` values, and stop without mutation if state has drifted.
- [x] 6.2 Rename Album `Date` to `Listened Date`, add `Release Type` with MusicBrainz primary-type options, and verify all prior date values remain present.
- [x] 6.3 Add People Vault `MusicBrainz Artist` as a URL property and verify existing pages and relations remain unchanged.
- [ ] 6.4 Apply and verify the agreed core property descriptions through supported schema tooling, or complete and verify the exact documented manual schema step if property descriptions are not connector-writable.

## 7. Validation and Fresh-Task Exercise

- [x] 7.1 Validate the OpenSpec change and confirm the capability covers natural-language invocation, direct source URLs, schema alignment, candidate conflicts, Genre growth, People Vault identifiers, idempotency, and personal-field protection.
- [x] 7.2 Run focused tests, applicable plugin/CLI tests, formatter or lint checks, and `git diff --check`.
- [x] 7.3 Review the scoped diff and confirm no backend, desktop, browser-runtime, Anki MCP, existing `notion-add-channel`, neighboring OpenSpec change, or generated `.claude/`, `.codex/`, and `.cursor/` adapter files were modified.
- [ ] 7.4 After merge, reinstall `cthu-codex@personal` and exercise check-only, add, completion, concrete Release conversion, new Genre option, duplicate, conflict, and uncertain-write paths in a fresh Codex task.
