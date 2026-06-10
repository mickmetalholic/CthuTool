## 1. Skill Structure

- [x] 1.1 Create `codex/plugins/cthu-codex/skills/anki-japanese-vocabulary-card-maker/`.
- [x] 1.2 Add `SKILL.md` with frontmatter that triggers for explicit Japanese vocabulary Anki card creation.
- [x] 1.3 Add `agents/openai.yaml` metadata for the skill.
- [x] 1.4 Set `policy.allow_implicit_invocation: false` so the skill is explicit-only.

## 2. Skill Workflow

- [x] 2.1 Document the default deck as `0.Japanese::Japanese Vocabulary` and model as `Japanese Vocabulary`.
- [x] 2.2 Document the required fields: `単語`, `読み方`, `穴埋め例文`, `例文`, and `意味`.
- [x] 2.3 Document vocabulary target parsing priority for `[[...]]`, single `**...**`, and separate vocabulary lines.
- [x] 2.4 Document lower-priority handling for `**...**` when `[[...]]` is present.
- [x] 2.5 Document removal of user markup while preserving kana annotations such as `責任（せきにん）`.
- [x] 2.6 Document `surfaceForm` versus dictionary-form `lemma` handling.
- [x] 2.7 Document clarification behavior for ambiguous targets or uncertain dictionary forms.
- [x] 2.8 Document field generation rules for `単語`, `読み方`, `穴埋め例文`, `例文`, and `意味`.
- [x] 2.9 Document `穴埋め例文` generation using short English cues in square brackets.
- [x] 2.10 Document tag handling: use explicit `tags:` or standalone tag-like lines when present, otherwise use no tags and continue.
- [x] 2.11 Document tag normalization from spaced hyphen hierarchy shorthand to Anki `::` hierarchy tags.

## 3. Anki MCP Integration

- [x] 3.1 Document schema verification with `cthu_anki_collection_schema` before note creation.
- [x] 3.2 Document candidate note construction using the existing Anki MCP note payload shape.
- [x] 3.3 Document validation with `cthu_anki_validate_notes` before creation.
- [x] 3.4 Document note creation with `cthu_anki_add_notes` and `openAfterCreate: true`.
- [x] 3.5 Document failure handling for schema drift, validation failures, Browser-opening warnings, ambiguous readings, and duplicate-card validation failures.

## 4. Documentation and Packaging

- [x] 4.1 Update `codex/plugins/cthu-codex/README.md` to list the Anki Japanese vocabulary card skill.
- [x] 4.2 Update CthuCodex plugin metadata only if local plugin skill discovery requires it.
- [x] 4.3 Keep the language-coach hook files unchanged.
- [x] 4.4 Keep the existing Anki Japanese sentence-card skill behavior unchanged.

## 5. Verification

- [x] 5.1 Validate the skill folder structure and frontmatter.
- [x] 5.2 Verify `agents/openai.yaml` uses the expected display name and explicit-only policy.
- [x] 5.3 Verify the skill instructions include sample parsing for both `[[重い]]` and `**重い**`.
- [x] 5.4 Manually dry-run candidate generation for `子供が生まれて（うまれて）うれしかった一方で、**重い**責任（せきにん）も感じた。`.
- [x] 5.5 Smoke-test against local AnkiConnect by validating one `Japanese Vocabulary` candidate note before any real add.
- [x] 5.6 Run relevant repository checks such as `git diff --check`.
