## Why

Backend-to-desktop work crosses a WebSocket protocol boundary, so backend-only or desktop-only logging cannot reliably reconstruct a user operation. Protocol-level observability semantics are needed to carry correlation metadata across agent registration, command dispatch, command response, browser state, and error messages.

## What Changes

- Define protocol correlation fields for agent messages, browser commands, browser results, browser errors, and state snapshots.
- Define the relationship between request identifiers, trace identifiers, command identifiers, agent identifiers, and site/profile context.
- Define compatibility behavior for peers that omit optional observability metadata.
- Define validation and redaction constraints so correlation metadata cannot carry arbitrary sensitive payloads.
- Keep concrete transport and telemetry exporter choices outside this change.

## Capabilities

### New Capabilities

- `packages-agent-protocol-observability`: Shared agent protocol correlation, metadata validation, compatibility, and redaction semantics.

### Modified Capabilities

- `apps-backend-agent-command-gateway`: Backend command dispatch consumes and preserves protocol correlation metadata.
- `apps-desktop-browser-host`: Desktop browser command handling consumes and returns protocol correlation metadata.
- `apps-cli-agent-contract`: CLI-facing agent protocol contracts gain correlation semantics where CLI workflows interact with agent messages.

## Impact

- Affects `packages/agent-protocol` schemas, message factories, parsers, tests, and downstream backend/desktop consumers.
- May require coordinated follow-up implementation in `apps/backend` and `apps/desktop`.
- Correlation fields should be optional for backward compatibility unless a later design explicitly approves a breaking protocol version.
