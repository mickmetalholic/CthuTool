## Why

Mature `Japanese Sentence` cards continue testing a local grammar cloze even after the sentence has become familiar. Promoting selected FSRS-stable cards to whole-sentence production lets the existing review progress from recognizing a construction in Japanese context to recalling the complete Japanese sentence from its English translation.

## What Changes

- Add an explicit-only CthuCodex skill that finds eligible `Japanese Sentence` notes, previews a whole-sentence cloze conversion, and updates only notes the user confirms.
- Use FSRS stability of at least 45 days and at least 3 reviews as the default eligibility threshold, while allowing the user to override the stability threshold.
- Convert a supported local cloze such as `...{{c1::買うことにした::decided to buy}}...` into `{{c1::<complete Japanese sentence>::<existing English translation>}}` without recreating the note or removing its other fields.
- Skip already-converted no-op results and structurally unsafe notes, bound each write batch, leave tags unchanged, and open updated notes in Anki Browser for review.
- Extend the bundled Anki MCP server with a validated, bounded existing-note field-update operation that supports stale-value checks, per-note results, and optional Browser opening.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-mature-japanese-sentence-conversion-skill`: Explicit workflow for selecting FSRS-stable Japanese sentence notes and promoting them from local grammar clozes to English-prompted whole-sentence production.

### Modified Capabilities

- `codex-plugins-cthu-codex-anki-mcp`: Add safe, bounded field updates for existing notes, including optimistic current-value checks, result reporting, and post-update Browser review.

## Impact

- Adds a plugin-local skill under `codex/plugins/cthu-codex/skills/` and documents it in the CthuCodex plugin README and module documentation.
- Changes `codex/plugins/cthu-codex/scripts/anki-mcp-server.mjs` and its integration tests to expose the new update operation.
- Uses existing AnkiConnect note search and note detail actions plus `updateNoteFields` and `guiBrowse`; Anki desktop with AnkiConnect must be running for live use.
- Updates the existing `Japanese Sentence` note field `文` in place without modifying tags; it does not migrate the note type, change card templates, recreate notes, or alter the existing sentence-card creation skill.
