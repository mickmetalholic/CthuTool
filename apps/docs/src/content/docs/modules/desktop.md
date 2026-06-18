---
title: Desktop
description: User and operator overview for CthuDesktop.
---

CthuDesktop is the local companion app for capabilities that must run on the user's computer.

## What It Does

- connects to the backend as an agent
- displays local status, agents, logs, and settings
- owns local browser profiles and login windows
- runs Playwright using the host Google Chrome runtime
- reports public profile summaries to the backend

## Runtime Location

Client computer.

## Setup

Use [Desktop App](/client/desktop/) for the current development and packaging path.

## Current Limits

CthuDesktop does not run arbitrary backend tasks, does not parse Douban data itself, and does not reuse the user's everyday Chrome profile.

Browser commands are structured capture, login, verify, and clear-profile actions. The backend does not send arbitrary Playwright scripts for desktop to evaluate.

Installer signing, notarization, and auto-update are not currently supported user flows.

## Authoritative Sources

- Product and runtime notes: `docs/desktop-agent-console.md`
- Desktop requirements: `openspec/specs/apps-desktop-product-shell/spec.md`, `openspec/specs/apps-desktop-agent-console/spec.md`, `openspec/specs/apps-desktop-browser-host/spec.md`, `openspec/specs/apps-desktop-packaging-ci/spec.md`
