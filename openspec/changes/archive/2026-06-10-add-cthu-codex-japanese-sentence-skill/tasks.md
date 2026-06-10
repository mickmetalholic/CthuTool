## 1. Skill Structure

- [x] 1.1 Create `codex/plugins/cthu-codex/skills/anki-japanese-sentence-card-maker/`.
- [x] 1.2 Add `SKILL.md` with frontmatter that triggers for Japanese sentence grammar Anki card creation.
- [x] 1.3 Add `agents/openai.yaml` metadata if supported by the plugin skill layout.
- [x] 1.4 Set `policy.allow_implicit_invocation: false` so the skill is explicit-only.

## 2. Skill Workflow

- [x] 2.1 Document the default deck as `0.Japanese::Japanese Sentences` and model as `Japanese Sentence`.
- [x] 2.2 Document parsing rules for `**...**` grammar markers and separate grammar-point lines.
- [x] 2.3 Document clarification behavior for missing, ambiguous, or repeated grammar points.
- [x] 2.4 Document field generation rules for `文`, `ヒント`, `訳`, and `メモ`.
- [x] 2.5 Document cloze generation with English cloze hints and natural wider cloze spans.
- [x] 2.6 Document tag handling: use explicit `tags:` when present, otherwise list all existing Anki tags and ask the user to choose.
- [x] 2.7 Document tag normalization from spaced hyphen hierarchy shorthand to Anki `::` hierarchy tags.
- [x] 2.8 Document canonical grammar-point handling for `ヒント`, separating clozed surface phrases from canonical grammar patterns.

## 3. Anki MCP Integration

- [x] 3.1 Document schema verification with `cthu_anki_collection_schema` before note creation.
- [x] 3.2 Document candidate note construction using the existing Anki MCP note payload shape.
- [x] 3.3 Document validation with `cthu_anki_validate_notes` before creation.
- [x] 3.4 Document note creation with `cthu_anki_add_notes` and `openAfterCreate: true`.
- [x] 3.5 Document failure handling for schema drift, validation failures, and Browser-opening warnings.

## 4. Documentation and Packaging

- [x] 4.1 Update `codex/plugins/cthu-codex/README.md` to list the Japanese sentence card skill.
- [x] 4.2 Update CthuCodex plugin metadata only if local plugin skill discovery requires it.
- [x] 4.3 Keep the language-coach hook files unchanged.

## 5. Verification

- [x] 5.1 Validate the skill folder structure and frontmatter.
- [x] 5.2 Run the relevant CthuCodex or CLI tests if plugin packaging metadata changes.
- [x] 5.3 Manually dry-run the skill workflow against a sample sentence without writing to Anki.
- [x] 5.4 Optionally smoke-test against local AnkiConnect by validating one candidate note before any real add.
