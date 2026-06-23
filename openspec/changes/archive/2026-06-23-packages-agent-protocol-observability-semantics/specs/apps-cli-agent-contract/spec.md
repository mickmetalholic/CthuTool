## ADDED Requirements

### Requirement: CLI agent correlation metadata
CLI-facing agent contracts SHALL treat protocol observability metadata as structured correlation context rather than human output.

#### Scenario: CLI JSON output excludes protocol metadata by default
- **WHEN** a CLI workflow surfaces an agent protocol result in JSON mode
- **THEN** observability metadata is omitted unless the command contract explicitly includes diagnostic metadata fields

#### Scenario: CLI diagnostics can reference command correlation
- **WHEN** a CLI workflow reports an agent command failure
- **THEN** diagnostics may include bounded command id or request id fields without printing raw protocol payloads
