## 1. Config Schema

- [x] 1.1 Define shared observability config types for log level, diagnostics enablement, diagnostics directory, console diagnostics, sampling, and optional exporter endpoints.
- [x] 1.2 Implement parsing and validation helpers with safe development and production defaults.
- [x] 1.3 Add structured validation errors for unsupported log levels, invalid sampling values, invalid directories, and malformed endpoints.

## 2. Config Boundaries

- [x] 2.1 Ensure observability config remains separate from browser site and browser auth configuration.
- [x] 2.2 Add redaction behavior so config diagnostics never print secrets, cookies, tokens, or storage-state values.
- [x] 2.3 Export typed helpers for app-level adoption without instantiating logging or telemetry clients.

## 3. Verification

- [x] 3.1 Add config package unit tests for defaults, valid overrides, and invalid values.
- [x] 3.2 Add tests for sensitive-field rejection or omission.
- [x] 3.3 Add tests confirming browser-sites config behavior is unchanged.
- [x] 3.4 Run config typecheck and tests.
