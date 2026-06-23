---
title: System Overview
description: High-level implementation architecture for CthuTool.
---

CthuTool is organized around a Kubernetes-managed homelab service core and client-side tools.

```text
Client Computers
  CthuDesktop
  chc CLI
  Host Chrome / Anki / Obsidian

        |
        | HTTP / WebSocket / local commands
        v

Homelab Kubernetes Cluster
  cthutool namespace
  Backend Deployment
  Backend Service
  ArgoCD reconciliation from git

        ^
        |
        | GitHub Actions -> GHCR -> k8s/deployment.yaml
        |

Repository Internals
  apps/*
  packages/*
  gitops/*
  k8s/*
  openspec/specs/*
```

## Main Boundaries

- Backend owns service APIs, agent registry, browser task orchestration, and public status.
- Kubernetes and ArgoCD own homelab backend deployment state.
- Desktop owns local browser runtime, login windows, profiles, and browser-capable agent execution.
- CLI owns local command-line workflows and installable utility behavior.
- OpenSpec owns normative capability requirements.

Use focused architecture pages for implementation details and source links.
