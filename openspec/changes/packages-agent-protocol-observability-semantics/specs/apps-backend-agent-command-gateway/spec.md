## ADDED Requirements

### Requirement: Gateway protocol correlation
The backend agent command gateway SHALL attach and preserve protocol observability metadata when dispatching typed commands and correlating responses.

#### Scenario: Request metadata is attached
- **WHEN** a backend request dispatches an agent command with request context
- **THEN** the gateway attaches bounded protocol observability metadata to the command message before writing it to the active agent connection

#### Scenario: Response metadata is preserved
- **WHEN** an agent command response includes observability metadata
- **THEN** the gateway preserves that metadata for backend runtime and diagnostic events
