## ADDED Requirements

### Requirement: OpenSpec project guidance is configured
The repository SHALL configure OpenSpec project context and artifact rules so
future OpenSpec artifact generation follows repository-specific naming, scope,
and generated-adapter policies.

#### Scenario: OpenSpec config carries repository context
- **WHEN** `openspec/config.yaml` is inspected
- **THEN** it defines project context for OpenSpec artifact generation
- **AND** the context includes monorepo area-prefix naming expectations for
  `openspec/specs/<capability>` directories
- **AND** the context states that generated agent adapter instructions under
  `.claude/`, `.codex/`, and `.cursor/` should be regenerated rather than
  hand-edited for project policy

#### Scenario: Artifact rules constrain future changes
- **WHEN** `openspec/config.yaml` is inspected
- **THEN** it defines artifact rules for proposals, specs, designs, and tasks
- **AND** those rules keep each OpenSpec change scoped to one task or change
- **AND** those rules prevent archiving, syncing, or committing neighboring
  OpenSpec changes unless explicitly requested
