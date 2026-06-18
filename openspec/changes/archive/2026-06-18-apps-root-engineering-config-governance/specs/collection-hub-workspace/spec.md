## ADDED Requirements

### Requirement: Experimental workspace boundary
The `scratches/collection-hub` workspace SHALL remain an experimental nested workspace outside root `@cthutool/*` orchestration until a future change explicitly promotes or integrates it.

#### Scenario: Root checks preserve experimental isolation
- **WHEN** root workspace lint, typecheck, build, or test commands are inspected
- **THEN** they do not require `scratches/collection-hub` package scripts to pass
- **AND** `scratches/collection-hub` continues to provide its own nested workspace verification entrypoint

#### Scenario: Experimental status is documented
- **WHEN** a developer reads repository workspace guidance
- **THEN** it identifies `scratches/collection-hub` as an experimental nested workspace
- **AND** it directs verification for that workspace to commands run from `scratches/collection-hub`
