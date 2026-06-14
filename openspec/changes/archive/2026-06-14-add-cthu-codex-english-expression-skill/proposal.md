## Why

English expression cards currently require manual extraction of the target expression, cloze hint writing, explanation generation, tag handling, and Anki MCP calls. CthuCodex already has a repeatable plugin-local Anki skill pattern for Japanese cards and an existing `English Expression` note type, so an explicit English expression skill can make this workflow consistent without changing the Anki schema.

## What Changes

- Add an explicit-only CthuCodex skill for creating `English Expression` Anki notes.
- Use deck `0.English` and model `English Expression`.
- Parse marked English expressions from `**...**`, or infer the target from a separate expression line.
- Generate `Sentence` with Anki cloze syntax and a short English synonym/paraphrase hint.
- Generate `Expression` and a structured `Explanation` containing definition, synonyms, and other examples.
- Reuse the tag behavior from the Japanese card skills: explicit `tags:` lines and standalone tag-like lines are normalized; missing tags become `[]`.
- Reuse existing Anki MCP schema, validation, creation, and post-create review tools.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-english-expression-skill`: CthuCodex plugin-local skill for creating `English Expression` Anki notes from English sentences, reading excerpts, and target expressions.

### Modified Capabilities

- None.

## Impact

- Adds files under `codex/plugins/cthu-codex/skills/anki-english-expression-card-maker/`.
- Updates `codex/plugins/cthu-codex/README.md` to list the new skill.
- Adds a new main spec under `openspec/specs/codex-plugins-cthu-codex-english-expression-skill/` when archived.
- Does not change the Anki MCP server, the language-coach hook, or existing Japanese card skills.
