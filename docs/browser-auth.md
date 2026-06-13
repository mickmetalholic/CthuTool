# Browser Auth Profiles

Browser login state is owned by CthuDesktop. The backend orchestrates browser
work, stores site policy, and records public status only; it does not store
third-party cookies, localStorage, Playwright storage-state bundles, or desktop
profile paths.

## Ownership

- `apps/backend` defines browser site configuration, origin allowlists,
  `anonymous` or `required` auth policy, login URLs, verify URLs, public profile
  summaries, and pending auth tasks.
- `apps/desktop` connects as a browser-capable agent, runs Playwright on the
  user's machine, stores persistent profile directories under Electron app data,
  and opens login or verification flows.
- `apps/cli` does not own browser runtime, login, verification, profile, or
  browser-status commands. Use CthuDesktop and backend APIs for browser state.

## Login Flow

When backend work requires a site whose auth policy is `required`, the backend
dispatches a controlled browser command to an online CthuDesktop agent. If the
desktop profile is missing or expired, desktop records a local pending auth task
and the backend records a matching public pending task.

The user completes login from CthuDesktop. After verification succeeds, desktop
reports a public profile summary with `agentId`, `siteId`, `profileName`,
`status`, and timestamps. Raw browser storage stays on the desktop machine.
