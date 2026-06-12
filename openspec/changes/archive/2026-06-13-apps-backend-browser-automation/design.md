## Context

`apps/backend` currently has only basic health/config/filter modules, while future source integrations need a common way to retrieve browser-rendered pages. The immediate driver is Douban movie metadata: some pages may need authenticated browser state, but the same capability should also serve later Notion enrichment and other source adapters.

The browser layer must stay backend-owned. Business modules should ask for a page content snapshot, not receive a raw Playwright `Page`. This keeps auth state, domain allowlists, timeouts, retries, diagnostics, and future agent-facing boundaries centralized.

## Goals / Non-Goals

**Goals:**

- Add `BrowserAutomationModule` under `apps/backend` as an internal Nest module.
- Expose `BrowserContentService.getPageContent()` for controlled URL retrieval.
- Support named auth profiles using Playwright-compatible `storageState` bundles.
- Provide CLI commands to explicitly install/check the Playwright browser runtime, create auth bundles, and verify a Douban profile by returning only user id and nickname.
- Provide a local Playwright provider behind a `BrowserProvider` interface.
- Provide a single-concurrency task runner, origin allowlist, timeout, retry, resource blocking, block detection, and diagnostics.
- Define a shared auth bundle format that can be produced by a CLI helper now and by a frontend-plus-browser-extension flow later.

**Non-Goals:**

- Do not add MCP tools or a remote MCP endpoint in this change.
- Do not implement Douban movie parsing, Notion database sync, or frontend movie views.
- Do not add Steel, proxies, captcha solving, stealth plugins, or anti-detect tooling.
- Do not expose raw browser pages, cookies, localStorage, or storage-state file contents to business modules, frontend APIs, or future agents.
- Do not support automatic username/password login.

## Decisions

### Decision: Keep browser automation inside `apps/backend`

The first implementation will live at `apps/backend/src/modules/browser-automation`. The module exports services to other backend modules through Nest dependency injection.

Alternative considered: create `packages/browser-automation` immediately. That would make direct reuse possible from CLI or a future MCP server, but it adds package boundaries before the backend API shape has settled. The backend module can still be extracted later if direct cross-app imports become necessary.

### Decision: Expose content snapshots, not raw browser control

Business modules call `BrowserContentService.getPageContent(request)` and receive a structured result with final URL, status, title, optional HTML, optional text, capture time, auth usage, detection status, and optional diagnostics ID.

Alternative considered: expose a generic `newPage()` provider to consumers. That is more flexible, but it lets callers bypass origin allowlists, task limits, resource policies, and auth safeguards. The lower-level provider remains internal to the browser module.

### Decision: Use a provider interface with local Playwright as the first implementation

`BrowserProvider` will be an internal interface implemented first by `LocalPlaywrightProvider`. The provider creates a context from request options and auth state, applies resource blocking and navigation settings, then returns page content to the service.

Alternative considered: call `chromium.launch()` directly from `BrowserContentService`. That is simpler at first, but makes a later Steel Cloud provider or alternate runtime a larger refactor.

### Decision: Store auth as named Playwright storage-state bundles

Auth state is stored by profile name under a configured secrets directory, for example `data/secrets/browser-auth/douban/storage-state.json` plus `meta.json`. The bundle stores browser state only, not account passwords.

The request supports:

- no profile: anonymous access
- `profileName` with `requireAuth: false`: use the profile if present, otherwise continue anonymously
- `profileName` with `requireAuth: true`: fail with `AUTH_STATE_MISSING` before navigation if the profile is absent

Alternative considered: store full persistent browser profiles as the default. Full profiles may help some sites, but they are larger, harder to inspect, and harder to upload from helpers. The design can add persistent profile support later without changing the auth bundle contract.

### Decision: Support explicit CLI browser setup and auth helpers

The CLI exposes explicit setup commands instead of relying on package install hooks:

