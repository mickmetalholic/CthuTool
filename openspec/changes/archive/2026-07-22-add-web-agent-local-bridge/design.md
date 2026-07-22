## Context

The installed component has no window, WebView, or locally hosted UI. Each environment already has or will have a deployed Web origin, and the tray selects exactly one active environment. That Web origin should render Agent settings and controls while calling a JSON bridge on the same machine.

This crosses a strong browser boundary: a public HTTPS page requests an HTTP loopback resource. Browsers increasingly mediate this through Local Network Access permissions, and the local service must defend itself even when only one person uses the product. The full device-credential system is removed; the remaining Web ticket is ephemeral proof that the tray intentionally opened the page.

## Goals / Non-Goals

**Goals:**

- Reuse the deployed Web application for Agent UI in every environment.
- Keep the Agent bundle free of Web UI assets and frontend servers.
- Connect the active environment page to a random-port loopback JSON API safely.
- Support local settings, profiles, diagnostics, lifecycle actions, and controlled browser operations.
- Provide understandable permission, mismatch, disconnected, and stale-session UX.

**Non-Goals:**

- Remote LAN access to the bridge or arbitrary Web-origin access.
- Persistent browser credentials, local HttpOnly cookies, or a device-enrollment workflow.
- Allowing the Web page to change the Agent's active environment or trusted endpoint catalog.
- Making WebSocket the only viable transport in the first release.

## Decisions

### Serve JSON only from a random loopback port

The Agent binds an OS-assigned port on `127.0.0.1` and, when verified consistently, `::1`. It serves health/bootstrap and versioned JSON RPC/resources but no UI assets. The endpoint is disclosed to tray/CLI through user-scoped local control and then placed in the opened page's URL fragment.

Random ports avoid installation conflicts and make blind targeting less predictable. The deployed Web page never scans localhost ports.

### Put endpoint and one-time ticket in the URL fragment

Tray or CLI opens a URL such as `https://test.example/agent#endpoint=http%3A...&ticket=...&environment=test`. Fragments are not sent in the HTTP request to the deployed server. The page immediately validates the expected environment, exchanges the ticket with the loopback bridge, calls `history.replaceState` to remove fragment data, and keeps the returned short-lived bearer token only in memory.

Tickets are high entropy, single use, scoped to active environment id plus exact Web origin, and expire within a short bound. Agent restart or environment switch invalidates all tickets and sessions. This is a lightweight launch capability, not a persisted credential feature.

### Use exact CORS/Origin and authenticated non-simple requests

The bridge accepts preflight and RPC requests only when `Origin` exactly matches the active environment profile. Responses echo that exact origin with `Vary: Origin`, never `*`, and never use cross-origin cookies. RPC requires JSON plus an Authorization header containing the in-memory token; simple form requests are rejected. Host must match the bound loopback host/port.

Origin checks protect the browser path, while the ticket/token prevents a page or local client that merely discovers the port from using sensitive APIs. No static Agent/backend secret is returned through the bridge.

### Design for Local Network Access permission

The deployed route initiates an explicit user-triggered Fetch request to loopback and uses `targetAddressSpace: "loopback"` when supported. It distinguishes Agent-not-running, permission-denied, Origin mismatch, expired ticket, and incompatible bridge versions. The route explains how to reopen from tray and how to reset browser local-network permission.

The first implementation uses Fetch RPC plus bounded polling for status/progress. WebSocket can be added later only after supported-browser behavior is validated; insecure `ws://` from HTTPS is not a launch dependency.

### Make the deployed Agent route a high-trust surface

The Agent route uses a restrictive CSP, self-hosted application code, and no analytics/advertising/third-party script dependencies. It may reuse existing Web components and authentication, but its local bearer token remains in component memory and is excluded from telemetry, errors, URLs, persistence, and service-worker caches.

### Keep environment authority in tray/Agent

The page knows its deployment environment but cannot ask the local Agent to trust another Origin or backend. If its environment differs from the Agent's active environment, the bridge returns a bounded mismatch response and the page directs the operator to switch through tray or CLI.

### Expose a narrow versioned local API

Resources cover active environment and backend connection state, Chrome discovery/configuration, environment-scoped public profile state, sanitized diagnostics, versions, and autostart adapter status. Mutations are typed, atomic, and classified as immediate/reconnect/restart. Controlled browser actions reuse existing allowlisted browser protocol behavior and never expose arbitrary script execution or raw profile data.

## Risks / Trade-offs

- [Browser denies Local Network Access] → Provide explicit permission UX and test supported Chrome/Edge/Firefox/Safari versions before declaring parity.
- [Trusted Web origin has XSS or third-party script compromise] → Isolate the Agent route with strict CSP, no third-party scripts, in-memory token storage, and short sessions.
- [Ticket leaks through URL/history/telemetry] → Put it in the fragment, exchange immediately, clear history state, never log fragments, and use one-time short expiry.
- [Different environment page reaches old local session] → Scope ticket/token to environment and Origin and invalidate on every switch.
- [Random port makes direct bookmarks fail] → Tray and `chc agent settings/open` are the canonical launch paths.
- [Polling is less efficient than WebSocket] → Accept low local overhead for browser compatibility; add streaming later behind a transport abstraction if needed.

## Migration Plan

1. Implement and security-test the loopback JSON bridge and ticket exchange without UI.
2. Add the deployed Web Agent route with permission/connection diagnostics and read-only resources.
3. Add typed settings/profile/lifecycle mutations and controlled browser actions.
4. Integrate ticket URL issuance with tray and CLI for every trusted environment.
5. Run browser compatibility and adversarial Origin/CORS/token tests before removing Electron settings.
6. Roll back by disabling the bridge route while retaining Agent configuration and using CLI diagnostics; no local frontend assets need restoration.

## Open Questions

- Finalize the supported browser/version matrix after a Local Network Access spike on release targets.
- Decide whether the command name remains `chc agent settings` or adds `chc agent open`; both use the same deployed route contract.
