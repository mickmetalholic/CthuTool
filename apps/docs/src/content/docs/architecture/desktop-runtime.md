---
title: Desktop Runtime
description: CthuDesktop process, browser runtime, and local profile architecture.
---

CthuDesktop has an Electron main process and renderer.

## Main Process

The main process stores local configuration, maintains the backend WebSocket agent connection, owns local browser profiles, records pending auth tasks, and hosts Playwright.

## Renderer

The renderer displays product pages using main-process state and backend HTTP APIs.

## Product Shell

The renderer opens directly into the main workspace instead of a landing page. The left activity bar contains product areas such as Overview, Local Chrome, Agents, and Logs. Settings switches into app-level configuration including service connection, local status, diagnostics, logs, and appearance.

The desktop window uses a custom title bar so the app reads as `CthuDesktop` rather than a generic browser window. Window controls are handled by the Electron main process.

The first built-in appearance is Dracula. The configuration model stores an appearance mode and color scheme so additional built-in schemes can be added later without changing the app shell contract.

## Browser Runtime

CthuDesktop uses the host Google Chrome binary by default. Browser profile directories are CthuDesktop-owned app data, not the user's everyday Chrome profile.

If host Chrome launch fails, CthuDesktop keeps running but does not advertise the `browser` capability. Local Status shows the runtime diagnostic.

## Requirements Sources

- Desktop product shell: `openspec/specs/apps-desktop-product-shell/spec.md`
- Desktop browser host: `openspec/specs/apps-desktop-browser-host/spec.md`
- Desktop agent console: `openspec/specs/apps-desktop-agent-console/spec.md`
