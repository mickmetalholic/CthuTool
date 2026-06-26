---
title: Browser Auth
description: Browser login-state and auth-profile ownership.
---

Browser auth state spans backend orchestration and desktop-owned local browser profiles.

## Ownership

| Owner | Responsibility |
| --- | --- |
| Backend | site configuration, auth policy, allowed origins, login/verify URLs, public profile summaries, pending auth tasks |
| Desktop | Playwright execution, host Chrome runtime, persistent profile directories, login windows, verification |
| CLI | no browser runtime ownership |

The backend does not store raw cookies, localStorage, Playwright storage-state bundles, or desktop profile paths.

## Login Flow

When backend work requires a site with `required` auth, the backend dispatches a controlled browser command to an online CthuDesktop agent. If the desktop profile is missing or expired, the user completes login from CthuDesktop. Desktop then reports public status back to the backend.

Public browser sessions use the same ownership model. A trusted caller can create a backend session for a configured site, but raw login state still stays in the desktop-owned browser profile. The backend keeps only routing metadata such as session ID, owning agent, site/profile names, timestamps, expiry, and active status.

## Site Policy

Backend site policy can be overridden with `BROWSER_SITES_CONFIG_FILE`. The JSON stores policy only, not login state.

Built-in Douban and Zhihu site policies can be overridden or extended by JSON entries keyed by `siteId`. See [Configuration](/reference/configuration/) for the file shape and Kubernetes configuration boundary.

## Authoritative Sources

- Runtime notes: `docs/browser-auth.md`
- Requirements: `openspec/specs/apps-backend-browser-auth/spec.md`, `openspec/specs/apps-backend-browser-public-api/spec.md`, `openspec/specs/apps-desktop-browser-host/spec.md`, `openspec/specs/packages-browser-client-sdk/spec.md`, `openspec/specs/packages-config-browser-sites/spec.md`
