---
title: Data and Security
description: Ownership boundaries for browser profiles, site policy, and operational data.
---

## Browser Login State

Raw browser login state belongs to the local CthuTool Agent and stays on the client computer. The backend does not store third-party cookies, localStorage, Playwright storage-state bundles, or local profile paths.

## Site Policy

`BROWSER_SITES_CONFIG_FILE` stores site policy:

- `siteId`
- display name
- auth policy
- allowed origins
- login and verification URLs

It must not store raw browser storage or local profile directories.

## Public Status

The backend can store public profile summaries and pending auth task summaries so users can see whether required login work is needed.

## Backup Boundaries

Back up backend configuration and service state separately from local browser
profiles. Agent profile backup belongs to the user machine where the local
CthuTool Agent stores environment-scoped app data.
