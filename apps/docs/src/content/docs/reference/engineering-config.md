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

The root `pnpm-workspace.yaml` includes root package globs for `apps/*` and `packages/*`.

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

## AI Tooling

The repository does not use the legacy `reasonix.toml`. Reasonix 0.53.2
discovers project skills from the shared `.agents/skills` surface, which is
committed to this repository.

OpenSpec workflow skills are committed under `.agents/skills` for Codex,
Cursor, OpenCode, and Pi, and under `.zcode/skills` for ZCode. Do not hand-edit
generated workflow files.

Install the OpenSpec CLI to run the committed workflows:

```bash
npm install -g @fission-ai/openspec@latest
openspec doctor --json
```

See `docs/ai-tooling.md` for ownership boundaries, tool-specific invocation
forms, third-party skill installation, and Reasonix configuration guidance.

Requirements source: `openspec/specs/apps-root-engineering-config/spec.md`.
