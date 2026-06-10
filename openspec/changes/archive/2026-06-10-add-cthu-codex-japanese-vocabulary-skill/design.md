## Context

CthuCodex is the repository-managed Codex plugin under `codex/plugins/cthu-codex`. It already bundles an Anki MCP server and an explicit-only Japanese sentence-card skill. The user's Anki collection contains deck `0.Japanese::Japanese Vocabulary` and note type `Japanese Vocabulary` with fields `単語`, `読み方`, `穴埋め例文`, `例文`, and `意味`.

Existing `Japanese Vocabulary` notes use `穴埋め例文` as an example sentence where the Japanese target word is replaced by a short English cue in square brackets, such as `兄は青の[trousers]をはいています。` or `八時にここを[depart]します。`. The new skill should preserve that collection style.

## Goals / Non-Goals

**Goals:**

- Add a plugin-local skill under CthuCodex for making Japanese vocabulary Anki cards.
- Keep the skill explicit-only, matching the Anki Japanese sentence-card skill policy.
- Use existing Anki MCP tools instead of adding new AnkiConnect actions.
- Parse vocabulary targets from `[[...]]`, single `**...**`, or separate vocabulary lines.
- Preserve kana annotations such as `責任（せきにん）` in final example fields.
- Remove user markup such as `[[ ]]` and `** **` from final Anki fields.
- Separate the sentence surface form from dictionary-form vocabulary: `穴埋め例文` replaces the surface form, while `単語` stores dictionary form.
- Generate `読み方`, `穴埋め例文`, `例文`, and English `意味`.
- Treat tags as optional: use `tags:` lines or standalone tag-like lines when present, otherwise create with no tags.

**Non-Goals:**

- Do not add a new Anki MCP server action.
- Do not change the `Japanese Vocabulary` note type schema.
- Do not change the existing language-coach hook behavior.
- Do not change the Japanese sentence-card skill.
- Do not implement a general Japanese morphological analyzer.

## Decisions

### Add a separate vocabulary-card skill

The skill should live under `codex/plugins/cthu-codex/skills/anki-japanese-vocabulary-card-maker/`. Vocabulary-card creation has different parsing and field-generation rules from sentence grammar cards, so a separate skill keeps both workflows small and predictable.

Alternative considered: extend `anki-japanese-sentence-card-maker`. That would blur grammar-card and vocabulary-card semantics, especially around `ヒント` versus `単語`, cloze syntax versus bracket cues, and dictionary-form normalization.

### Keep the skill instruction-only

The implementation should be a concise `SKILL.md` plus `agents/openai.yaml`. The fragile parts are linguistic judgment, dictionary-form normalization, short English cue choice, and ambiguity handling. Codex can perform those directly, while Anki MCP handles deterministic schema reads, validation, and writes.

Alternative considered: add a deterministic parser script. A script could strip markers, but it would still need LLM judgment for lemma selection, reading, and contextual meaning, so it would add surface area without enough reliability gain.

### Use explicit-only invocation

`agents/openai.yaml` should set `policy.allow_implicit_invocation: false`. The user wants these Anki-writing workflows to be manually invoked, not automatically loaded or triggered from ordinary prompts.

### Define target priority and ambiguity handling

The target-selection priority should be:

1. Use `[[...]]` as the vocabulary target when present.
2. If no `[[...]]` exists and exactly one `**...**` span exists, use that span as the vocabulary target.
3. If both `[[...]]` and `**...**` exist, use `[[...]]` as the vocabulary target and treat `**...**` as lower-priority grammar or context information.
4. If multiple possible vocabulary targets remain, ask the user.

### Separate surface form from dictionary form

The skill should track:

- `surfaceForm`: exact sentence form to remove from `穴埋め例文`
- `lemma`: dictionary form to write into `単語`

For example, `重かった` in the sentence should become `単語: 重い`, but `穴埋め例文` should replace `重かった` with `[heavy]`. If the lemma is uncertain, the skill should ask the user.

### Match existing `穴埋め例文` style

The skill should replace only the target surface form with `[short English cue]`. The cue should be short and contextual, not a full definition. Other kana annotations remain in place. For example:

```text
子供が生まれて（うまれて）うれしかった一方で、[serious]責任（せきにん）も感じた。
```

### Use a strict candidate-validation workflow

The skill should read `Japanese Vocabulary` schema with `cthu_anki_collection_schema`, build a complete candidate note, validate with `cthu_anki_validate_notes`, then create with `cthu_anki_add_notes` using `openAfterCreate: true`.

If tags are missing, it should use an empty tag list and continue directly to validation and creation. If tags are supplied through `tags:` or a standalone tag-like line, it should normalize spaced hyphen hierarchy shorthand such as `A - B - C` to `A::B::C`.

## Risks / Trade-offs

- Ambiguous vocabulary target -> Ask which word to study before writing.
- Ambiguous dictionary form -> Ask for the intended dictionary form before writing `単語`.
- Reading generation can be wrong -> Present candidate note when reading is inferred from context or not explicitly supplied.
- English cue may be too broad -> Keep `穴埋め例文` cue short and contextual; put fuller explanation in `意味`.
- Duplicate cards may exist -> Use Anki validation and report validation failures before creation.
- Missing tags should not add friction -> use no tags unless `tags:` or a standalone tag-like line is supplied.
