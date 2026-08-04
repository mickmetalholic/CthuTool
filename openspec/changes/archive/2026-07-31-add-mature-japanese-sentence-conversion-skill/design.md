## Context

CthuCodex already provides an explicit-only `anki-create-japanese-sentence-card` skill and an Anki MCP server with schema, search, detail, validation, creation, media, and Browser-opening tools. The sentence skill creates `Japanese Sentence` notes in deck `0.Japanese::Japanese Sentences` with fields `文`, `ヒント`, `訳`, and `メモ`; `文` contains a `c1` cloze around a local grammar construction and `訳` contains the full English translation.

The desired progression is to turn sufficiently stable cards into whole-sentence production prompts without recreating their notes or changing the note type. The user's collection uses FSRS, so stability is available through Anki search as `prop:s`. The MCP server can already pass that query to `findNotes`, but it cannot update an existing note.

Live schema and template inspection was unavailable during proposal creation because AnkiConnect was not running. Implementation must therefore verify the real `Japanese Sentence` model before the first live mutation.

## Goals / Non-Goals

**Goals:**

- Select review cards whose FSRS stability is at least 45 days and review count is at least 3 by default.
- Preview a deterministic promotion from a local `c1` grammar cloze to one whole-sentence `c1` cloze whose hint is the existing English translation.
- Require explicit confirmation before any note update.
- Update notes in place with stale-value protection, bounded batches, idempotent no-op detection, unchanged tags, and post-update Browser review.
- Keep the original note ID, card identity, deck, model, translation, grammar hint, memo, and existing tags.

**Non-Goals:**

- Changing the `Japanese Sentence` note type or card templates.
- Creating a second production card or a new note.
- Automatically converting unsupported multi-cloze, nested-cloze, missing-translation, or malformed notes.
- Automatically falling back to interval-based selection when FSRS stability search is unavailable.
- Providing an exact automated rollback to the original local cloze markup in the first version.
- Changing the existing Japanese sentence-card creation skill.

## Decisions

### Use an explicit batch conversion skill

The new skill will be named `anki-convert-mature-japanese-sentence-cards` and live under `codex/plugins/cthu-codex/skills/`. Its agent policy will disable implicit invocation because it mutates existing study material. A separate skill keeps creation and promotion semantics independent and makes the write intent visible at invocation time.

Alternative considered: extend `anki-create-japanese-sentence-card`. That skill operates on user-provided sentences before note creation, while this workflow searches and mutates existing notes; combining them would make invocation and safety behavior ambiguous.

### Select candidates with FSRS stability

The default Anki query will be equivalent to:

```text
deck:"0.Japanese::Japanese Sentences" note:"Japanese Sentence" is:review -is:learn -is:suspended -is:buried prop:s>=45 prop:reps>=3
```

The user may override only the `45`-day stability threshold. Review count remains at least 3, and every other default safety filter remains unchanged. The skill will not silently substitute `prop:ivl`, because doing so changes the meaning from modeled memory stability to scheduled interval.

The existing `cthu_anki_find_notes` and `cthu_anki_get_notes` tools are sufficient for selection and field inspection. Candidate preview does not need to display the numeric stability value because the Anki query itself enforces the threshold.

### Promote by rebuilding the same `c1` cloze

For a supported note, the skill will:

1. Read the current `文` and `訳` values.
2. Require one non-nested `c1` cloze and no other cloze number.
3. Remove the local cloze wrapper and its old hint while preserving the clozed Japanese text in place, producing the complete Japanese sentence.
4. Use a display-safe, single-line form of `訳` as the new cloze hint.
5. Set `文` to `{{c1::<complete Japanese sentence>::<English translation>}}`.
6. Leave `ヒント`, `訳`, `メモ`, and all unrelated fields unchanged.
7. Skip the note as already converted when the proposed `文` exactly equals the current `文`.
8. Leave all tags unchanged.