- `chc browser doctor` checks whether Playwright can load and whether Chromium is installed.
- `chc browser install` invokes Playwright's browser installer for Chromium.
- `chc browser auth login <profile>` launches a headed local Playwright browser, lets the user log in manually, calls `context.storageState()`, and writes the auth bundle to the configured local auth directory.
- `chc browser auth verify <profile>` reuses the stored auth bundle and, for Douban, returns only the profile name plus user id and nickname.

The first version uses documented file placement for backend consumption rather than uploading bundles to a backend endpoint.

Alternative considered: install browser binaries from `prepare`, `postinstall`, or another package lifecycle hook. That can surprise users during install, may download large files, and is brittle under proxy or `--ignore-scripts` environments. An explicit command gives clearer failure and retry behavior.

### Decision: Support two auth producers with one backend format

The CLI auth helper is the first producer. It writes Playwright-compatible `storage-state.json` plus non-secret `meta.json`; it never asks for or stores account passwords.

The frontend-plus-browser-extension flow is a later producer. The extension uses browser permissions to read site cookies and needed origin storage, converts them into the same Playwright-compatible storage-state shape, and uploads the same backend bundle format.

Alternative considered: make the backend open a headed browser for login. The user prefers not to support this because the backend may run on an internal server without a local desktop session.

### Decision: Treat block handling as detection and stop conditions

The browser module classifies responses as `ok`, `login_required`, `rate_limited`, `captcha_required`, or `blocked` using status codes, final URL, page title, and configured text patterns. It returns structured errors or detection results rather than trying to bypass the block.

Alternative considered: add stealth plugins, captcha solving, or proxy rotation. Those are out of scope for a personal internal service and would blur the boundary between resilient automation and active evasion.

### Decision: Save diagnostics behind IDs

When navigation fails or block detection triggers, the diagnostics store may save metadata, HTML, text excerpts, and screenshots under a configured diagnostics directory. Results expose only a diagnostics ID and summary, not raw files.

Alternative considered: return full diagnostics inline. That is convenient, but could leak authenticated content to unrelated modules or future agent-facing responses.

## Risks / Trade-offs

- [Risk] Playwright adds a heavier runtime dependency to the backend and CLI. -> Mitigation: isolate backend usage behind `BrowserProvider`, keep max concurrency low, keep CLI build from bundling Playwright, and provide explicit `browser install` / `browser doctor` commands.
- [Risk] Storage-state files contain sensitive cookies. -> Mitigation: store them under a secrets path, update `.gitignore`, never return raw state through service results, and keep auth APIs admin-only when added.
- [Risk] Extension-generated storage state may not perfectly match Playwright's own export format. -> Mitigation: implement the CLI helper first as the reference producer, then test extension output against the backend auth-state parser.
- [Risk] Blocking and login detection will be site-specific over time. -> Mitigation: provide generic detector primitives and let future site modules add patterns without changing browser provider behavior.
- [Risk] A single-concurrency queue can be slow for unrelated modules. -> Mitigation: start conservative, expose configuration for max concurrency, and add per-origin queues only after real usage shows the need.

## Migration Plan

1. Add ignored runtime directories for browser auth state, browser data, and diagnostics.
2. Add `BrowserAutomationModule` and wire it into `AppModule`.
3. Add the local Playwright provider and content snapshot service.
4. Add backend config parsing for browser provider, data paths, concurrency, timeouts, and diagnostics.
5. Add the CLI browser setup, login, and verify commands plus backend auth bundle parser/storage.
6. Add focused tests for config, auth-state storage, allowed origins, task runner behavior, block detection, and service result shaping.
7. Leave extension auth flow as a documented follow-up unless implementation scope explicitly includes browser extension packaging.

Rollback is straightforward before consumers depend on the module: remove the module import, Playwright dependency, CLI browser commands, and runtime config. Runtime auth/diagnostic files are ignored and can be deleted manually.

## Open Questions

- Should a later change add a backend admin HTTP endpoint for auth bundle upload, or keep file placement as the durable local/intranet workflow?
- Should a later change include the browser extension scaffold, or only keep the shared auth bundle format until the frontend auth UI exists?
