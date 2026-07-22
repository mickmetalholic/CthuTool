---
title: Local Agent
description: Install and operate the lightweight tray-owned CthuTool Agent.
---

The CthuTool Agent is the supported client-side runtime for browser control and
local browser profiles. It runs without an application window. A small native
tray owns the background Agent process; opening settings launches the deployed
Web `/agent` page in the default browser through a short-lived loopback bridge.

The Agent does not embed, package, or serve the Web application.

## Install

Install `chc` first, then install the signed Agent release:

```bash
chc agent install
chc agent env list
chc agent env set production
printf '%s\n' "$AGENT_SECRET" | chc agent env set-secret production --secret-stdin
chc agent autostart enable
chc agent start
```

`install` verifies the pinned release signature, immutable archive digest,
platform, protocol versions, bundle inventory, and release environment catalog
before activation. macOS arm64/x64 and Windows x64 are supported release
targets.

## Tray and Web settings

The tray menu exposes the selected environment, environment switching, Open
Settings, and Exit. Double-clicking the tray icon also opens settings. Exit
shuts down both the tray and its Agent; there is no tray-only idle mode.

```bash
chc agent settings
```

The command starts the tray if necessary and opens a fresh deployed-Web URL.
The launch ticket is single-use, short-lived, bound to the selected environment
and Web origin, and is never printed by the CLI. The loopback API requires the
negotiated bearer session after launch.

## Environments and secrets

Only environments from the signed release catalog can be selected. Each has
its own settings, Agent secret, browser profiles, runtime state, and logs. A Web
page cannot add or replace catalog endpoints.

This personal-use design intentionally uses one static Agent secret per
environment rather than device enrollment. Supply it only through stdin or a
user-private file:

```bash
chc agent env set-secret production --secret-stdin
chc agent env set-secret production --secret-file ./agent-secret
```

## Update, diagnostics, and uninstall

```bash
chc agent status
chc agent doctor
chc agent logs --lines 200
chc agent update
chc agent uninstall
```

Agent update is independent of `chc update`. A failed Agent readiness check
restores the previous active Agent version. Uninstall removes binaries and
autostart but preserves settings, secrets, profiles, and logs unless
`--purge --yes` is explicitly confirmed.

## Legacy Desktop migration

On first Agent start, legacy CthuDesktop settings and browser profiles are
detected and copied into exactly one trusted environment. Exact legacy backend
matching is used when possible; otherwise run `chc agent env set <id>` and
restart. Old device identifiers and credentials are never reused, so configure
a new static Agent secret.

The migration is locked, validated, idempotent, and non-destructive. The
original CthuDesktop data remains in place for rollback. See
[Agent migration](https://github.com/mickmetalholic/CthuTool/blob/main/docs/agent-migration.md)
and use `chc agent doctor` for redacted repair guidance.
