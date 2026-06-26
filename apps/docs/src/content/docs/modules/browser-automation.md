---
title: Browser Automation
description: Structured browser work routed through backend and desktop agents.
---

Browser automation is coordinated by the backend and executed by CthuDesktop when an online desktop agent advertises browser capability.

## Runtime Location

- Backend: orchestration, task routing, public status
- Desktop: Playwright execution and local profile storage

## Current Boundary

The backend sends structured browser commands for supported work such as capture, login, verify, and clear-profile actions. It does not send arbitrary Playwright scripts for desktop to evaluate.

## Public Browser Sessions

Trusted third-party applications can use the backend public browser session API instead of the desktop agent WebSocket protocol. The backend creates a session on one online CthuDesktop browser agent, stores only thin routing metadata, and routes later action lists back to that same agent.

Supported public session actions are a bounded Playwright-like DSL: navigation, selector waiting, click, fill, text extraction, page content, title, screenshot, and close. The API rejects unsupported action types before dispatching desktop work.

The public API is intended for trusted deployments first. It does not add API key authentication yet, and it does not expose cookies, localStorage, Playwright storage-state contents, desktop profile paths, or raw browser handles.

## Related Modules

- [Browser Auth](/modules/browser-auth/)
- [Browser Client SDK](/modules/browser-client-sdk/)
- [Desktop](/modules/desktop/)

## Authoritative Sources

- Requirements: `openspec/specs/apps-backend-browser-automation/spec.md`, `openspec/specs/apps-backend-browser-content/spec.md`, `openspec/specs/apps-backend-browser-agent-capture/spec.md`, `openspec/specs/apps-backend-desktop-browser-runtime/spec.md`, `openspec/specs/apps-backend-browser-public-api/spec.md`, `openspec/specs/packages-browser-client-sdk/spec.md`
