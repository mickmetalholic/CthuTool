# Browser Auth Profiles

Browser automation uses named auth profiles stored as Playwright-compatible
storage-state bundles. The backend reads these bundles from
`BROWSER_AUTH_STATE_DIR`, which defaults to `./data/secrets/browser-auth`.

Each profile lives in its own directory:

```text
data/secrets/browser-auth/
  douban/
    meta.json
    storage-state.json
```

`storage-state.json` is the Playwright browser context storage state. `meta.json`
contains non-secret profile metadata:

```json
{
  "profileName": "douban",
  "source": "cli-helper",
  "updatedAt": "2026-06-12T00:00:00.000Z",
  "loginUrl": "https://accounts.douban.com/passport/login",
  "verifyUrl": "https://movie.douban.com/",
  "allowedOrigins": ["https://movie.douban.com"]
}
```

## CLI Helper

Use the CLI helper when the service runs in a trusted local or intranet
environment and you want to authorize once on the same machine:

```powershell
chc browser doctor
chc browser install
```

`doctor` checks whether the CLI can load Playwright and whether Chromium is
available. `install` downloads the Chromium browser binary used by Playwright.
The browser install is intentionally explicit instead of a package install hook
because it may download large files, use network access, and fail for proxy or
permission reasons.

```powershell
chc browser auth login douban --out ./data/secrets/browser-auth
chc browser auth verify douban --json
```

The helper opens a headed Playwright browser, waits for manual login
confirmation, then writes `storage-state.json` and `meta.json`. It does not ask
for account passwords and does not store passwords.

`verify` reuses the stored auth profile and returns only the user identity needed
to confirm the login:

```json
{
  "ok": true,
  "command": "browser auth verify",
  "result": {
    "profileName": "douban",
    "user": {
      "id": "123456789",
      "nickname": "nickname"
    }
  }
}
```

For a custom site profile, provide the login URL:

```powershell
chc browser auth login my-site `
  --login-url https://example.com/login `
  --verify-url https://example.com/ `
  --allowed-origin https://example.com `
  --out ./data/secrets/browser-auth
```

The first version uses documented file placement instead of uploading bundles to
the backend. Deployments should mount or copy only the intended profile
directory into the backend auth-state directory.

## Browser Extension Producer

A frontend plus browser extension can also produce the same bundle format. The
frontend role is limited to:

- displaying backend profile status;
- asking the extension to capture auth state for an allowed site;
- sending the converted bundle to a trusted backend endpoint when that endpoint
  exists.

The frontend must not directly read third-party cookies or localStorage. The
extension performs privileged browser reads after explicit user action, then
converts its captured cookie and per-origin storage snapshot into the shared
bundle format before backend storage. The backend auth store rejects raw
extension-shaped snapshots and accepts only validated bundles.
