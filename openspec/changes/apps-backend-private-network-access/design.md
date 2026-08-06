## Context

The Backend currently has two runtime access modes. Production uses
`trusted-proxy`, which combines an exact socket-peer allowlist, an injected
operator identity header, and a static Agent WebSocket secret. Local tests and
development use loopback-only `private-development`. The access service applies
the two paths differently: HTTP operator APIs use the proxy address and header,
while Agent WebSockets use the environment id and static secret.

The intended deployment is smaller and has one trust domain. Backend and all
Agents run behind the homelab's private network. When the Web or Backend HTTP
endpoint is reachable from the public Internet, Cloudflare Access authenticates
the single operator and Cloudflare Tunnel forwards traffic into the private
network. The Agent WebSocket remains private-network only, so Agents do not
need Cloudflare credentials. CthuTool does not need to understand Cloudflare
credentials or carry a second application-level identity protocol.

The change is cross-cutting because the static Agent secret is currently
represented in Backend configuration, Agent connection headers, per-environment
local storage, CLI commands, local bridge status, release assumptions, active
OpenSpec requirements, and operator documentation.

## Goals / Non-Goals

**Goals:**

- Make private-network peer validation the single fixed Backend access boundary
  for both protected HTTP APIs and the Agent WebSocket endpoint.
- Accept loopback, private IPv4, and private IPv6 socket peers while rejecting
  public peers and malformed addresses.
- Remove the Backend access-mode, proxy-header, trusted-IP, private-development,
  and static Agent-secret environment variables.
- Remove the Agent/CLI static-secret lifecycle so the connection path has no
  unused credential state or commands.
- Keep `CTHUTOOL_ENVIRONMENT_ID` as an explicit environment-routing value and
  continue rejecting connections for another environment.
- Document that Cloudflare Access/Tunnel and firewall policy are the only
  supported public-entry controls; the Backend must not trust forwarded client
  IP headers.

**Non-Goals:**

- Do not add Cloudflare API, JWT, service-token, or Tunnel configuration to
  CthuTool.
- Do not make the Backend publicly safe when its raw port or an unprotected
  ingress bypasses the Cloudflare/network boundary.
- Do not add user accounts, device enrollment, operator sessions, secret
  rotation, or multi-user authorization.
- Do not destructively delete existing local `agent-secret` files; leave any
  cleanup or migration command for a later explicitly destructive change.
- Do not modify the CthuOps checkout in this repository change.

## Decisions

### 1. Use one fixed private-network peer policy

The access service will validate `request.socket.remoteAddress` for both HTTP
operator requests and Agent WebSocket upgrades. It will not read
`X-Forwarded-For`, gateway identity headers, or any other caller-provided proxy
metadata.

The accepted address families are:

- IPv4 loopback (`127.0.0.0/8`) and private ranges (`10.0.0.0/8`,
  `172.16.0.0/12`, `192.168.0.0/16`);
- IPv6 loopback (`::1`), unique-local addresses (`fc00::/7`), and link-local
  addresses (`fe80::/10`);
- IPv4-mapped IPv6 values after normalization.

The helper should use the Node standard library for IP classification rather
than adding a dependency. Tests will cover accepted and rejected examples,
including public documentation addresses and malformed input.

**Alternative considered:** Keep `trusted-proxy` and configure one or more
stable ingress addresses. Rejected because it requires deployment-specific
header and Secret wiring, and it does not add value when Cloudflare Access and
the private network already define the trust boundary.

**Alternative considered:** Accept every request and rely only on Cloudflare
Access. Rejected because an accidental direct ingress or internal bypass would
remove all Backend-side network protection.

### 2. Apply the same boundary to HTTP and WebSocket paths

`assertOperator()` will authorize protected HTTP routes only when the peer is
private-network. `authenticateAgent()` will first require the configured
environment id and then require a private-network peer. It will no longer
parse `Authorization: Agent ...` or return static-secret failure categories.

This deliberately treats environment id as routing metadata, not a credential.
The network boundary is the authentication mechanism for this single-user
deployment.

**Alternative considered:** Keep Agent Secret as optional defense in depth.
Rejected for this change because it would preserve a second secret lifecycle,
keep client-side secret state alive, and make the deployment contract appear
more secure than the selected threat model actually requires.

