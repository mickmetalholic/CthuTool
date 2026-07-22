---
title: Client Overview
description: Installable CthuTool tools for user computers.
---

Client computers use `chc` to install and manage the local runtime:

| Client | Purpose | Runtime owner |
| --- | --- | --- |
| CthuTool Agent + tray | Local browser profiles, login windows, backend connection, deployed-Web bridge | `apps/agent`, `apps/agent-tray` |
| `chc` CLI | Agent lifecycle plus command workflows, scripts, Codex config, completion, and updates | `apps/cli` |

Install the CLI from [CLI Tool](/client/cli/), then follow [Local Agent](/client/desktop/) for the signed Agent, environment, secret, tray, and migration path.

Browser login state belongs to the environment-scoped Agent profile store, not
the CLI or backend. See [Browser Auth](/modules/browser-auth/).
