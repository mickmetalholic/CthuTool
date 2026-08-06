# Agent deployment security

The personal-use deployment has two deliberately small trust boundaries:

- Backend and Agents run on the homelab private network. Protected HTTP APIs and
  the Agent WebSocket accept only loopback or private-network socket peers.
- When external Web or operator Backend HTTP traffic is reachable from the
  public Internet, Cloudflare Access authenticates the operator and Cloudflare
  Tunnel forwards into the private network. The Agent WebSocket remains
  private-network only; Agents do not carry Cloudflare Access credentials.
  Direct public Backend port exposure or bypassing Access is unsupported.

This is not a device-enrollment or multi-user credential system. The stable
`agentId` and `CTHUTOOL_ENVIRONMENT_ID` are correlation and routing metadata;
neither is an authentication credential. CthuTool does not use a static Agent
secret, trusted-proxy IP allowlist, gateway identity header, or
private-development access mode.

## Backend configuration

Homelab production deployments require:

```dotenv
NODE_ENV=production
CTHUTOOL_ENVIRONMENT_ID=prod
```

Optional local runtime values such as `PORT` and `LOG_LEVEL` may still be set.
Do not configure `CTHUTOOL_AGENT_SECRET`, `CTHUTOOL_OPERATOR_ACCESS_MODE`,
`CTHUTOOL_OPERATOR_GATEWAY_HEADER`, `CTHUTOOL_TRUSTED_PROXY_IPS`, or
`CTHUTOOL_PRIVATE_DEVELOPMENT`; the Backend ignores those removed knobs.

CthuTool validates the direct socket peer address. It does not trust
`X-Forwarded-For` or caller-provided gateway identity headers. Firewall the
Backend so public clients cannot reach the raw port without Cloudflare Access
and the private Tunnel path.

## External access path

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

The Cloudflare application must cover the external Web and Backend HTTP
routes. `/ws/agents` remains a private-network-only endpoint for Agents and
must not be exposed through Cloudflare Access in this deployment. After the
new Backend is deployed, a separate CthuOps change should remove any pending
trusted-proxy, trusted-IP, gateway, and Secret wiring while keeping TLS and
the Cloudflare/Tunnel route for HTTP traffic.

## Agent environment catalog

Packaged environments use a release-controlled JSON catalog:

```json
{
  "profiles": [
    {
      "environmentId": "prod",
      "label": "Production",
      "webOrigin": "https://app.example.com",
      "webAgentUrl": "https://app.example.com/agent",
      "backendHttpUrl": "https://api.example.com",
      "backendAgentWsUrl": "wss://api.example.com/ws/agents",
      "namespace": "prod"
    }
  ]
}
```

Agents consume `backendAgentWsUrl` from the private network. If the same
hostname is used for external Web access, split-horizon DNS or an equivalent
private route must resolve the Agent endpoint to the homelab; a
Cloudflare-Access-only public WSS URL is not an Agent endpoint.

Set `CTHUTOOL_AGENT_ENVIRONMENTS_PATH` to the installed catalog path. Custom
development catalogs additionally require
`CTHUTOOL_AGENT_ALLOW_CUSTOM_ENVIRONMENTS=1`, are marked `custom-development`,
may use insecure protocols only on loopback, and are rejected in production.

Each environment gets a separate `config.json`, `browser-profiles`, `logs`, and
`runtime` root below the Agent data directory. A leftover `agent-secret` file,
if present, is ignored and is not deleted automatically. A deployed Web page
cannot supply or replace catalog URLs.

## Credential hygiene

There is intentionally no enrollment, automatic rotation, revocation list, or
device ownership UI. Never put operator sessions, authorization headers, or
local bridge tickets in URLs, logs, or diagnostics. Network reachability to the
private Backend is the access control for this single-user deployment.

## Legacy Desktop migration

Legacy CthuDesktop identifiers and credentials are not authentication inputs
for the Agent and are never copied. Migration resolves the old backend to one
trusted release environment and copies only safe settings and browser profiles.
Run `chc agent doctor` for a redacted status and repair command. See
`docs/agent-migration.md` for paths, locking, retry, and rollback behavior.
