## Why

The CLI browser surface now overlaps with CthuDesktop, while Desktop already owns local browser runtime, login, profile, and user-facing status workflows. Removing the CLI entry avoids keeping a thin diagnostic wrapper that can be mistaken for supported browser automation ownership.

## What Changes

- **BREAKING**: Remove the `chc browser` command group instead of retaining `doctor`, `status`, or deprecated compatibility stubs.
- Remove CLI-local browser auth helper code that opens login browsers, writes storage-state bundles, or verifies third-party browser identity.
- Generalize the existing `chc codex` help behavior so any top-level command invoked without enough arguments prints its native help instead of running partial command logic.
- Update browser-auth documentation so regular browser runtime/status workflows point to CthuDesktop.
- Document that developer troubleshooting can call backend browser APIs directly, without a CLI wrapper.
- Keep backend browser APIs and Desktop browser workflows unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-browser-runtime`: CLI browser runtime and status requirements change from providing `chc browser doctor/status` to explicitly not exposing a CLI browser command surface.
- `apps-cli-agent-contract`: CLI entry behavior changes so incomplete top-level commands render help successfully.

## Impact

- Affected CLI files include root command registration, the browser command implementation, old browser-auth helper code, and related unit tests.
- Affected CLI entry behavior includes top-level incomplete command handling for commands such as `chc codex`, `chc scripts`, and `chc completion`.
- Affected documentation includes `docs/browser-auth.md`.
- Affected specs include `openspec/specs/apps-cli-browser-runtime`.
- Backend browser APIs, Desktop browser runtime/login/status behavior, and task-center behavior stay in place.
