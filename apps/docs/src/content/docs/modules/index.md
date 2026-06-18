---
title: Modules Overview
description: User-facing module index for CthuTool product areas.
---

CthuTool modules are grouped by what the user is trying to do, not by repository folder.

| Module | Purpose | Runs on | Source |
| --- | --- | --- | --- |
| [CLI](/modules/cli/) | Command-line workflows, scripts, Codex config, completion, self-update | Client computer | `apps/cli/README.md` |
| [Desktop](/modules/desktop/) | Local browser execution, login state, agent connection | Client computer | `docs/desktop-agent-console.md` |
| [Web Console](/modules/web-console/) | Browser-hosted management console scaffold | Homelab/web host | `apps/web/README.md` |
| [Browser Auth](/modules/browser-auth/) | Browser profile ownership and login flow | Backend plus desktop | `docs/browser-auth.md` |
| [Browser Automation](/modules/browser-automation/) | Structured browser work routed to desktop agents | Backend plus desktop | `openspec/specs/apps-backend-browser-automation/spec.md` |
| [Codex Plugin](/modules/codex-plugin/) | Repository-managed Codex plugin assets | User/Codex environment | `codex/plugins/cthu-codex/README.md` |
| [Douban Movie Info](/modules/douban-movie-info/) | Douban movie information capability | Backend and desktop surfaces | `openspec/specs/apps-backend-douban-movie-info/spec.md` |
| [Collection Hub](/modules/collection-hub/) | Collection workspace and import workflows | Scratch workspace | `scratches/collection-hub/` |
| [Obsidian Enhancer](/modules/obsidian-enhancer/) | Obsidian plugin utilities | Obsidian client | `packages/obsidian-enhancer/README.md` |

Module pages summarize current behavior and link to source files for development and requirements detail.
