---
title: Browser Automation
description: Structured browser work routed through the backend and local Agents.
---

Browser automation is coordinated by the backend and executed by an online
local Agent that advertises browser readiness.

## Runtime location

- Backend: orchestration, task routing, public status, and bounded public APIs
- Local Agent: Playwright execution, host Chrome, and local profile storage

The backend sends structured commands for capture, login, verify,
clear-profile, and bounded crawler-oriented actions. It does not send arbitrary
Playwright scripts for the Agent to evaluate.

Trusted third-party applications can use the backend public browser session API
instead of the Agent WebSocket protocol. The backend stores only thin routing
metadata and routes later actions back to the same Agent. Raw cookies,
localStorage, profile paths, browser handles, arbitrary `evaluate`, route
interception, downloads, uploads, and Playwright assertions are not exposed.

Related modules: [Browser Auth](/modules/browser-auth/), [Browser Client
SDK](/modules/browser-client-sdk/), and [Local Agent](/modules/desktop/).
