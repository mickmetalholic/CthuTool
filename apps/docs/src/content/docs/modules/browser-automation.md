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

## Related Modules

- [Browser Auth](/modules/browser-auth/)
- [Desktop](/modules/desktop/)

## Authoritative Sources

- Requirements: `openspec/specs/apps-backend-browser-automation/spec.md`, `openspec/specs/apps-backend-browser-content/spec.md`, `openspec/specs/apps-backend-browser-agent-capture/spec.md`, `openspec/specs/apps-backend-desktop-browser-runtime/spec.md`
