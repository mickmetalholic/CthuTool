# Agent deployment security

The personal-use deployment has two deliberately small trust boundaries:

- Browser/operator requests reach Agent status and machine-control APIs only through an authenticated reverse proxy or access gateway.
- The local Agent authenticates its outbound WebSocket with a separate, environment-specific static secret.

This is not a device-enrollment or multi-user credential system. The stable `agentId` is correlation metadata and is never an authentication credential.

## Backend configuration

Public production deployments require all of the following values:

```dotenv
NODE_ENV=production
CTHUTOOL_ENVIRONMENT_ID=prod
CTHUTOOL_AGENT_SECRET=<at-least-32-random-characters>
CTHUTOOL_OPERATOR_ACCESS_MODE=trusted-proxy
CTHUTOOL_OPERATOR_GATEWAY_HEADER=x-cthutool-operator
CTHUTOOL_TRUSTED_PROXY_IPS=10.0.0.2
```

The access gateway must remove any client-provided operator identity header and inject its own authenticated identity. Direct backend ingress must be firewalled so only the configured proxy addresses can reach it. CthuTool validates the direct socket peer address; it does not trust `X-Forwarded-For` as an identity signal.

`CTHUTOOL_PRIVATE_DEVELOPMENT=1` permits loopback-only requests and unauthenticated Agent registration for local development. Startup rejects this mode when `NODE_ENV=production`.

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

Set `CTHUTOOL_AGENT_ENVIRONMENTS_PATH` to the installed catalog path. Custom development catalogs additionally require `CTHUTOOL_AGENT_ALLOW_CUSTOM_ENVIRONMENTS=1`, are marked `custom-development`, may use insecure protocols only on loopback, and are rejected in production.

Each environment gets a separate `config.json`, `agent-secret`, `browser-profiles`, `logs`, and `runtime` root below the Agent data directory. The secret file is created with user-only permissions. A deployed Web page cannot supply or replace catalog URLs.

## Replacing a static Agent secret

1. Generate a new random value of at least 32 characters.
2. Update `CTHUTOOL_AGENT_SECRET` in the backend secret manager and restart or roll the backend deployment. Existing Agent connections are closed or become unusable when the deployment changes.
3. Update the matching local environment secret without exposing it in argv:
   `printf '%s\n' "$AGENT_SECRET" | chc agent env set-secret <id> --secret-stdin`.
   Then reconnect or restart the Agent.
4. Confirm authenticated Agent status through the access gateway.

There is intentionally no enrollment, automatic rotation, revocation list, or device ownership UI. If a secret leaks, manually replace it on both sides. Never put Agent secrets, operator sessions, authorization headers, or local bridge tickets in URLs, logs, or diagnostics.

## Legacy Desktop migration

Legacy CthuDesktop identifiers and credentials are not authentication inputs
for the Agent and are never copied. Migration resolves the old backend to one
trusted release environment, copies only safe settings and browser profiles,
and then requires the environment-specific static secret above. Run
`chc agent doctor` for a redacted status and repair command. See
`docs/agent-migration.md` for paths, locking, retry, and rollback behavior.
