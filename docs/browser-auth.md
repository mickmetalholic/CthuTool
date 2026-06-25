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
- `apps/cli` does not expose browser commands. It does not install browsers,
  inspect browser runtime status, open login browsers, read backend browser
  status, or store browser profiles.

## Browser Runtime

CthuDesktop uses the host Google Chrome binary for local browser automation.
The Chrome executable and profile directory are separate concerns: automation
runs with CthuDesktop-owned profile directories under Electron app data, and
CthuDesktop does not reuse the user's everyday Chrome profile.

The desktop config can set a host Chrome executable path when Playwright's
`chrome` channel discovery is not enough. Runtime configuration is exposed
through the local config file and read-only desktop diagnostics rather than a
Settings form.

Regular users inspect browser runtime and profile status in CthuDesktop. The CLI
does not wrap browser runtime diagnostics or backend browser status.

For developer troubleshooting, call backend browser APIs directly instead of
using a CLI browser command:

```text
GET /api/browser/sites
GET /api/browser/profiles
GET /api/browser/pending-auth-tasks
```

Trusted applications can also use the backend public browser session API to run
controlled browser actions through an online CthuDesktop agent:

```text
POST /api/browser/sessions
POST /api/browser/sessions/{sessionId}/actions
DELETE /api/browser/sessions/{sessionId}
```

The session API is intended for trusted deployments first and does not add API
key authentication. Keep it behind a trusted network boundary until an explicit
auth layer is added. The backend stores only thin session routing metadata such
as `sessionId`, owning `agentId`, site/profile names, timestamps, and expiry;
CthuDesktop stores the actual Playwright context and page. The first
implementation uses an in-memory backend routing store, so active sessions do
not survive backend restarts and multi-replica deployments require sticky
routing or a later Redis-backed store.

Action execution uses a bounded Playwright-like DSL instead of arbitrary
Playwright script passthrough. Supported action types include `goto`,
`waitForSelector`, `click`, `fill`, `textContent`, `content`, `title`, and
`screenshot`. Navigation actions must stay within the configured site's
`allowedOrigins`, and responses never include cookies, localStorage,
Playwright storage-state contents, desktop profile paths, or raw Playwright
object handles.

## Site Configuration

The backend ships with built-in Douban and Zhihu site policies. To override
those defaults or add new sites, mount a JSON file and point the backend at it
with `BROWSER_SITES_CONFIG_FILE`.

```powershell
$env:BROWSER_SITES_CONFIG_FILE="C:\cthutool\config\browser-sites.json"
pnpm --filter @cthutool/backend start:dev
```

The file uses this shape:

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
    },
    {
      "siteId": "example_public",
      "displayName": "Example Public Site",
      "authPolicy": "anonymous",
      "allowedOrigins": ["https://example.com"]
    }
  ]
}
```

See `docs/examples/browser-sites.json` for a fuller example. Site entries are
merged by `siteId`: a matching entry overrides the built-in site, and a new
`siteId` adds a new site. Arrays such as `allowedOrigins` and
`defaultBlockResources` replace the built-in array for that site.

For Docker or homelab deployments, keep the JSON file outside the image and
mount it read-only into the backend container:

```yaml
services:
  backend:
    environment:
      BROWSER_SITES_CONFIG_FILE: /config/browser-sites.json
    volumes:
      - ./config/browser-sites.json:/config/browser-sites.json:ro
```

Do not put raw cookies, localStorage, Playwright `storageState`, browser user
data directories, or desktop profile paths in this JSON file. It is only site
policy. Login state remains desktop-owned and is exposed back to the backend as
public profile status only.

## Login Flow

When backend work requires a site whose auth policy is `required`, the backend
dispatches a controlled browser command to an online CthuDesktop agent. If the
desktop profile is missing or expired, desktop records a local pending auth task
and the backend records a matching public pending task.

The user completes login from CthuDesktop. After verification succeeds, desktop
reports a public profile summary with `agentId`, `siteId`, `profileName`,
`status`, and timestamps. Raw browser storage stays on the desktop machine.
