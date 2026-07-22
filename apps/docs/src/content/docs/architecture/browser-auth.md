---
title: Browser Auth Model
description: Browser profile ownership and backend/Agent trust boundary.
---

Browser auth is intentionally split.

## Backend Owns Policy

The backend stores site policy, login and verify URLs, auth requirements, public pending tasks, and public profile summaries.

## Agent Owns Secrets

The local Agent stores browser profile directories locally and runs
login/verification flows. Raw cookies, localStorage, Playwright storage-state
bundles, and profile paths do not move to the backend.

## CLI Boundary

The CLI controls Agent lifecycle and can report bounded browser readiness, but
it does not store profiles, inspect browser storage, or execute browser work.

## Requirements Sources

- Backend browser auth: `openspec/specs/apps-backend-browser-auth/spec.md`
- Local Agent requirements: the ordered Agent changes until archive/sync.
- Browser sites config: `openspec/specs/packages-config-browser-sites/spec.md`
