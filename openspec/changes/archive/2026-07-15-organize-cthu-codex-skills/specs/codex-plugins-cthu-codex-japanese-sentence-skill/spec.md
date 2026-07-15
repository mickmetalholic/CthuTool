## MODIFIED Requirements

### Requirement: Plugin-local Japanese sentence card skill
CthuCodex SHALL provide a plugin-local explicit-only skill for creating `Japanese Sentence` Anki notes from user-provided Japanese example sentences and grammar points.

#### Scenario: Skill lives inside CthuCodex
- **WHEN** the Japanese sentence card skill is implemented
- **THEN** its skill instructions live under `codex/plugins/cthu-codex/skills/anki-create-japanese-sentence-card/`
- **AND** the skill is packaged with CthuCodex rather than as a standalone top-level repository skill

#### Scenario: Skill uses the grouped invocation name
- **WHEN** the Japanese sentence card skill is presented or invoked
- **THEN** its skill name is `anki-create-japanese-sentence-card`
- **AND** its display name starts with `Anki ·`

#### Scenario: Skill is explicit-only
- **WHEN** the Anki Japanese sentence card skill is installed
- **THEN** its `agents/openai.yaml` sets `policy.allow_implicit_invocation` to `false`
- **AND** Codex should use it only when explicitly invoked

#### Scenario: Skill remains separate from prompt hook
- **WHEN** the skill is added to CthuCodex
- **THEN** the existing language-coach `UserPromptSubmit` hook remains responsible only for English prose review
- **AND** Japanese sentence card generation is not implemented in the prompt hook
