## Why

The web app is expected to become a browser-hosted management console, but frontend debugging signals are not yet standardized. Defining web observability semantics now keeps API correlation, user-action diagnostics, and development console logs consistent as real workflows move into `apps/web`.

## What Changes

- Define frontend request correlation semantics for API calls, backend-provided request identifiers, duration, status, and user-visible failure states.
- Define a development console diagnostics contract for `debug`, `info`, `warn`, and `error` events with stable scope, event, action, route, request, duration, and error fields.
- Define production logging constraints so development console logs do not become noisy production output or leak sensitive user data.
- Define frontend error boundary and recoverable UI warning semantics for management-console workflows.
- Define safe logging rules that exclude tokens, cookies, raw HTML, screenshots, personal input values, and unbounded payloads.

## Capabilities

### New Capabilities

- `apps-web-observability`: Web frontend API correlation, UI diagnostics, error boundary, and console logging semantics.

### Modified Capabilities

- `apps-web-project-shell`: The browser-hosted management console gains requirements for observable API calls, safe frontend diagnostics, and standardized development console output.

## Impact

- Affects `apps/web` frontend runtime, API client conventions, console diagnostics wrappers, and future web management-console pages.
- May coordinate with `packages-app-shell-observability` for shared frontend logger contracts and status presentation patterns.
- No external browser telemetry collector is introduced by this proposal.
