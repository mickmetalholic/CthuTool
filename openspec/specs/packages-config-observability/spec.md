# packages-config-observability Specification

## Purpose
Define shared observability configuration schema, defaults, validation, environment naming, and redaction boundaries for CthuTool packages and apps.

## Requirements
### Requirement: Observability configuration schema
The config package SHALL define shared observability configuration semantics for log level, diagnostics enablement, diagnostics directory, console diagnostics, sampling, and optional telemetry exporter endpoints.

#### Scenario: Default observability config is valid
- **WHEN** an app requests observability configuration without explicit overrides
- **THEN** the config package returns safe defaults appropriate for the app environment

#### Scenario: Invalid log level is rejected
- **WHEN** configuration provides an unsupported log level
- **THEN** the config package returns a structured validation error identifying the failing field

### Requirement: Observability configuration redaction
The config package SHALL keep observability configuration separate from browser auth state and SHALL NOT expose cookies, tokens, storage-state values, or local browser profile contents as observability configuration.

#### Scenario: Sensitive field appears in config
- **WHEN** an observability configuration source includes raw credentials, cookies, tokens, or storage-state fields
- **THEN** the config package rejects or ignores those fields and does not expose them in typed observability config

### Requirement: Observability environment naming
The config package SHALL define consistent environment variable and config key names for shared observability settings that apps can adopt.

#### Scenario: Environment config is parsed consistently
- **WHEN** an app reads shared observability configuration from environment variables
- **THEN** the config package normalizes and validates those values using the shared schema
