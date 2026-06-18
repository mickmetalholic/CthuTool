---
title: Data and Security
description: Ownership boundaries for browser profiles, site policy, and operational data.
---

## Browser Login State

Raw browser login state belongs to CthuDesktop and stays on the client computer. The backend does not store third-party cookies, localStorage, Playwright storage-state bundles, or desktop profile paths.

## Site Policy

`BROWSER_SITES_CONFIG_FILE` stores site policy:

- `siteId`
- display name
- auth policy
- allowed origins
- login and verification URLs

It must not store raw browser storage or desktop profile directories.

## Public Status

The backend can store public profile summaries and pending auth task summaries so users can see whether required login work is needed.

## Backup Boundaries

Back up backend configuration and service state separately from desktop browser profiles. Desktop profile backup belongs to the user machine where CthuDesktop stores app data.
