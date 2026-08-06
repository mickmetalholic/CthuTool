## Why

The Backend currently requires a configurable operator access mode, trusted
proxy addresses, a gateway identity header, and a static Agent secret. That
model adds deployment-only authentication configuration that does not match
the actual single-user homelab topology: Agents stay on the private network,
while external Web access is protected before it reaches the homelab through
Cloudflare Access and Tunnel.

The Backend should therefore use one explicit-in-code private-network trust
boundary and remove the unused production access modes and static-secret
lifecycle rather than carrying configuration for deployment shapes that are
not used.

## What Changes

- **BREAKING** Make the Backend's operator APIs and Agent WebSocket accept only
  loopback or private-network socket peers; reject public peer addresses.
- **BREAKING** Remove Backend configuration for
  `CTHUTOOL_OPERATOR_ACCESS_MODE`, `CTHUTOOL_OPERATOR_GATEWAY_HEADER`,
  `CTHUTOOL_TRUSTED_PROXY_IPS`, `CTHUTOOL_PRIVATE_DEVELOPMENT`, and
  `CTHUTOOL_AGENT_SECRET`.
- **BREAKING** Remove static Agent-secret authentication from the Agent
  WebSocket handshake; retain the environment id as routing and environment
  consistency metadata.
- Remove Agent-side static-secret persistence, CLI `env set-secret`, secret
  readiness/status fields, and related migration/documentation paths.
- Keep Cloudflare Access/Tunnel and direct-port firewalling as deployment
  responsibilities outside the Backend process. CthuTool must document that
  external Web and Backend HTTP traffic is safe only when it cannot bypass
  that boundary, while Agent WebSocket traffic remains on the private network.
- Add focused tests for private IPv4/IPv6/loopback acceptance, public-address
  rejection, environment mismatch rejection, and the absence of authorization
  secrets or gateway headers in the connection path.
- Update active OpenSpec requirements and user/operator documentation so the
  private-network boundary, Cloudflare entry path, and reduced configuration
  surface are the canonical model.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-backend-single-user-agent-access`: replace configurable proxy/secret
  authentication with the fixed private-network boundary.
- `apps-backend-agent-registry`: authenticate Agent WebSocket peers by private
  network and environment id instead of a static Agent secret.
- `apps-agent-environment-routing`: remove per-environment static Agent-secret
  configuration and storage from the Agent connection contract.
- `apps-agent-runtime`: remove the static-secret connection header and secret
  diagnostics state.
- `apps-cli-agent-lifecycle`: remove secret configuration commands, status
  checks, and preserved-secret lifecycle behavior.
- `apps-agent-local-bridge`: remove the environment-secret readiness surface
  while retaining local bridge and credential redaction guarantees.
- `apps-agent-release-artifacts`: remove mutable Agent-secret data from the
  release/install contract.
- `packages-agent-protocol`: remove static Agent-secret-specific requirements
  while retaining generic credential and authorization redaction.
- `apps-docs-site`: document fixed private-network access and external
  Cloudflare Access/Tunnel entry without the removed configuration variables.

## Impact

- Backend access configuration and tests under `apps/backend/src/config` and
  `apps/backend/src/modules/operator-access`.
- Agent connection configuration and WebSocket headers in
  `packages/agent-runtime` and `apps/agent`.
- Agent environment data and CLI command implementation/tests under
  `packages/agent-runtime` and `apps/cli`.
- Active OpenSpec specs and deployment/security documentation that currently
  describe trusted-proxy mode or static Agent secrets.
- CthuOps must remove its pending trusted-proxy/Secret wiring in a separate
  operations-repository update; this CthuTool change does not edit CthuOps.
- Existing local `agent-secret` files must not be read or used after the
  change. The implementation should avoid destructive deletion unless an
  explicit migration/cleanup command is later added.
