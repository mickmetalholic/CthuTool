## Why

Observability behavior needs consistent configuration across backend, desktop, web, and CLI without each package inventing its own environment variable names or validation rules. A shared config vocabulary reduces drift for log levels, diagnostics enablement, redaction, and future telemetry endpoints.

## What Changes

- Define shared observability configuration semantics for log level, diagnostics enablement, local diagnostics directory, console diagnostics, sampling, and optional telemetry exporter endpoints.
- Define environment variable and config-file naming conventions that apps can adopt consistently.
- Define validation behavior and structured configuration errors for invalid observability settings.
- Define safe defaults for development and production modes.
- Keep app-specific behavior in app-level changes; this package defines shared config shape and parsing semantics.

## Capabilities

### New Capabilities

- `packages-config-observability`: Shared observability configuration schema, defaults, validation, and error semantics.

### Modified Capabilities

- None.

## Impact

- Affects `packages/config` source, tests, and public exports for shared observability configuration helpers.
- May affect app `.env.example` files and service configuration parsing in backend, desktop, and CLI follow-up changes.
- No existing browser-sites config behavior should change except documentation that clarifies separation from observability settings.
