---
title: System Overview
description: High-level implementation architecture for CthuTool.
---

CthuTool is organized around a homelab service core and client-side tools.

```text
Client Computers
  CthuDesktop
  chc CLI
  Host Chrome / Anki / Obsidian

        |
        | HTTP / WebSocket / local commands
        v

Homelab Machine
  Backend Service
  Web Console
  Config and Public Status

        |
        v

Repository Internals
  apps/*
  packages/*
  codex/plugins/*
  openspec/specs/*
```

## Main Boundaries

- Backend owns service APIs, agent registry, browser task orchestration, and public status.
- Desktop owns local browser runtime, login windows, profiles, and browser-capable agent execution.
- CLI owns local command-line workflows and installable utility behavior.
- OpenSpec owns normative capability requirements.

Use focused architecture pages for implementation details and source links.
