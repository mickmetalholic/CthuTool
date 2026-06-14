## 1. Skill Structure

- [x] 1.1 Create `codex/plugins/cthu-codex/skills/anki-english-expression-card-maker/`.
- [x] 1.2 Add `SKILL.md` with frontmatter that triggers for explicit English expression Anki card creation.
- [x] 1.3 Add `agents/openai.yaml` metadata for the skill.
- [x] 1.4 Set `policy.allow_implicit_invocation: false` so the skill is explicit-only.

## 2. Skill Workflow

- [x] 2.1 Document the default deck as `0.English` and model as `English Expression`.
- [x] 2.2 Document the required fields: `Sentence`, `Expression`, and `Explanation`.
- [x] 2.3 Document expression target parsing for `**...**`, separate expression lines, and longer excerpts.
- [x] 2.4 Document ambiguity handling for missing targets, multiple target occurrences, and multiple containing sentences.
- [x] 2.5 Document cloze generation using `{{c1::<expression>::<synonym / paraphrase / synonym>}}`.
- [x] 2.6 Document `Expression` field generation with user markup removed.
- [x] 2.7 Document `Explanation` generation with `Definition`, `Synonyms`, and `Other Examples` sections.
- [x] 2.8 Document tag handling: use explicit `tags:` or standalone tag-like lines when present, otherwise use no tags and continue.
- [x] 2.9 Document tag normalization from spaced hyphen hierarchy shorthand to Anki `::` hierarchy tags.

## 3. Anki MCP Integration

- [x] 3.1 Document schema verification with `cthu_anki_collection_schema` before note creation.
- [x] 3.2 Document candidate note construction using the existing Anki MCP note payload shape.
- [x] 3.3 Document validation with `cthu_anki_validate_notes` before creation.
- [x] 3.4 Document note creation with `cthu_anki_add_notes` and `openAfterCreate: true`.
- [x] 3.5 Document failure handling for schema drift, validation failures, Browser-opening warnings, ambiguous expressions, and duplicate-card validation failures.

## 4. Documentation and Packaging

- [x] 4.1 Update `codex/plugins/cthu-codex/README.md` to list the Anki English expression card skill.
- [x] 4.2 Update CthuCodex plugin metadata only if local plugin skill discovery requires it.
- [x] 4.3 Keep the language-coach hook files unchanged.
- [x] 4.4 Keep the existing Japanese Anki card skills behavior unchanged.

## 5. Verification

- [x] 5.1 Validate the skill folder structure and frontmatter.
- [x] 5.2 Verify `agents/openai.yaml` uses the expected display name and explicit-only policy.
- [x] 5.3 Verify the skill instructions include sample parsing for marked expressions, separate expression lines, and standalone tag-like lines.
- [x] 5.4 Manually dry-run candidate generation for `Nutrition labels can offer some helpful clues if you can **get past the maze of** information and jargon.`.
- [x] 5.5 Smoke-test against local AnkiConnect by validating one `English Expression` candidate note before any real add when Anki is reachable.
- [x] 5.6 Run relevant repository checks such as `git diff --check`.

## 6. Hint Refinement

- [x] 6.1 Update cloze hints to use two to four meaning-only synonyms or paraphrases.
- [x] 6.2 Document that cloze hints must avoid word counts, initials, and partially masked spellings.
- [x] 6.3 Expand `Explanation` synonym guidance to five to eight close synonyms or paraphrases.
