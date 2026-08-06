---
title: Local Agent
description: Local browser execution, profiles, tray lifecycle, and deployed-Web control.
---

The headless CthuTool Agent owns capabilities that must run on the user's
computer:

- a backend Agent WebSocket connection
- host Chrome discovery and Playwright execution
- persistent, Agent-owned browser profiles and headed login flows
- a native tray for environment selection, settings, and exit
- a loopback bridge used only by the matching deployed Web origin

There is no embedded renderer or settings window. Product UI is deployed once
as the Web application. The Agent exposes only versioned, bounded local
resources and RPC operations after a one-time tray/CLI launch handshake.

Raw cookies, localStorage, browser storage state, profile paths, and bridge
tickets stay off the backend and out of diagnostics. Browser commands remain
structured; the backend and deployed Web page cannot submit arbitrary Playwright
code.

Use [Local Agent](/client/desktop/) for installation and lifecycle commands,
[Browser Auth](/modules/browser-auth/) for profile ownership, and
[Agent Protocol](/architecture/agent-protocol/) for the remote connection.

The former Desktop-only Douban page has no Web replacement and is intentionally
removed from the client product surface. Backend Douban APIs and backend-routed
browser work remain separate capabilities.
