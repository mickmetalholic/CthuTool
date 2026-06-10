## Why

Japanese vocabulary cards currently require manual parsing of marked words, dictionary-form normalization, reading lookup, cloze-style prompt construction, English meaning generation, tag selection, and Anki MCP calls. CthuCodex already has Anki MCP tooling and a plugin-local Japanese sentence skill pattern, so a dedicated vocabulary-card skill can make this workflow repeatable while preserving user control.

## What Changes

- Add an explicit-only CthuCodex skill for creating `Japanese Vocabulary` Anki notes.
- Use deck `0.Japanese::Japanese Vocabulary` and note type `Japanese Vocabulary`.
- Parse vocabulary targets from `[[...]]`, `**...**`, or a separate vocabulary line, with `[[...]]` taking priority over `**...**`.
- Preserve kana annotations such as `責任（せきにん）` in final example fields while removing markdown markers such as `[[ ]]` and `** **`.
- Normalize inflected sentence forms to dictionary form for `単語`, while using the actual sentence form for `穴埋め例文`.
- Generate `穴埋め例文` in the existing collection style by replacing the target word's sentence form with a short English cue in square brackets.
- Generate `読み方` and English `意味`.
- Reuse existing Anki MCP schema, validation, creation, tag-selection, and post-create review behavior.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-japanese-vocabulary-skill`: CthuCodex plugin-local skill for creating `Japanese Vocabulary` Anki notes from marked Japanese example sentences and vocabulary targets.

### Modified Capabilities

- None.

## Impact

- Adds a new skill under `codex/plugins/cthu-codex/skills/`.
- Updates CthuCodex plugin documentation to mention the vocabulary-card skill.
- Uses existing Anki MCP tools: `cthu_anki_collection_schema`, `cthu_anki_validate_notes`, and `cthu_anki_add_notes`.
- Does not change the existing language-coach hook, Anki MCP server implementation, or the Japanese sentence-card skill.