Keeping `c1` and updating the note in place avoids intentionally creating a new card or resetting the workflow through note recreation. Notes with nested markup, multiple cloze deletions, another cloze number, an empty translation, or delimiter content that cannot be represented safely will be skipped with a reason.

Alternative considered: replace `文` with plain English. A Cloze note requires cloze markup and could produce a blank card. Another alternative was a note-type field and conditional template mode; that would preserve the original local cloze exactly but requires a collection-wide model migration and template ownership that is outside this change.

### Make preview and confirmation mandatory

The skill will build a preview containing each note ID, original `文`, proposed `文`, and any skip reason. It will not call a write tool until the user explicitly confirms the displayed candidate set. A dry-run request ends after preview.

At most 20 notes will be included in one confirmed write batch. If more candidates match, the skill reports that more remain and processes them only in later confirmed batches. This matches the existing MCP batch safety posture and keeps Browser review manageable.

### Add a guarded generic update tool to the Anki MCP server

The MCP server will expose `cthu_anki_update_notes` with a payload shaped around:

```json
{
  "updates": [
    {
      "noteId": 123,
      "fields": { "文": "<new value>" },
      "expectedFields": {
        "文": "<previewed old value>",
        "訳": "<previewed translation>"
      }
    }
  ],
  "openAfterUpdate": true
}
```

The tool will validate the payload and maximum batch size, fetch all current notes with `notesInfo`, verify that target fields exist, and compare every `expectedFields` value before writing. Any preflight failure rejects the entire batch so a stale preview cannot overwrite newer edits.

After preflight, the tool will call `updateNoteFields` for each update and return per-note results. AnkiConnect does not provide a transactional multi-note update, so a runtime failure may leave an already processed prefix updated; the result must make that partial state explicit.

Alternative considered: instruct the skill to access raw AnkiConnect. Keeping mutation behind the MCP server preserves input validation, batch limits, consistent error reporting, and tests.

### Reuse bounded Browser opening after updates

When `openAfterUpdate` is true, the tool will open successfully updated note IDs through the existing `guiBrowse` helper and limit. Browser failure will be returned as a warning and will not misreport successful field updates as failed.

## Risks / Trade-offs

- [The conversion discards the exact old local cloze boundary and hint] → Preserve the full Japanese sentence, `ヒント`, `訳`, and `メモ`, require preview, and skip exact no-op proposals on later runs. Users who need exact rollback should restore from an Anki backup or export.
- [A note may change between preview and confirmation] → Send previewed `文` and `訳` as `expectedFields` and reject the whole batch on any mismatch.
- [AnkiConnect can fail after some notes have updated] → Return per-note field results, open only successful notes, and make retry behavior inspect current values rather than blindly replaying the original batch.
- [Card-level search can return a note with unsupported siblings] → Accept only the single-`c1`, no-other-cloze structure and skip everything else.
- [English translations may contain HTML or cloze delimiters] → Normalize only representable inline content and skip unsafe translations instead of generating ambiguous markup.
- [The live note schema may differ from repository assumptions] → Require schema inspection and a one-note dry run before enabling a real batch.

## Migration Plan

1. Add and test the guarded MCP update tool without changing any collection data.
2. Add the explicit conversion skill and documentation.
3. With AnkiConnect running, inspect the live `Japanese Sentence` schema and dry-run a representative note.
4. Confirm and update one note, then inspect it in Anki Browser and Preview.
5. Proceed with batches of at most 20 only after the one-note smoke test succeeds.

No repository rollback changes Anki data that has already been updated. Collection rollback relies on the previewed original values or the user's Anki backup/export for exact restoration.

## Validation Outcome

Live collection validation confirmed that the `Japanese Sentence` model contains the required fields and uses `文` as its Cloze source. A guarded single-note smoke test rendered the existing English translation as the front prompt and the complete Japanese sentence as the back answer with the user's template and CSS. The note's other fields remained unchanged, and the temporary conversion tag used during the smoke test was removed.
