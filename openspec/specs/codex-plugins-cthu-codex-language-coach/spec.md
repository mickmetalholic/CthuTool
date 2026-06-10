# codex-plugins-cthu-codex-language-coach Specification

## Purpose
TBD - created by archiving change codex-plugins-cthu-codex-language-coach-detector. Update Purpose after archive.
## Requirements
### Requirement: Language coach hook emits coaching only for English prose intent
The CthuCodex language-coach hook SHALL inject English coaching context only when the latest user prompt contains English prose intent after local filtering.

#### Scenario: English prose triggers coaching
- **WHEN** the hook receives a valid `UserPromptSubmit` payload whose prompt text is English prose
- **THEN** it exits successfully
- **AND** it writes a compact JSON object with `hookSpecificOutput.hookEventName` set to `UserPromptSubmit`
- **AND** it includes language-coach instructions in `hookSpecificOutput.additionalContext`

#### Scenario: English-dominant mixed prose triggers coaching
- **WHEN** the hook receives a prompt that is mostly English prose with a few non-English placeholder words
- **THEN** it injects the language-coach context

#### Scenario: Empty or malformed input stays silent
- **WHEN** the hook receives empty stdin, invalid JSON, or a payload without a prompt-like field
- **THEN** it exits successfully
- **AND** it writes `{}` without emitting coaching context

### Requirement: Language coach hook filters non-user prose before routing
The language-coach detector SHALL remove prompt content that is likely code, command, or pasted context before deciding whether to inject coaching.

#### Scenario: Fenced code is ignored
- **WHEN** the prompt contains English words only inside a fenced code block
- **THEN** the hook stays silent

#### Scenario: Inline code is ignored
- **WHEN** the prompt contains English-looking tokens only inside inline code spans
- **THEN** the hook stays silent

#### Scenario: Slash and bang command lines are ignored
- **WHEN** the prompt line starts with `/` or `!`
- **THEN** that line does not contribute to English prose detection

#### Scenario: Code-like identifier lists are ignored
- **WHEN** the prompt consists only of code-like tokens such as camelCase identifiers, all-caps constants, or versioned technology names
- **THEN** the hook stays silent

#### Scenario: Prose mixed with identifiers still triggers coaching
- **WHEN** the prompt contains real English prose plus code identifiers or product names
- **THEN** the hook treats the prompt as English prose intent

### Requirement: Language coach hook preserves Chinese workflow silence
The language-coach hook SHALL remain silent for Chinese-dominant workflow prompts and SHALL NOT translate Chinese by default.

#### Scenario: Pure Chinese prompt stays silent
- **WHEN** the hook receives a prompt written in Chinese
- **THEN** it writes `{}` without injecting coaching or translation context

#### Scenario: Chinese-dominant mixed prompt stays silent
- **WHEN** the hook receives a Chinese-dominant prompt that includes occasional English technical terms
- **THEN** it writes `{}` without injecting coaching or translation context

### Requirement: Language coach hook uses trailing user intent for long pasted prompts
The language-coach detector SHALL evaluate a short trailing user-authored segment instead of the full prompt when the prompt appears to contain a long pasted body followed by a much shorter trailing request.

#### Scenario: Long paste followed by English question triggers coaching
- **WHEN** the prompt contains a long pasted body followed by a short English question
- **THEN** the hook routes based on the short English question
- **AND** it injects language-coach context

#### Scenario: Long paste followed by trivial acknowledgement stays silent
- **WHEN** the prompt contains a long pasted body followed by a short acknowledgement such as `ok`
- **THEN** the hook routes based on the short acknowledgement
- **AND** it writes `{}`

#### Scenario: Balanced multi-sentence prompt is evaluated as a whole
- **WHEN** the prompt contains multiple normal-length prose segments without a short-tail pattern
- **THEN** the detector evaluates the full cleaned prompt

