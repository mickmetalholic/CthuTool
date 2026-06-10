---
name: anki-japanese-vocabulary-card-maker
description: Create Japanese Vocabulary Anki notes from Japanese example sentences and marked vocabulary targets through the CthuCodex Anki MCP tools. Use when the user explicitly asks to make, add, generate, or create a Japanese vocabulary card/note for Anki, especially for the `Japanese Vocabulary` note type with fields `単語`, `読み方`, `穴埋め例文`, `例文`, and `意味`, dictionary-form normalization, English meaning cues, kana annotations, and optional tags.
---

# Anki Japanese Vocabulary Card Maker

Use this skill to create one `Japanese Vocabulary` Anki note from a Japanese example sentence and vocabulary target.

## Constants

- Deck: `0.Japanese::Japanese Vocabulary`
- Model: `Japanese Vocabulary`
- Required fields: `単語`, `読み方`, `穴埋め例文`, `例文`, `意味`

## Workflow

1. Parse the user's input into:
   - `sentence`: the Japanese example sentence with user markup removed and kana annotations preserved.
   - `surfaceForm`: the exact sentence form to replace in `穴埋め例文`.
   - `lemma`: the dictionary form to write to `単語`.
   - `reading`: the reading of `lemma`.
   - `englishCue`: a short contextual English cue for `穴埋め例文`.
   - `meaning`: an English meaning or explanation for `意味`.
   - `tags`: optional tags from a `tags:` line or standalone tag-like line, normalized before validation.
2. Call `cthu_anki_collection_schema` for `Japanese Vocabulary`.
3. Confirm the model exists and fields include `単語`, `読み方`, `穴埋め例文`, `例文`, and `意味`.
4. If no tags were supplied, use an empty tag list and continue without asking for tags.
5. Generate a candidate note payload.
6. Show the candidate if review would help, especially when `lemma`, `reading`, or the English cue required judgment.
7. Call `cthu_anki_validate_notes` with the candidate note.
8. If validation passes, call `cthu_anki_add_notes` with `openAfterCreate: true`.
9. Report the created note ID and any Browser-opening warning.

Do not write a note if the target, dictionary form, reading, schema, or validation result is unclear.

## Input Parsing

Accept a vocabulary target marked with double brackets:

```text
子供が生まれて（うまれて）うれしかった**一方で**、[[重い]]責任（せきにん）も感じた。
```

Also accept a vocabulary target marked with bold when no double-bracket target exists:

```text
子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。
```

Also accept a separate vocabulary line:

```text
子供が生まれて（うまれて）うれしかった一方で、重い責任（せきにん）も感じた。
重い
```

Also accept an optional `tags:` line:

```text
子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。
tags: 无敌绿宝书::N3必考词::第2单元
```

Also accept spaced hyphen hierarchy shorthand in `tags:`:

```text
tags: 无敌绿宝书 - N3必考词 - 第2单元
```

Normalize it before validation as:

```text
无敌绿宝书::N3必考词::第2单元
```

Also accept a standalone tag-like line without the `tags:` prefix:

```text
子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。
无敌绿宝书 - N3必考词 - 第2单元
```

In this example, parse `重い` as the vocabulary target and normalize the final line to the tag `无敌绿宝书::N3必考词::第2单元`.

Parsing priority:

0. Before treating a short standalone line as a vocabulary clue, check whether it is tag-like. A line is tag-like when it contains `::`, contains spaced hyphen hierarchy separators with at least three non-empty parts such as `A - B - C`, or matches an existing collection tag after normalization. Treat tag-like lines as tags, not vocabulary clues.
1. If exactly one `[[...]]` span exists, use that span as `surfaceForm`.
2. If no `[[...]]` span exists and exactly one `**...**` span exists, use that span as `surfaceForm`.
3. If both `[[...]]` and `**...**` exist, use `[[...]]` as `surfaceForm` and treat `**...**` as lower-priority grammar or context information.
4. If no target marker exists, treat the last short non-tag line as a vocabulary clue when the preceding line is a Japanese sentence containing that clue or an inflected form of it.
5. If multiple possible vocabulary targets remain, ask the user which vocabulary item to study.

