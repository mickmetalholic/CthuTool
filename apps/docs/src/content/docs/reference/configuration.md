---
title: Configuration
description: Current configuration references for backend, Agent, CLI, and browser site policy.
---

## Backend

In homelab deployment, backend environment values are defined in the CthuOps repository and consumed by its Backend Deployment. CthuOps generates `ConfigMap/cthutool-backend` through `apps/cthutool/kustomization.yaml`; CthuTool does not keep Kubernetes manifests.

Current homelab values:

```yaml
NODE_ENV: "production"
PORT: "3000"
LOG_LEVEL: "info"
OTEL_SDK_DISABLED: "true"
CTHUTOOL_ENVIRONMENT_ID: "production"
CTHUTOOL_OPERATOR_ACCESS_MODE: "trusted-proxy"
```

The Deployment reads `CTHUTOOL_AGENT_SECRET` and
`CTHUTOOL_TRUSTED_PROXY_IPS` from the out-of-band
`Secret/cthutool-backend-secrets`; create both through the CthuOps procedure and
never commit their values. The proxy IP setting must contain the actual ingress
proxy source IPs before rollout. For local development or debugging from a
checkout, the same values can be supplied as environment variables when
starting the backend. Local commands are not the homelab deployment path.

## Browser Sites

`BROWSER_SITES_CONFIG_FILE` points to JSON site policy. It stores site configuration only.

```json
{
  "version": 1,
  "sites": [
    {
      "siteId": "douban",
      "displayName": "Douban",
      "authPolicy": "required",
      "allowedOrigins": ["https://movie.douban.com"],
      "profileName": "douban-main",
      "loginUrl": "https://accounts.douban.com/passport/login",
      "verifyUrl": "https://www.douban.com/mine/"
    }
  ]
}
```

Site entries are merged by `siteId`: a matching entry overrides the built-in site, and a new `siteId` adds a new site. Arrays such as `allowedOrigins` and `defaultBlockResources` replace the built-in array for that site.

Example source: `docs/examples/browser-sites.json`.

If this policy is used in the Kubernetes deployment, mount it through CthuOps-managed configuration and set `BROWSER_SITES_CONFIG_FILE` in the backend environment. Do not bake private runtime files into the backend image.

## Local Agent

Agent endpoints come only from the signed release environment catalog. Select
one environment and store its static Agent secret with `chc agent env`; do not
put secrets in the catalog or command argv. Mutable settings and browser
profiles are isolated by environment namespace.

Default browser runtime:

```json
{
  "deviceName": "my-client",
  "connectionEnabled": true
}
```

Explicit Chrome binary:

```json
{
  "browserExecutablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
```

Settings are normally edited through the deployed Web `/agent` page opened by
the tray. Legacy CthuDesktop config is copied only after exact trusted
environment resolution; appearance, window state, device ids, and credentials
are not migrated.

## CLI

The CLI reads command flags, local user state, and Codex configuration sources documented in `apps/cli/README.md` and [CLI Commands](/reference/cli/).
