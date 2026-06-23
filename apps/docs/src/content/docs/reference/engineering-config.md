---
title: Engineering Config
description: Root workspace engineering configuration, checks, and boundaries.
---

Root engineering configuration defines the checks for the root-managed workspace under `apps/*` and `packages/*`.

## Canonical Root Checks

Run these from the repository root after dependencies are installed:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

CI runs lint, typecheck, and test for pull requests and pushes to `main`.

## Workspace Boundary

The root `pnpm-workspace.yaml` includes root package globs for `apps/*` and `packages/*`. It intentionally does not include `scratches/collection-hub`, which is a nested experimental workspace with its own commands.

## Turbo Outputs

Root Turbo declares durable build outputs for package build artifacts, framework outputs, release artifacts, and coverage outputs:

```text
dist/**
out/**
.next/**
.astro/**
release/**
coverage/**
```

## Biome Boundary

Biome checks root-managed source under `apps/**` and `packages/**`, excluding generated output directories such as `dist`, `build`, `out`, `.next`, `.astro`, `release`, and `coverage`.

## Reasonix Skills

`reasonix.toml` references existing project agent skill directories:

```toml
[skills]
paths = [".cursor/skills", ".claude/skills", ".codex/skills"]
```

Requirements source: `openspec/specs/apps-root-engineering-config/spec.md`.
