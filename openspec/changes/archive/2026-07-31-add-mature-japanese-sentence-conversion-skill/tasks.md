## 1. Guarded Anki Note Updates

- [x] 1.1 Add the `cthu_anki_update_notes` MCP tool definition with bounded `updates`, optional `openAfterUpdate`, and Browser limit inputs.
- [x] 1.2 Implement update payload validation for note IDs, non-empty fields, expected fields, and the maximum batch size.
- [x] 1.3 Implement a `notesInfo` preflight that verifies target fields and rejects the entire batch on missing notes, missing fields, or stale expected values before mutation.
- [x] 1.4 Implement per-note `updateNoteFields` calls with structured success and partial-failure results.
- [x] 1.5 Reuse bounded Browser opening for successfully updated note IDs and preserve successful update results when Browser opening fails.

## 2. Anki MCP Test Coverage

- [x] 2.1 Add integration tests proving malformed and oversized update batches make no AnkiConnect mutation calls.
- [x] 2.2 Add integration tests proving a stale expected field rejects the full batch before `updateNoteFields`.
- [x] 2.3 Add integration tests for successful field updates, preservation of unmentioned data, and optional Browser opening.
- [x] 2.4 Add integration tests for runtime partial failures, capped Browser opening, and Browser warnings.
- [x] 2.5 Update the MCP tool-list assertion and documentation-facing tool inventory for `cthu_anki_update_notes`.

## 3. Mature Japanese Sentence Conversion Skill

- [x] 3.1 Create `codex/plugins/cthu-codex/skills/anki-convert-mature-japanese-sentence-cards/` with `SKILL.md` and an explicit-only `agents/openai.yaml`.
- [x] 3.2 Document the default FSRS query with `prop:s>=45`, `prop:reps>=3`, review-state safety filters, and stability-threshold override behavior.
- [x] 3.3 Document candidate parsing that accepts one non-nested `c1`, reconstructs the complete Japanese sentence, uses `訳` as the whole-sentence hint, and skips unsafe structures with reasons.
- [x] 3.4 Document mandatory preview output with note IDs and before/after `文`, dry-run behavior, explicit confirmation, and the 20-note batch limit.
- [x] 3.5 Document guarded `cthu_anki_update_notes` payloads using previewed `文` and `訳` as expected values and post-update Browser review without modifying tags.
- [x] 3.6 Document stale-preflight, partial-update, FSRS-unavailable, schema-mismatch, and Browser-warning failure handling without blind retries.

## 4. Plugin Documentation

- [x] 4.1 Add the conversion skill, its explicit invocation name, default 45-day FSRS threshold, and preview-first behavior to `codex/plugins/cthu-codex/README.md`.
- [x] 4.2 Update `apps/docs/src/content/docs/modules/codex-plugin.md` with the new skill and existing-note update tool.
- [x] 4.3 Confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged because this change adds only plugin-local source skill files.

## 5. Verification

- [x] 5.1 Run the targeted Anki MCP integration test file and fix any failures.
- [x] 5.2 Run `openspec validate add-mature-japanese-sentence-conversion-skill --strict` and resolve every proposal, design, spec, or task validation error.
- [x] 5.3 Run `git diff --check` and review the diff to confirm only this change and its intended implementation files are affected.
- [x] 5.4 With AnkiConnect running, verify the live `Japanese Sentence` schema and perform a no-write preview on a representative supported note.
- [x] 5.5 After explicit user confirmation, smoke-test exactly one guarded conversion, inspect the rendered card in Anki Browser, and do not continue to a larger batch unless it renders correctly.

## 6. Tag-free Conversion Revision

- [x] 6.1 Remove the production tag from candidate selection and confirmed updates, and use exact proposed/current `文` equality as the already-converted no-op check.
- [x] 6.2 Simplify the MCP update operation and integration coverage to field-only updates.
- [x] 6.3 Remove the tag added during the one-note smoke test and rerun targeted tests, strict OpenSpec validation, and diff checks.
