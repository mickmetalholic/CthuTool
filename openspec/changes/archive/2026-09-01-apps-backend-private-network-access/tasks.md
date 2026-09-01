## 1. Backend private-network boundary

- [x] 1.1 Add a shared socket-peer classifier for loopback, RFC1918 IPv4,
  IPv6 unique-local, IPv6 link-local, and IPv4-mapped IPv6 addresses; reject
  public and malformed addresses without adding a dependency.
- [x] 1.2 Simplify Backend service configuration to retain only the runtime
  values still needed by the service, removing access mode, private-development,
  trusted-proxy, gateway-header, and Agent-secret fields and validation.
- [x] 1.3 Update `SingleOperatorAccessService` so protected HTTP routes and
  Agent WebSocket upgrades use the same private-network peer check, retain
  environment-id validation for Agents, and ignore forwarded IP and gateway
  identity headers.
- [x] 1.4 Update Backend unit, integration, and E2E tests for accepted private
  peers, rejected public peers, environment mismatch, loopback behavior, and
  authorization-header independence.

## 2. Agent connection and local state

- [x] 2.1 Remove static Agent-secret fields and read/write paths from Agent
  environment configuration while preserving environment selection, profiles,
  runtime state, logs, and browser settings.
- [x] 2.2 Stop passing `CTHUTOOL_AGENT_SECRET` into the Agent environment
  manager and stop emitting `Authorization: Agent ...` from the WebSocket
  client; keep only the environment-id connection header.
- [x] 2.3 Remove Agent secret readiness/status output and ensure legacy
  `agent-secret` files are ignored and not deleted automatically.
- [x] 2.4 Update Agent runtime, environment, migration, and connection tests
  to cover connections without secrets and preservation of unrelated
  environment-scoped data.

## 3. CLI, bridge, and release contracts

- [x] 3.1 Remove `chc agent env set-secret`, its completion/registry entries,
  protected secret input handling, and secret-specific help and output.
- [x] 3.2 Remove secret-configured checks from `chc agent status` and `doctor`,
  and update uninstall/purge reporting so it no longer claims to preserve or
  delete Agent secrets.
- [x] 3.3 Remove the local bridge environment-secret status resource while
  retaining loopback, origin, bearer-session, and generic credential-redaction
  protections.
- [x] 3.4 Update CLI, bridge, release-layout, and protocol tests and fixtures,
  including command completion and archive inventory expectations.

## 4. Documentation and deployment boundary

- [x] 4.1 Update Backend and Agent configuration documentation to remove the
  obsolete environment variables and static-secret setup instructions.
- [x] 4.2 Document the supported external Web/operator HTTP path as Cloudflare
  Access/Tunnel to private ingress, state that Agent `/ws/agents` remains
  private-network only, and state that direct public Backend port exposure or
  bypassing Access is unsupported.
- [x] 4.3 Update architecture, quick-start, client installation, CLI,
  troubleshooting, and security pages so they no longer instruct operators to
  configure or rotate Agent secrets or trusted-proxy headers.
- [x] 4.4 Update the active OpenSpec main requirements from this change's delta
  specs and verify stale trusted-proxy/private-development/Agent-secret
  references are either removed or explicitly historical.
- [x] 4.5 Record the separate CthuOps follow-up: remove its pending
  trusted-proxy, trusted-IP, gateway, and Secret wiring after the new Backend is
  deployed; keep TLS and the Cloudflare/Tunnel route.

## 5. Verification and rollout readiness

- [x] 5.1 Run focused Backend, Agent runtime, CLI, bridge, and protocol tests
  covering the private-network access contract.
- [x] 5.2 Run documentation validation and the relevant package typechecks or
  lint checks without starting a local service.
- [x] 5.3 Run strict OpenSpec validation for this change and `git diff --check`.
- [x] 5.4 Search the repository for removed configuration names and confirm no
  active runtime path still reads, writes, or requires them.
- [x] 5.5 Verify the rollout order and rollback note: deploy the new Backend,
  test the internal Agent WSS path and Cloudflare-protected external HTTP path,
  then apply the separate CthuOps cleanup.

## 6. Review follow-ups

- [x] 6.1 Align the deployment, architecture, migration, and OpenSpec text with
  the supported topology: external Web/operator HTTP through Cloudflare and
  Agent WSS through the private network only.
- [x] 6.2 Make the local bridge resource test parse the JSON response before
  asserting the absence of a `secret` field.
