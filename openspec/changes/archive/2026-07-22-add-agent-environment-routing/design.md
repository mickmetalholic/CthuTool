## Context

The product is intended for one operator and one active local Agent, but the operator uses multiple deployments such as development, test, and production. Each deployment may have a distinct Web origin and backend, and a backend may be reachable from the public internet. The previous design treated every Agent as an enrolled device with ownership, rotation, and revocation; that is disproportionate for this trust model.

Public exposure still requires two narrow protections: browser users must pass the existing Web session or a trusted single-operator access gateway before invoking machine-control APIs, and the Agent must prove possession of an environment-specific static secret before its outbound WebSocket becomes routable. This does not require a new user/device credential product.

## Goals / Non-Goals

**Goals:**

- Define a trusted multi-environment catalog and one persisted active environment.
- Switch environment atomically without restarting the tray process.
- Isolate local browser profiles, Agent secret, configuration, and diagnostics by environment.
- Protect publicly reachable backend operator APIs and Agent WebSocket registration with minimal static/session mechanisms.
- Route commands deterministically by environment and connection generation.

**Non-Goals:**

- Device enrollment codes, per-device credential issuance, rotation, or revocation UI.
- Multi-user accounts, tenant ownership, RBAC, device inventory, or simultaneous multi-environment Agent connections.
- Allowing an arbitrary deployed Web page to nominate its own backend or trusted Origin.

## Decisions

### Treat an environment profile as one atomic trust record

Each profile contains `environmentId`, display label, exact `webOrigin`, same-origin `webAgentUrl`, backend HTTPS base URL, backend WSS Agent URL, and local namespace identifiers. Packaged production profiles come from a release-controlled catalog. Development may add custom profiles only through an explicit CLI/development path with a visible trust warning.

The Web page cannot send URLs for the Agent to trust. This prevents a malicious page from turning the local service into a confused deputy.

### Keep exactly one active environment

The Agent persists one active environment id. Switching enters a `switching` state, rejects new commands, cancels or drains bounded pending work, closes controlled browser contexts, invalidates local Web bridge tickets/sessions, closes the old backend connection, changes the environment-scoped roots, and connects to the new backend. The tray stays alive and reports progress.

Supporting simultaneous environments was rejected because it multiplies tray state, credential exposure, profile-locking, and command-routing ambiguity.

### Isolate mutable data by environment

Backend Agent secrets, browser profiles, environment overrides, and logs live under separate environment namespaces. A stable random `agentId` may be reused as non-secret installation identity, but the backend registry key is `(environmentId, agentId)`. Profiles are not shared across production and test by default because a test backend must not gain access to production login state.

### Use static Agent secrets for public WebSocket registration

Each public backend deployment has one Agent secret provisioned in its server secret manager and the matching local environment configuration. The Agent presents it only over WSS using a bounded authentication field or header. The backend compares a verifier in constant time before accepting `agent.hello`. Secrets are stored in user-restricted local configuration, redacted everywhere, and replaced manually when needed.

This deliberately omits enrollment, rotation, and revocation workflows. A leaked secret is handled by replacing the environment secret on backend and local Agent.

### Require a single-operator boundary for public command APIs

A public backend must reject anonymous machine-control and Agent-status APIs. It should reuse the Web application's existing authenticated session when available; otherwise deployment may use a minimal operator login with a Secure HttpOnly session or an authenticated reverse-proxy/access gateway that strips untrusted identity headers. The boundary is single-operator; no new user database, organizations, roles, or device ownership are required.

The Agent secret is separate from the operator secret/session, so compromising one role does not automatically grant the other.

### Route by environment, not first capability match

Backend command callers include an explicit `environmentId`; a single-environment deployment may derive it from trusted server configuration. The gateway resolves only the authoritative connection for that environment, validates generic capability and connection generation, and never falls back to another environment or the first browser-capable Agent.

### Bind the trusted Web origin to the active environment

The active profile's exact Web origin is the only origin eligible to exchange a future local bridge ticket. Environment switch invalidates all tickets issued for the prior origin. Origin binding is not treated as authentication for public backend APIs; it is one layer of the loopback bridge boundary.

## Risks / Trade-offs

- [Static Agent secret leaks] → Use WSS, user-restricted storage, structural redaction, separate secrets per environment, and manual replacement documentation.
- [Public API is deployed without operator protection] → Fail production startup or health readiness unless a supported operator access boundary is configured.
- [Environment switch leaks work across environments] → Close old command correlations and browser contexts, invalidate local tickets, and use separate profile roots before reconnecting.
- [Environment catalog is tampered with] → Ship production profiles through signed release inputs and reject arbitrary runtime origins by default.
- [Single active environment limits automation] → Accept this constraint for the personal-use product; simultaneous environments require a later explicit change.

## Migration Plan

1. Add the environment catalog schema, active-environment persistence, and environment-scoped path resolver behind compatibility defaults.
2. Add minimal operator-boundary checks and static Agent-secret authentication to backend deployment/registry.
3. Update protocol, registry, gateway, and callers to carry trusted environment identity and connection generation.
4. Update the headless Agent and Electron compatibility adapter to switch/reconnect and isolate data by environment.
5. Disable unauthenticated public registration/command APIs; keep an explicit loopback/private development mode only.
6. Roll back by selecting the previous environment profile or re-enabling the bounded private-development mode, never by exposing an anonymous public backend.

## Open Questions

- Choose the initial single-operator access implementation per deployment: repository-owned password session or an authenticated access gateway. Production readiness requires one, but does not require multi-user auth.
- Finalize the release-controlled environment catalog delivery format with `add-agent-release-artifacts`.
