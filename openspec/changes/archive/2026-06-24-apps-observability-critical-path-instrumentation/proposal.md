## Why

The observability semantics for the main applications exist, but several high-value runtime paths are only partially wired to those contracts. Closing these gaps makes local debugging and future log consumption more reliable without introducing a centralized collector yet.

## What Changes

- Route web frontend API calls through the structured observable fetch path so API success, HTTP failure, network failure, duration, action label, route label, and backend request id are consistently recorded.
- Emit backend readiness observability events when `/health/ready` is evaluated, including browser agent and diagnostics store dependency status using safe bounded fields.
- Apply the shared CLI command diagnostics contract consistently across top-level CLI commands, including start, completion, deliberate command errors, and unexpected command failures.
- Preserve existing output contracts: web production console gating, backend redaction, CLI JSON stdout purity, and CLI quiet-mode suppression.
- No centralized telemetry exporter, metrics backend, or log ingestion service is introduced by this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-web-observability`: Require production API call sites to use the structured web API correlation path instead of leaving the wrapper unused.
- `apps-backend-observability`: Require readiness checks to emit structured dependency readiness events in addition to returning readiness payloads.
- `apps-cli-observability`: Require all top-level CLI commands to use the shared command diagnostics lifecycle consistently.

## Impact

- Affected code:
  - `apps/web/src` API call sites and web observability tests.
  - `apps/backend/src/modules/health` and backend observability/readiness tests.
  - `apps/cli/src/command`, CLI runtime helpers, and command diagnostics tests.
- Affected contracts:
  - Web console diagnostics remain structured and redacted.
  - Backend observability remains Nest Logger based.
  - CLI diagnostics remain stderr JSON lines gated by `CHC_CLI_DIAGNOSTICS`.
- No external dependencies, persistence backends, OpenTelemetry exporter, or deployment configuration changes are required.
