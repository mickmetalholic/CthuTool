---
title: Configuration
description: Current configuration references for backend, desktop, CLI, and browser site policy.
---

## Backend

In homelab deployment, backend environment values are defined in `k8s/configmap.yaml` and consumed by `k8s/deployment.yaml`.

Current Kubernetes values:

```yaml
NODE_ENV: "production"
PORT: "3000"
LOG_LEVEL: "info"
```

For local development or debugging from a checkout, the same values can be supplied as environment variables when starting the backend. Local commands are not the homelab deployment path.

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

If this policy is used in the Kubernetes deployment, mount it through Kubernetes-managed configuration and set `BROWSER_SITES_CONFIG_FILE` in the backend environment. Do not bake private runtime files into the backend image.

## Desktop

CthuDesktop stores backend URL, appearance, and browser runtime configuration locally. Host Chrome can be selected by explicit executable path when discovery is not enough.

Default browser runtime:

```json
{
  "browserRuntime": {
    "kind": "host-chrome"
  }
}
```

Explicit Chrome binary:

```json
{
  "browserRuntime": {
    "kind": "host-chrome",
    "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  }
}
```

## CLI

The CLI reads command flags, local user state, and Codex configuration sources documented in `apps/cli/README.md` and [CLI Commands](/reference/cli/).
