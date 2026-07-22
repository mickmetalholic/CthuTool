## Why

The local Agent is single-user software, but it must switch between multiple deployed environments and some backends may be exposed to the public internet. A full device enrollment, ownership, credential rotation, and revocation system is unnecessary; the minimum safe model is a trusted environment catalog, one active environment, a static Agent secret, and reuse of an existing Web session or trusted access gateway for operator requests.

## What Changes

- Add environment profiles that bind an environment id and label to its exact deployed Web origin and Agent-console URL, backend HTTP URL, backend Agent WebSocket URL, and environment-scoped local data paths.
- Allow exactly one active environment and switch it without restarting the tray, while closing old commands/contexts, invalidating Web bridge tickets, and reconnecting the Agent.
- Isolate backend Agent secrets, browser profiles, configuration, and diagnostics by environment.
- Authenticate public Agent WebSocket registration with a static per-environment Agent secret; do not add enrollment codes, device ownership, credential rotation, or revocation workflows.
- Require public machine-control APIs to run behind a minimal single-operator session or an equivalent trusted access gateway.
- Route backend commands to the authoritative Agent connection for the requested environment instead of selecting the first browser-capable Agent.
- Bind each environment to an exact trusted Web origin for future loopback bridge access.

## Capabilities

### New Capabilities

- `apps-agent-environment-routing`: Trusted environment catalog, single active environment, environment switching, isolated local state, and environment/Web-origin binding.
- `apps-backend-single-user-agent-access`: Minimal public-backend protection using a single-operator access boundary and a separate static Agent WebSocket secret, without device enrollment or multi-user authorization.

### Modified Capabilities

- `apps-backend-agent-registry`: Agent registration is authenticated by environment-scoped static secret and registry state is keyed by environment plus stable non-secret Agent id.
- `apps-backend-agent-command-gateway`: Command dispatch resolves an explicit environment to its authoritative connection instead of selecting the first capable Agent.
- `packages-agent-protocol`: Lifecycle and command metadata carry bounded environment identity and connection generation without exposing static secrets.

## Impact

- Affects the headless Agent configuration/data layout, backend registry/gateway, public command access boundary, shared protocol, tray environment menu, and CLI environment commands.
- Intentionally avoids a device database, enrollment UI, tenant/RBAC model, or automated credential lifecycle.
- Must follow `extract-local-agent-runtime` and precede the deployed Web/local bridge and tray integration changes.
