---
title: Client Overview
description: Installable CthuTool tools for user computers.
---

Client computers can run two installable surfaces:

| Client | Purpose | Runtime owner |
| --- | --- | --- |
| CthuDesktop | Local browser profiles, login windows, agent connection, desktop status | `apps/desktop` |
| `chc` CLI | Command-line workflows, bundled scripts, Codex config, shell completion, self-update | `apps/cli` |

Install the CLI from [CLI Tool](/client/cli/). Use [Desktop App](/client/desktop/) for the current desktop development and packaging path.

Browser login state belongs to CthuDesktop, not the CLI. See [Browser Auth](/modules/browser-auth/).
