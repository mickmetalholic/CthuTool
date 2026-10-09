## Why

Several managed libraries share People & Organizations, formerly People Vault. Their relation workflows need a shared schema and template reference so new related records receive the correct icon.

## What Changes

- Add a selectively loaded People & Organizations reference with identity, entity-type, and reciprocal-relation safeguards.
- Require template-based creation: bands use the electric-guitar template and individuals use the user template, including individual musicians.
- Link existing people-related library references without broadening their related-record creation permissions.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-notion-people-reference`: Shared entity matching and required template handling for related people and organizations.

### Modified Capabilities

None.

## Impact

The unified business-plugin skill, linked library references, documentation, and scoped OpenSpec artifacts. No live Notion writes or new standalone skill.
