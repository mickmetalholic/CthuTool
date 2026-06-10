---
name: anki-japanese-sentence-card-maker
description: Create Japanese Sentence Anki notes from Japanese example sentences and grammar points through the CthuCodex Anki MCP tools. Use when the user asks to make, add, generate, or create a Japanese grammar sentence card/note for Anki, especially for the `Japanese Sentence` note type with fields `文`, `ヒント`, `訳`, and `メモ`, cloze deletion, English translation, English grammar explanations, and optional tags.
---

# Anki Japanese Sentence Card Maker

Use this skill to create one `Japanese Sentence` Anki note from a Japanese example sentence and grammar point.

## Constants

- Deck: `0.Japanese::Japanese Sentences`
- Model: `Japanese Sentence`
- Required fields: `文`, `ヒント`, `訳`, `メモ`

## Workflow

1. Parse the user's input into:
   - `sentence`: the Japanese example sentence without markdown markers.
   - `surfacePhrase`: the exact sentence span to cloze.
   - `grammarPoint`: the canonical grammar item being studied.
   - `tags`: optional tags from a `tags:` line or standalone tag-like line, normalized before validation.
2. Call `cthu_anki_collection_schema` for `Japanese Sentence`.
3. Confirm the model exists and fields include `文`, `ヒント`, `訳`, and `メモ`.
4. If no tags were supplied, use an empty tag list and continue without asking for tags.
5. Generate a candidate note payload.
6. Show the candidate if review would help, especially when the cloze span or explanation required judgment.
7. Call `cthu_anki_validate_notes` with the candidate note.
8. If validation passes, call `cthu_anki_add_notes` with `openAfterCreate: true`.
9. Report the created note ID and any Browser-opening warning.

Do not write a note if the sentence, grammar point, schema, or validation result is unclear.

## Input Parsing

Accept either inline grammar marking:

```text
うちの課は女性がよく飲みに行くの**に対して**、男性は皆まっすぐ家に帰る。
```

Or a separate grammar point line:

```text
うちの課は女性がよく飲みに行くのに対して、男性は皆まっすぐ家に帰る。
に対して
```

Also accept an optional `tags:` line:

```text
うちの課は女性がよく飲みに行くのに対して、男性は皆まっすぐ家に帰る。
に対して
tags: 新完全マスター::N３・文法::第１部・６課, grammar::contrast
```

Also accept spaced hyphen hierarchy shorthand in `tags:`:

```text
tags: 新完全マスター - N３・文法 - 第１部・１１課
```

Normalize it before validation as:

```text
新完全マスター::N３・文法::第１部・１１課
```

Also accept a standalone tag-like line without the `tags:` prefix:

```text
佐藤さんの奥さんは料理の先生だ**って**。
新完全マスター - N３・文法 - 第１部・７課
```

In this example, parse `って` as the grammar point clue and normalize the final line to the tag `新完全マスター::N３・文法::第１部・７課`.

Parsing rules:

- Before treating a short standalone line as a grammar clue, check whether it is tag-like. A line is tag-like when it contains `::`, contains spaced hyphen hierarchy separators with at least three non-empty parts such as `A - B - C`, or matches an existing collection tag after normalization. Treat tag-like lines as tags, not grammar clues.
- If exactly one `**...**` span exists, use that span as `surfacePhrase` and remove only the markdown `**` markers from `sentence`.
- If there is no `**...**` span, treat the last short non-tag line as a grammar clue. Use it to identify `surfacePhrase` in the sentence and canonicalize `grammarPoint`.
- If the grammar clue does not occur exactly in the sentence but is a clear conjugated phrase, typo, or partial phrase for a known grammar construction, infer the matching `surfacePhrase` only when confident. For example, with `冷蔵庫が壊れたので、新しいのを買うことにした。` and `買うとにした`, use `買うことにした` as `surfacePhrase` and `～ことにする` as `grammarPoint`.
- If the grammar clue is a canonical pattern such as `～ことにする`, find the matching surface phrase in the sentence, such as `買うことにした`.
- If the surface phrase cannot be confidently found in the sentence, ask the user to clarify.
- If the surface phrase occurs multiple times and no occurrence is marked, ask which occurrence to cloze.
- If there are multiple marked spans, ask whether to create multiple clozes or which grammar point to study.

