## Why

Japanese sentence grammar cards currently require the user to manually turn an example sentence into the `Japanese Sentence` note shape, write an English translation, explain the grammar point, choose tags, and call the Anki MCP tools. This is repetitive and error-prone now that CthuCodex already provides Anki collection/schema and note creation tools.

## What Changes

- Add a plugin-bundled Codex skill for creating `Japanese Sentence` Anki notes from a Japanese example sentence and grammar point.
- Default new notes to the `0.Japanese::Japanese Sentences` deck and the `Japanese Sentence` note type.
- Support grammar point extraction from either `**...**` emphasis inside the sentence or a separate grammar-point line.
- Generate the `文` field as an Anki cloze with an English cloze hint, the `ヒント` field as the canonical grammar point, the `訳` field as an English translation, and the `メモ` field as an English grammar explanation.
- Canonicalize sentence-bound or inflected grammar clues before writing `ヒント`, such as `買うことにした` -> `～ことにする`.
- Require a tag-selection step before writing unless the user explicitly provides `tags:` in the input; when tags are missing, list all existing Anki collection tags for the user to choose from.
- Normalize user-provided spaced hyphen tag hierarchy shorthand, such as `新完全マスター - N３・文法 - 第１部・１１課`, to Anki hierarchy tags such as `新完全マスター::N３・文法::第１部・１１課`.
- Use the existing Anki MCP tools for schema checks, validation, note creation, and optional post-create review.

## Capabilities

### New Capabilities
- `codex-plugins-cthu-codex-japanese-sentence-skill`: Defines the plugin-local skill workflow for generating and writing `Japanese Sentence` notes through the CthuCodex Anki MCP tools.

### Modified Capabilities
None.

## Impact

- Adds a skill under `codex/plugins/cthu-codex/skills/`.
- Adds skill metadata under that skill's `agents/` directory if supported by the local plugin skill layout.
- Updates `codex/plugins/cthu-codex/README.md` to mention the Japanese sentence card workflow.
- May update plugin metadata only if required for plugin-bundled skill discovery.
- Does not change the language-coach hook behavior.
- Does not add new destructive Anki MCP tools.
