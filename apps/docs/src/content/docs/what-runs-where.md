---
title: What Runs Where
description: Runtime placement for homelab services, client tools, and shared state.
---

CthuTool splits long-running services from local client capabilities.

| Place | Components | Responsibility |
| --- | --- | --- |
| Homelab machine | Backend service, optional web console, configuration files | Service APIs, agent registry, browser task orchestration, public status |
| Client computer | CthuDesktop, `chc` CLI | Local user workflows, desktop browser profiles, CLI commands |
| Repository checkout | Apps, packages, OpenSpec, docs | Development source and requirements |
| External local apps | Google Chrome, Anki, Obsidian | Capabilities used by modules when installed by the user |

## Core Boundary

The backend can coordinate browser work, but raw browser login state stays on the desktop machine. CthuDesktop owns persistent browser profile directories, headed login windows, verification, and Playwright execution.

The CLI is installable on client computers and exposes supported commands such as Codex config workflows, bundled scripts, shell completion, and self-update. Browser runtime ownership remains with CthuDesktop rather than the CLI.

## Source References

- Desktop and browser profile details: [Browser Auth](/modules/browser-auth/) and [Desktop Runtime](/architecture/desktop-runtime/).
- Backend service startup: [Homelab Setup](/deployment/homelab-setup/).
- CLI install path: [CLI Tool](/client/cli/).
