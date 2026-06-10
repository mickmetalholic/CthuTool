## Context

CthuCodex is the repository-managed Codex plugin under `codex/plugins/cthu-codex`. It currently bundles a language-coach hook and an Anki MCP server. The Anki MCP server can read collection schema, validate candidate notes, create notes, store media, and open created notes in Anki's Browser.

The target note type already exists in the user's Anki collection as `Japanese Sentence`, with fields `文`, `ヒント`, `訳`, and `メモ`. The user wants a repeatable manual skill that turns a Japanese example sentence and grammar point into one `Japanese Sentence` note, defaults to deck `0.Japanese::Japanese Sentences`, uses English translation and cloze hints, writes English grammar notes, and lets the user choose tags before writing.

## Goals / Non-Goals

**Goals:**

- Add a plugin-local skill under CthuCodex for making Japanese sentence grammar cards.
- Keep the workflow manual and explicit: the skill runs when requested, not from the prompt-submission hook.
- Make the skill depend on existing Anki MCP tools instead of adding a new script or raw AnkiConnect action.
- Define reliable parsing rules for grammar points provided through `**...**` emphasis or a separate grammar-point line, including the distinction between the clozed surface phrase and canonical grammar point.
- Require tag confirmation unless the user provides `tags:` in the initial input, and list all existing Anki collection tags when asking.
- Validate the candidate note before writing and open the created note for review when practical.

**Non-Goals:**

- Do not add new Anki MCP write actions.
- Do not change the existing language-coach hook behavior.
- Do not create a general Japanese grammar parser.
- Do not write cards without validation.
- Do not silently choose tags when the user has not supplied them.

## Decisions

### Add a plugin-local skill, not a standalone repository skill

The skill should live under `codex/plugins/cthu-codex/skills/anki-japanese-sentence-card-maker/`. This keeps the workflow packaged with the Anki MCP server it depends on and avoids adding a separate top-level repository skill with an implicit dependency on CthuCodex.

The skill should be explicit-only by setting `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. The skill remains available through direct `$anki-japanese-sentence-card-maker` invocation, but it should not be implicitly invoked from ordinary prompts.

Alternative considered: put the skill under `codex/skills`. That would be easier to install as a standalone repository skill, but it would weaken the ownership boundary: the workflow is specifically a CthuCodex Anki workflow.

### Keep the skill instruction-only

The implementation should be a concise `SKILL.md` plus UI metadata if supported. It should not add a helper script for note generation because the fragile part is reasoning over Japanese grammar, translation, cloze scope, and tag confirmation. Codex can perform that reasoning directly, while the Anki MCP tools handle deterministic writes.

Alternative considered: add a deterministic parser script. That would help with markdown extraction, but it would still need LLM judgment for natural cloze scope and explanations, so a script would add surface area without enough reliability gain.

### Use a strict candidate-review workflow

The skill should always build a candidate note first. If tags are missing, it should pause, list all existing collection tags returned by `cthu_anki_collection_schema`, and ask the user to choose tags. Only after the candidate is complete should it call `cthu_anki_validate_notes`, then `cthu_anki_add_notes` with `openAfterCreate: true`.

If the user includes `tags:` in the input, the skill can skip the tag question, but it still normalizes tag shorthand and validates before adding. For tag hierarchy shorthand, spaced ASCII hyphen separators such as `A - B - C` become Anki hierarchy separators, `A::B::C`; unspaced hyphens inside tag names are preserved.

### Generate natural cloze scope and English cloze hints

The `文` field should always contain Anki cloze syntax. The cloze span can be wider than the grammar point when that better captures the learned construction. For example, a grammar point of `に対して` can become `{{c1::行くのに対して::in contrast to going out for drinks}}`. The hint after `::` should be English.

The `ヒント` field remains the canonical grammar point itself, not the wider cloze span or raw inflected phrase. For example, the clozed surface phrase can be `買うことにした`, while `ヒント` should be `～ことにする`.

### Canonicalize grammar clues for `ヒント`

The user's grammar clue may be a sentence-bound phrase, an inflected form, or a slightly mistyped clue. The skill should separate:

- `surfacePhrase`: the exact span to cloze in `文`
- `grammarPoint`: the canonical grammar pattern to write into `ヒント`

When confident, infer the canonical pattern. For example, `買うことにした` should become `～ことにする`. If the clue does not exactly occur in the sentence but clearly points to the same construction, such as `買うとにした` for `買うことにした`, the skill may use the sentence's actual phrase as `surfacePhrase` and the canonical pattern as `grammarPoint`. If multiple patterns are plausible, it should ask the user.

### Preserve user-facing language choices

The `訳` field should be an English translation of the sentence. The `メモ` field should be English, focused on grammar meaning, connection pattern, and how the construction works in the sentence.

## Risks / Trade-offs

- Ambiguous input parsing -> Ask the user for the sentence and grammar point instead of guessing.
- Ambiguous grammar canonicalization -> Ask for the intended grammar pattern before writing `ヒント`.
- Grammar point appears more than once -> Ask which occurrence to cloze unless one occurrence is clearly marked by `**...**`.
- Existing schema drifts -> Start by reading `cthu_anki_collection_schema` for `Japanese Sentence` and stop if fields or note type are missing.
- AI-generated translation or notes may be imperfect -> Present the candidate note before writing when the user needs review, and always use Anki validation before creation.
- Tag selection can slow down card creation -> Skip the tag question only when `tags:` is provided explicitly.