Canonical grammar-point rules:

- Store the studied grammar pattern in `ヒント`, not the raw sentence fragment.
- Prefer dictionary/citation form for grammar patterns, using `～` when natural: `～ことにする`, `～に対して`, `～ようにする`.
- Convert inflected or sentence-bound forms to the canonical pattern when confident: `買うことにした` -> `～ことにする`.
- Ask the user when multiple canonical grammar patterns could explain the same surface phrase.

## Field Generation

Generate fields as follows:

- `文`: Japanese sentence with Anki cloze syntax.
- `ヒント`: The canonical grammar point itself, not the wider cloze phrase or raw inflected sentence fragment.
- `訳`: Natural English translation of the full sentence.
- `メモ`: English explanation of the grammar meaning, connection pattern, and role in the sentence.

The `文` field must always use `{{c1::...::...}}` cloze syntax with an English hint after the second `::`.

The cloze span may be wider than the grammar point when that is better for learning the construction. For example, if the grammar point is `に対して`, this is better than hiding only `に対して`:

```text
うちの課は女性がよく飲みに{{c1::行くのに対して::in contrast to going out for drinks}}、男性はみなまっすぐ家に帰る。
```

Keep the English cloze hint short and semantic, not a full sentence.

Example for canonical `ヒント`:

```json
{
  "文": "冷蔵庫が壊れたので、新しいのを{{c1::買うことにした::decided to buy}}。",
  "ヒント": "～ことにする",
  "訳": "The refrigerator broke, so I decided to buy a new one.",
  "メモ": "`～ことにする` expresses a decision made by the speaker or subject. In this sentence, the speaker decides to buy a new refrigerator because the old one broke."
}
```

## Tag Selection

If the user supplied `tags:` or a standalone tag-like line, normalize and use those tags.

Tag normalization rules:

- Split multiple tags on commas.
- Trim surrounding whitespace from each tag.
- When a tag contains spaced ASCII hyphen separators like `A - B - C`, convert those separators to Anki hierarchy separators: `A::B::C`.
- Do not convert unspaced hyphens inside tag names.
- Treat an unprefixed line as a tag only when it is tag-like: it contains `::`, contains spaced hyphen hierarchy separators with at least three non-empty parts, or matches an existing collection tag after normalization.

If tags are missing:

1. Use an empty tag list: `[]`.
2. Continue directly to validation and creation.
3. Do not ask the user to choose tags.

## Candidate Payload

Use this Anki MCP note shape:

```json
{
  "deckName": "0.Japanese::Japanese Sentences",
  "modelName": "Japanese Sentence",
  "fields": {
    "文": "<cloze sentence>",
    "ヒント": "<canonical grammar point>",
    "訳": "<English translation>",
    "メモ": "<English grammar explanation>"
  },
  "tags": []
}
```

Validate with:

```json
{
  "notes": [
    {
      "deckName": "0.Japanese::Japanese Sentences",
      "modelName": "Japanese Sentence",
      "fields": {
        "文": "<cloze sentence>",
        "ヒント": "<canonical grammar point>",
        "訳": "<English translation>",
        "メモ": "<English grammar explanation>"
      },
      "tags": []
    }
  ]
}
```

Create with:

```json
{
  "notes": [
    {
      "deckName": "0.Japanese::Japanese Sentences",
      "modelName": "Japanese Sentence",
      "fields": {
        "文": "<cloze sentence>",
        "ヒント": "<canonical grammar point>",
        "訳": "<English translation>",
        "メモ": "<English grammar explanation>"
      },
      "tags": []
    }
  ],
  "openAfterCreate": true
}
```

## Failure Handling

- If `Japanese Sentence` is missing or fields do not match, stop and report the schema mismatch.
- If validation fails, show the validation result and do not call `cthu_anki_add_notes`.
- If note creation succeeds but Browser opening fails, report the warning without treating creation as failed.
- If the user asks for a dry run or preview, generate and show the candidate without calling write tools.
