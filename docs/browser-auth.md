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
