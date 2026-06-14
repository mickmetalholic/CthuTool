## Context

CthuCodex is the repository-managed Codex plugin under `codex/plugins/cthu-codex`. It already bundles an Anki MCP server and explicit-only Anki card skills for Japanese sentence and Japanese vocabulary notes.

The user's Anki collection contains an `English Expression` note type with fields `Sentence`, `Expression`, and `Explanation`, and deck `0.English`. Existing notes use `Sentence` as a cloze field such as `{{c1::get past the maze of::navigate / work through / overcome}}`, store the raw expression in `Expression`, and use `Explanation` for a structured English explanation with definition, synonyms, and other examples.

AnkiConnect was reachable during exploration, but was unavailable during proposal creation. Implementation should verify the live schema again before marking validation tasks complete.

## Goals / Non-Goals

**Goals:**

- Add a plugin-local skill under CthuCodex for making English expression Anki cards.
- Keep the skill explicit-only, matching the Japanese Anki card skills.
- Use existing Anki MCP tools instead of adding new AnkiConnect actions.
- Support marked expressions, separate expression lines, and excerpt inputs where the target expression can be found in a sentence.
- Generate cloze `Sentence`, raw `Expression`, and structured English `Explanation`.
- Reuse optional tag behavior from the Japanese card skills.

**Non-Goals:**

- Do not add a new Anki MCP server action.
- Do not change the `English Expression` note type schema.
- Do not change the language-coach hook.
- Do not add automatic card generation from ordinary English coaching prompts.
- Do not implement a general English vocabulary dictionary card workflow unless a later change defines one.

## Decisions

### Add a Separate English Expression Skill

The skill should live under `codex/plugins/cthu-codex/skills/anki-english-expression-card-maker/`. English expression cards have different fields and generation semantics from Japanese sentence and vocabulary cards, so a separate skill keeps the workflows focused.

Alternative considered: extend the language-coach hook. That would blur English review with Anki writing and could accidentally make card creation implicit. Keeping the skill explicit-only preserves user control.

### Keep the Skill Instruction-Based

The implementation should be a concise `SKILL.md` plus `agents/openai.yaml`. The fragile parts are expression selection, cloze hint wording, and explanation generation, which are better handled by Codex instructions than by brittle deterministic parsing.

Alternative considered: add a script parser. This is unnecessary for the first version because the existing Japanese card skills already succeed with instruction-based parsing plus Anki MCP validation.

### Parse Expression Inputs Conservatively

The skill should accept:

1. A sentence with exactly one `**...**` expression marker.
2. A sentence plus a separate expression line.
3. A longer excerpt plus a marked expression or expression clue, when one containing sentence can be confidently selected.

If the expression is missing, occurs multiple times, or spans multiple possible sentences, the skill should ask the user before writing.

### Generate Fields in the Existing Collection Style

The skill should generate:

- `Sentence`: source sentence with `{{c1::<expression>::<synonym / paraphrase / synonym>}}`.
- `Expression`: the expression without markers.
- `Explanation`: English structured content using `Definition`, `Synonyms`, and `Other Examples`.

The cloze hint should contain two to four short synonyms or paraphrases so the user sees the meaning field without receiving form cues such as word count, initials, or partially masked spellings. The fuller explanation belongs in `Explanation`, and its `Synonyms` section should provide a broader five-to-eight-item set.

### Reuse Optional Tag Behavior

Tags should work like the latest Japanese card skills:

- Use `tags:` when present.
- Treat standalone tag-like lines as tags when they contain `::`, contain spaced hierarchy separators such as `A - B - C`, or match an existing collection tag after normalization.
- Normalize spaced hierarchy shorthand to Anki `::` hierarchy tags.
- Use `tags: []` when no tags are supplied.

## Risks / Trade-offs

- Expression boundaries may be ambiguous -> Ask the user when the target expression cannot be confidently located or appears multiple times.
- Cloze hints may become fill-in-the-blank cues -> Use meaning-only synonym/paraphrase hints and avoid word counts, initials, or masked spellings.
- Generated examples may be too artificial -> Require natural, varied examples in the skill instructions.
- Duplicate cards may exist -> Validate with `cthu_anki_validate_notes` before writing and report validation failures.
- AnkiConnect may be unavailable during implementation -> Include a verification task that runs live schema and validation only when AnkiConnect is reachable.