Markup and annotation rules:

- Remove `[[`, `]]`, and `**` marker characters from final note fields.
- Preserve kana annotations such as `責任（せきにん）` and `生まれて（うまれて）` in `例文`.
- Preserve kana annotations in `穴埋め例文`, except when the annotated text itself is the target surface form being replaced.

## Dictionary Form

Separate the sentence surface form from the dictionary-form vocabulary item:

- `surfaceForm`: exact text to replace in `穴埋め例文`.
- `lemma`: dictionary form to write to `単語`.

Rules:

- If the marked target is already dictionary form, use it as `lemma`.
- Convert inflected forms to dictionary form when confident.
- For i-adjectives, convert forms such as `重かった` to `重い`.
- For verbs, convert forms such as `起こします` to `起こす`.
- Ask the user when the dictionary form is ambiguous or uncertain.

## Field Generation

Generate fields as follows:

- `単語`: Dictionary-form vocabulary item, not necessarily the sentence surface form.
- `読み方`: Reading of the dictionary-form vocabulary item.
- `穴埋め例文`: Example sentence with `surfaceForm` replaced by `[englishCue]`.
- `例文`: Example sentence with user markup removed and kana annotations preserved.
- `意味`: English meaning or explanation. Include context-specific nuance when useful.

The `穴埋め例文` field must match the existing collection style: replace only the target surface form with a short English cue in square brackets.

Examples:

```json
{
  "単語": "重い",
  "読み方": "おもい",
  "穴埋め例文": "子供が生まれて（うまれて）うれしかった一方で、[serious]責任（せきにん）も感じた。",
  "例文": "子供が生まれて（うまれて）うれしかった一方で、重い責任（せきにん）も感じた。",
  "意味": "heavy; serious; significant. In this sentence, it means serious or weighty, as in a serious responsibility."
}
```

```json
{
  "単語": "重い",
  "読み方": "おもい",
  "穴埋め例文": "昨日は荷物が[heavy]。",
  "例文": "昨日は荷物が重かった。",
  "意味": "heavy. In this sentence, it appears as the past-tense form 重かった."
}
```

```json
{
  "単語": "起こす",
  "読み方": "おこす",
  "穴埋め例文": "毎朝、母が弟を[wakes up]。",
  "例文": "毎朝、母が弟を起こします。",
  "意味": "to wake someone up; to cause. In this sentence, it means to wake someone up."
}
```

Keep `englishCue` short and contextual. Put fuller explanation in `意味`.

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
  "deckName": "0.Japanese::Japanese Vocabulary",
  "modelName": "Japanese Vocabulary",
  "fields": {
    "単語": "<dictionary-form vocabulary>",
    "読み方": "<reading>",
    "穴埋め例文": "<example with [English cue]>",
    "例文": "<clean example sentence>",
    "意味": "<English meaning>"
  },
  "tags": []
}
```

Validate with:

```json
{
  "notes": [
    {
      "deckName": "0.Japanese::Japanese Vocabulary",
      "modelName": "Japanese Vocabulary",
      "fields": {
        "単語": "<dictionary-form vocabulary>",
        "読み方": "<reading>",
        "穴埋め例文": "<example with [English cue]>",
        "例文": "<clean example sentence>",
        "意味": "<English meaning>"
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
      "deckName": "0.Japanese::Japanese Vocabulary",
      "modelName": "Japanese Vocabulary",
      "fields": {
        "単語": "<dictionary-form vocabulary>",
        "読み方": "<reading>",
        "穴埋め例文": "<example with [English cue]>",
        "例文": "<clean example sentence>",
        "意味": "<English meaning>"
      },
      "tags": []
    }
  ],
  "openAfterCreate": true
}
```

## Failure Handling

- If `Japanese Vocabulary` is missing or fields do not match, stop and report the schema mismatch.
- If `lemma` or `reading` is uncertain, ask the user before validation.
- If validation fails, show the validation result and do not call `cthu_anki_add_notes`.
- If note creation succeeds but Browser opening fails, report the warning without treating creation as failed.
- If the user asks for a dry run or preview, generate and show the candidate without calling write tools.
