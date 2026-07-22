---
title: Browser Auth
description: Browser login-state and Agent-owned profile boundaries.
---

Browser auth state spans backend orchestration and Agent-owned local profiles.

| Owner | Responsibility |
| --- | --- |
| Backend | site policy, public profile summaries, pending auth tasks, bounded command routing |
| Local Agent | host Chrome, Playwright execution, environment-scoped profiles, headed login, verification |
| CLI | Agent lifecycle and environment selection; no browser runtime ownership |

The backend does not store raw cookies, localStorage, Playwright storage-state
bundles, or local profile paths.

When a configured site requires authentication, the backend dispatches a
controlled browser command to an online Agent. If the profile is missing or
expired, the user completes login in the Agent-hosted headed browser. The Agent
reports only public status back to the backend.

Public browser sessions use the same ownership model. Backend state is limited
to routing metadata such as session id, owning Agent, site/profile names,
timestamps, expiry, and active status.

Backend site policy can be overridden with `BROWSER_SITES_CONFIG_FILE`. The
file stores policy only, never login state. See [Configuration](/reference/configuration/).
