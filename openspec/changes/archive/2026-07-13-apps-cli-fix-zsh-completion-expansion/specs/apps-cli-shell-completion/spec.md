## ADDED Requirements

### Requirement: zsh candidate expansion
The zsh completion adapter SHALL expand the candidates returned by `chc __complete` and pass each candidate to zsh completion without exposing shell array syntax as a candidate.

#### Scenario: Root candidates are forwarded to compadd
- **WHEN** the generated zsh completion function receives line-oriented candidates from `chc __complete`
- **THEN** it passes each returned candidate as a separate argument to `compadd`
- **AND** it does not pass literal `${candidates[@]}` text as a completion candidate

#### Scenario: Generated parameter expressions remain executable
- **WHEN** a user runs `chc completion zsh`
- **THEN** the emitted zsh parameter expressions are not prefixed with escape characters that make them literal text
