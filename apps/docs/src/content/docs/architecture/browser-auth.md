---
title: Browser Auth Model
description: Browser profile ownership and backend/desktop trust boundary.
---

Browser auth is intentionally split.

## Backend Owns Policy

The backend stores site policy, login and verify URLs, auth requirements, public pending tasks, and public profile summaries.

## Desktop Owns Secrets

CthuDesktop stores browser profile directories locally and runs login/verification flows. Raw cookies, localStorage, Playwright storage-state bundles, and profile paths do not move to the backend.

## CLI Boundary

The CLI does not install browsers, inspect browser runtime status, open login browsers, read backend browser status, or store browser profiles.

## Requirements Sources

- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Desktop browser host: `openspec/specs/apps-desktop-browser-host/spec.md`
- Browser sites config: `openspec/specs/packages-config-browser-sites/spec.md`
