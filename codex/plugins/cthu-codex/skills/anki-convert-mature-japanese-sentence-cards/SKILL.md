---
name: anki-convert-mature-japanese-sentence-cards
description: Preview and convert FSRS-stable `Japanese Sentence` Anki notes from local grammar clozes to English-prompted whole-sentence production through guarded CthuCodex Anki MCP updates. Use only when the user explicitly invokes `$anki-convert-mature-japanese-sentence-cards`.
---

# Anki · Convert Mature Japanese Sentence Cards

Use this skill to promote familiar `Japanese Sentence` notes from a local grammar cloze to whole-sentence Japanese production prompted by the existing English translation.

## Constants

- Deck: `0.Japanese::Japanese Sentences`
- Model: `Japanese Sentence`
- Required fields: `文`, `ヒント`, `訳`, `メモ`
- Default FSRS stability threshold: `45` days
- Minimum review count: `3`
- Maximum confirmed write batch: `20` notes
- Maximum read chunk: `50` note IDs

## Safety Contract

- Always preview exact note IDs and before/after `文` values before writing.
- Never treat the initial invocation as confirmation, even if it asks to convert cards immediately.
- Call `cthu_anki_update_notes` only after the user confirms the displayed candidate set.
- Never create replacement notes, change the note type or template, modify tags, or modify fields other than `文`.
- Never silently fall back from FSRS stability to interval-based selection.
- Never retry a stale or partially failed update without reading the affected notes again.

## Input

With no additional input, use the default stability threshold of 45 days:

```text
$anki-convert-mature-japanese-sentence-cards
```

Accept a positive threshold override:

```text
$anki-convert-mature-japanese-sentence-cards
stability: 30
```

Treat requests such as `dry run`, `preview`, `只预览`, or `不要修改` as read-only. A threshold override changes only the number in `prop:s>=<days>`; preserve every other default filter.

## Candidate Search

1. Call `cthu_anki_collection_schema` for `Japanese Sentence`.
2. Confirm the deck exists, the model exists, and its fields include `文`, `ヒント`, `訳`, and `メモ`.
3. Build this default query, substituting only a valid user-supplied stability threshold:

```text
deck:"0.Japanese::Japanese Sentences" note:"Japanese Sentence" is:review -is:learn -is:suspended -is:buried prop:s>=45 prop:reps>=3
```

4. Call `cthu_anki_find_notes` with the query.
5. Record the total match count. Read note details with `cthu_anki_get_notes` in chunks of at most 50 IDs until 20 supported candidates have been collected or all matches have been inspected.
6. Keep skipped-note reasons while scanning. Do not update skipped notes.

If Anki rejects or cannot evaluate `prop:s`, stop and report that FSRS stability search is unavailable. Do not replace it with `prop:ivl` unless a future, separately reviewed workflow explicitly specifies that behavior.

## Supported Note Parsing

For every note returned by Anki:

1. Require `modelName` to equal `Japanese Sentence`.
2. Read field text from each field object's `value` property.
3. Require non-empty `文` and `訳` values.
4. Count cloze opening tokens matching `{{c<number>::` in `文`.
5. Require exactly one cloze deletion, require its number to be `c1`, and reject nested cloze markup.
6. Parse the single cloze as an answer plus at most one optional hint. Reject malformed delimiters or an ambiguous body instead of guessing.
7. Reconstruct `completeJapaneseSentence` by replacing the entire local cloze wrapper with only its Japanese answer text while preserving all surrounding sentence content.
8. Build `translationHint` from `訳` by trimming it, converting line breaks and `<br>` elements to spaces, removing remaining HTML only when the visible text is unambiguous, and collapsing repeated whitespace.
9. Skip the note if the reconstructed sentence or translation hint is empty, or if either contains cloze delimiters that cannot be represented safely.

Generate the proposed field as:

```text
{{c1::<completeJapaneseSentence>::<translationHint>}}
```

If the proposed `文` is exactly equal to the current `文`, skip the note as `already converted / no change`. This makes repeated runs idempotent without adding a tag.

Example:

```text
Before 文:
冷蔵庫が壊れたので、新しいのを{{c1::買うことにした::decided to buy}}。

訳:
The refrigerator broke, so I decided to buy a new one.

After 文:
{{c1::冷蔵庫が壊れたので、新しいのを買うことにした。::The refrigerator broke, so I decided to buy a new one.}}
```

Leave `ヒント`, `訳`, `メモ`, unrelated fields, and existing tags unchanged.

## Mandatory Preview

Before any write, show:

- The effective search query and total number of matching note IDs.
- The number of supported candidates included in this batch, capped at 20.
- For each supported candidate: note ID, original `文`, and proposed `文`.
- For each inspected but unsupported note: note ID and skip reason.
- The number of additional matches not included in the current batch.

Then ask the user to confirm the exact displayed candidate set. Do not call `cthu_anki_update_notes` in the same turn that first presents that preview.

If the request is a dry run, finish after presenting the preview and do not ask for write confirmation unless the user later requests conversion.

## Confirmed Update

After the user clearly confirms the displayed candidate set, call `cthu_anki_update_notes` with no more than 20 updates:

```json
{
  "updates": [
    {
      "noteId": 123,
      "fields": {
        "文": "{{c1::<complete Japanese sentence>::<English translation>}}"
      },
      "expectedFields": {
        "文": "<original 文 from the preview>",
        "訳": "<original 訳 from the preview>"
      }
    }
  ],
  "openAfterUpdate": true
}
```

Use only candidates included in the confirmed preview. Do not substitute newly found notes or regenerate translations between preview and update.

## Result Reporting

- Report successful note IDs and confirm they were requested for Browser review.
- Report field-update failures for each affected note.
- When the response is partial, explicitly say which notes changed and which notes failed.
- Report Browser warnings separately; a Browser failure does not undo successful note updates.
- If more matching candidates remain, offer another preview-first batch rather than updating them automatically.

## Failure Handling

- Schema or deck mismatch: stop without searching or writing.
- FSRS query failure: report that stability selection is unavailable; do not fall back to `prop:ivl`.
- Empty result: report that no eligible notes matched.
- Unsupported cloze or translation: skip with a precise reason and do not guess.
- Stale expected field: report the note and field, perform no blind retry, and offer to rebuild the preview from current data.
- Runtime field failure: report the failed note and continue to use the MCP response as the source of truth.
- Browser failure: keep successful update results and show the warning.
