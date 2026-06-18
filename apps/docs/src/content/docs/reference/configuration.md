---
title: Configuration
description: Current configuration references for backend, desktop, CLI, and browser site policy.
---

## Backend

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
BROWSER_SITES_CONFIG_FILE=/config/browser-sites.json
```

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

For Docker or homelab deployments, keep the JSON file outside the image and mount it read-only:

```yaml
services:
  backend:
    environment:
      BROWSER_SITES_CONFIG_FILE: /config/browser-sites.json
    volumes:
      - ./config/browser-sites.json:/config/browser-sites.json:ro
```

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

The CLI reads command flags, local user state, and Codex configuration sources documented in `apps/cli/README.md`.
