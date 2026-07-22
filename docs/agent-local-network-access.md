# Agent Web local-network compatibility

The deployed Agent route uses CORS `fetch()` calls to an HTTP loopback bridge. It does not use WebSocket, does not scan ports, and adds `targetAddressSpace: "loopback"` where the browser implements Local Network Access (LNA).

## Release support matrix

The matrix is deliberately conservative. “Supported” means the public/deployed Web-to-loopback flow has an implementation path and must pass the release probe; it does not mean every browser with generic Fetch support is equivalent.

| Target | July 22, 2026 result | Release position |
| --- | --- | --- |
| Google Chrome 150.0.7871.129 | Automated isolated-browser probe passed: `Request.targetAddressSpace === "loopback"`, permission granted, ticket exchange and resource Fetch passed, fragment cleared | Supported and locally verified |
| Microsoft Edge | Browser was not installed on the probe host. Microsoft documents the LNA prompt and `targetAddressSpace: "loopback"`; run the same manual flow before release | Supported target, manual release gate |
| Firefox | Browser was not installed on the probe host | Parity not declared; manual evaluation required |
| Safari 26.5.2 | Installed, but isolated Safari automation was not enabled; no synthetic pass was recorded | Parity not declared; manual evaluation required |

Relevant primary references:

- [Chrome Local Network Access permission](https://developer.chrome.com/blog/local-network-access)
- [Microsoft Edge Local Network Access guidance](https://learn.microsoft.com/en-us/deployedge/ms-edge-local-network-access)
- [WICG Local Network Access specification](https://wicg.github.io/local-network-access/)
- [WebKit standards position request](https://github.com/WebKit/standards-positions/issues/520)
- [Mozilla standards position](https://github.com/mozilla/standards-positions/issues/1260)

## Re-run the automated spike

From the repository root:

```sh
pnpm --filter @cthutool/agent-runtime smoke:lna
```

The script uses an isolated Chromium profile, classifies the source endpoint as public, grants only `local-network-access` to the exact source Origin, then exercises the real `AgentLocalBridge`. It reports missing browsers instead of silently treating another engine as equivalent.

## Manual release flow

For each installed release target:

1. Start a release Agent with a trusted HTTPS environment profile.
2. Use the tray or `chc agent settings` to issue a fresh launch URL.
3. Confirm the URL opens the deployed `/agent` route and that the browser presents or resolves its local-network permission.
4. Grant permission and verify environment, runtime, profile, and diagnostics resources load through Fetch polling.
5. Reload the page and verify it requires a fresh tray/CLI launch rather than reusing a bearer.
6. Deny/reset permission and verify the page shows remediation without scanning another port or claiming the Agent is uninstalled.
7. Switch Agent environment and verify the old page becomes stale and cannot reuse its session.

Do not declare Firefox or Safari parity until this flow passes from the actual deployed HTTPS Origin on the minimum supported release.

## Permission remediation

- Chrome/Edge: open the deployed site’s permissions, allow local network access, then reopen settings from the tray so a new ticket is issued.
- Firefox/Safari: if the public HTTPS-to-HTTP-loopback request is blocked, use a verified Chrome/Edge release until that browser is added to the supported matrix. Do not weaken bridge Origin, Host, CORS, or bearer checks as a workaround.
- All browsers: an expired or consumed ticket cannot be retried. Always reopen from tray/CLI after changing permissions.

The Web client queries the LNA permission when the Permissions API exposes it. A denied permission maps to permission remediation; a granted permission plus a network failure maps to Agent-not-running. Unsupported permission-query implementations remain conservative and do not persist any probe result.
