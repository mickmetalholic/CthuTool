---
name: anki-english-expression-card-maker
description: Create English Expression Anki notes from English sentences, reading excerpts, and target expressions through the CthuCodex Anki MCP tools. Use when the user explicitly asks to make, add, generate, or create an English expression card/note for Anki, especially for the `English Expression` note type with fields `Sentence`, `Expression`, and `Explanation`, cloze deletion, structured English explanations, examples, and optional tags.
---

# Anki English Expression Card Maker

Use this skill to create one `English Expression` Anki note from an English sentence or excerpt and a target expression.

## Constants

- Deck: `0.English`
- Model: `English Expression`
- Required fields: `Sentence`, `Expression`, `Explanation`

## Workflow

1. Parse the user's input into:
   - `sourceSentence`: the single English sentence to store.
   - `expression`: the expression being studied, with user markup removed.
   - `surfaceSpan`: the exact sentence span to cloze.
   - `clozeHint`: two to four short synonyms or paraphrases for the cloze.
   - `explanation`: structured English content for `Explanation`.
   - `tags`: optional tags from a `tags:` line or standalone tag-like line, normalized before validation.
2. Call `cthu_anki_collection_schema` for `English Expression`.
3. Confirm the model exists and fields include `Sentence`, `Expression`, and `Explanation`.
4. If no tags were supplied, use an empty tag list and continue without asking for tags.
5. Generate a candidate note payload.
6. Show the candidate if review would help, especially when the expression boundary, sentence selection, or hint required judgment.
7. Call `cthu_anki_validate_notes` with the candidate note.
8. If validation passes, call `cthu_anki_add_notes` with `openAfterCreate: true`.
9. Report the created note ID and any Browser-opening warning.

Do not write a note if the expression, source sentence, schema, or validation result is unclear.

## Input Parsing

Accept an expression marked inline:

```text
Nutrition labels can offer some helpful clues if you can **get past the maze of** information and jargon.
```

Also accept a separate expression line:

```text
Nutrition labels can offer some helpful clues if you can get past the maze of information and jargon.
get past the maze of
```

Also accept a longer excerpt when the target expression identifies exactly one containing sentence:

```text
Some advice is simple. Nutrition labels can offer some helpful clues if you can get past the maze of information and jargon. The serving size is a good place to start.
get past the maze of
```

Also accept an optional `tags:` line:

```text
Nutrition labels can offer some helpful clues if you can **get past the maze of** information and jargon.
tags: english-reading::article, health
```

Also accept spaced hyphen hierarchy shorthand in `tags:`:

```text
tags: english-reading - article
```

Normalize it before validation as:

```text
english-reading::article
```

Also accept a standalone tag-like line without the `tags:` prefix:

```text
Nutrition labels can offer some helpful clues if you can **get past the maze of** information and jargon.
english-reading - article
```

In this example, parse `get past the maze of` as the expression and normalize the final line to the tag `english-reading::article`.

Parsing rules:

- Before treating a short standalone line as an expression clue, check whether it is tag-like. A line is tag-like when it contains `::`, contains spaced hyphen hierarchy separators with at least two non-empty parts such as `A - B`, or matches an existing collection tag after normalization. Treat tag-like lines as tags, not expression clues.
- If exactly one `**...**` span exists, use that span as `surfaceSpan` and `expression`, then remove only the markdown `**` markers from `sourceSentence`.
- If there is no `**...**` span, treat the last short non-tag line as an expression clue. Use it to identify `surfaceSpan` in the sentence or excerpt.
- If a longer excerpt is provided, select the sentence containing `surfaceSpan` only when there is exactly one confident containing sentence.
- If the expression clue cannot be found exactly but a close match is obvious, use it only when the intended phrase boundary is clear.
- If the expression cannot be confidently found, appears in multiple possible sentences, or occurs multiple times in the selected sentence, ask the user to clarify before validation.
- If there are multiple marked spans, ask whether to create multiple cards or which expression to study.

## Field Generation

Generate fields as follows:

- `Sentence`: The selected English sentence with the target expression converted to Anki cloze syntax.
- `Expression`: The raw expression with user markup removed.
- `Explanation`: English structured content with `Definition`, `Synonyms`, and `Other Examples` sections.

The `Sentence` field must use `{{c1::<expression>::<synonym / paraphrase / synonym>}}` cloze syntax. The cloze hint should give two to four short synonyms or paraphrases that point to the meaning, without giving form cues such as word count, initials, or partially masked spellings. Put the fuller explanation in `Explanation`.

Format `Explanation` in the existing collection style:

```text
Definition:<br>...<br><br>Synonyms:<br>...<br><br>Other Examples:<br>...
```

Use five to eight synonyms or close paraphrases in `Synonyms`. Use natural, varied example sentences. Three to five examples are usually enough.

Example candidate:

```json
{
  "Sentence": "Nutrition labels can offer some helpful clues if you can {{c1::get past the maze of::navigate / work through / overcome}} information and jargon.",
  "Expression": "get past the maze of",
  "Explanation": "Definition:<br>This phrase means to move through or overcome a confusing, complicated set of information or obstacles.<br><br>Synonyms:<br>navigate through, work through, overcome, make sense of, find one's way through, get through, sort through<br><br>Other Examples:<br>She helped me get past the maze of paperwork.<br>It took a while to get past the maze of technical terms.<br>We need to get past the maze of conflicting advice."
}
```

## Tag Selection

If the user supplied `tags:` or a standalone tag-like line, normalize and use those tags.

Tag normalization rules:

- Split multiple tags on commas.
- Trim surrounding whitespace from each tag.
- When a tag contains spaced ASCII hyphen separators like `A - B`, convert those separators to Anki hierarchy separators: `A::B`.
- Do not convert unspaced hyphens inside tag names.
- Preserve existing Anki hierarchy tags such as `english-reading::book::the-martian`.
- Treat an unprefixed line as a tag only when it is tag-like: it contains `::`, contains spaced hyphen hierarchy separators with at least two non-empty parts, or matches an existing collection tag after normalization.

If tags are missing:

1. Use an empty tag list: `[]`.
2. Continue directly to validation and creation.
3. Do not ask the user to choose tags.

## Candidate Payload

Use this Anki MCP note shape:

```json
{
  "deckName": "0.English",
  "modelName": "English Expression",
  "fields": {
    "Sentence": "<cloze sentence>",
    "Expression": "<expression>",
    "Explanation": "<structured English explanation>"
  },
  "tags": []
}
```

Validate with:

```json
{
  "notes": [
    {
      "deckName": "0.English",
      "modelName": "English Expression",
      "fields": {
        "Sentence": "<cloze sentence>",
        "Expression": "<expression>",
        "Explanation": "<structured English explanation>"
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
      "deckName": "0.English",
      "modelName": "English Expression",
      "fields": {
        "Sentence": "<cloze sentence>",
        "Expression": "<expression>",
        "Explanation": "<structured English explanation>"
      },
      "tags": []
    }
  ],
  "openAfterCreate": true
}
```

## Failure Handling

- If `English Expression` is missing or fields do not match, stop and report the schema mismatch.
- If the expression, sentence selection, or cloze occurrence is ambiguous, ask the user before validation.
- If validation fails, show the validation result and do not call `cthu_anki_add_notes`.
- If validation fails because the note would be a duplicate, report the duplicate-card result and ask before making any alternate card.
- If note creation succeeds but Browser opening fails, report the warning without treating creation as failed.
- If the user asks for a dry run or preview, generate and show the candidate without calling write tools.