### 3. Remove static-secret state end to end

The Agent connection config, environment manager, local storage, CLI, local
bridge status, and release/docs contracts will stop treating a per-environment
Agent secret as a supported value. The Agent will send only the environment id
header during WebSocket connection setup.

Existing `agent-secret` files are not deleted automatically. They become
unread legacy files and can be removed manually after rollout if desired. This
keeps the migration reversible and avoids turning a security simplification
into an implicit destructive data operation.

**Alternative considered:** Remove only the Backend environment variable while
keeping client secret storage and `set-secret`. Rejected because it leaves a
credential that is never consumed, creates misleading readiness output, and
requires future operators to understand a dead configuration path.

### 4. Keep public entry protection outside CthuTool

The supported external topology is:

```text
External Web/operator HTTP
        |
        v
Cloudflare Access + Tunnel
        |
        v
Private ingress / service peer
        |
        v
      Backend
```

The Cloudflare application must cover the external Web and Backend HTTP routes,
and the homelab firewall must prevent a public route from bypassing Access. The
`/ws/agents` endpoint remains private-network only and must not be exposed
through Cloudflare in this deployment. CthuTool documentation will describe
this dependency, but CthuOps/Cloudflare configuration remains owned by the
operations environment.

**Alternative considered:** Add Cloudflare JWT validation inside Backend.
Rejected because it couples the application to one edge provider, duplicates
Access policy, and is unnecessary for a single trusted private network.

### 5. Roll out Backend and client changes compatibly

The new Backend should be deployed before removing the old CthuOps Secret and
proxy variables. The new parser/access service ignores those obsolete values,
so existing Agent binaries can continue to connect while the client and CLI
release is updated. After the new client path is verified, CthuOps can remove
the old Secret and ConfigMap entries in its own change.

Rollback is a Git revert of this change plus restoration of the previous CthuOps
Secret and proxy configuration. The rollout must retain enough external
configuration to recreate that state until the new Backend is validated.

## Risks / Trade-offs

- **[Risk] Any device able to reach the private network can call protected APIs
  or impersonate an Agent** → Accept this as the stated single-user homelab
  trust model; enforce host/network firewalling and do not expose a raw public
  port.
- **[Risk] Cloudflare Access or Tunnel is misconfigured or bypassed** → Keep
  private-peer validation in Backend, document the required route, and test the
  public HTTP hostname plus the Agent's internal WSS path before removing the
  old Secret.
- **[Risk] Kubernetes ingress source addresses differ from local assumptions**
  → Validate the rendered CthuOps route and observe the direct socket peer; use
  only private connector/ingress networks and never reintroduce forwarded-IP
  trust in application code.
- **[Risk] Removing Agent secret state breaks existing CLI expectations** →
  update command registration, local bridge status, release checks, fixtures,
  and docs together; preserve old files without reading them.
- **[Trade-off] The Backend cannot identify the Cloudflare user** → Cloudflare
  Access remains the external identity layer; Backend intentionally receives
  only a private-network connection.

## Migration Plan

1. Implement and test the fixed private-network boundary while accepting the
   existing extra deployment variables as ignored legacy input.
2. Release Backend and validate internal Agent connections, protected HTTP
   routes, and external Web/operator HTTP access through Cloudflare.
3. Release the Agent/CLI changes that stop reading and writing static secrets.
4. **CthuOps follow-up (separate checkout):** after the new Backend is deployed
   and verified, remove pending trusted-proxy mode, trusted-IP allowlist,
   gateway identity header, and Agent Secret wiring from CthuOps. Keep TLS and
   the Cloudflare Access/Tunnel route. Do not edit CthuOps from this CthuTool
   change.
5. Keep old local `agent-secret` files untouched; document manual cleanup only
   if the operator wants to remove them.

## Open Questions

- The exact Cloudflare Tunnel and ingress placement must be confirmed in
  CthuOps so the external HTTP route reaches the Backend with a private socket
  peer. The Agent WSS route must remain a private-network route and does not
  require Cloudflare Access credentials.
- Whether the homelab actually needs IPv6 link-local acceptance can be checked
  during implementation; omitting it is safer if all deployed peers use IPv4
  or IPv6 unique-local addresses.
